import { db, newId } from "@/lib/db";
import { getProduct, recordStockMovement } from "@/lib/repositories/products";
import { getOrCreateCashAccount, applyCashTransaction } from "@/lib/repositories/treasury";
import type { PaymentMethod, Sale } from "@/lib/types";

export interface CartLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface PaymentLine {
  method: PaymentMethod;
  amount: number;
}

export function nextSaleReference(storeId: string): string {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM Sale WHERE storeId = ?")
    .get(storeId) as { c: number };
  return `V-${String(row.c + 1).padStart(4, "0")}`;
}

export function createSale(input: {
  storeId: string;
  sellerId: string;
  clientId?: string | null;
  items: CartLine[];
  discount: number;
  payments: PaymentLine[];
}): Sale {
  if (input.items.length === 0) throw new Error("Le panier est vide");

  const subtotal = input.items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice - i.discount,
    0
  );
  const total = subtotal - input.discount;

  const totalPaid = input.payments.reduce((s, p) => s + p.amount, 0);
  const hasCredit = input.payments.some((p) => p.method === "CREDIT");
  if (!hasCredit && Math.round(totalPaid) !== Math.round(total)) {
    throw new Error(
      `Le total encaissé (${totalPaid}) ne correspond pas au total de la vente (${total})`
    );
  }

  const id = newId("sale");
  const reference = nextSaleReference(input.storeId);

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO Sale (id, reference, subtotal, discount, total, storeId, clientId, sellerId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      reference,
      subtotal,
      input.discount,
      total,
      input.storeId,
      input.clientId ?? null,
      input.sellerId
    );

    for (const item of input.items) {
      const product = getProduct(item.productId);
      if (!product) throw new Error("Produit introuvable dans le panier");
      if (product.stockQty < item.quantity) {
        throw new Error(
          `Stock insuffisant pour ${product.name} (disponible: ${product.stockQty})`
        );
      }
      db.prepare(
        `INSERT INTO SaleItem (id, quantity, unitPrice, discount, saleId, productId)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        newId("item"),
        item.quantity,
        item.unitPrice,
        item.discount,
        id,
        item.productId
      );
      recordStockMovement(
        item.productId,
        input.storeId,
        "VENTE",
        -item.quantity,
        `Vente ${reference}`
      );
    }

    for (const payment of input.payments) {
      db.prepare(
        `INSERT INTO Payment (id, method, amount, saleId) VALUES (?, ?, ?, ?)`
      ).run(newId("pay"), payment.method, payment.amount, id);

      if (payment.method !== "CREDIT" && payment.amount > 0) {
        const account = getOrCreateCashAccount(input.storeId, payment.method);
        applyCashTransaction(
          account.id,
          `Vente ${reference}`,
          payment.amount,
          "vente",
          input.sellerId
        );
      }
    }

    if (hasCredit && input.clientId) {
      // Debt is implicitly tracked via unpaid sale total minus payments;
      // represented through DebtPayment ledger (negative = charge)
      const creditAmount = input.payments
        .filter((p) => p.method === "CREDIT")
        .reduce((s, p) => s + p.amount, 0);
      db.prepare(
        "INSERT INTO DebtPayment (id, amount, note, clientId) VALUES (?, ?, ?, ?)"
      ).run(newId("debt"), -creditAmount, `Achat à crédit ${reference}`, input.clientId);
    }
  });

  tx();
  return db.prepare("SELECT * FROM Sale WHERE id = ?").get(id) as Sale;
}

export function listRecentSales(storeId: string, limit = 20) {
  return db
    .prepare(
      `SELECT s.*, u.name as sellerName, c.name as clientName
       FROM Sale s
       JOIN User u ON u.id = s.sellerId
       LEFT JOIN Client c ON c.id = s.clientId
       WHERE s.storeId = ?
       ORDER BY s.createdAt DESC LIMIT ?`
    )
    .all(storeId, limit);
}

export function getSaleWithDetails(id: string) {
  const sale = db.prepare("SELECT * FROM Sale WHERE id = ?").get(id) as
    | Sale
    | undefined;
  if (!sale) return null;
  const items = db
    .prepare(
      `SELECT si.*, p.name as productName, p.unit as unit FROM SaleItem si
       JOIN Product p ON p.id = si.productId WHERE si.saleId = ?`
    )
    .all(id);
  const payments = db
    .prepare("SELECT * FROM Payment WHERE saleId = ?")
    .all(id);
  const seller = db
    .prepare("SELECT name FROM User WHERE id = ?")
    .get(sale.sellerId) as { name: string } | undefined;
  const client = sale.clientId
    ? (db.prepare("SELECT name FROM Client WHERE id = ?").get(sale.clientId) as
        | { name: string }
        | undefined)
    : null;
  return { sale, items, payments, sellerName: seller?.name, clientName: client?.name };
}

export function salesBetween(storeId: string, startIso: string, endIso: string) {
  return db
    .prepare(
      `SELECT * FROM Sale WHERE storeId = ? AND cancelled = 0 AND createdAt >= ? AND createdAt < ?`
    )
    .all(storeId, startIso, endIso) as Sale[];
}

export function paymentsBreakdown(storeId: string, startIso: string, endIso: string) {
  return db
    .prepare(
      `SELECT p.method as method, COALESCE(SUM(p.amount),0) as total
       FROM Payment p
       JOIN Sale s ON s.id = p.saleId
       WHERE s.storeId = ? AND s.cancelled = 0 AND s.createdAt >= ? AND s.createdAt < ?
       GROUP BY p.method`
    )
    .all(storeId, startIso, endIso) as { method: string; total: number }[];
}

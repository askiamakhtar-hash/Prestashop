import { db, newId } from "@/lib/db";
import { recordStockMovement } from "@/lib/repositories/products";
import { getOrCreateCashAccount, applyCashTransaction } from "@/lib/repositories/treasury";
import type { PurchaseOrder, PurchaseOrderStatus, Supplier } from "@/lib/types";

export function listSuppliers(storeId: string): Supplier[] {
  return db
    .prepare("SELECT * FROM Supplier WHERE storeId = ? ORDER BY name")
    .all(storeId) as Supplier[];
}

export function getSupplier(id: string): Supplier | undefined {
  return db.prepare("SELECT * FROM Supplier WHERE id = ?").get(id) as
    | Supplier
    | undefined;
}

export function createSupplier(input: {
  storeId: string;
  name: string;
  phone?: string;
  address?: string;
}): Supplier {
  const id = newId("sup");
  db.prepare(
    "INSERT INTO Supplier (id, name, phone, address, storeId) VALUES (?, ?, ?, ?, ?)"
  ).run(id, input.name, input.phone ?? null, input.address ?? null, input.storeId);
  return getSupplier(id)!;
}

export function supplierDebt(supplierId: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(poi.quantity * poi.unitPrice),0) as total
       FROM PurchaseOrder po JOIN PurchaseOrderItem poi ON poi.purchaseOrderId = po.id
       WHERE po.supplierId = ? AND po.status IN ('RECU','FACTURE')`
    )
    .get(supplierId) as { total: number };
  return row.total;
}

export function nextPoReference(storeId: string): string {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM PurchaseOrder WHERE storeId = ?")
    .get(storeId) as { c: number };
  return `CMD-${String(row.c + 1).padStart(4, "0")}`;
}

export function createPurchaseOrder(input: {
  storeId: string;
  supplierId: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}): PurchaseOrder {
  const id = newId("po");
  const reference = nextPoReference(input.storeId);
  const tx = db.transaction(() => {
    db.prepare(
      "INSERT INTO PurchaseOrder (id, reference, status, supplierId, storeId) VALUES (?, ?, 'EN_ATTENTE', ?, ?)"
    ).run(id, reference, input.supplierId, input.storeId);
    for (const item of input.items) {
      db.prepare(
        "INSERT INTO PurchaseOrderItem (id, quantity, unitPrice, purchaseOrderId, productId) VALUES (?, ?, ?, ?, ?)"
      ).run(newId("poi"), item.quantity, item.unitPrice, id, item.productId);
    }
  });
  tx();
  return db.prepare("SELECT * FROM PurchaseOrder WHERE id = ?").get(id) as PurchaseOrder;
}

export function receivePurchaseOrder(id: string, storeId: string) {
  const po = db.prepare("SELECT * FROM PurchaseOrder WHERE id = ?").get(id) as
    | PurchaseOrder
    | undefined;
  if (!po) throw new Error("Commande introuvable");
  const items = db
    .prepare("SELECT * FROM PurchaseOrderItem WHERE purchaseOrderId = ?")
    .all(id) as { productId: string; quantity: number; unitPrice: number }[];
  const tx = db.transaction(() => {
    for (const item of items) {
      recordStockMovement(
        item.productId,
        storeId,
        "ACHAT_FOURNISSEUR",
        item.quantity,
        `Réception ${po.reference}`
      );
      db.prepare(
        "UPDATE Product SET purchasePrice = ? WHERE id = ?"
      ).run(item.unitPrice, item.productId);
    }
    db.prepare(
      "UPDATE PurchaseOrder SET status = 'RECU', receivedAt = datetime('now') WHERE id = ?"
    ).run(id);
  });
  tx();
}

export function payPurchaseOrder(
  id: string,
  storeId: string,
  cashAccountId: string,
  userId?: string
) {
  const po = db.prepare("SELECT * FROM PurchaseOrder WHERE id = ?").get(id) as
    | PurchaseOrder
    | undefined;
  if (!po) throw new Error("Commande introuvable");
  const total = (
    db
      .prepare(
        "SELECT COALESCE(SUM(quantity*unitPrice),0) as t FROM PurchaseOrderItem WHERE purchaseOrderId = ?"
      )
      .get(id) as { t: number }
  ).t;
  const tx = db.transaction(() => {
    applyCashTransaction(cashAccountId, `Paiement fournisseur ${po.reference}`, -total, "achats", userId);
    db.prepare(
      "UPDATE PurchaseOrder SET status = 'PAYE', paidAt = datetime('now') WHERE id = ?"
    ).run(id);
  });
  tx();
}

export function listPurchaseOrders(storeId: string) {
  return db
    .prepare(
      `SELECT po.*, s.name as supplierName,
        (SELECT COALESCE(SUM(quantity*unitPrice),0) FROM PurchaseOrderItem WHERE purchaseOrderId = po.id) as total
       FROM PurchaseOrder po JOIN Supplier s ON s.id = po.supplierId
       WHERE po.storeId = ? ORDER BY po.createdAt DESC`
    )
    .all(storeId);
}

export function getPurchaseOrderDetails(id: string) {
  const po = db.prepare("SELECT * FROM PurchaseOrder WHERE id = ?").get(id) as
    | PurchaseOrder
    | undefined;
  if (!po) return null;
  const items = db
    .prepare(
      `SELECT poi.*, p.name as productName FROM PurchaseOrderItem poi
       JOIN Product p ON p.id = poi.productId WHERE poi.purchaseOrderId = ?`
    )
    .all(id);
  const supplier = getSupplier(po.supplierId);
  return { po, items, supplier };
}

export function priceComparisonForProduct(storeId: string, productId: string) {
  return db
    .prepare(
      `SELECT s.name as supplierName, poi.unitPrice, po.createdAt
       FROM PurchaseOrderItem poi
       JOIN PurchaseOrder po ON po.id = poi.purchaseOrderId
       JOIN Supplier s ON s.id = po.supplierId
       WHERE poi.productId = ? AND po.storeId = ?
       ORDER BY po.createdAt DESC`
    )
    .all(productId, storeId);
}

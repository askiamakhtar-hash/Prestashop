import { db } from "../src/lib/db";
import { createStore } from "../src/lib/repositories/stores";
import { createUser } from "../src/lib/repositories/users";
import { createProduct, recordStockMovement } from "../src/lib/repositories/products";
import { createClient, recordDebtPayment } from "../src/lib/repositories/clients";
import { createSupplier, createPurchaseOrder, receivePurchaseOrder, payPurchaseOrder } from "../src/lib/repositories/suppliers";
import { createSale } from "../src/lib/repositories/sales";
import { getOrCreateCashAccount, applyCashTransaction, recordExpense } from "../src/lib/repositories/treasury";
import { newId } from "../src/lib/db";
import type { PaymentMethod } from "../src/lib/types";

function wipe() {
  const tables = [
    "AuditLog", "Expense", "CashTransaction", "CashAccount", "Payment", "SaleItem", "Sale",
    "PurchaseOrderItem", "PurchaseOrder", "Supplier", "DebtPayment", "Client",
    "StockTransfer", "StockMovement", "Product", "User", "Store",
  ];
  for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();
}

function daysAgoIso(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function backdate(table: string, id: string, iso: string) {
  db.prepare(`UPDATE ${table} SET createdAt = ? WHERE id = ?`).run(iso, id);
}

async function main() {
  console.log("Réinitialisation de la base...");
  wipe();

  console.log("Création des boutiques...");
  const dakar = createStore("Boutique Sandaga", "Dakar");
  const thies = createStore("Boutique Thiès", "Thiès");

  console.log("Création des utilisateurs...");
  const yade = await createUser({
    name: "M. Yade", email: "yade@gestashop.sn", phone: "771234567",
    password: "demo1234", pin: "1111", role: "PROPRIETAIRE", storeId: dakar.id,
  });
  const fatou = await createUser({
    name: "Fatou Sarr", email: "fatou@gestashop.sn", phone: "772345678",
    password: "demo1234", pin: "2222", role: "MANAGER", storeId: dakar.id,
  });
  const moussa = await createUser({
    name: "Moussa Diallo", email: "moussa@gestashop.sn", phone: "773456789",
    password: "demo1234", pin: "3333", role: "CAISSIER", storeId: dakar.id,
  });
  const ibou = await createUser({
    name: "Ibou Fall", email: "ibou@gestashop.sn", phone: "774567890",
    password: "demo1234", pin: "4444", role: "MAGASINIER", storeId: dakar.id,
  });
  await createUser({
    name: "Awa Ndoye", email: "awa@gestashop.sn", phone: "775678901",
    password: "demo1234", pin: "5555", role: "CAISSIER", storeId: thies.id,
  });

  console.log("Création des produits...");
  const productDefs = [
    { sku: "RIZ25", name: "Riz parfumé 25kg", category: "Épicerie", purchasePrice: 11200, sellingPrice: 12500, stockQty: 4, stockMin: 10, unit: "sac", supplierName: "Fournisseur A" },
    { sku: "HUI5L", name: "Huile végétale 5L", category: "Épicerie", purchasePrice: 6800, sellingPrice: 7500, stockQty: 8, stockMin: 15, unit: "bidon", supplierName: "Fournisseur B" },
    { sku: "SUC1KG", name: "Sucre en poudre 1kg", category: "Épicerie", purchasePrice: 590, sellingPrice: 650, stockQty: 126, stockMin: 50, unit: "sachet", supplierName: "Fournisseur A" },
    { sku: "LAIT400", name: "Lait en poudre 400g", category: "Épicerie", purchasePrice: 1150, sellingPrice: 1250, stockQty: 48, stockMin: 20, unit: "boîte", supplierName: "Fournisseur C" },
    { sku: "THON400", name: "Thon 400g", category: "Épicerie", purchasePrice: 980, sellingPrice: 1100, stockQty: 35, stockMin: 15, unit: "boîte", supplierName: "Fournisseur C" },
    { sku: "FAR1KG", name: "Farine de blé 1kg", category: "Épicerie", purchasePrice: 480, sellingPrice: 575, stockQty: 60, stockMin: 20, unit: "sachet", supplierName: "Fournisseur A" },
    { sku: "SPAG500", name: "Spaghetti 500g", category: "Épicerie", purchasePrice: 350, sellingPrice: 425, stockQty: 90, stockMin: 30, unit: "paquet", supplierName: "Fournisseur B" },
    { sku: "OMO1KG", name: "Lessive Omo 1kg", category: "Hygiène", purchasePrice: 1450, sellingPrice: 1700, stockQty: 40, stockMin: 15, unit: "boîte", supplierName: "Fournisseur B" },
    { sku: "SAV", name: "Savon de toilette", category: "Hygiène", purchasePrice: 220, sellingPrice: 300, stockQty: 150, stockMin: 40, unit: "pièce", supplierName: "Fournisseur C" },
    { sku: "EAU15", name: "Eau minérale 1.5L", category: "Boissons", purchasePrice: 250, sellingPrice: 350, stockQty: 200, stockMin: 60, unit: "bouteille", supplierName: "Fournisseur B" },
    { sku: "BISS1L", name: "Jus Bissap 1L", category: "Boissons", purchasePrice: 600, sellingPrice: 800, stockQty: 55, stockMin: 20, unit: "bouteille", supplierName: "Fournisseur A" },
    { sku: "CAFE", name: "Café Touba 250g", category: "Épicerie", purchasePrice: 700, sellingPrice: 900, stockQty: 45, stockMin: 15, unit: "sachet", supplierName: "Fournisseur C" },
    { sku: "TOM", name: "Tomate concentrée 400g", category: "Épicerie", purchasePrice: 380, sellingPrice: 475, stockQty: 70, stockMin: 25, unit: "boîte", supplierName: "Fournisseur A" },
    { sku: "THE", name: "Thé vert 25 sachets", category: "Épicerie", purchasePrice: 900, sellingPrice: 1150, stockQty: 30, stockMin: 12, unit: "boîte", supplierName: "Fournisseur B" },
    { sku: "GAZ6KG", name: "Bouteille de gaz 6kg (consigne)", category: "Divers", purchasePrice: 3200, sellingPrice: 3700, stockQty: 12, stockMin: 5, unit: "bouteille", supplierName: "Fournisseur C" },
  ];

  const products = productDefs.map((p) =>
    createProduct({ storeId: dakar.id, ...p, tva: 0 })
  );
  const bySku = Object.fromEntries(products.map((p) => [p.sku, p]));

  // Also seed a couple of matching products in Thiès store for multi-boutique demo
  createProduct({ storeId: thies.id, sku: "RIZ25", name: "Riz parfumé 25kg", category: "Épicerie", purchasePrice: 11400, sellingPrice: 12800, stockQty: 15, stockMin: 10, unit: "sac", tva: 0, supplierName: "Fournisseur A" });
  createProduct({ storeId: thies.id, sku: "EAU15", name: "Eau minérale 1.5L", category: "Boissons", purchasePrice: 260, sellingPrice: 375, stockQty: 90, stockMin: 40, unit: "bouteille", tva: 0, supplierName: "Fournisseur B" });

  console.log("Création des clients...");
  const mamadou = createClient({ storeId: dakar.id, name: "Mamadou Ndiaye", phone: "771112233", creditLimit: 150000 });
  const aissatou = createClient({ storeId: dakar.id, name: "Aissatou Fall", phone: "772223344", creditLimit: 80000 });
  const cheikh = createClient({ storeId: dakar.id, name: "Cheikh Diop", phone: "773334455", creditLimit: 50000 });
  const saliou = createClient({ storeId: dakar.id, name: "Saliou Ba", phone: "774445566", creditLimit: 100000 });
  const fatouD = createClient({ storeId: dakar.id, name: "Fatou Dieng", phone: "775556677", creditLimit: 40000 });

  console.log("Création des fournisseurs...");
  const supA = createSupplier({ storeId: dakar.id, name: "Fournisseur A", phone: "338001122" });
  const supB = createSupplier({ storeId: dakar.id, name: "Fournisseur B", phone: "338002233" });
  const supC = createSupplier({ storeId: dakar.id, name: "Fournisseur C", phone: "338003344" });

  console.log("Solde de trésorerie initial...");
  const caisse = getOrCreateCashAccount(dakar.id, "ESPECES");
  const banque = getOrCreateCashAccount(dakar.id, "VIREMENT");
  applyCashTransaction(caisse.id, "Apport initial caisse", 150000, "capital", yade.id);
  applyCashTransaction(banque.id, "Apport initial banque", 1200000, "capital", yade.id);

  console.log("Commandes fournisseurs...");
  const po1 = createPurchaseOrder({ storeId: dakar.id, supplierId: supA.id, items: [
    { productId: bySku.RIZ25.id, quantity: 10, unitPrice: 11200 },
    { productId: bySku.SUC1KG.id, quantity: 100, unitPrice: 590 },
  ]});
  receivePurchaseOrder(po1.id, dakar.id);
  db.prepare("UPDATE PurchaseOrder SET createdAt = ?, receivedAt = ? WHERE id = ?").run(daysAgoIso(5), daysAgoIso(4), po1.id);

  const po2 = createPurchaseOrder({ storeId: dakar.id, supplierId: supB.id, items: [
    { productId: bySku.HUI5L.id, quantity: 20, unitPrice: 6800 },
    { productId: bySku.OMO1KG.id, quantity: 15, unitPrice: 1450 },
  ]});
  receivePurchaseOrder(po2.id, dakar.id);
  payPurchaseOrder(po2.id, dakar.id, banque.id, yade.id);
  db.prepare("UPDATE PurchaseOrder SET createdAt = ?, receivedAt = ?, paidAt = ? WHERE id = ?").run(daysAgoIso(6), daysAgoIso(5), daysAgoIso(3), po2.id);

  const po3 = createPurchaseOrder({ storeId: dakar.id, supplierId: supC.id, items: [
    { productId: bySku.LAIT400.id, quantity: 30, unitPrice: 1150 },
    { productId: bySku.THON400.id, quantity: 25, unitPrice: 980 },
  ]});
  db.prepare("UPDATE PurchaseOrder SET createdAt = ? WHERE id = ?").run(daysAgoIso(1), po3.id); // reste en attente

  const po4 = createPurchaseOrder({ storeId: dakar.id, supplierId: supA.id, items: [
    { productId: bySku.RIZ25.id, quantity: 8, unitPrice: 11300 },
  ]});
  db.prepare("UPDATE PurchaseOrder SET createdAt = ? WHERE id = ?").run(daysAgoIso(0), po4.id); // en attente aujourd'hui

  console.log("Dettes clients...");
  recordDebtPayment(mamadou.id, 0, "init"); // no-op to keep structure simple
  db.prepare("DELETE FROM DebtPayment WHERE clientId = ?").run(mamadou.id);
  db.prepare("INSERT INTO DebtPayment (id, amount, note, clientId, createdAt) VALUES (?,?,?,?,?)")
    .run(newId("debt"), -155000, "Achats à crédit cumulés", mamadou.id, daysAgoIso(10));
  db.prepare("INSERT INTO DebtPayment (id, amount, note, clientId, createdAt) VALUES (?,?,?,?,?)")
    .run(newId("debt"), 30000, "Paiement partiel", mamadou.id, daysAgoIso(2));

  db.prepare("INSERT INTO DebtPayment (id, amount, note, clientId, createdAt) VALUES (?,?,?,?,?)")
    .run(newId("debt"), -45000, "Achats à crédit", aissatou.id, daysAgoIso(6));

  db.prepare("INSERT INTO DebtPayment (id, amount, note, clientId, createdAt) VALUES (?,?,?,?,?)")
    .run(newId("debt"), -76500, "Achats à crédit", saliou.id, daysAgoIso(4));

  db.prepare("INSERT INTO DebtPayment (id, amount, note, clientId, createdAt) VALUES (?,?,?,?,?)")
    .run(newId("debt"), -12000, "Achats à crédit", fatouD.id, daysAgoIso(1));

  console.log("Génération des ventes historiques...");
  const sellers = [moussa, fatou, moussa, moussa, ibou];
  const clientPool = [null, null, null, mamadou, aissatou, cheikh, saliou, fatouD, null];
  const methods: PaymentMethod[] = ["ESPECES", "WAVE", "ORANGE_MONEY", "CARTE"];

  function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const nbSales = dayOffset === 0 ? 12 : 4 + Math.floor(Math.random() * 6);
    for (let i = 0; i < nbSales; i++) {
      const nbItems = 1 + Math.floor(Math.random() * 3);
      const chosenProducts = new Set<string>();
      const items = [];
      for (let j = 0; j < nbItems; j++) {
        const product = randomItem(products.filter((p) => p.stockQty > 5 || dayOffset > 0));
        if (chosenProducts.has(product.id)) continue;
        chosenProducts.add(product.id);
        const qty = 1 + Math.floor(Math.random() * 3);
        items.push({
          productId: product.id,
          quantity: qty,
          unitPrice: product.sellingPrice,
          discount: Math.random() < 0.15 ? Math.round(product.sellingPrice * 0.1) : 0,
        });
      }
      if (items.length === 0) continue;

      const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice - it.discount, 0);
      const globalDiscount = Math.random() < 0.1 ? Math.round(subtotal * 0.02) : 0;
      const total = subtotal - globalDiscount;
      const client = randomItem(clientPool);
      const useCredit = client && Math.random() < 0.25;

      let payments;
      if (useCredit) {
        payments = [{ method: "CREDIT" as PaymentMethod, amount: total }];
      } else if (Math.random() < 0.2) {
        const split = Math.round(total * (0.3 + Math.random() * 0.4));
        payments = [
          { method: "ESPECES" as PaymentMethod, amount: split },
          { method: randomItem(methods.filter((m) => m !== "ESPECES")), amount: total - split },
        ];
      } else {
        payments = [{ method: randomItem(methods), amount: total }];
      }

      try {
        const sale = createSale({
          storeId: dakar.id,
          sellerId: randomItem(sellers).id,
          clientId: client?.id ?? null,
          items,
          discount: globalDiscount,
          payments,
        });
        const hour = 8 + Math.floor(Math.random() * 11);
        const minute = Math.floor(Math.random() * 60);
        const iso = daysAgoIso(dayOffset, hour, minute);
        backdate("Sale", sale.id, iso);
        db.prepare("UPDATE Payment SET createdAt = ? WHERE saleId = ?").run(iso, sale.id);
        db.prepare("UPDATE StockMovement SET createdAt = ? WHERE note = ? AND storeId = ?")
          .run(iso, `Vente ${sale.reference}`, dakar.id);
        db.prepare(
          `UPDATE CashTransaction SET createdAt = ? WHERE label = ? AND cashAccountId IN (SELECT id FROM CashAccount WHERE storeId = ?)`
        ).run(iso, `Vente ${sale.reference}`, dakar.id);
      } catch (e) {
        // skip if stock insufficient
      }
    }
  }

  console.log("Dépenses...");
  const expenseDefs = [
    { label: "Loyer boutique", category: "loyer", amount: 150000, daysAgo: 12 },
    { label: "Salaires équipe", category: "salaires", amount: 280000, daysAgo: 10 },
    { label: "Transport marchandises", category: "transport", amount: 25000, daysAgo: 8 },
    { label: "Facture SENELEC", category: "électricité", amount: 45000, daysAgo: 7 },
    { label: "Facture SDE", category: "eau", amount: 12000, daysAgo: 7 },
    { label: "Abonnement internet", category: "internet", amount: 25000, daysAgo: 6 },
    { label: "Carburant livraison", category: "carburant", amount: 18000, daysAgo: 3 },
    { label: "Fournitures diverses", category: "autres", amount: 9500, daysAgo: 1 },
  ];
  for (const e of expenseDefs) {
    recordExpense({ storeId: dakar.id, label: e.label, category: e.category, amount: e.amount, cashAccountId: banque.id, userId: yade.id });
    db.prepare("UPDATE Expense SET createdAt = ? WHERE label = ? AND storeId = ?").run(daysAgoIso(e.daysAgo), e.label, dakar.id);
    db.prepare(
      `UPDATE CashTransaction SET createdAt = ? WHERE label = ? AND cashAccountId = ?`
    ).run(daysAgoIso(e.daysAgo), e.label, banque.id);
  }

  console.log("Terminé.");
  console.log({
    dakar: dakar.id,
    thies: thies.id,
    yade: yade.email,
    fatou: fatou.email,
    moussa: moussa.email,
    ibou: ibou.email,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

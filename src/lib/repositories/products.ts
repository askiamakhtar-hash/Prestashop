import { db, newId, nowIso } from "@/lib/db";
import type { Product, StockMovementType } from "@/lib/types";

export function listProducts(storeId: string): Product[] {
  return db
    .prepare(
      "SELECT * FROM Product WHERE storeId = ? AND active = 1 ORDER BY name"
    )
    .all(storeId) as Product[];
}

export function searchProducts(storeId: string, query: string): Product[] {
  const q = `%${query}%`;
  return db
    .prepare(
      `SELECT * FROM Product WHERE storeId = ? AND active = 1
       AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ? OR category LIKE ?)
       ORDER BY name LIMIT 50`
    )
    .all(storeId, q, q, q, q) as Product[];
}

export function getProduct(id: string): Product | undefined {
  return db.prepare("SELECT * FROM Product WHERE id = ?").get(id) as
    | Product
    | undefined;
}

export function createProduct(input: {
  storeId: string;
  sku: string;
  barcode?: string;
  name: string;
  category?: string;
  supplierName?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQty: number;
  stockMin: number;
  unit: string;
  location?: string;
  tva: number;
}): Product {
  const id = newId("prod");
  db.prepare(
    `INSERT INTO Product
      (id, sku, barcode, name, category, supplierName, purchasePrice, sellingPrice, stockQty, stockMin, unit, location, tva, storeId)
     VALUES (@id, @sku, @barcode, @name, @category, @supplierName, @purchasePrice, @sellingPrice, @stockQty, @stockMin, @unit, @location, @tva, @storeId)`
  ).run({
    id,
    sku: input.sku,
    barcode: input.barcode ?? null,
    name: input.name,
    category: input.category ?? null,
    supplierName: input.supplierName ?? null,
    purchasePrice: input.purchasePrice,
    sellingPrice: input.sellingPrice,
    stockQty: input.stockQty,
    stockMin: input.stockMin,
    unit: input.unit,
    location: input.location ?? null,
    tva: input.tva,
    storeId: input.storeId,
  });
  if (input.stockQty > 0) {
    recordStockMovement(id, input.storeId, "INVENTAIRE", input.stockQty, "Stock initial");
  }
  return getProduct(id)!;
}

export function updateProduct(
  id: string,
  input: Partial<{
    sku: string;
    barcode: string | null;
    name: string;
    category: string | null;
    supplierName: string | null;
    purchasePrice: number;
    sellingPrice: number;
    stockMin: number;
    unit: string;
    location: string | null;
    tva: number;
  }>
) {
  const existing = getProduct(id);
  if (!existing) throw new Error("Produit introuvable");
  const merged = { ...existing, ...input };
  db.prepare(
    `UPDATE Product SET sku=@sku, barcode=@barcode, name=@name, category=@category,
      supplierName=@supplierName, purchasePrice=@purchasePrice, sellingPrice=@sellingPrice,
      stockMin=@stockMin, unit=@unit, location=@location, tva=@tva, updatedAt=@updatedAt
     WHERE id=@id`
  ).run({ ...merged, id, updatedAt: nowIso() });
}

export function deactivateProduct(id: string) {
  db.prepare("UPDATE Product SET active = 0 WHERE id = ?").run(id);
}

export function recordStockMovement(
  productId: string,
  storeId: string,
  type: StockMovementType,
  quantity: number,
  note?: string
) {
  db.prepare(
    "INSERT INTO StockMovement (id, type, quantity, note, productId, storeId) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(newId("mov"), type, quantity, note ?? null, productId, storeId);
  db.prepare(
    "UPDATE Product SET stockQty = stockQty + ?, updatedAt = ? WHERE id = ?"
  ).run(quantity, nowIso(), productId);
}

export function listStockMovements(productId: string) {
  return db
    .prepare(
      "SELECT * FROM StockMovement WHERE productId = ? ORDER BY createdAt DESC LIMIT 100"
    )
    .all(productId);
}

export function stockAlerts(storeId: string) {
  const products = listProducts(storeId);
  return products
    .map((p) => {
      let level: "critique" | "faible" | "normal" = "normal";
      if (p.stockMin > 0) {
        if (p.stockQty <= p.stockMin * 0.5) level = "critique";
        else if (p.stockQty <= p.stockMin) level = "faible";
      } else if (p.stockQty === 0) {
        level = "critique";
      }
      return { product: p, level };
    })
    .filter((a) => a.level !== "normal")
    .sort((a, b) => (a.level === "critique" ? -1 : 1));
}

export function stockValue(storeId: string): number {
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(stockQty * purchasePrice), 0) as val FROM Product WHERE storeId = ? AND active = 1"
    )
    .get(storeId) as { val: number };
  return row.val;
}

export function transferStock(input: {
  productId: string;
  fromStoreId: string;
  toStoreId: string;
  quantity: number;
  note?: string;
}) {
  const source = getProduct(input.productId);
  if (!source) throw new Error("Produit introuvable");
  if (source.stockQty < input.quantity)
    throw new Error("Stock insuffisant pour ce transfert");

  const tx = db.transaction(() => {
    db.prepare(
      "INSERT INTO StockTransfer (id, productId, quantity, note, fromStoreId, toStoreId) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      newId("transfer"),
      input.productId,
      input.quantity,
      input.note ?? null,
      input.fromStoreId,
      input.toStoreId
    );
    recordStockMovement(
      input.productId,
      input.fromStoreId,
      "TRANSFERT_SORTIE",
      -input.quantity,
      `Transfert vers boutique`
    );

    // find or create matching product in destination store by SKU
    let dest = db
      .prepare("SELECT * FROM Product WHERE storeId = ? AND sku = ?")
      .get(input.toStoreId, source.sku) as
      | ReturnType<typeof getProduct>
      | undefined;

    if (!dest) {
      const id = newId("prod");
      db.prepare(
        `INSERT INTO Product (id, sku, barcode, name, category, supplierName, purchasePrice, sellingPrice, stockQty, stockMin, unit, location, tva, storeId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`
      ).run(
        id,
        source.sku,
        source.barcode,
        source.name,
        source.category,
        source.supplierName,
        source.purchasePrice,
        source.sellingPrice,
        source.stockMin,
        source.unit,
        source.location,
        source.tva,
        input.toStoreId
      );
      dest = getProduct(id);
    }
    recordStockMovement(
      dest!.id,
      input.toStoreId,
      "TRANSFERT_ENTREE",
      input.quantity,
      `Transfert reçu`
    );
  });
  tx();
}

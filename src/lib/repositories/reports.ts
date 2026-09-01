import { db } from "@/lib/db";

export function topProducts(storeId: string, startIso: string, endIso: string, limit = 10) {
  return db
    .prepare(
      `SELECT p.id, p.name, SUM(si.quantity) as qty,
        SUM(si.quantity * si.unitPrice - si.discount) as revenue,
        SUM((si.unitPrice - p.purchasePrice) * si.quantity - si.discount) as margin
       FROM SaleItem si
       JOIN Sale s ON s.id = si.saleId
       JOIN Product p ON p.id = si.productId
       WHERE s.storeId = ? AND s.cancelled = 0 AND s.createdAt >= ? AND s.createdAt < ?
       GROUP BY p.id ORDER BY revenue DESC LIMIT ?`
    )
    .all(storeId, startIso, endIso, limit);
}

export function lowRotationProducts(storeId: string, sinceIso: string) {
  return db
    .prepare(
      `SELECT * FROM (
        SELECT p.id, p.name, p.stockQty, p.category,
          COALESCE((SELECT SUM(si.quantity) FROM SaleItem si JOIN Sale s ON s.id = si.saleId
            WHERE si.productId = p.id AND s.createdAt >= ? AND s.cancelled = 0), 0) as soldQty
         FROM Product p WHERE p.storeId = ? AND p.active = 1
       ) t
       WHERE t.soldQty <= 1
       ORDER BY t.stockQty DESC`
    )
    .all(sinceIso, storeId);
}

export function lowMarginProducts(storeId: string) {
  return db
    .prepare(
      `SELECT id, name, purchasePrice, sellingPrice,
        CASE WHEN sellingPrice > 0 THEN (sellingPrice - purchasePrice) / sellingPrice ELSE 0 END as marginRate
       FROM Product WHERE storeId = ? AND active = 1
       ORDER BY marginRate ASC LIMIT 10`
    )
    .all(storeId);
}

export function dormantStock(storeId: string, sinceIso: string) {
  return db
    .prepare(
      `SELECT p.id, p.name, p.stockQty, p.purchasePrice, (p.stockQty * p.purchasePrice) as value
       FROM Product p
       WHERE p.storeId = ? AND p.active = 1 AND p.stockQty > 0
       AND NOT EXISTS (
         SELECT 1 FROM SaleItem si JOIN Sale s ON s.id = si.saleId
         WHERE si.productId = p.id AND s.createdAt >= ?
       )
       ORDER BY value DESC`
    )
    .all(storeId, sinceIso);
}

export function salesBySeller(storeId: string, startIso: string, endIso: string) {
  return db
    .prepare(
      `SELECT u.id, u.name, COUNT(DISTINCT s.id) as nbVentes,
        COALESCE(SUM(s.total),0) as ca,
        COALESCE(SUM(s.discount),0) as remises
       FROM Sale s JOIN User u ON u.id = s.sellerId
       WHERE s.storeId = ? AND s.cancelled = 0 AND s.createdAt >= ? AND s.createdAt < ?
       GROUP BY u.id ORDER BY ca DESC`
    )
    .all(storeId, startIso, endIso);
}

export function averageBasket(storeId: string, startIso: string, endIso: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(AVG(total),0) as avg FROM Sale
       WHERE storeId = ? AND cancelled = 0 AND createdAt >= ? AND createdAt < ?`
    )
    .get(storeId, startIso, endIso) as { avg: number };
  return row.avg;
}

export function salesTimeSeries(storeId: string, days: number) {
  return db
    .prepare(
      `SELECT date(createdAt) as day, COALESCE(SUM(total),0) as total
       FROM Sale
       WHERE storeId = ? AND cancelled = 0 AND createdAt >= date('now', ?)
       GROUP BY day ORDER BY day`
    )
    .all(storeId, `-${days} days`);
}

export function marginBetween(storeId: string, startIso: string, endIso: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM((si.unitPrice - p.purchasePrice) * si.quantity - si.discount), 0) as margin
       FROM SaleItem si
       JOIN Sale s ON s.id = si.saleId
       JOIN Product p ON p.id = si.productId
       WHERE s.storeId = ? AND s.cancelled = 0 AND s.createdAt >= ? AND s.createdAt < ?`
    )
    .get(storeId, startIso, endIso) as { margin: number };
  return row.margin;
}

export function cancellationsCount(storeId: string, startIso: string, endIso: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM Sale WHERE storeId = ? AND cancelled = 1 AND createdAt >= ? AND createdAt < ?`
    )
    .get(storeId, startIso, endIso) as { c: number };
  return row.c;
}

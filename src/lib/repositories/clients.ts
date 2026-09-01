import { db, newId } from "@/lib/db";
import type { Client } from "@/lib/types";

export function listClients(storeId: string): Client[] {
  return db
    .prepare("SELECT * FROM Client WHERE storeId = ? ORDER BY name")
    .all(storeId) as Client[];
}

export function getClient(id: string): Client | undefined {
  return db.prepare("SELECT * FROM Client WHERE id = ?").get(id) as
    | Client
    | undefined;
}

export function createClient(input: {
  storeId: string;
  name: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
}): Client {
  const id = newId("client");
  db.prepare(
    "INSERT INTO Client (id, name, phone, address, creditLimit, storeId) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    input.name,
    input.phone ?? null,
    input.address ?? null,
    input.creditLimit ?? 0,
    input.storeId
  );
  return getClient(id)!;
}

export function clientDebt(clientId: string): number {
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(amount),0) as total FROM DebtPayment WHERE clientId = ?"
    )
    .get(clientId) as { total: number };
  // stored as negative for charges, positive for payments; debt = -total
  return -row.total;
}

export function clientDebtHistory(clientId: string) {
  return db
    .prepare(
      "SELECT * FROM DebtPayment WHERE clientId = ? ORDER BY createdAt DESC"
    )
    .all(clientId);
}

export function recordDebtPayment(clientId: string, amount: number, note?: string) {
  db.prepare(
    "INSERT INTO DebtPayment (id, amount, note, clientId) VALUES (?, ?, ?, ?)"
  ).run(newId("debt"), Math.abs(amount), note ?? "Paiement de dette", clientId);
}

export function clientPurchaseHistory(clientId: string) {
  return db
    .prepare(
      "SELECT * FROM Sale WHERE clientId = ? ORDER BY createdAt DESC LIMIT 50"
    )
    .all(clientId);
}

export function listClientsWithDebt(storeId: string) {
  const clients = listClients(storeId);
  return clients.map((c) => ({ ...c, debt: clientDebt(c.id) }));
}

export function totalClientDebts(storeId: string): number {
  const rows = listClientsWithDebt(storeId);
  return rows.reduce((s, c) => s + Math.max(0, c.debt), 0);
}

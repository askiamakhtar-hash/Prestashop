import { db, newId } from "@/lib/db";
import type { Store } from "@/lib/types";

export function listStores(): Store[] {
  return db.prepare("SELECT * FROM Store ORDER BY name").all() as Store[];
}

export function getStore(id: string): Store | undefined {
  return db.prepare("SELECT * FROM Store WHERE id = ?").get(id) as
    | Store
    | undefined;
}

export function createStore(name: string, city?: string): Store {
  const id = newId("store");
  db.prepare("INSERT INTO Store (id, name, city) VALUES (?, ?, ?)").run(
    id,
    name,
    city ?? null
  );
  const accounts: [string, string][] = [
    ["Caisse", "ESPECES"],
    ["Wave", "WAVE"],
    ["Orange Money", "ORANGE_MONEY"],
    ["Banque", "BANQUE"],
  ];
  const insertAccount = db.prepare(
    "INSERT INTO CashAccount (id, name, type, balance, storeId) VALUES (?, ?, ?, 0, ?)"
  );
  for (const [name2, type] of accounts) {
    insertAccount.run(newId("cash"), name2, type, id);
  }
  return getStore(id)!;
}

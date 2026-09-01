import { db, newId } from "@/lib/db";
import type { CashAccount, PaymentMethod } from "@/lib/types";

const TYPE_BY_METHOD: Record<string, string> = {
  ESPECES: "ESPECES",
  WAVE: "WAVE",
  ORANGE_MONEY: "ORANGE_MONEY",
  VIREMENT: "BANQUE",
  CARTE: "BANQUE",
};

export function listCashAccounts(storeId: string): CashAccount[] {
  return db
    .prepare("SELECT * FROM CashAccount WHERE storeId = ? ORDER BY name")
    .all(storeId) as CashAccount[];
}

export function getOrCreateCashAccount(
  storeId: string,
  method: PaymentMethod | string
): CashAccount {
  const type = TYPE_BY_METHOD[method] ?? method;
  let account = db
    .prepare("SELECT * FROM CashAccount WHERE storeId = ? AND type = ?")
    .get(storeId, type) as CashAccount | undefined;
  if (!account) {
    const id = newId("cash");
    const name =
      type === "ESPECES"
        ? "Caisse"
        : type === "WAVE"
        ? "Wave"
        : type === "ORANGE_MONEY"
        ? "Orange Money"
        : "Banque";
    db.prepare(
      "INSERT INTO CashAccount (id, name, type, balance, storeId) VALUES (?, ?, ?, 0, ?)"
    ).run(id, name, type, storeId);
    account = db.prepare("SELECT * FROM CashAccount WHERE id = ?").get(id) as CashAccount;
  }
  return account;
}

export function applyCashTransaction(
  cashAccountId: string,
  label: string,
  amount: number,
  category?: string,
  userId?: string
) {
  db.prepare(
    "INSERT INTO CashTransaction (id, label, amount, category, cashAccountId, userId) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(newId("ctx"), label, amount, category ?? null, cashAccountId, userId ?? null);
  db.prepare("UPDATE CashAccount SET balance = balance + ? WHERE id = ?").run(
    amount,
    cashAccountId
  );
}

export function totalAvailable(storeId: string): number {
  const row = db
    .prepare("SELECT COALESCE(SUM(balance),0) as total FROM CashAccount WHERE storeId = ?")
    .get(storeId) as { total: number };
  return row.total;
}

export function listCashTransactions(storeId: string, limit = 50) {
  return db
    .prepare(
      `SELECT ct.*, ca.name as accountName FROM CashTransaction ct
       JOIN CashAccount ca ON ca.id = ct.cashAccountId
       WHERE ca.storeId = ?
       ORDER BY ct.createdAt DESC LIMIT ?`
    )
    .all(storeId, limit);
}

export function recordExpense(input: {
  storeId: string;
  label: string;
  category: string;
  amount: number;
  cashAccountId: string;
  userId?: string;
}) {
  db.prepare(
    "INSERT INTO Expense (id, label, category, amount, storeId, userId) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    newId("exp"),
    input.label,
    input.category,
    input.amount,
    input.storeId,
    input.userId ?? null
  );
  applyCashTransaction(
    input.cashAccountId,
    input.label,
    -Math.abs(input.amount),
    input.category,
    input.userId
  );
}

export function recordManualRecette(input: {
  cashAccountId: string;
  label: string;
  amount: number;
  userId?: string;
}) {
  applyCashTransaction(
    input.cashAccountId,
    input.label,
    Math.abs(input.amount),
    "recette",
    input.userId
  );
}

export function expensesBetween(storeId: string, startIso: string, endIso: string): number {
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(amount),0) as total FROM Expense WHERE storeId = ? AND createdAt >= ? AND createdAt < ?"
    )
    .get(storeId, startIso, endIso) as { total: number };
  return row.total;
}

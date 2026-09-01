import { db, newId } from "@/lib/db";
import type { Role, User } from "@/lib/types";
import { hashPassword } from "@/lib/auth";

export function findUserByEmail(email: string): User | undefined {
  return db.prepare("SELECT * FROM User WHERE email = ?").get(email) as
    | User
    | undefined;
}

export function getUser(id: string): User | undefined {
  return db.prepare("SELECT * FROM User WHERE id = ?").get(id) as
    | User
    | undefined;
}

export function listUsersByStore(storeId: string): User[] {
  return db
    .prepare("SELECT * FROM User WHERE storeId = ? ORDER BY name")
    .all(storeId) as User[];
}

export async function createUser(input: {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  pin: string;
  role: Role;
  storeId: string | null;
}): Promise<User> {
  const id = newId("user");
  const passwordHash = await hashPassword(input.password);
  db.prepare(
    `INSERT INTO User (id, name, email, phone, passwordHash, pin, role, storeId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.email ?? null,
    input.phone ?? null,
    passwordHash,
    input.pin,
    input.role,
    input.storeId
  );
  return getUser(id)!;
}

export function setUserActive(id: string, active: boolean) {
  db.prepare("UPDATE User SET active = ? WHERE id = ?").run(
    active ? 1 : 0,
    id
  );
}

export function logAudit(
  userId: string,
  storeId: string,
  action: string,
  details?: string
) {
  db.prepare(
    "INSERT INTO AuditLog (id, action, details, userId, storeId) VALUES (?, ?, ?, ?, ?)"
  ).run(newId("audit"), action, details ?? null, userId, storeId);
}

export function listAuditLogs(storeId: string, limit = 50) {
  return db
    .prepare(
      `SELECT a.*, u.name as userName FROM AuditLog a
       JOIN User u ON u.id = a.userId
       WHERE a.storeId = ? ORDER BY a.createdAt DESC LIMIT ?`
    )
    .all(storeId, limit);
}

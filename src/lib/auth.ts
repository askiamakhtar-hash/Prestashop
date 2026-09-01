import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const ROLE_LABELS: Record<string, string> = {
  PROPRIETAIRE: "Propriétaire",
  MANAGER: "Manager",
  CAISSIER: "Caissier",
  MAGASINIER: "Magasinier",
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  PROPRIETAIRE: [
    "dashboard",
    "caisse",
    "stock",
    "achats",
    "clients",
    "tresorerie",
    "rapports",
    "boutiques",
    "employes",
    "parametres",
  ],
  MANAGER: [
    "dashboard",
    "caisse",
    "stock",
    "achats",
    "clients",
    "rapports",
  ],
  CAISSIER: ["caisse", "clients"],
  MAGASINIER: ["stock", "achats"],
};

export function canAccess(role: string, section: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(section) ?? false;
}

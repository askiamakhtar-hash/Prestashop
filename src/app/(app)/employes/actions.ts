"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/guard";
import { createUser, setUserActive, findUserByEmail, logAudit } from "@/lib/repositories/users";
import type { Role } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createEmployeeAction(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  pin: string;
  role: Role;
}): Promise<ActionResult> {
  const session = await requireSection("employes");
  if (session.role !== "PROPRIETAIRE") return { ok: false, error: "Accès refusé." };
  if (!input.name.trim() || !input.email.trim() || !input.password || !input.pin) {
    return { ok: false, error: "Tous les champs obligatoires doivent être renseignés." };
  }
  if (findUserByEmail(input.email.toLowerCase())) {
    return { ok: false, error: "Cet email est déjà utilisé." };
  }
  const user = await createUser({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone || undefined,
    password: input.password,
    pin: input.pin,
    role: input.role,
    storeId: session.storeId,
  });
  logAudit(session.userId, session.storeId, "EMPLOYE_CREE", `${user.name} (${user.role})`);
  revalidatePath("/employes");
  return { ok: true };
}

export async function toggleEmployeeActiveAction(
  userId: string,
  active: boolean
): Promise<ActionResult> {
  const session = await requireSection("employes");
  if (session.role !== "PROPRIETAIRE") return { ok: false, error: "Accès refusé." };
  setUserActive(userId, active);
  logAudit(session.userId, session.storeId, active ? "EMPLOYE_ACTIVE" : "EMPLOYE_DESACTIVE", userId);
  revalidatePath("/employes");
  return { ok: true };
}

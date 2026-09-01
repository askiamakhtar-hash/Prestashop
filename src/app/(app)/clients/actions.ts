"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/guard";
import { createClient, recordDebtPayment } from "@/lib/repositories/clients";
import { logAudit } from "@/lib/repositories/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createClientAction(input: {
  name: string;
  phone: string;
  address: string;
  creditLimit: number;
}): Promise<ActionResult> {
  const session = await requireSection("clients");
  if (!input.name.trim()) return { ok: false, error: "Le nom est obligatoire." };
  const client = createClient({
    storeId: session.storeId,
    name: input.name,
    phone: input.phone || undefined,
    address: input.address || undefined,
    creditLimit: input.creditLimit,
  });
  logAudit(session.userId, session.storeId, "CLIENT_CREE", client.name);
  revalidatePath("/clients");
  revalidatePath("/caisse");
  return { ok: true };
}

export async function recordPaymentAction(
  clientId: string,
  amount: number
): Promise<ActionResult> {
  const session = await requireSection("clients");
  if (amount <= 0) return { ok: false, error: "Montant invalide." };
  recordDebtPayment(clientId, amount);
  logAudit(session.userId, session.storeId, "PAIEMENT_DETTE", `${clientId} ${amount}`);
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/guard";
import { recordExpense, recordManualRecette } from "@/lib/repositories/treasury";
import { logAudit } from "@/lib/repositories/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addExpenseAction(input: {
  cashAccountId: string;
  label: string;
  category: string;
  amount: number;
}): Promise<ActionResult> {
  const session = await requireSection("tresorerie");
  if (!input.label.trim() || input.amount <= 0) {
    return { ok: false, error: "Renseignez un libellé et un montant valide." };
  }
  recordExpense({
    storeId: session.storeId,
    label: input.label,
    category: input.category,
    amount: input.amount,
    cashAccountId: input.cashAccountId,
    userId: session.userId,
  });
  logAudit(session.userId, session.storeId, "DEPENSE", `${input.label} — ${input.amount}`);
  revalidatePath("/tresorerie");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addRecetteAction(input: {
  cashAccountId: string;
  label: string;
  amount: number;
}): Promise<ActionResult> {
  const session = await requireSection("tresorerie");
  if (!input.label.trim() || input.amount <= 0) {
    return { ok: false, error: "Renseignez un libellé et un montant valide." };
  }
  recordManualRecette({
    cashAccountId: input.cashAccountId,
    label: input.label,
    amount: input.amount,
    userId: session.userId,
  });
  logAudit(session.userId, session.storeId, "RECETTE", `${input.label} — ${input.amount}`);
  revalidatePath("/tresorerie");
  revalidatePath("/dashboard");
  return { ok: true };
}

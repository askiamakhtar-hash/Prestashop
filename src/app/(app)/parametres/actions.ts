"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/guard";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/repositories/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateStoreInfoAction(input: {
  name: string;
  city: string;
}): Promise<ActionResult> {
  const session = await requireSection("parametres");
  if (session.role !== "PROPRIETAIRE") return { ok: false, error: "Accès refusé." };
  if (!input.name.trim()) return { ok: false, error: "Le nom est obligatoire." };
  db.prepare("UPDATE Store SET name = ?, city = ? WHERE id = ?").run(
    input.name,
    input.city || null,
    session.storeId
  );
  logAudit(session.userId, session.storeId, "BOUTIQUE_MODIFIEE", input.name);
  revalidatePath("/parametres");
  return { ok: true };
}

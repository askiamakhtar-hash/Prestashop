"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/guard";
import { createStore } from "@/lib/repositories/stores";
import { transferStock } from "@/lib/repositories/products";
import { logAudit } from "@/lib/repositories/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createStoreAction(input: {
  name: string;
  city: string;
}): Promise<ActionResult> {
  const session = await requireSection("boutiques");
  if (session.role !== "PROPRIETAIRE") return { ok: false, error: "Accès refusé." };
  if (!input.name.trim()) return { ok: false, error: "Le nom est obligatoire." };
  const store = createStore(input.name, input.city || undefined);
  logAudit(session.userId, session.storeId, "BOUTIQUE_CREEE", store.name);
  revalidatePath("/boutiques");
  return { ok: true };
}

export async function transferStockAction(input: {
  productId: string;
  fromStoreId: string;
  toStoreId: string;
  quantity: number;
  note?: string;
}): Promise<ActionResult> {
  const session = await requireSection("boutiques");
  if (session.role !== "PROPRIETAIRE") return { ok: false, error: "Accès refusé." };
  if (input.fromStoreId === input.toStoreId) {
    return { ok: false, error: "Choisissez deux boutiques différentes." };
  }
  try {
    transferStock(input);
    logAudit(
      session.userId,
      session.storeId,
      "TRANSFERT_STOCK",
      `${input.quantity} unités transférées`
    );
    revalidatePath("/boutiques");
    revalidatePath("/stock");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

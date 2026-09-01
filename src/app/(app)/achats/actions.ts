"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/guard";
import {
  createSupplier,
  createPurchaseOrder,
  receivePurchaseOrder,
  payPurchaseOrder,
} from "@/lib/repositories/suppliers";
import { getOrCreateCashAccount } from "@/lib/repositories/treasury";
import { logAudit } from "@/lib/repositories/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createSupplierAction(input: {
  name: string;
  phone: string;
  address: string;
}): Promise<ActionResult> {
  const session = await requireSection("achats");
  if (!input.name.trim()) return { ok: false, error: "Le nom est obligatoire." };
  const supplier = createSupplier({
    storeId: session.storeId,
    name: input.name,
    phone: input.phone || undefined,
    address: input.address || undefined,
  });
  logAudit(session.userId, session.storeId, "FOURNISSEUR_CREE", supplier.name);
  revalidatePath("/achats");
  return { ok: true };
}

export async function createPurchaseOrderAction(input: {
  supplierId: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}): Promise<ActionResult> {
  const session = await requireSection("achats");
  if (!input.supplierId) return { ok: false, error: "Sélectionnez un fournisseur." };
  if (input.items.length === 0) return { ok: false, error: "Ajoutez au moins un article." };
  try {
    const po = createPurchaseOrder({
      storeId: session.storeId,
      supplierId: input.supplierId,
      items: input.items,
    });
    logAudit(session.userId, session.storeId, "COMMANDE_CREEE", po.reference);
    revalidatePath("/achats");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function receivePurchaseOrderAction(id: string): Promise<ActionResult> {
  const session = await requireSection("achats");
  try {
    receivePurchaseOrder(id, session.storeId);
    logAudit(session.userId, session.storeId, "COMMANDE_RECUE", id);
    revalidatePath("/achats");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function payPurchaseOrderAction(
  id: string,
  cashAccountType: string
): Promise<ActionResult> {
  const session = await requireSection("achats");
  try {
    const account = getOrCreateCashAccount(session.storeId, cashAccountType);
    payPurchaseOrder(id, session.storeId, account.id, session.userId);
    logAudit(session.userId, session.storeId, "COMMANDE_PAYEE", id);
    revalidatePath("/achats");
    revalidatePath("/tresorerie");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

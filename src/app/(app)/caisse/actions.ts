"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/guard";
import { createSale } from "@/lib/repositories/sales";
import { logAudit } from "@/lib/repositories/users";
import type { PaymentMethod } from "@/lib/types";

export type SubmitSaleInput = {
  clientId: string | null;
  items: { productId: string; quantity: number; unitPrice: number; discount: number }[];
  discount: number;
  payments: { method: PaymentMethod; amount: number }[];
};

export type SubmitSaleResult =
  | { ok: true; reference: string; total: number }
  | { ok: false; error: string };

export async function submitSale(input: SubmitSaleInput): Promise<SubmitSaleResult> {
  const session = await requireSection("caisse");

  try {
    const sale = createSale({
      storeId: session.storeId,
      sellerId: session.userId,
      clientId: input.clientId,
      items: input.items,
      discount: input.discount,
      payments: input.payments,
    });

    logAudit(
      session.userId,
      session.storeId,
      "VENTE",
      `Vente ${sale.reference} — ${sale.total} FCFA`
    );

    revalidatePath("/caisse");
    revalidatePath("/dashboard");
    revalidatePath("/stock");
    revalidatePath("/tresorerie");
    revalidatePath("/clients");

    return { ok: true, reference: sale.reference, total: sale.total };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

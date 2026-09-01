"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/guard";
import {
  createProduct,
  updateProduct,
  deactivateProduct,
  recordStockMovement,
} from "@/lib/repositories/products";
import { logAudit } from "@/lib/repositories/users";
import type { StockMovementType } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type ProductInput = {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  supplierName: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQty: number;
  stockMin: number;
  unit: string;
  location: string;
  tva: number;
};

export async function createProductAction(input: ProductInput): Promise<ActionResult> {
  const session = await requireSection("stock");
  try {
    const product = createProduct({
      storeId: session.storeId,
      sku: input.sku,
      barcode: input.barcode || undefined,
      name: input.name,
      category: input.category || undefined,
      supplierName: input.supplierName || undefined,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      stockQty: input.stockQty,
      stockMin: input.stockMin,
      unit: input.unit || "unité",
      location: input.location || undefined,
      tva: input.tva,
    });
    logAudit(session.userId, session.storeId, "PRODUIT_CREE", product.name);
    revalidatePath("/stock");
    revalidatePath("/caisse");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateProductAction(
  id: string,
  input: ProductInput
): Promise<ActionResult> {
  const session = await requireSection("stock");
  try {
    updateProduct(id, {
      sku: input.sku,
      barcode: input.barcode || null,
      name: input.name,
      category: input.category || null,
      supplierName: input.supplierName || null,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      stockMin: input.stockMin,
      unit: input.unit || "unité",
      location: input.location || null,
      tva: input.tva,
    });
    logAudit(session.userId, session.storeId, "PRODUIT_MODIFIE", input.name);
    revalidatePath("/stock");
    revalidatePath("/caisse");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deactivateProductAction(id: string): Promise<ActionResult> {
  const session = await requireSection("stock");
  deactivateProduct(id);
  logAudit(session.userId, session.storeId, "PRODUIT_DESACTIVE", id);
  revalidatePath("/stock");
  revalidatePath("/caisse");
  return { ok: true };
}

export async function adjustStockAction(input: {
  productId: string;
  type: StockMovementType;
  quantity: number;
  note?: string;
}): Promise<ActionResult> {
  const session = await requireSection("stock");
  try {
    const signedQty = ["PERTE", "CASSE", "CONSOMMATION"].includes(input.type)
      ? -Math.abs(input.quantity)
      : Math.abs(input.quantity);
    recordStockMovement(input.productId, session.storeId, input.type, signedQty, input.note);
    logAudit(session.userId, session.storeId, "MOUVEMENT_STOCK", `${input.type} ${signedQty}`);
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

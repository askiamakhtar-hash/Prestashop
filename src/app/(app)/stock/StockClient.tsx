"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, Pencil, PackagePlus, AlertTriangle, X } from "lucide-react";
import { formatCFA, formatNumber, formatPercent } from "@/lib/format";
import {
  createProductAction,
  updateProductAction,
  adjustStockAction,
  type ProductInput,
} from "./actions";
import type { Product, StockMovementType } from "@/lib/types";

const EMPTY_FORM: ProductInput = {
  sku: "",
  barcode: "",
  name: "",
  category: "",
  supplierName: "",
  purchasePrice: 0,
  sellingPrice: 0,
  stockQty: 0,
  stockMin: 0,
  unit: "unité",
  location: "",
  tva: 0,
};

const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  ACHAT_FOURNISSEUR: "Achat fournisseur",
  RETOUR_CLIENT: "Retour client",
  INVENTAIRE: "Ajustement inventaire",
  VENTE: "Vente",
  PERTE: "Perte",
  CASSE: "Casse",
  CONSOMMATION: "Consommation interne",
  TRANSFERT_ENTREE: "Transfert (entrée)",
  TRANSFERT_SORTIE: "Transfert (sortie)",
};

export default function StockClient({
  products,
  alerts,
  role,
}: {
  products: Product[];
  alerts: { product: Product; level: string }[];
  role: string;
}) {
  const [query, setQuery] = useState("");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [modal, setModal] = useState<null | { mode: "create" } | { mode: "edit"; product: Product }>(
    null
  );
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);

  const alertIds = new Set(alerts.map((a) => a.product.id));

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  );

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q);
    const matchesAlert = !onlyAlerts || alertIds.has(p.id);
    return matchesQuery && matchesAlert;
  });

  const canEdit = role === "PROPRIETAIRE" || role === "MANAGER" || role === "MAGASINIER";

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={() => setOnlyAlerts((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border ${
            onlyAlerts
              ? "bg-amber-50 border-amber-300 text-amber-700"
              : "border-slate-300 text-slate-600"
          }`}
        >
          <AlertTriangle size={14} /> Alertes ({alerts.length})
        </button>
        {canEdit && (
          <button
            onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-1.5 bg-[#12b76a] hover:bg-[#0f9d5a] text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Nouveau produit
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">Produit</th>
                <th className="text-left px-4 py-2.5">Catégorie</th>
                <th className="text-right px-4 py-2.5">Prix achat</th>
                <th className="text-right px-4 py-2.5">Prix vente</th>
                <th className="text-right px-4 py-2.5">Marge</th>
                <th className="text-right px-4 py-2.5">Stock</th>
                <th className="text-right px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const margin = p.sellingPrice > 0 ? (p.sellingPrice - p.purchasePrice) / p.sellingPrice : 0;
                const isAlert = alertIds.has(p.id);
                const alertLevel = alerts.find((a) => a.product.id === p.id)?.level;
                return (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-400">
                        {p.sku} {p.barcode ? `· ${p.barcode}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{p.category}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      {formatCFA(p.purchasePrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                      {formatCFA(p.sellingPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500">
                      {formatPercent(margin)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          alertLevel === "critique"
                            ? "text-red-600"
                            : alertLevel === "faible"
                            ? "text-amber-600"
                            : "text-slate-700"
                        }`}
                      >
                        {isAlert && <AlertTriangle size={12} />}
                        {formatNumber(p.stockQty)} {p.unit}
                      </span>
                      <div className="text-[11px] text-slate-400">min {p.stockMin}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setAdjustProduct(p)}
                              title="Mouvement de stock"
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                            >
                              <PackagePlus size={16} />
                            </button>
                            <button
                              onClick={() => setModal({ mode: "edit", product: p })}
                              title="Modifier"
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                            >
                              <Pencil size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Aucun produit trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ProductModal
          initial={modal.mode === "edit" ? modal.product : null}
          onClose={() => setModal(null)}
        />
      )}
      {adjustProduct && (
        <AdjustStockModal product={adjustProduct} onClose={() => setAdjustProduct(null)} />
      )}
    </div>
  );
}

function ProductModal({
  initial,
  onClose,
}: {
  initial: Product | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductInput>(
    initial
      ? {
          sku: initial.sku,
          barcode: initial.barcode ?? "",
          name: initial.name,
          category: initial.category ?? "",
          supplierName: initial.supplierName ?? "",
          purchasePrice: initial.purchasePrice,
          sellingPrice: initial.sellingPrice,
          stockQty: initial.stockQty,
          stockMin: initial.stockMin,
          unit: initial.unit,
          location: initial.location ?? "",
          tva: initial.tva,
        }
      : EMPTY_FORM
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    setError(null);
    if (!form.name || !form.sku) {
      setError("Le nom et le SKU sont obligatoires.");
      return;
    }
    startTransition(async () => {
      const result = initial
        ? await updateProductAction(initial.id, form)
        : await createProductAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900">
            {initial ? "Modifier le produit" : "Nouveau produit"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nom du produit" span2>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="SKU">
            <input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="input" />
          </Field>
          <Field label="Code-barres">
            <input
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Catégorie">
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Fournisseur">
            <input
              value={form.supplierName}
              onChange={(e) => set("supplierName", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Prix d'achat (FCFA)">
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => set("purchasePrice", Number(e.target.value) || 0)}
              className="input"
            />
          </Field>
          <Field label="Prix de vente (FCFA)">
            <input
              type="number"
              value={form.sellingPrice}
              onChange={(e) => set("sellingPrice", Number(e.target.value) || 0)}
              className="input"
            />
          </Field>
          {!initial && (
            <Field label="Stock initial">
              <input
                type="number"
                value={form.stockQty}
                onChange={(e) => set("stockQty", Number(e.target.value) || 0)}
                className="input"
              />
            </Field>
          )}
          <Field label="Stock minimum (alerte)">
            <input
              type="number"
              value={form.stockMin}
              onChange={(e) => set("stockMin", Number(e.target.value) || 0)}
              className="input"
            />
          </Field>
          <Field label="Unité">
            <input value={form.unit} onChange={(e) => set("unit", e.target.value)} className="input" />
          </Field>
          <Field label="Emplacement">
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="TVA (%)">
            <input
              type="number"
              value={form.tva}
              onChange={(e) => set("tva", Number(e.target.value) || 0)}
              className="input"
            />
          </Field>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-700"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="flex-1 bg-[#12b76a] hover:bg-[#0f9d5a] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
      <style jsx global>{`
        .input {
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  span2,
}: {
  label: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function AdjustStockModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [type, setType] = useState<StockMovementType>("INVENTAIRE");
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const adjustmentTypes: StockMovementType[] = [
    "INVENTAIRE",
    "RETOUR_CLIENT",
    "PERTE",
    "CASSE",
    "CONSOMMATION",
  ];

  function submit() {
    setError(null);
    if (quantity <= 0) {
      setError("Indiquez une quantité valide.");
      return;
    }
    startTransition(async () => {
      const result = await adjustStockAction({ productId: product.id, type, quantity, note });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-lg text-slate-900">Mouvement de stock</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          {product.name} — stock actuel : {product.stockQty} {product.unit}
        </p>

        <Field label="Type de mouvement">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as StockMovementType)}
            className="input"
          >
            {adjustmentTypes.map((t) => (
              <option key={t} value={t}>
                {MOVEMENT_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <div className="mt-3">
          <Field label="Quantité">
            <input
              type="number"
              min={0}
              value={quantity || ""}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
              className="input"
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Note (optionnel)">
            <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
          </Field>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-700"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="flex-1 bg-[#12b76a] hover:bg-[#0f9d5a] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "..." : "Valider"}
          </button>
        </div>
        <style jsx global>{`
          .input {
            border: 1px solid #cbd5e1;
            border-radius: 0.5rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            width: 100%;
          }
        `}</style>
      </div>
    </div>
  );
}

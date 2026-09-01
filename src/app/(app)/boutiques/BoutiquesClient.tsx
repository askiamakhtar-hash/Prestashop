"use client";

import { useState, useTransition } from "react";
import { Building2, Plus, ArrowRightLeft, X } from "lucide-react";
import { formatCFA, formatNumber } from "@/lib/format";
import { createStoreAction, transferStockAction } from "./actions";
import type { Product, Store } from "@/lib/types";

type Summary = {
  store: Store;
  productCount: number;
  stockVal: number;
  caToday: number;
  products: Product[];
};

export default function BoutiquesClient({
  summaries,
  currentStoreId,
}: {
  summaries: Summary[];
  currentStoreId: string;
}) {
  const [showNewStore, setShowNewStore] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const totalCA = summaries.reduce((s, x) => s + x.caToday, 0);
  const totalStock = summaries.reduce((s, x) => s + x.stockVal, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Dashboard consolidé — Groupe
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-slate-400">Boutiques</div>
            <div className="text-xl font-bold text-slate-900">{summaries.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">CA du jour (groupe)</div>
            <div className="text-xl font-bold text-slate-900">{formatCFA(totalCA)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Valeur du stock (groupe)</div>
            <div className="text-xl font-bold text-slate-900">{formatCFA(totalStock)}</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowTransfer(true)}
          className="flex items-center gap-1.5 border border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg"
        >
          <ArrowRightLeft size={16} /> Transfert de stock
        </button>
        <button
          onClick={() => setShowNewStore(true)}
          className="flex items-center gap-1.5 bg-[#12b76a] hover:bg-[#0f9d5a] text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Nouvelle boutique
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((s) => (
          <div key={s.store.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 size={16} />
              </div>
              <div>
                <div className="font-semibold text-slate-800">
                  {s.store.name}
                  {s.store.id === currentStoreId && (
                    <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      Actuelle
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">{s.store.city}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm mt-3">
              <div>
                <div className="text-xs text-slate-400">Produits</div>
                <div className="font-semibold text-slate-800">{formatNumber(s.productCount)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">CA jour</div>
                <div className="font-semibold text-slate-800">{formatCFA(s.caToday)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Stock</div>
                <div className="font-semibold text-slate-800">{formatCFA(s.stockVal)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNewStore && <NewStoreModal onClose={() => setShowNewStore(false)} />}
      {showTransfer && (
        <TransferModal summaries={summaries} onClose={() => setShowTransfer(false)} />
      )}
    </div>
  );
}

function NewStoreModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createStoreAction({ name, city });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Nouvelle boutique" onClose={onClose}>
      <Field label="Nom de la boutique">
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </Field>
      <Field label="Ville">
        <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
      </Field>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <ModalActions onCancel={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

function TransferModal({
  summaries,
  onClose,
}: {
  summaries: Summary[];
  onClose: () => void;
}) {
  const [fromStoreId, setFromStoreId] = useState(summaries[0]?.store.id ?? "");
  const [toStoreId, setToStoreId] = useState(summaries[1]?.store.id ?? summaries[0]?.store.id ?? "");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fromProducts = summaries.find((s) => s.store.id === fromStoreId)?.products ?? [];

  function submit() {
    setError(null);
    if (!productId) {
      setError("Sélectionnez un produit.");
      return;
    }
    startTransition(async () => {
      const result = await transferStockAction({ productId, fromStoreId, toStoreId, quantity });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Transfert entre boutiques" onClose={onClose}>
      <Field label="Boutique source">
        <select
          value={fromStoreId}
          onChange={(e) => {
            setFromStoreId(e.target.value);
            setProductId("");
          }}
          className="input"
        >
          {summaries.map((s) => (
            <option key={s.store.id} value={s.store.id}>
              {s.store.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Boutique destination">
        <select value={toStoreId} onChange={(e) => setToStoreId(e.target.value)} className="input">
          {summaries.map((s) => (
            <option key={s.store.id} value={s.store.id}>
              {s.store.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Produit">
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input">
          <option value="">Sélectionner...</option>
          {fromProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.stockQty} {p.unit})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Quantité">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          className="input"
        />
      </Field>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <ModalActions onCancel={onClose} onSubmit={submit} pending={pending} submitLabel="Transférer" />
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        {children}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ModalActions({
  onCancel,
  onSubmit,
  pending,
  submitLabel = "Enregistrer",
}: {
  onCancel: () => void;
  onSubmit: () => void;
  pending: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex gap-2 mt-2">
      <button
        onClick={onCancel}
        className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-700"
      >
        Annuler
      </button>
      <button
        onClick={onSubmit}
        disabled={pending}
        className="flex-1 bg-[#12b76a] hover:bg-[#0f9d5a] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "..." : submitLabel}
      </button>
    </div>
  );
}

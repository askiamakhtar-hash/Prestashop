"use client";

import { useState, useTransition } from "react";
import { Plus, X, Truck, CheckCircle2, Wallet } from "lucide-react";
import { formatCFA, formatDate } from "@/lib/format";
import {
  createSupplierAction,
  createPurchaseOrderAction,
  receivePurchaseOrderAction,
  payPurchaseOrderAction,
} from "./actions";
import type { Product, PurchaseOrderStatus, Supplier, CashAccount } from "@/lib/types";

type OrderRow = {
  id: string;
  reference: string;
  status: PurchaseOrderStatus;
  supplierName: string;
  total: number;
  createdAt: string;
  receivedAt: string | null;
  paidAt: string | null;
};

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE: "En attente",
  RECU: "Reçu",
  FACTURE: "Facturé",
  PAYE: "Payé",
  ANNULE: "Annulé",
};

const STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  BROUILLON: "bg-slate-100 text-slate-600",
  EN_ATTENTE: "bg-amber-50 text-amber-700",
  RECU: "bg-blue-50 text-blue-700",
  FACTURE: "bg-indigo-50 text-indigo-700",
  PAYE: "bg-emerald-50 text-emerald-700",
  ANNULE: "bg-red-50 text-red-700",
};

export default function AchatsClient({
  suppliers,
  orders,
  products,
  cashAccounts,
}: {
  suppliers: Supplier[];
  orders: OrderRow[];
  products: Product[];
  cashAccounts: CashAccount[];
}) {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [payingOrder, setPayingOrder] = useState<OrderRow | null>(null);
  const [pending, startTransition] = useTransition();

  function receive(id: string) {
    startTransition(async () => {
      await receivePurchaseOrderAction(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          onClick={() => setShowNewSupplier(true)}
          className="flex items-center gap-1.5 border border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Fournisseur
        </button>
        <button
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-1.5 bg-[#12b76a] hover:bg-[#0f9d5a] text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Nouvelle commande
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
          Commandes fournisseurs
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">Référence</th>
                <th className="text-left px-4 py-2.5">Fournisseur</th>
                <th className="text-left px-4 py-2.5">Statut</th>
                <th className="text-right px-4 py-2.5">Total</th>
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-right px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{o.reference}</td>
                  <td className="px-4 py-2.5 text-slate-600">{o.supplierName}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[o.status]}`}
                    >
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                    {formatCFA(o.total)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-2">
                      {o.status === "EN_ATTENTE" && (
                        <button
                          onClick={() => receive(o.id)}
                          disabled={pending}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                        >
                          <Truck size={13} /> Recevoir
                        </button>
                      )}
                      {(o.status === "RECU" || o.status === "FACTURE") && (
                        <button
                          onClick={() => setPayingOrder(o)}
                          className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                        >
                          <Wallet size={13} /> Payer
                        </button>
                      )}
                      {o.status === "PAYE" && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 size={13} /> Payé
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Aucune commande pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
          Fournisseurs
        </div>
        <div className="divide-y divide-slate-100">
          {suppliers.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-slate-800">{s.name}</div>
                <div className="text-xs text-slate-400">{s.phone}</div>
              </div>
              <div className="text-xs text-slate-400">{s.address}</div>
            </div>
          ))}
          {suppliers.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-sm">Aucun fournisseur.</p>
          )}
        </div>
      </div>

      {showNewSupplier && <NewSupplierModal onClose={() => setShowNewSupplier(false)} />}
      {showNewOrder && (
        <NewOrderModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowNewOrder(false)}
        />
      )}
      {payingOrder && (
        <PayOrderModal
          order={payingOrder}
          cashAccounts={cashAccounts}
          onClose={() => setPayingOrder(null)}
        />
      )}
    </div>
  );
}

function NewSupplierModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createSupplierAction({ name, phone, address });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Nouveau fournisseur" onClose={onClose}>
      <LabeledInput label="Nom" value={name} onChange={setName} />
      <LabeledInput label="Téléphone" value={phone} onChange={setPhone} />
      <LabeledInput label="Adresse" value={address} onChange={setAddress} />
      {error && <ErrorText text={error} />}
      <ModalActions onCancel={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

function NewOrderModal({
  suppliers,
  products,
  onClose,
}: {
  suppliers: Supplier[];
  products: Product[];
  onClose: () => void;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [lines, setLines] = useState<{ productId: string; quantity: number; unitPrice: number }[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addLine() {
    const first = products[0];
    if (!first) return;
    setLines((prev) => [
      ...prev,
      { productId: first.id, quantity: 1, unitPrice: first.purchasePrice },
    ]);
  }

  function updateLine(i: number, patch: Partial<{ productId: string; quantity: number; unitPrice: number }>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  function submit() {
    setError(null);
    if (!supplierId) {
      setError("Sélectionnez un fournisseur.");
      return;
    }
    if (lines.length === 0) {
      setError("Ajoutez au moins un article.");
      return;
    }
    startTransition(async () => {
      const result = await createPurchaseOrderAction({ supplierId, items: lines });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Nouvelle commande fournisseur" onClose={onClose} wide>
      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-500 mb-1">Fournisseur</label>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="input"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 mb-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={line.productId}
              onChange={(e) => {
                const p = products.find((pr) => pr.id === e.target.value);
                updateLine(i, {
                  productId: e.target.value,
                  unitPrice: p?.purchasePrice ?? line.unitPrice,
                });
              }}
              className="input flex-1"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={line.quantity}
              onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })}
              className="input w-20"
              placeholder="Qté"
            />
            <input
              type="number"
              value={line.unitPrice}
              onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) || 0 })}
              className="input w-28"
              placeholder="PU"
            />
            <button onClick={() => removeLine(i)} className="text-slate-300 hover:text-red-500">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addLine} className="text-xs font-medium text-[#12b76a] mb-3">
        + Ajouter un article
      </button>

      <div className="flex justify-between text-sm font-semibold text-slate-800 border-t border-slate-100 pt-2 mb-3">
        <span>Total commande</span>
        <span>{formatCFA(total)}</span>
      </div>

      {error && <ErrorText text={error} />}
      <ModalActions onCancel={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

function PayOrderModal({
  order,
  cashAccounts,
  onClose,
}: {
  order: OrderRow;
  cashAccounts: CashAccount[];
  onClose: () => void;
}) {
  const [type, setType] = useState(cashAccounts[0]?.type ?? "ESPECES");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await payPurchaseOrderAction(order.id, type);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={`Payer la commande ${order.reference}`} onClose={onClose}>
      <p className="text-sm text-slate-600 mb-3">
        Montant à payer : <span className="font-semibold">{formatCFA(order.total)}</span>
      </p>
      <label className="block text-xs font-medium text-slate-500 mb-1">Compte de paiement</label>
      <select value={type} onChange={(e) => setType(e.target.value)} className="input">
        {cashAccounts.map((a) => (
          <option key={a.id} value={a.type}>
            {a.name} ({formatCFA(a.balance)})
          </option>
        ))}
      </select>
      {error && <ErrorText text={error} />}
      <ModalActions onCancel={onClose} onSubmit={submit} pending={pending} submitLabel="Payer" />
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full p-6 max-h-[90vh] overflow-y-auto ${wide ? "max-w-lg" : "max-w-sm"}`}>
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

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </div>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
      {text}
    </p>
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

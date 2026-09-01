"use client";

import { useState, useTransition } from "react";
import { Plus, Minus, X, Wallet } from "lucide-react";
import { formatCFA, formatDateTime } from "@/lib/format";
import { addExpenseAction, addRecetteAction } from "./actions";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { CashAccount } from "@/lib/types";

type Transaction = {
  id: string;
  label: string;
  amount: number;
  category: string | null;
  accountName: string;
  createdAt: string;
};

export default function TresorerieClient({
  accounts,
  transactions,
  total,
  margin,
  expenses,
  resultatEstime,
}: {
  accounts: CashAccount[];
  transactions: Transaction[];
  total: number;
  margin: number;
  expenses: number;
  resultatEstime: number;
}) {
  const [modal, setModal] = useState<null | "depense" | "recette">(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((a) => (
          <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Wallet size={14} /> {a.name}
            </div>
            <div className="text-xl font-bold text-slate-900">{formatCFA(a.balance)}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500">Total disponible</div>
            <div className="text-2xl font-bold text-slate-900">{formatCFA(total)}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModal("recette")}
              className="flex items-center gap-1.5 border border-emerald-300 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-lg"
            >
              <Plus size={16} /> Recette
            </button>
            <button
              onClick={() => setModal("depense")}
              className="flex items-center gap-1.5 border border-red-300 text-red-600 text-sm font-semibold px-4 py-2 rounded-lg"
            >
              <Minus size={16} /> Dépense
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Résultat estimé (mois en cours)
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Marge brute</div>
            <div className="font-semibold text-slate-800">{formatCFA(margin)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Dépenses</div>
            <div className="font-semibold text-slate-800">- {formatCFA(expenses)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Résultat estimé</div>
            <div
              className={`font-bold ${resultatEstime >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatCFA(resultatEstime)}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Résultat = Marge brute (CA − coût marchandises) − dépenses
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
          Mouvements récents
        </div>
        <div className="divide-y divide-slate-100 max-h-[28rem] overflow-y-auto">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <div className="text-slate-700 font-medium">{t.label}</div>
                <div className="text-xs text-slate-400">
                  {t.accountName} · {formatDateTime(t.createdAt)}
                </div>
              </div>
              <span className={`font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {t.amount >= 0 ? "+" : ""}
                {formatCFA(t.amount)}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-sm">Aucun mouvement.</p>
          )}
        </div>
      </div>

      {modal === "depense" && (
        <ExpenseModal accounts={accounts} onClose={() => setModal(null)} />
      )}
      {modal === "recette" && (
        <RecetteModal accounts={accounts} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function ExpenseModal({ accounts, onClose }: { accounts: CashAccount[]; onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState(0);
  const [cashAccountId, setCashAccountId] = useState(accounts[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await addExpenseAction({ cashAccountId, label, category, amount });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Nouvelle dépense" onClose={onClose}>
      <Field label="Libellé">
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="input" />
      </Field>
      <Field label="Catégorie">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Montant (FCFA)">
        <input
          type="number"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          className="input"
        />
      </Field>
      <Field label="Compte">
        <select
          value={cashAccountId}
          onChange={(e) => setCashAccountId(e.target.value)}
          className="input"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <ModalActions onCancel={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

function RecetteModal({ accounts, onClose }: { accounts: CashAccount[]; onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState(0);
  const [cashAccountId, setCashAccountId] = useState(accounts[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await addRecetteAction({ cashAccountId, label, amount });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Nouvelle recette" onClose={onClose}>
      <Field label="Libellé">
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="input" />
      </Field>
      <Field label="Montant (FCFA)">
        <input
          type="number"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          className="input"
        />
      </Field>
      <Field label="Compte">
        <select
          value={cashAccountId}
          onChange={(e) => setCashAccountId(e.target.value)}
          className="input"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <ModalActions onCancel={onClose} onSubmit={submit} pending={pending} />
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
}: {
  onCancel: () => void;
  onSubmit: () => void;
  pending: boolean;
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
        {pending ? "..." : "Enregistrer"}
      </button>
    </div>
  );
}

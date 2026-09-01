"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, X, MessageCircle } from "lucide-react";
import { formatCFA, whatsappLink } from "@/lib/format";
import { createClientAction } from "./actions";
import type { Client } from "@/lib/types";

type ClientWithDebt = Client & { debt: number };

export default function ClientsClient({ clients }: { clients: ClientWithDebt[] }) {
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  const filtered = clients.filter((c) => {
    const q = query.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q);
  });

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-[#12b76a] hover:bg-[#0f9d5a] text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">Client</th>
                <th className="text-left px-4 py-2.5">Téléphone</th>
                <th className="text-right px-4 py-2.5">Limite crédit</th>
                <th className="text-right px-4 py-2.5">Dette actuelle</th>
                <th className="text-right px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/clients/${c.id}`} className="font-medium text-slate-800 hover:text-[#12b76a]">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{c.phone}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">
                    {formatCFA(c.creditLimit)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`font-semibold ${c.debt > 0 ? "text-red-600" : "text-slate-400"}`}
                    >
                      {formatCFA(c.debt)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-3">
                      {c.debt > 0 && c.phone && (
                        <a
                          href={whatsappLink(
                            c.phone,
                            `Bonjour ${c.name}, un rappel amical : votre solde chez nous est de ${formatCFA(
                              c.debt
                            )}. Merci !`
                          )}
                          target="_blank"
                          className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                        >
                          <MessageCircle size={13} /> Relancer
                        </a>
                      )}
                      <Link
                        href={`/clients/${c.id}`}
                        className="text-xs font-medium text-slate-500 hover:underline"
                      >
                        Détails
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && <NewClientModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewClientModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createClientAction({ name, phone, address, creditLimit });
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900">Nouveau client</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Adresse</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Limite de crédit (FCFA)
            </label>
            <input
              type="number"
              value={creditLimit || ""}
              onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
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
            {pending ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

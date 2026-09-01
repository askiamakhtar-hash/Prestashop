"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { formatCFA, formatDateTime, whatsappLink } from "@/lib/format";
import { recordPaymentAction } from "../actions";
import type { Client } from "@/lib/types";

export default function ClientDetailClient({
  client,
  debt,
  history,
  purchases,
}: {
  client: Client;
  debt: number;
  history: { id: string; amount: number; note: string | null; createdAt: string }[];
  purchases: { id: string; reference: string; total: number; createdAt: string }[];
}) {
  const [amount, setAmount] = useState(debt > 0 ? debt : 0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submitPayment() {
    setError(null);
    startTransition(async () => {
      const result = await recordPaymentAction(client.id, amount);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div>
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-800"
      >
        <ArrowLeft size={14} /> Retour aux clients
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Dette actuelle</div>
          <div className={`text-2xl font-bold ${debt > 0 ? "text-red-600" : "text-slate-800"}`}>
            {formatCFA(debt)}
          </div>
          {client.creditLimit > 0 && (
            <div className="text-xs text-slate-400 mt-1">
              Limite de crédit : {formatCFA(client.creditLimit)}
            </div>
          )}
          {debt > 0 && client.phone && (
            <a
              href={whatsappLink(
                client.phone,
                `Bonjour ${client.name}, un rappel amical : votre solde chez nous est de ${formatCFA(
                  debt
                )}. Merci !`
              )}
              target="_blank"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-emerald-600"
            >
              <MessageCircle size={14} /> Relancer sur WhatsApp
            </a>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 lg:col-span-2">
          <div className="text-sm font-semibold text-slate-700 mb-2">
            Enregistrer un paiement
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-40"
            />
            <button
              onClick={submitPayment}
              disabled={pending || amount <= 0}
              className="bg-[#12b76a] hover:bg-[#0f9d5a] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              {pending ? "..." : "Enregistrer le paiement"}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
            Historique de dette
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <div className="text-slate-700">{h.note}</div>
                  <div className="text-xs text-slate-400">{formatDateTime(h.createdAt)}</div>
                </div>
                <span className={h.amount < 0 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                  {h.amount < 0 ? "-" : "+"}
                  {formatCFA(Math.abs(h.amount))}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-sm">Aucun historique.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
            Historique d&apos;achats
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <div className="font-medium text-slate-700">#{p.reference}</div>
                  <div className="text-xs text-slate-400">{formatDateTime(p.createdAt)}</div>
                </div>
                <span className="font-semibold text-slate-900">{formatCFA(p.total)}</span>
              </div>
            ))}
            {purchases.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-sm">Aucun achat.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

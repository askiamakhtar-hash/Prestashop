"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Plus, Minus, Trash2, X, Printer, ShoppingCart } from "lucide-react";
import { formatCFA, formatDateTime } from "@/lib/format";
import { submitSale, type SubmitSaleInput } from "./actions";
import type { Product, Client } from "@/lib/types";

type CartLine = {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  stockQty: number;
};

type PaymentMethodKey = "ESPECES" | "WAVE" | "ORANGE_MONEY" | "CARTE" | "CREDIT";

const METHOD_LABELS: Record<PaymentMethodKey, string> = {
  ESPECES: "Espèces",
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  CARTE: "Carte",
  CREDIT: "Crédit",
};

const METHOD_COLORS: Record<PaymentMethodKey, string> = {
  ESPECES: "bg-emerald-600 hover:bg-emerald-700",
  WAVE: "bg-violet-600 hover:bg-violet-700",
  ORANGE_MONEY: "bg-orange-500 hover:bg-orange-600",
  CARTE: "bg-cyan-600 hover:bg-cyan-700",
  CREDIT: "bg-red-500 hover:bg-red-600",
};

type RecentSale = {
  id: string;
  reference: string;
  total: number;
  createdAt: string;
  sellerName: string;
  clientName: string | null;
};

export default function POSClient({
  products,
  clients,
  recentSales,
}: {
  products: Product[];
  clients: Client[];
  recentSales: RecentSale[];
}) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [payments, setPayments] = useState<{ method: PaymentMethodKey; amount: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    reference: string;
    total: number;
    items: CartLine[];
    payments: { method: PaymentMethodKey; amount: number }[];
    clientName: string | null;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 24);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").toLowerCase().includes(q) ||
          (p.category ?? "").toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [products, query]);

  const subtotal = cart.reduce((s, l) => s + l.quantity * l.unitPrice - l.discount, 0);
  const total = Math.max(0, subtotal - globalDiscount);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = total - totalPaid;

  function addToCart(p: Product) {
    setError(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.quantity + 1 > p.stockQty) return prev;
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      if (p.stockQty <= 0) return prev;
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          unit: p.unit,
          unitPrice: p.sellingPrice,
          quantity: 1,
          discount: 0,
          stockQty: p.stockQty,
        },
      ];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.min(l.stockQty, Math.max(1, l.quantity + delta)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function resetSale() {
    setCart([]);
    setClientId("");
    setGlobalDiscount(0);
    setPayments([]);
    setError(null);
  }

  function quickPay(method: PaymentMethodKey) {
    if (method === "CREDIT" && !clientId) {
      setError("Sélectionnez un client pour une vente à crédit.");
      return;
    }
    setPayments([{ method, amount: total }]);
  }

  function addPaymentLine() {
    const used = totalPaid;
    const rest = Math.max(0, total - used);
    setPayments((prev) => [...prev, { method: "ESPECES", amount: rest }]);
  }

  function updatePayment(index: number, patch: Partial<{ method: PaymentMethodKey; amount: number }>) {
    setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function removePayment(index: number) {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCheckout() {
    setError(null);
    if (cart.length === 0) {
      setError("Le panier est vide.");
      return;
    }
    if (Math.round(totalPaid) !== Math.round(total)) {
      setError(
        `Le montant encaissé (${formatCFA(totalPaid)}) ne correspond pas au total (${formatCFA(total)}).`
      );
      return;
    }

    const input: SubmitSaleInput = {
      clientId: clientId || null,
      items: cart.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discount: l.discount,
      })),
      discount: globalDiscount,
      payments,
    };

    startTransition(async () => {
      const result = await submitSale(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const clientName = clients.find((c) => c.id === clientId)?.name ?? null;
      setReceipt({
        reference: result.reference,
        total: result.total,
        items: cart,
        payments,
        clientName,
      });
      resetSale();
    });
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <div className="flex-1 min-w-0 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">Nouvelle vente</h1>
          <div className="text-sm text-slate-500">
            {cart.reduce((s, l) => s + l.quantity, 0)} article(s)
          </div>
        </div>

        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit, SKU ou code-barres..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#12b76a]"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const inCart = cart.find((l) => l.productId === p.id);
            const disabled = p.stockQty <= 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={disabled}
                className={`text-left bg-white border rounded-xl p-3 transition ${
                  disabled
                    ? "opacity-40 cursor-not-allowed border-slate-200"
                    : "border-slate-200 hover:border-[#12b76a] hover:shadow-sm"
                } ${inCart ? "ring-2 ring-[#12b76a]" : ""}`}
              >
                <div className="text-sm font-semibold text-slate-800 line-clamp-2 min-h-[2.5rem]">
                  {p.name}
                </div>
                <div className="text-xs text-slate-400 mb-1">{p.category}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[#12b76a] font-bold text-sm">
                    {formatCFA(p.sellingPrice)}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      p.stockQty <= p.stockMin
                        ? "bg-red-50 text-red-500"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {p.stockQty} {p.unit}
                  </span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-sm text-slate-400 py-8 text-center">
              Aucun produit trouvé.
            </p>
          )}
        </div>

        {recentSales.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Ventes récentes</h2>
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {recentSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="font-medium text-slate-700">#{s.reference}</span>
                  <span className="text-slate-500">{s.clientName ?? "Client de passage"}</span>
                  <span className="text-slate-400 text-xs">{formatDateTime(s.createdAt)}</span>
                  <span className="font-semibold text-slate-900">{formatCFA(s.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full lg:w-[400px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 md:p-6 flex flex-col">
        <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShoppingCart size={18} /> Panier
        </h2>

        <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[40vh] lg:max-h-none">
          {cart.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">
              Ajoutez des produits depuis la liste.
            </p>
          )}
          {cart.map((line) => (
            <div key={line.productId} className="flex items-center gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">{line.name}</div>
                <div className="text-xs text-slate-400">
                  {formatCFA(line.unitPrice)} × {line.quantity}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQty(line.productId, -1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center">{line.quantity}</span>
                <button
                  onClick={() => updateQty(line.productId, 1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="w-20 text-right font-semibold text-slate-800">
                {formatCFA(line.quantity * line.unitPrice - line.discount)}
              </div>
              <button
                onClick={() => removeLine(line.productId)}
                className="text-slate-300 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-500 mb-1">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Client de passage</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Remise globale (FCFA)
          </label>
          <input
            type="number"
            min={0}
            value={globalDiscount || ""}
            onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="0"
          />
        </div>

        <div className="space-y-1 border-t border-slate-100 pt-3 mb-3 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Sous-total</span>
            <span>{formatCFA(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Remise</span>
            <span>- {formatCFA(globalDiscount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>{formatCFA(total)}</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-500">Paiement</label>
            {payments.length > 0 && (
              <button
                onClick={addPaymentLine}
                className="text-xs text-[#12b76a] font-medium"
              >
                + Ajouter un moyen
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {(["ESPECES", "WAVE", "ORANGE_MONEY", "CARTE"] as PaymentMethodKey[]).map((m) => (
              <button
                key={m}
                onClick={() => quickPay(m)}
                className={`text-white text-[11px] font-semibold py-2 rounded-lg ${METHOD_COLORS[m]}`}
              >
                {METHOD_LABELS[m]}
              </button>
            ))}
          </div>
          {clientId && (
            <button
              onClick={() => quickPay("CREDIT")}
              className={`w-full text-white text-xs font-semibold py-2 rounded-lg mb-2 ${METHOD_COLORS.CREDIT}`}
            >
              Vente à crédit (compte client)
            </button>
          )}

          {payments.length > 0 && (
            <div className="space-y-1.5">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <select
                    value={p.method}
                    onChange={(e) =>
                      updatePayment(i, { method: e.target.value as PaymentMethodKey })
                    }
                    className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    {Object.entries(METHOD_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={p.amount || ""}
                    onChange={(e) => updatePayment(i, { amount: Number(e.target.value) || 0 })}
                    className="w-24 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-right"
                  />
                  <button onClick={() => removePayment(i)} className="text-slate-300 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div
                className={`text-xs text-right font-medium ${
                  remaining === 0 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {remaining === 0
                  ? "Montant exact"
                  : remaining > 0
                  ? `Reste à payer : ${formatCFA(remaining)}`
                  : `Excédent : ${formatCFA(-remaining)}`}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={pending || cart.length === 0}
          className="w-full bg-[#12b76a] hover:bg-[#0f9d5a] disabled:opacity-50 text-white font-bold py-3 rounded-xl"
        >
          {pending ? "Encaissement..." : `Encaisser ${formatCFA(total)}`}
        </button>
      </div>

      {receipt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 text-xl">
                ✓
              </div>
              <h3 className="font-bold text-lg text-slate-900">Vente enregistrée</h3>
              <p className="text-sm text-slate-500">Ticket #{receipt.reference}</p>
            </div>
            <div className="border-t border-b border-dashed border-slate-200 py-3 my-3 space-y-1">
              {receipt.items.map((l) => (
                <div key={l.productId} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {l.quantity} × {l.name}
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatCFA(l.quantity * l.unitPrice - l.discount)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-slate-900 mb-1">
              <span>Total</span>
              <span>{formatCFA(receipt.total)}</span>
            </div>
            {receipt.clientName && (
              <p className="text-xs text-slate-400 mb-2">Client : {receipt.clientName}</p>
            )}
            <div className="space-y-0.5 mb-4">
              {receipt.payments.map((p, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-500">
                  <span>{METHOD_LABELS[p.method]}</span>
                  <span>{formatCFA(p.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-700"
              >
                <Printer size={14} /> Imprimer
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 bg-[#12b76a] text-white rounded-lg py-2 text-sm font-semibold"
              >
                Nouvelle vente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

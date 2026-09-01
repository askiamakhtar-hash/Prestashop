import Link from "next/link";
import { requireSection } from "@/lib/guard";
import { todayRange, yesterdayRange } from "@/lib/period";
import {
  salesBetween,
  paymentsBreakdown,
} from "@/lib/repositories/sales";
import { marginBetween, salesTimeSeries, topProducts } from "@/lib/repositories/reports";
import { stockAlerts, stockValue, listProducts } from "@/lib/repositories/products";
import { listCashAccounts, totalAvailable } from "@/lib/repositories/treasury";
import { totalClientDebts } from "@/lib/repositories/clients";
import { listRecentSales } from "@/lib/repositories/sales";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import SalesLineChart from "@/components/charts/SalesLineChart";
import PaymentsDonut from "@/components/charts/PaymentsDonut";
import { formatCFA, formatDateTime, formatNumber } from "@/lib/format";
import {
  TrendingUp,
  ShoppingBag,
  PiggyBank,
  Package,
  Wallet,
  AlertTriangle,
  Plus,
} from "lucide-react";

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default async function DashboardPage() {
  const session = await requireSection("dashboard");
  const storeId = session.storeId;

  const today = todayRange();
  const yesterday = yesterdayRange();

  const salesToday = salesBetween(storeId, today.startIso, today.endIso);
  const salesYesterday = salesBetween(storeId, yesterday.startIso, yesterday.endIso);

  const caToday = salesToday.reduce((s, sale) => s + sale.total, 0);
  const caYesterday = salesYesterday.reduce((s, sale) => s + sale.total, 0);

  const margeToday = marginBetween(storeId, today.startIso, today.endIso);
  const margeYesterday = marginBetween(storeId, yesterday.startIso, yesterday.endIso);

  const stockVal = stockValue(storeId);
  const products = listProducts(storeId);
  const alerts = stockAlerts(storeId);
  const cashAccounts = listCashAccounts(storeId);
  const disponible = totalAvailable(storeId);
  const debts = totalClientDebts(storeId);

  const series = salesTimeSeries(storeId, 7);
  const payments = paymentsBreakdown(storeId, today.startIso, today.endIso);
  const top = topProducts(storeId, today.startIso, today.endIso, 4);
  const recent = listRecentSales(storeId, 5) as {
    id: string;
    reference: string;
    total: number;
    createdAt: string;
    sellerName: string;
    clientName: string | null;
  }[];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de votre activité"
        actions={
          <Link
            href="/caisse"
            className="flex items-center gap-1.5 bg-[#12b76a] hover:bg-[#0f9d5a] text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Nouvelle vente
          </Link>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={TrendingUp}
            iconBg="#e7f8ef"
            iconColor="#12b76a"
            label="Chiffre d'affaires"
            value={formatCFA(caToday)}
            hint="Aujourd'hui"
            trend={{ value: pctChange(caToday, caYesterday), label: "vs hier" }}
          />
          <StatCard
            icon={ShoppingBag}
            iconBg="#eef2ff"
            iconColor="#4f46e5"
            label="Ventes"
            value={formatNumber(salesToday.length)}
            hint="Aujourd'hui"
            trend={{
              value: pctChange(salesToday.length, salesYesterday.length),
              label: "vs hier",
            }}
          />
          <StatCard
            icon={PiggyBank}
            iconBg="#fff7ed"
            iconColor="#f97316"
            label="Marge brute"
            value={formatCFA(margeToday)}
            hint="Aujourd'hui"
            trend={{ value: pctChange(margeToday, margeYesterday), label: "vs hier" }}
          />
          <StatCard
            icon={Package}
            iconBg="#f5f3ff"
            iconColor="#7c3aed"
            label="Valeur du stock"
            value={formatCFA(stockVal)}
            hint={`${products.length} produits`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm">Trésorerie</h3>
              <Link href="/tresorerie" className="text-xs text-[#12b76a] font-medium">
                Voir tout
              </Link>
            </div>
            <div className="space-y-2">
              {cashAccounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Wallet size={14} className="text-slate-400" />
                    {a.name}
                  </span>
                  <span className="font-medium text-slate-900">{formatCFA(a.balance)}</span>
                </div>
              ))}
              {debts > 0 && (
                <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-100">
                  <span className="text-slate-600">Créances clients</span>
                  <span className="font-medium text-amber-600">{formatCFA(debts)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-700">Total disponible</span>
              <span className="text-base font-bold text-slate-900">
                {formatCFA(disponible)}
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-800 text-sm">
                Évolution des ventes (7 derniers jours)
              </h3>
            </div>
            <SalesLineChart data={series as { day: string; total: number }[]} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Alertes stock
            </h3>
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune alerte pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 5).map((a) => (
                  <div key={a.product.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          a.level === "critique" ? "bg-red-500" : "bg-amber-400"
                        }`}
                      />
                      {a.product.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {a.level === "critique" ? "Stock critique" : "Stock faible"} ·{" "}
                      {formatNumber(a.product.stockQty)} {a.product.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/stock"
              className="inline-block mt-3 text-xs font-medium text-[#12b76a]"
            >
              Voir tout le stock →
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-1">
              Paiements aujourd&apos;hui
            </h3>
            <PaymentsDonut data={payments} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-800 text-sm">Top produits (jour)</h3>
            </div>
            {top.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune vente aujourd&apos;hui.</p>
            ) : (
              <div className="space-y-2">
                {(top as { id: string; name: string; revenue: number }[]).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      <span className="text-slate-400 mr-2">{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="font-medium text-slate-900">{formatCFA(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-800 text-sm">Dernières ventes</h3>
            <Link href="/rapports" className="text-xs text-[#12b76a] font-medium">
              Voir tout
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase">
                  <th className="py-1.5 pr-4">Référence</th>
                  <th className="py-1.5 pr-4">Client</th>
                  <th className="py-1.5 pr-4">Vendeur</th>
                  <th className="py-1.5 pr-4">Heure</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">#{s.reference}</td>
                    <td className="py-2 pr-4 text-slate-600">{s.clientName ?? "Client de passage"}</td>
                    <td className="py-2 pr-4 text-slate-600">{s.sellerName}</td>
                    <td className="py-2 pr-4 text-slate-500">{formatDateTime(s.createdAt)}</td>
                    <td className="py-2 text-right font-semibold text-slate-900">
                      {formatCFA(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

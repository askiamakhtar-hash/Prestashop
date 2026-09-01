import { requireSection } from "@/lib/guard";
import { periodRange, type Period } from "@/lib/period";
import {
  topProducts,
  lowRotationProducts,
  lowMarginProducts,
  dormantStock,
  salesBySeller,
  averageBasket,
  cancellationsCount,
  marginBetween,
} from "@/lib/repositories/reports";
import { salesBetween } from "@/lib/repositories/sales";
import PageHeader from "@/components/PageHeader";
import PeriodTabs from "./PeriodTabs";
import { formatCFA, formatNumber, formatPercent } from "@/lib/format";

const PERIODS: { key: Period; label: string }[] = [
  { key: "jour", label: "Jour" },
  { key: "semaine", label: "Semaine" },
  { key: "mois", label: "Mois" },
  { key: "trimestre", label: "Trimestre" },
  { key: "annee", label: "Année" },
];

export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await requireSection("rapports");
  const { period: periodParam } = await searchParams;
  const period = (PERIODS.find((p) => p.key === periodParam)?.key ?? "mois") as Period;
  const { startIso, endIso } = periodRange(period);

  const sales = salesBetween(session.storeId, startIso, endIso);
  const ca = sales.reduce((s, sale) => s + sale.total, 0);
  const margin = marginBetween(session.storeId, startIso, endIso);
  const basket = averageBasket(session.storeId, startIso, endIso);
  const cancellations = cancellationsCount(session.storeId, startIso, endIso);

  const top = topProducts(session.storeId, startIso, endIso, 10) as {
    id: string;
    name: string;
    qty: number;
    revenue: number;
    margin: number;
  }[];
  const lowRotation = lowRotationProducts(session.storeId, startIso) as {
    id: string;
    name: string;
    stockQty: number;
    category: string | null;
  }[];
  const lowMargin = lowMarginProducts(session.storeId) as {
    id: string;
    name: string;
    purchasePrice: number;
    sellingPrice: number;
    marginRate: number;
  }[];
  const dormant = dormantStock(session.storeId, startIso) as {
    id: string;
    name: string;
    stockQty: number;
    value: number;
  }[];
  const sellers = salesBySeller(session.storeId, startIso, endIso) as {
    id: string;
    name: string;
    nbVentes: number;
    ca: number;
    remises: number;
  }[];

  return (
    <div>
      <PageHeader title="Analyse commerciale" subtitle="Produits, vendeurs et périodes" />
      <div className="p-4 md:p-8 space-y-6">
        <PeriodTabs periods={PERIODS} current={period} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Chiffre d'affaires" value={formatCFA(ca)} />
          <SummaryCard label="Marge brute" value={formatCFA(margin)} />
          <SummaryCard label="Panier moyen" value={formatCFA(basket)} />
          <SummaryCard label="Annulations" value={formatNumber(cancellations)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Top 10 produits">
            <Table
              head={["Produit", "Qté vendue", "CA", "Marge"]}
              rows={top.map((p) => [
                p.name,
                formatNumber(p.qty),
                formatCFA(p.revenue),
                formatCFA(p.margin),
              ])}
              empty="Aucune vente sur la période."
            />
          </Panel>

          <Panel title="CA par vendeur">
            <Table
              head={["Vendeur", "Ventes", "CA", "Remises"]}
              rows={sellers.map((s) => [
                s.name,
                formatNumber(s.nbVentes),
                formatCFA(s.ca),
                formatCFA(s.remises),
              ])}
              empty="Aucune vente sur la période."
            />
          </Panel>

          <Panel title="Produits à faible rotation">
            <Table
              head={["Produit", "Catégorie", "Stock actuel"]}
              rows={lowRotation
                .slice(0, 10)
                .map((p) => [p.name, p.category ?? "-", formatNumber(p.stockQty)])}
              empty="Tous les produits tournent bien."
            />
          </Panel>

          <Panel title="Produits à faible marge">
            <Table
              head={["Produit", "Prix achat", "Prix vente", "Marge"]}
              rows={lowMargin.map((p) => [
                p.name,
                formatCFA(p.purchasePrice),
                formatCFA(p.sellingPrice),
                formatPercent(p.marginRate),
              ])}
              empty="—"
            />
          </Panel>

          <Panel title="Stock dormant">
            <Table
              head={["Produit", "Stock", "Valeur immobilisée"]}
              rows={dormant
                .slice(0, 10)
                .map((p) => [p.name, formatNumber(p.stockQty), formatCFA(p.value)])}
              empty="Aucun stock dormant."
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
        {title}
      </div>
      {children}
    </div>
  );
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: (string | number)[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                className={`px-4 py-2 ${i === 0 ? "text-left" : "text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-slate-100">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-2 ${ci === 0 ? "text-left text-slate-700" : "text-right text-slate-600"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="text-center py-6 text-slate-400">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

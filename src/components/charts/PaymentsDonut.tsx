"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCFA } from "@/lib/format";

const COLORS: Record<string, string> = {
  ESPECES: "#12b76a",
  WAVE: "#7c3aed",
  ORANGE_MONEY: "#f97316",
  VIREMENT: "#0b3d91",
  CARTE: "#0891b2",
  CREDIT: "#ef4444",
};

const LABELS: Record<string, string> = {
  ESPECES: "Espèces",
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  VIREMENT: "Virement",
  CARTE: "Carte",
  CREDIT: "Crédit",
};

export default function PaymentsDonut({
  data,
}: {
  data: { method: string; total: number }[];
}) {
  const chartData = data
    .filter((d) => d.total > 0)
    .map((d) => ({ name: LABELS[d.method] ?? d.method, value: d.total, key: d.method }));

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
        Aucun paiement enregistré
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          isAnimationActive={false}
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCFA(Number(value) || 0)} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

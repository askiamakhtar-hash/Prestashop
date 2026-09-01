import { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  hint,
  trend,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  hint?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-bold text-slate-900 truncate">{value}</div>
        {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
        {trend && (
          <div
            className={`text-xs font-medium mt-0.5 ${
              trend.value >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}

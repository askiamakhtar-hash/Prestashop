"use client";

import Link from "next/link";

export default function PeriodTabs({
  periods,
  current,
}: {
  periods: { key: string; label: string }[];
  current: string;
}) {
  return (
    <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
      {periods.map((p) => (
        <Link
          key={p.key}
          href={`/rapports?period=${p.key}`}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            current === p.key
              ? "bg-[#12b76a] text-white"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}

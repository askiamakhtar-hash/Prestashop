"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Wallet,
  BarChart3,
  Building2,
  UserCog,
  Settings,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/app/logout/actions";
import { ROLE_LABELS } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, section: "dashboard" },
  { href: "/caisse", label: "Caisse", icon: ShoppingCart, section: "caisse" },
  { href: "/stock", label: "Stock", icon: Package, section: "stock" },
  { href: "/achats", label: "Achats", icon: Truck, section: "achats" },
  { href: "/clients", label: "Clients", icon: Users, section: "clients" },
  { href: "/tresorerie", label: "Trésorerie", icon: Wallet, section: "tresorerie" },
  { href: "/rapports", label: "Rapports", icon: BarChart3, section: "rapports" },
  { href: "/boutiques", label: "Boutiques", icon: Building2, section: "boutiques" },
  { href: "/employes", label: "Employés", icon: UserCog, section: "employes" },
  { href: "/parametres", label: "Paramètres", icon: Settings, section: "parametres" },
];

export default function Sidebar({
  role,
  name,
  allowedSections,
  storeName,
}: {
  role: string;
  name: string;
  allowedSections: string[];
  storeName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-[#0b1220] text-slate-200 min-h-screen border-r border-slate-800">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="GestaShop.sn" className="w-9 h-9 rounded-lg" />
          <div>
            <div className="font-extrabold text-white leading-none">
              GESTA<span className="text-[#12b76a]">SHOP</span>.SN
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">
              {storeName}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter((item) => allowedSections.includes(item.section)).map(
          (item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-[#12b76a]/15 text-[#12b76a] font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          }
        )}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold">
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{name}</div>
            <div className="text-xs text-slate-500">{ROLE_LABELS[role]}</div>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/40"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}

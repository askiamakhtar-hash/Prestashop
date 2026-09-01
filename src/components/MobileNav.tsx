"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Bell, Menu } from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, section: "dashboard" },
  { href: "/caisse", label: "Caisse", icon: ShoppingCart, section: "caisse" },
  { href: "/stock", label: "Stock", icon: Package, section: "stock" },
  { href: "/rapports", label: "Rapports", icon: Bell, section: "rapports" },
  { href: "/parametres", label: "Menu", icon: Menu, section: "parametres" },
];

export default function MobileNav({ allowedSections }: { allowedSections: string[] }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => allowedSections.includes(i.section));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#0b1220] border-t border-slate-800 flex justify-around py-2 z-40">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
              active ? "text-[#12b76a]" : "text-slate-400"
            }`}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStore } from "@/lib/repositories/stores";
import { ROLE_PERMISSIONS } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const store = getStore(session.storeId);
  const allowedSections = ROLE_PERMISSIONS[session.role] ?? [];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        role={session.role}
        name={session.name}
        allowedSections={allowedSections}
        storeName={store?.name ?? ""}
      />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      <MobileNav allowedSections={allowedSections} />
    </div>
  );
}

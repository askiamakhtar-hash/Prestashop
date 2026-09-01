import { requireSection } from "@/lib/guard";
import { listUsersByStore, listAuditLogs } from "@/lib/repositories/users";
import PageHeader from "@/components/PageHeader";
import EmployesClient from "./EmployesClient";

export default async function EmployesPage() {
  const session = await requireSection("employes");
  const employees = listUsersByStore(session.storeId);
  const logs = listAuditLogs(session.storeId, 40) as {
    id: string;
    action: string;
    details: string | null;
    userName: string;
    createdAt: string;
  }[];

  return (
    <div>
      <PageHeader title="Employés" subtitle="Rôles, permissions et journal d'activité" />
      <div className="p-4 md:p-8">
        <EmployesClient
          employees={employees}
          logs={logs}
          currentUserId={session.userId}
          role={session.role}
        />
      </div>
    </div>
  );
}

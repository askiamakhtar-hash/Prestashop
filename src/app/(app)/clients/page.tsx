import { requireSection } from "@/lib/guard";
import { listClientsWithDebt, totalClientDebts } from "@/lib/repositories/clients";
import PageHeader from "@/components/PageHeader";
import ClientsClient from "./ClientsClient";
import { formatCFA } from "@/lib/format";

export default async function ClientsPage() {
  const session = await requireSection("clients");
  const clients = listClientsWithDebt(session.storeId);
  const totalDebt = totalClientDebts(session.storeId);

  return (
    <div>
      <PageHeader
        title="Clients & carnet de dettes"
        subtitle={`${clients.length} clients · Créances totales ${formatCFA(totalDebt)}`}
      />
      <div className="p-4 md:p-8">
        <ClientsClient clients={clients} />
      </div>
    </div>
  );
}

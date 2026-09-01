import { notFound } from "next/navigation";
import { requireSection } from "@/lib/guard";
import {
  getClient,
  clientDebt,
  clientDebtHistory,
  clientPurchaseHistory,
} from "@/lib/repositories/clients";
import PageHeader from "@/components/PageHeader";
import ClientDetailClient from "./ClientDetailClient";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSection("clients");
  const client = getClient(id);
  if (!client) notFound();

  const debt = clientDebt(id);
  const history = clientDebtHistory(id) as {
    id: string;
    amount: number;
    note: string | null;
    createdAt: string;
  }[];
  const purchases = clientPurchaseHistory(id) as {
    id: string;
    reference: string;
    total: number;
    createdAt: string;
  }[];

  return (
    <div>
      <PageHeader title={client.name} subtitle={client.phone ?? ""} />
      <div className="p-4 md:p-8">
        <ClientDetailClient client={client} debt={debt} history={history} purchases={purchases} />
      </div>
    </div>
  );
}

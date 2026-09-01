import { requireSection } from "@/lib/guard";
import { listCashAccounts, totalAvailable, listCashTransactions, expensesBetween } from "@/lib/repositories/treasury";
import { marginBetween } from "@/lib/repositories/reports";
import { periodRange } from "@/lib/period";
import PageHeader from "@/components/PageHeader";
import TresorerieClient from "./TresorerieClient";
import { formatCFA } from "@/lib/format";

export default async function TresoreriePage() {
  const session = await requireSection("tresorerie");
  const accounts = listCashAccounts(session.storeId);
  const total = totalAvailable(session.storeId);
  const transactions = listCashTransactions(session.storeId, 40);

  const month = periodRange("mois");
  const margin = marginBetween(session.storeId, month.startIso, month.endIso);
  const expenses = expensesBetween(session.storeId, month.startIso, month.endIso);
  const resultatEstime = margin - expenses;

  return (
    <div>
      <PageHeader
        title="Trésorerie"
        subtitle={`Total disponible ${formatCFA(total)}`}
      />
      <div className="p-4 md:p-8">
        <TresorerieClient
          accounts={accounts}
          transactions={transactions as never[]}
          total={total}
          margin={margin}
          expenses={expenses}
          resultatEstime={resultatEstime}
        />
      </div>
    </div>
  );
}

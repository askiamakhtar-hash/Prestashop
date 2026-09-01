import { requireSection } from "@/lib/guard";
import { listStores } from "@/lib/repositories/stores";
import { listProducts, stockValue } from "@/lib/repositories/products";
import { salesBetween } from "@/lib/repositories/sales";
import { todayRange } from "@/lib/period";
import PageHeader from "@/components/PageHeader";
import BoutiquesClient from "./BoutiquesClient";

export default async function BoutiquesPage() {
  const session = await requireSection("boutiques");
  const stores = listStores();
  const { startIso, endIso } = todayRange();

  const summaries = stores.map((s) => {
    const products = listProducts(s.id);
    const sales = salesBetween(s.id, startIso, endIso);
    return {
      store: s,
      productCount: products.length,
      stockVal: stockValue(s.id),
      caToday: sales.reduce((sum, sale) => sum + sale.total, 0),
      products,
    };
  });

  return (
    <div>
      <PageHeader title="Boutiques" subtitle="Vue consolidée et transferts de stock" />
      <div className="p-4 md:p-8">
        <BoutiquesClient summaries={summaries} currentStoreId={session.storeId} />
      </div>
    </div>
  );
}

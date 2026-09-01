import { requireSection } from "@/lib/guard";
import { listSuppliers, listPurchaseOrders } from "@/lib/repositories/suppliers";
import { listProducts } from "@/lib/repositories/products";
import { listCashAccounts } from "@/lib/repositories/treasury";
import PageHeader from "@/components/PageHeader";
import AchatsClient from "./AchatsClient";

export default async function AchatsPage() {
  const session = await requireSection("achats");
  const suppliers = listSuppliers(session.storeId);
  const orders = listPurchaseOrders(session.storeId);
  const products = listProducts(session.storeId);
  const cashAccounts = listCashAccounts(session.storeId);

  return (
    <div>
      <PageHeader title="Achats & fournisseurs" subtitle="Commandes, réceptions et paiements" />
      <div className="p-4 md:p-8">
        <AchatsClient
          suppliers={suppliers}
          orders={orders as never[]}
          products={products}
          cashAccounts={cashAccounts}
        />
      </div>
    </div>
  );
}

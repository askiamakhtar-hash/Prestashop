import { requireSection } from "@/lib/guard";
import { listProducts, stockAlerts, stockValue } from "@/lib/repositories/products";
import PageHeader from "@/components/PageHeader";
import StockClient from "./StockClient";
import { formatCFA } from "@/lib/format";

export default async function StockPage() {
  const session = await requireSection("stock");
  const products = listProducts(session.storeId);
  const alerts = stockAlerts(session.storeId);
  const value = stockValue(session.storeId);

  return (
    <div>
      <PageHeader
        title="Gestion de stock"
        subtitle={`${products.length} produits · Valeur du stock ${formatCFA(value)}`}
      />
      <div className="p-4 md:p-8">
        <StockClient products={products} alerts={alerts} role={session.role} />
      </div>
    </div>
  );
}

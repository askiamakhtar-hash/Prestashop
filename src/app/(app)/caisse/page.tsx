import { requireSection } from "@/lib/guard";
import { listProducts } from "@/lib/repositories/products";
import { listClients } from "@/lib/repositories/clients";
import { listRecentSales } from "@/lib/repositories/sales";
import POSClient from "./POSClient";

export default async function CaissePage() {
  const session = await requireSection("caisse");
  const products = listProducts(session.storeId);
  const clients = listClients(session.storeId);
  const recentSales = listRecentSales(session.storeId, 8);

  return (
    <POSClient
      products={products}
      clients={clients}
      recentSales={recentSales as never[]}
    />
  );
}

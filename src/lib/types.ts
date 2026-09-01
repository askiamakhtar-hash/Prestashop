export type Role = "PROPRIETAIRE" | "MANAGER" | "CAISSIER" | "MAGASINIER";

export type PaymentMethod =
  | "ESPECES"
  | "WAVE"
  | "ORANGE_MONEY"
  | "VIREMENT"
  | "CARTE"
  | "CREDIT";

export type StockMovementType =
  | "ACHAT_FOURNISSEUR"
  | "RETOUR_CLIENT"
  | "INVENTAIRE"
  | "VENTE"
  | "PERTE"
  | "CASSE"
  | "CONSOMMATION"
  | "TRANSFERT_ENTREE"
  | "TRANSFERT_SORTIE";

export type PurchaseOrderStatus =
  | "BROUILLON"
  | "EN_ATTENTE"
  | "RECU"
  | "FACTURE"
  | "PAYE"
  | "ANNULE";

export interface Store {
  id: string;
  name: string;
  city: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  passwordHash: string;
  pin: string;
  role: Role;
  active: number;
  storeId: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  category: string | null;
  supplierName: string | null;
  purchasePrice: number;
  sellingPrice: number;
  stockQty: number;
  stockMin: number;
  unit: string;
  location: string | null;
  tva: number;
  photoUrl: string | null;
  active: number;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  storeId: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  storeId: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  reference: string;
  subtotal: number;
  discount: number;
  total: number;
  cancelled: number;
  storeId: string;
  clientId: string | null;
  sellerId: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  saleId: string;
  productId: string;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  saleId: string;
  createdAt: string;
}

export interface CashAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  storeId: string;
}

export interface CashTransaction {
  id: string;
  label: string;
  amount: number;
  category: string | null;
  cashAccountId: string;
  userId: string | null;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  status: PurchaseOrderStatus;
  supplierId: string;
  storeId: string;
  createdAt: string;
  receivedAt: string | null;
  paidAt: string | null;
  dueDate: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  purchaseOrderId: string;
  productId: string;
}

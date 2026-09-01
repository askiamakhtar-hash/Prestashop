PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Store (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  passwordHash TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('PROPRIETAIRE','MANAGER','CAISSIER','MAGASINIER')),
  active INTEGER NOT NULL DEFAULT 1,
  storeId TEXT REFERENCES Store(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Product (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  category TEXT,
  supplierName TEXT,
  purchasePrice REAL NOT NULL DEFAULT 0,
  sellingPrice REAL NOT NULL DEFAULT 0,
  stockQty REAL NOT NULL DEFAULT 0,
  stockMin REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unité',
  location TEXT,
  tva REAL NOT NULL DEFAULT 0,
  photoUrl TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  storeId TEXT NOT NULL REFERENCES Store(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(storeId, sku)
);
CREATE INDEX IF NOT EXISTS idx_product_store ON Product(storeId);

CREATE TABLE IF NOT EXISTS StockMovement (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  note TEXT,
  productId TEXT NOT NULL REFERENCES Product(id),
  storeId TEXT NOT NULL REFERENCES Store(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_movement_product ON StockMovement(productId);

CREATE TABLE IF NOT EXISTS StockTransfer (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL REFERENCES Product(id),
  quantity REAL NOT NULL,
  note TEXT,
  fromStoreId TEXT NOT NULL REFERENCES Store(id),
  toStoreId TEXT NOT NULL REFERENCES Store(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Client (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  creditLimit REAL NOT NULL DEFAULT 0,
  storeId TEXT NOT NULL REFERENCES Store(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS DebtPayment (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  note TEXT,
  clientId TEXT NOT NULL REFERENCES Client(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Supplier (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  storeId TEXT NOT NULL REFERENCES Store(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS PurchaseOrder (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'BROUILLON' CHECK (status IN ('BROUILLON','EN_ATTENTE','RECU','FACTURE','PAYE','ANNULE')),
  supplierId TEXT NOT NULL REFERENCES Supplier(id),
  storeId TEXT NOT NULL REFERENCES Store(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  receivedAt TEXT,
  paidAt TEXT,
  dueDate TEXT
);

CREATE TABLE IF NOT EXISTS PurchaseOrderItem (
  id TEXT PRIMARY KEY,
  quantity REAL NOT NULL,
  unitPrice REAL NOT NULL,
  purchaseOrderId TEXT NOT NULL REFERENCES PurchaseOrder(id),
  productId TEXT NOT NULL REFERENCES Product(id)
);

CREATE TABLE IF NOT EXISTS Sale (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  cancelled INTEGER NOT NULL DEFAULT 0,
  storeId TEXT NOT NULL REFERENCES Store(id),
  clientId TEXT REFERENCES Client(id),
  sellerId TEXT NOT NULL REFERENCES User(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sale_store ON Sale(storeId);
CREATE INDEX IF NOT EXISTS idx_sale_created ON Sale(createdAt);

CREATE TABLE IF NOT EXISTS SaleItem (
  id TEXT PRIMARY KEY,
  quantity REAL NOT NULL,
  unitPrice REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  saleId TEXT NOT NULL REFERENCES Sale(id),
  productId TEXT NOT NULL REFERENCES Product(id)
);
CREATE INDEX IF NOT EXISTS idx_saleitem_sale ON SaleItem(saleId);

CREATE TABLE IF NOT EXISTS Payment (
  id TEXT PRIMARY KEY,
  method TEXT NOT NULL CHECK (method IN ('ESPECES','WAVE','ORANGE_MONEY','VIREMENT','CARTE','CREDIT')),
  amount REAL NOT NULL,
  saleId TEXT NOT NULL REFERENCES Sale(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS CashAccount (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  storeId TEXT NOT NULL REFERENCES Store(id),
  UNIQUE(storeId, type)
);

CREATE TABLE IF NOT EXISTS CashTransaction (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT,
  cashAccountId TEXT NOT NULL REFERENCES CashAccount(id),
  userId TEXT REFERENCES User(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Expense (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  storeId TEXT NOT NULL REFERENCES Store(id),
  userId TEXT REFERENCES User(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  userId TEXT NOT NULL REFERENCES User(id),
  storeId TEXT NOT NULL REFERENCES Store(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

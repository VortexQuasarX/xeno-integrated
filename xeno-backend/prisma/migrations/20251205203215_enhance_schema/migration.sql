-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "title" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

-- CreateTable
CREATE TABLE "DraftOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyDraftOrderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalPrice" DECIMAL NOT NULL,
    "subtotalPrice" DECIMAL,
    "totalTax" DECIMAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,
    "tenantId" TEXT NOT NULL,
    "lineItems" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DraftOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DraftOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyCustomerId" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "totalSpent" DECIMAL NOT NULL DEFAULT 0.0,
    "addresses" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "tags" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("createdAt", "email", "firstName", "id", "lastName", "shopifyCustomerId", "tenantId", "totalSpent", "updatedAt") SELECT "createdAt", "email", "firstName", "id", "lastName", "shopifyCustomerId", "tenantId", "totalSpent", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_tenantId_shopifyCustomerId_key" ON "Customer"("tenantId", "shopifyCustomerId");
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyOrderId" TEXT NOT NULL,
    "totalPrice" DECIMAL NOT NULL,
    "orderDate" DATETIME NOT NULL,
    "customerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "financialStatus" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerId", "id", "orderDate", "shopifyOrderId", "tenantId", "totalPrice", "updatedAt") SELECT "createdAt", "customerId", "id", "orderDate", "shopifyOrderId", "tenantId", "totalPrice", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_tenantId_shopifyOrderId_key" ON "Order"("tenantId", "shopifyOrderId");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "price" DECIMAL NOT NULL,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT,
    "tags" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "id", "price", "shopifyProductId", "tenantId", "title", "updatedAt") SELECT "createdAt", "id", "price", "shopifyProductId", "tenantId", "title", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_tenantId_shopifyProductId_key" ON "Product"("tenantId", "shopifyProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DraftOrder_tenantId_shopifyDraftOrderId_key" ON "DraftOrder"("tenantId", "shopifyDraftOrderId");

/*
  Warnings:

  - You are about to drop the `DraftOrder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "DraftOrder_tenantId_shopifyDraftOrderId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DraftOrder";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyOrderId" TEXT NOT NULL,
    "totalPrice" DECIMAL NOT NULL,
    "orderDate" DATETIME NOT NULL,
    "customerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "financialStatus" TEXT,
    "fulfillmentStatus" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "tags" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerId", "financialStatus", "id", "orderDate", "shopifyOrderId", "status", "tenantId", "totalPrice", "updatedAt") SELECT "createdAt", "customerId", "financialStatus", "id", "orderDate", "shopifyOrderId", "status", "tenantId", "totalPrice", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_tenantId_shopifyOrderId_key" ON "Order"("tenantId", "shopifyOrderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

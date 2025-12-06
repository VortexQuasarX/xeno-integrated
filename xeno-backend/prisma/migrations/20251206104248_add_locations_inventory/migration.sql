-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyLocationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "province" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Location_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyInventoryItemId" TEXT NOT NULL,
    "available" INTEGER NOT NULL,
    "locationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryLevel_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryLevel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_tenantId_shopifyLocationId_key" ON "Location"("tenantId", "shopifyLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLevel_tenantId_locationId_shopifyInventoryItemId_key" ON "InventoryLevel"("tenantId", "locationId", "shopifyInventoryItemId");

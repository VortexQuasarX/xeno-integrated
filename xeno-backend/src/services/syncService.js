const axios = require('axios');
const prisma = require('../lib/prisma');
const ingestionService = require('./ingestionService');

const API_VERSION = '2023-10';

async function syncTenant(tenantId) {
    console.log(`🔄 Starting Manual Sync for Tenant: ${tenantId}`);

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || !tenant.accessToken || !tenant.shopifyDomain) {
        throw new Error('Tenant not configured or missing credentials');
    }

    const SHOP_URL = `https://${tenant.shopifyDomain}`;
    const ACCESS_TOKEN = tenant.accessToken;

    const axiosConfig = {
        headers: {
            'X-Shopify-Access-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json'
        }
    };

    try {
        // --- 1. PRODUCTS ---
        console.log('   -> Fetching Products...');
        const productsRes = await axios.get(`${SHOP_URL}/admin/api/${API_VERSION}/products.json?limit=250`, axiosConfig);
        const shopifyProducts = productsRes.data.products;

        for (const p of shopifyProducts) {
            await ingestionService.upsertProduct(tenantId, p);
        }

        // --- 2. CUSTOMERS ---
        console.log('   -> Fetching Customers...');
        const customersRes = await axios.get(`${SHOP_URL}/admin/api/${API_VERSION}/customers.json?limit=250`, axiosConfig);
        const shopifyCustomers = customersRes.data.customers;

        for (const c of shopifyCustomers) {
            await ingestionService.upsertCustomer(tenantId, c);
        }

        // --- 3. ORDERS ---
        console.log('   -> Fetching Orders...');
        const ordersRes = await axios.get(`${SHOP_URL}/admin/api/${API_VERSION}/orders.json?status=any&limit=250`, axiosConfig);
        const shopifyOrders = ordersRes.data.orders;

        for (const o of shopifyOrders) {
            await ingestionService.upsertOrder(tenantId, o);
        }

        // --- 4. LOCATIONS & INVENTORY (Keep simple local logic or move to service if complicated, keeping local for now as it wasn't core complaint) ---
        try {
            const locRes = await axios.get(`${SHOP_URL}/admin/api/${API_VERSION}/locations.json`, axiosConfig);
            const locations = locRes.data.locations;

            for (const loc of locations) {
                const localLoc = await prisma.location.upsert({
                    where: { tenantId_shopifyLocationId: { tenantId, shopifyLocationId: loc.id.toString() } },
                    update: { name: loc.name, updatedAt: new Date() },
                    create: { tenantId, shopifyLocationId: loc.id.toString(), name: loc.name }
                });

                try {
                    const invRes = await axios.get(`${SHOP_URL}/admin/api/${API_VERSION}/inventory_levels.json?location_ids=${loc.id}&limit=250`, axiosConfig);
                    const levels = invRes.data.inventory_levels;

                    for (const lvl of levels) {
                        await prisma.inventoryLevel.upsert({
                            where: { tenantId_locationId_shopifyInventoryItemId: { tenantId, locationId: localLoc.id, shopifyInventoryItemId: lvl.inventory_item_id.toString() } },
                            update: { available: lvl.available || 0, updatedAt: new Date() },
                            create: { tenantId, locationId: localLoc.id, shopifyInventoryItemId: lvl.inventory_item_id.toString(), available: lvl.available || 0 }
                        });
                    }
                } catch (err) {
                    // ignore inventory errors
                }
            }
        } catch (e) {
            console.log('   -> Skipping Locations (Scope missing?)');
        }

        console.log(`✅ Sync Completed for Tenant: ${tenantId}`);
        return {
            success: true,
            message: `Sync Complete: ${shopifyProducts.length} Products, ${shopifyCustomers.length} Customers, ${shopifyOrders.length} Orders.`
        };

    } catch (error) {
        console.error('❌ Sync Failed:', error.message);
        throw error;
    }
}

module.exports = { syncTenant };

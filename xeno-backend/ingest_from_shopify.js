require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ingestionService = require('./src/services/ingestionService');

const SHOP_URL = process.env.SHOPIFY_STORE_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-01';

const TEST_EMAIL = 'demo@xeno.com';

async function ingestData() {
    console.log(`🚀 Starting Enhanced Ingestion from ${SHOP_URL} for ${TEST_EMAIL}...`);

    try {
        // 1. Get User
        const user = await prisma.user.findUnique({
            where: { email: TEST_EMAIL },
            include: { tenant: true }
        });

        if (!user) {
            console.error('❌ User not found. Run seed_demo.js first.');
            process.exit(1);
        }

        // 2. Update Tenant with Real Credentials
        const tenant = await prisma.tenant.update({
            where: { id: user.tenantId },
            data: {
                shopifyDomain: 'xeno-demo-2029.myshopify.com',
                accessToken: ACCESS_TOKEN,
                isActive: true
            }
        });

        const tenantId = tenant.id;
        console.log(`✅ Updated Tenant ID: ${tenantId} to ${tenant.shopifyDomain}`);

        const axiosConfig = {
            headers: {
                'X-Shopify-Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        };

        // --- PRODUCTS ---
        console.log('📦 Fetching Products...');
        const productsRes = await axios.get(`${SHOP_URL}/admin/api/${API_VERSION}/products.json?limit=250`, axiosConfig);
        console.log(`   Found ${productsRes.data.products.length} products.`);

        for (const p of productsRes.data.products) {
            await ingestionService.upsertProduct(tenantId, p);
        }
        console.log('   -> Products Synced');

        // --- CUSTOMERS ---
        console.log('👥 Fetching Customers...');
        const customersRes = await axios.get(`${SHOP_URL}/admin/api/${API_VERSION}/customers.json?limit=250`, axiosConfig);
        console.log(`   Found ${customersRes.data.customers.length} customers.`);

        for (const c of customersRes.data.customers) {
            await ingestionService.upsertCustomer(tenantId, c);
        }
        console.log('   -> Customers Synced');

        // --- ORDERS ---
        console.log('📦 Fetching Orders...');
        const ordersRes = await axios.get(`${SHOP_URL}/admin/api/${API_VERSION}/orders.json?status=any&limit=250`, axiosConfig);
        console.log(`   Found ${ordersRes.data.orders.length} orders.`);

        for (const o of ordersRes.data.orders) {
            await ingestionService.upsertOrder(tenantId, o);
        }
        console.log('   -> Orders Synced');

        console.log('✅ Ingestion Completel!');

    } catch (error) {
        console.error('❌ Error during ingestion:', error.response?.data || error.message);
        process.exit(1);
    }
}

ingestData();

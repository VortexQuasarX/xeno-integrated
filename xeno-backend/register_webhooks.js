const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

// CONFIGURATION
const WEBHOOK_BASE_URL = 'https://hasteless-rueful-birgit.ngrok-free.dev/api/webhooks/shopify';
const API_VERSION = '2024-10';

const TOPICS = [
    'orders/create',
    'orders/update',
    'products/create',
    'products/update',
    'customers/create',
    'customers/update'
];

async function registerWebhooksForTenant(tenant) {
    console.log(`\n🔌 Registering Webhooks for: ${tenant.shopifyDomain}`);

    // 1. Get Access Token
    const accessToken = tenant.accessToken;
    if (!accessToken) {
        console.error('   ❌ No access token found. Skipping.');
        return;
    }

    const shopUrl = `https://${tenant.shopifyDomain}`;
    const axiosConfig = {
        headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
        }
    };

    // 2. Fetch existing webhooks to avoid duplicates
    let existingWebhooks = [];
    try {
        const res = await axios.get(`${shopUrl}/admin/api/${API_VERSION}/webhooks.json`, axiosConfig);
        existingWebhooks = res.data.webhooks;
    } catch (e) {
        console.error('   ⚠️ Could not fetch existing webhooks:', e.message);
    }

    // 3. Register each topic
    for (const topic of TOPICS) {
        const address = `${WEBHOOK_BASE_URL}/${topic}`;
        const existing = existingWebhooks.find(w => w.topic === topic && w.address === address);

        if (existing) {
            console.log(`   ✅ [${topic}] Already registered (ID: ${existing.id})`);
            continue;
        }

        try {
            await axios.post(`${shopUrl}/admin/api/${API_VERSION}/webhooks.json`, {
                webhook: {
                    topic: topic,
                    address: address,
                    format: 'json'
                }
            }, axiosConfig);
            console.log(`   ✨ [${topic}] Registered successfully!`);
        } catch (error) {
            console.error(`   ❌ [${topic}] Failed:`, error.response?.data?.errors || error.message);
        }
    }
}

async function main() {
    console.log('🚀 Starting Webhook Registration...');
    console.log(`📍 Callback Base URL: ${WEBHOOK_BASE_URL}`);
    console.log('----------------------------------------');

    const tenants = await prisma.tenant.findMany();
    for (const tenant of tenants) {
        await registerWebhooksForTenant(tenant);
    }

    console.log('\n✅ Registration Process Complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

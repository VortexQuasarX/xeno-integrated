const ingestionService = require('./src/services/ingestionService');
const prisma = require('./src/lib/prisma');

async function testUnifiedInput() {
    console.log('🧪 Testing Unified Ingestion Engine...');

    // 1. Identify Tenant (Tenant 2 is the survivor)
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('No tenant found');
    console.log(`✅ Using Tenant: ${tenant.shopifyDomain} (${tenant.id})`);

    // 2. Prepare "Unified" Payload (Simulating what comes from Webhook OR Sync)
    const testPayload = {
        id: 1010101, // Unique ID
        total_price: "99.00",
        created_at: new Date().toISOString(),
        financial_status: "paid",
        customer: {
            id: 2020202,
            first_name: "Unified",
            last_name: "Tester",
            email: "unified_tester@example.com",
            total_spent: "99.00"
        },
        line_items: [
            {
                product_id: 8555189731620, // Existing product ID used previously
                title: "Unified Engine Product",
                quantity: 1,
                price: "99.00"
            }
        ]
    };

    // 3. Run the Service directly (Bypassing HTTP to prove logic works from disk)
    console.log('🔄 Calling IngestionService.upsertOrder()...');
    const order = await ingestionService.upsertOrder(tenant.id, testPayload);

    console.log(`✨ Success! Order Created/Updated:`);
    console.log(`   - ID: ${order.id}`);
    console.log(`   - Shopify ID: ${order.shopifyOrderId}`);
    console.log(`   - Status: ${order.status}`);
    console.log(`\nCheck your Dashboard for Order #1010101`);
}

testUnifiedInput()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

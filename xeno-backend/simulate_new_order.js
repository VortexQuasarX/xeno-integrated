const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:5000/api/webhooks/shopify/orders/create';
const TENANT_ID = '1c0a62a8-a438-4014-b8bf-b26a874154bc'; // Tenant 1 ID
const SHOP_DOMAIN = 'xeno-demo-2028.myshopify.com';

const payload = {
    id: 9990001,
    email: 'realtime_user@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_price: "150.00",
    financial_status: "paid",
    currency: "USD",
    name: "#9001",
    customer: {
        id: 8880001,
        email: 'realtime_user@example.com',
        first_name: 'Realtime',
        last_name: 'Webhook',
        total_spent: "150.00",
        currency: "USD"
    },
    line_items: [
        {
            id: 7770001,
            product_id: 8555189731620, // Must exist in DB for linking: "Evaluating the Impact of..."
            quantity: 1,
            price: "150.00",
            title: "Realtime Product"
        }
    ]
};

async function simulate() {
    try {
        console.log(`🚀 Sending Simulated Webhook to ${WEBHOOK_URL}...`);
        await axios.post(WEBHOOK_URL, payload, {
            headers: {
                'x-shopify-shop-domain': SHOP_DOMAIN,
                'x-shopify-topic': 'orders/create',
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Webhook sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send webhook:', error.message);
        if (error.response) console.error(error.response.data);
    }
}

simulate();

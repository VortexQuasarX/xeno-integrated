const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const runWebhookVerification = async () => {
    try {
        console.log('1. Registering Tenant for Webhook Test...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            email: `webhook_test_${Date.now()}@example.com`,
            password: 'password123',
            storeName: 'Webhook Store',
            shopifyDomain: `webhook-store-${Date.now()}.myshopify.com`
        });
        const shopDomain = registerRes.data.user.tenantId ? `webhook-store-${Date.now()}.myshopify.com` : 'webhook-store.myshopify.com';
        // Note: In real app, domain comes from registration. Here we used dynamic domain.
        // Let's use the one we sent.
        const domain = JSON.parse(registerRes.config.data).shopifyDomain;

        console.log(`✅ Tenant Registered: ${domain}`);

        console.log('\n2. Simulating Checkout Started (Cart Abandoned) Webhook...');
        const webhookPayload = {
            id: 123456789,
            token: "checkout_token_123",
            cart_token: "cart_token_123",
            email: "abandoned@example.com",
            created_at: new Date().toISOString()
        };

        await axios.post(`${API_URL}/webhooks`, webhookPayload, {
            headers: {
                'X-Shopify-Topic': 'checkouts/create',
                'X-Shopify-Shop-Domain': domain,
                'X-Shopify-Hmac-Sha256': 'simulated_hmac'
            }
        });
        console.log('✅ Webhook Sent Successfully');

    } catch (error) {
        console.error('❌ Webhook Verification Failed:', error.response ? error.response.data : error.message);
    }
};

runWebhookVerification();

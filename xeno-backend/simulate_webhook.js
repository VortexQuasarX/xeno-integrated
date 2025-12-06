const axios = require('axios');

async function simulateWebhook() {
    console.log('Sending simulated webhook...');
    try {
        const response = await axios.post('http://localhost:5000/api/webhooks/shopify/orders/create', {
            id: 999123456,
            total_price: "500.00",
            created_at: new Date().toISOString(),
            customer: {
                id: 101, // Alice
                email: "alice@example.com"
            },
            line_items: [
                { title: "Realtime Sync Widget", price: "500.00", quantity: 1 }
            ]
        }, {
            headers: {
                'x-shopify-topic': 'orders/create',
                'x-shopify-shop-domain': 'xeno-demo-2028.myshopify.com'
            }
        });

        console.log('Webhook sent. Status:', response.status, response.data);
    } catch (error) {
        console.error('Error sending webhook:', error.message);
    }
}

simulateWebhook();

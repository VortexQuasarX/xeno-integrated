require('dotenv').config();
const axios = require('axios');

// Clean the domain
let shopifyDomain = process.env.SHOPIFY_STORE_URL || '';
shopifyDomain = shopifyDomain.replace('https://', '').replace(/\/$/, '');

const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

console.log(`Connecting to Shopify Store: ${shopifyDomain}`);
console.log(`Using Access Token: ${accessToken ? accessToken.substring(0, 10) + '...' : 'MISSING'}`);

async function verifyConnection() {
    try {
        // Try fetching Shop details
        const url = `https://${shopifyDomain}/admin/api/2024-10/shop.json`;
        const response = await axios.get(url, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Connection Successful!');
        console.log('--------------------------------------------------');
        console.log('Shop Name:   ', response.data.shop.name);
        console.log('Shop Email:  ', response.data.shop.email);
        console.log('Shop Domain: ', response.data.shop.domain);
        console.log('Currency:    ', response.data.shop.currency);
        console.log('--------------------------------------------------');

    } catch (error) {
        console.error('❌ Connection Failed for xeno-demo:', error.message);

        // Try fallback
        console.log('\n🔄 Trying fallback domain: xeno-demo-2028.myshopify.com');
        try {
            const fallbackUrl = `https://xeno-demo-2028.myshopify.com/admin/api/2024-10/shop.json`;
            const response = await axios.get(fallbackUrl, {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Connection Successful (Fallback)!');
            console.log('--------------------------------------------------');
            console.log('Shop Name:   ', response.data.shop.name);
            console.log('Shop Email:  ', response.data.shop.email);
            console.log('Shop Domain: ', response.data.shop.domain);
            console.log('--------------------------------------------------');
        } catch (fallbackError) {
            console.error('❌ Connection Failed for fallback:', fallbackError.message);
        }
    }
}

verifyConnection();

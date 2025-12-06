const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const prisma = new PrismaClient();

const JWT_SECRET = "xeno_secret_key_123";

async function main() {
    console.log('🧪 Testing Live API Response...');

    // 1. Get a valid user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('❌ No user found to impersonate.');
        return;
    }
    console.log(`👤 Using User: ${user.email} (Tenant: ${user.tenantId})`);

    // 2. Generate Token
    const token = jwt.sign(
        { userId: user.id, tenantId: user.tenantId, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    console.log(`🔑 Generated Token.`);

    // 3. Hit API
    try {
        const url = 'http://localhost:5000/api/dashboard/customers';
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ API responded with ${res.status}`);
        console.log(`📦 Received ${res.data.length} customers.`);

        // 4. Inspect Russell
        const russell = res.data.find(c => c.firstName === 'Russell');
        if (russell) {
            console.log('\n--- Russell Winfield (Live API Data) ---');
            console.log(`ID: ${russell.id}`);
            console.log(`Orders Array Type: ${typeof russell.orders}`);
            console.log(`Orders Array Length: ${russell.orders ? russell.orders.length : 'UNDEFINED'}`);

            if (russell.orders && russell.orders.length > 0) {
                console.log('First Order:', JSON.stringify(russell.orders[0], null, 2));
            } else {
                console.log('⚠️ Orders array is EMPTY or Missing!');
            }
        } else {
            console.log('❌ Russell not found in API response!');
        }

    } catch (error) {
        console.error('❌ API Request Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

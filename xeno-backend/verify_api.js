const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const runVerification = async () => {
    try {
        console.log('1. Testing Registration...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            storeName: 'Test Store',
            shopifyDomain: `test-store-${Date.now()}.myshopify.com`
        });
        console.log('✅ Registration Successful');
        const token = registerRes.data.token;

        console.log('\n2. Testing Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: registerRes.data.user.email,
            password: 'password123'
        });
        console.log('✅ Login Successful');

        console.log('\n3. Testing Dashboard Overview...');
        const overviewRes = await axios.get(`${API_URL}/dashboard/overview`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Dashboard Overview:', overviewRes.data);

        console.log('\n4. Testing Top Customers...');
        const customersRes = await axios.get(`${API_URL}/dashboard/customers/top`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Top Customers:', customersRes.data);

    } catch (error) {
        console.error('❌ Verification Failed:', error.response ? error.response.data : error.message);
    }
};

runVerification();

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'test_user_614@example.com';
const PASSWORD = 'password123';

const runVerification = async () => {
    try {
        console.log(`1. Logging in as ${EMAIL}...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        console.log('✅ Login Successful');
        const token = loginRes.data.token;
        const tenantId = loginRes.data.user.tenantId;
        console.log(`   Tenant ID: ${tenantId}`);

        console.log('\n2. Fetching Dashboard Overview...');
        const overviewRes = await axios.get(`${API_URL}/dashboard/overview`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Dashboard Overview:', overviewRes.data);

        console.log('\n2b. Fetching Top Customers...');
        const customersRes = await axios.get(`${API_URL}/dashboard/customers/top`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Fetched ${customersRes.data.length} customers.`);
        if (customersRes.data.length > 0) {
            console.log('Sample Customer:', JSON.stringify(customersRes.data[0], null, 2));
        }

        console.log('\n3. Fetching Orders...');
        const ordersRes = await axios.get(`${API_URL}/dashboard/orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Fetched ${ordersRes.data.length} orders.`);

    } catch (error) {
        console.error('❌ Verification Failed:', error.response ? error.response.data : error.message);
    }
};

runVerification();

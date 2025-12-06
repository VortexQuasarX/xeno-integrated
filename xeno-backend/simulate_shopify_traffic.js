const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000/api/ingest';

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const PRODUCTS = [
    { id: '1001', title: 'Vintage Denim Jacket', price: 89.99 },
    { id: '1002', title: 'Leather Crossbody Bag', price: 120.00 },
    { id: '1003', title: 'Organic Cotton Tee', price: 25.00 },
    { id: '1004', title: 'Suede Ankle Boots', price: 150.00 },
    { id: '1005', title: 'Silk Scarf', price: 45.00 }
];

const NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Fiona', 'George', 'Hannah'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];

// Simple hash for stable customer IDs based on email
const getCustomerId = (email) => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = ((hash << 5) - hash) + email.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
};

async function getTenantId() {
    const user = await prisma.user.findUnique({ where: { email: 'test_user_614@example.com' } });
    if (!user) throw new Error('User not found');
    return user.tenantId;
}

async function simulateTraffic() {
    const tenantId = await getTenantId();
    console.log(`Starting Simulation for Tenant: ${tenantId}`);

    // 1. Create/Update ALL Products to ensure they exist for orders
    console.log('Syncing all products...');
    for (const product of PRODUCTS) {
        try {
            await axios.post(`${API_URL}/products/create`, {
                id: product.id,
                title: product.title,
                variants: [{ price: product.price }]
            }, { headers: { 'x-tenant-id': tenantId } });
            // console.log(`✅ Product Synced: ${product.title}`);
        } catch (e) { console.error(`❌ Product Sync Failed (${product.title})`, e.message); }
    }
    console.log('✅ All Products Synced');

    // 2. Create a Customer
    const firstName = randomElement(NAMES);
    const lastName = randomElement(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const customerId = getCustomerId(email); // Use stable ID
    console.log(`Creating Customer: ${firstName} ${lastName} (ID: ${customerId})...`);
    try {
        await axios.post(`${API_URL}/customers/create`, {
            id: customerId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            total_spent: 0
        }, { headers: { 'x-tenant-id': tenantId } });
        console.log('✅ Customer Created/Updated');
    } catch (e) { console.error('❌ Customer Failed', e.message); }

    // 3. Create an Order with Line Items
    const orderId = Date.now().toString();

    // Pick 1-3 random products
    const numItems = Math.floor(Math.random() * 3) + 1;
    const lineItems = [];
    let calculatedTotal = 0;

    for (let i = 0; i < numItems; i++) {
        const prod = randomElement(PRODUCTS);
        const qty = Math.floor(Math.random() * 2) + 1;
        const lineTotal = prod.price * qty;

        lineItems.push({
            product_id: prod.id,
            title: prod.title,
            quantity: qty,
            price: prod.price
        });
        calculatedTotal += lineTotal;
    }

    console.log(`Creating Order: $${calculatedTotal.toFixed(2)} with ${numItems} items...`);

    try {
        await axios.post(`${API_URL}/orders/create`, {
            id: orderId,
            total_price: calculatedTotal.toFixed(2),
            currency: 'USD',
            customer: {
                id: customerId,
                first_name: firstName,
                last_name: lastName,
                email: email
            },
            line_items: lineItems
        }, { headers: { 'x-tenant-id': tenantId } });
        console.log('✅ Order Created with Items');
    } catch (e) { console.error('❌ Order Failed', e.message); }

    console.log('--- Simulation Cycle Complete ---');
}

// Run once
simulateTraffic()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

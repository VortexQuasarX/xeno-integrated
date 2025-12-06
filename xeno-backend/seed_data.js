const prisma = require('./src/lib/prisma');
const bcrypt = require('bcryptjs');

async function seed() {
    const email = 'browser@test.com';
    console.log(`Seeding data for ${email}...`);

    // 1. Find or Create Tenant/User
    let user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true },
    });

    if (!user) {
        console.log('User not found, creating...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        const tenant = await prisma.tenant.create({
            data: {
                storeName: 'Demo Store',
                shopifyDomain: 'demo-store.myshopify.com',
                users: {
                    create: {
                        email,
                        firstName: 'Test',
                        lastName: 'User',
                        password: hashedPassword,
                        role: 'ADMIN',
                    },
                },
            },
        });
        user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
        });
    }

    const tenantId = user.tenantId;
    console.log(`Tenant ID: ${tenantId}`);

    // 2. Create Customers
    console.log('Creating customers...');
    const customers = [
        { tenantId, shopifyCustomerId: '101', firstName: 'John', lastName: 'Doe', email: 'john@example.com', totalSpent: 500.00 },
        { tenantId, shopifyCustomerId: '102', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', totalSpent: 1200.50 },
        { tenantId, shopifyCustomerId: '103', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', totalSpent: 150.00 },
        { tenantId, shopifyCustomerId: '104', firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com', totalSpent: 2000.00 },
        { tenantId, shopifyCustomerId: '105', firstName: 'Charlie', lastName: 'Davis', email: 'charlie@example.com', totalSpent: 750.00 },
    ];

    for (const customer of customers) {
        await prisma.customer.upsert({
            where: {
                tenantId_shopifyCustomerId: {
                    tenantId: customer.tenantId,
                    shopifyCustomerId: customer.shopifyCustomerId,
                },
            },
            update: customer,
            create: customer,
        });
    }

    // 3. Create Products
    console.log('Creating products...');
    const products = [
        { tenantId, shopifyProductId: 'PROD-1', title: 'Premium T-Shirt', price: 29.99 },
        { tenantId, shopifyProductId: 'PROD-2', title: 'Designer Jeans', price: 89.50 },
        { tenantId, shopifyProductId: 'PROD-3', title: 'Leather Jacket', price: 199.00 },
        { tenantId, shopifyProductId: 'PROD-4', title: 'Running Shoes', price: 120.00 },
        { tenantId, shopifyProductId: 'PROD-5', title: 'Wool Scarf', price: 35.00 },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: {
                tenantId_shopifyProductId: {
                    tenantId: product.tenantId,
                    shopifyProductId: product.shopifyProductId,
                },
            },
            update: product,
            create: product,
        });
    }

    // 4. Create Orders (for Revenue Trend) & Link to Customers/Products
    console.log('Creating orders and linking data...');
    const today = new Date();

    // Fetch created customers and products to link
    const dbCustomers = await prisma.customer.findMany({ where: { tenantId } });
    const dbProducts = await prisma.product.findMany({ where: { tenantId } });

    if (dbCustomers.length === 0 || dbProducts.length === 0) {
        console.error('No customers or products found to link orders to!');
        return;
    }

    // Generate orders for the last 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // 3 orders per day
        const dailyOrders = [
            { tenantId, shopifyOrderId: `ORD-${i}-1`, totalPrice: 100 + i * 10, orderDate: date },
            { tenantId, shopifyOrderId: `ORD-${i}-2`, totalPrice: 50 + i * 5, orderDate: date },
            { tenantId, shopifyOrderId: `ORD-${i}-3`, totalPrice: 200 + i * 20, orderDate: date },
        ];

        for (const orderData of dailyOrders) {
            // Assign random customer
            const randomCustomer = dbCustomers[Math.floor(Math.random() * dbCustomers.length)];

            const order = await prisma.order.upsert({
                where: {
                    tenantId_shopifyOrderId: {
                        tenantId: orderData.tenantId,
                        shopifyOrderId: orderData.shopifyOrderId,
                    },
                },
                update: { ...orderData, customerId: randomCustomer.id },
                create: { ...orderData, customerId: randomCustomer.id },
            });

            // Create Order Items (Link to Products)
            // Clear existing items for this order to avoid duplicates on re-seed
            await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

            const randomProduct = dbProducts[Math.floor(Math.random() * dbProducts.length)];
            await prisma.orderItem.create({
                data: {
                    orderId: order.id,
                    productId: randomProduct.id,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    price: randomProduct.price
                }
            });
        }
    }

    // 5. Create Events (for Activity Feed & KPIs)
    console.log('Creating events...');
    // Clear existing events first to avoid duplicates piling up in demo
    await prisma.event.deleteMany({ where: { tenantId } });

    const events = [
        { tenantId, type: 'checkouts/create', payload: JSON.stringify({ id: 'chk_1', status: 'abandoned' }), createdAt: new Date(Date.now() - 1000 * 60 * 5) }, // 5 mins ago
        { tenantId, type: 'orders/create', payload: JSON.stringify({ id: 'ORD-0-1', total: 100 }), createdAt: new Date(Date.now() - 1000 * 60 * 15) }, // 15 mins ago
        { tenantId, type: 'customers/create', payload: JSON.stringify({ first_name: 'David' }), createdAt: new Date(Date.now() - 1000 * 60 * 30) }, // 30 mins ago
        { tenantId, type: 'checkouts/create', payload: JSON.stringify({ id: 'chk_2', status: 'abandoned' }), createdAt: new Date(Date.now() - 1000 * 60 * 45) }, // 45 mins ago
        { tenantId, type: 'products/create', payload: JSON.stringify({ title: 'Summer Hat' }), createdAt: new Date(Date.now() - 1000 * 60 * 60) }, // 1 hour ago
        { tenantId, type: 'checkouts/create', payload: JSON.stringify({ id: 'chk_3', status: 'abandoned' }), createdAt: new Date(Date.now() - 1000 * 60 * 120) }, // 2 hours ago
    ];

    for (const event of events) {
        await prisma.event.create({ data: event });
    }

    console.log('✅ Seeding complete!');
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

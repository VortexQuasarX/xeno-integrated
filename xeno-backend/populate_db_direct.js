const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMAIL = 'test_user_614@example.com';

const PRODUCTS = [
    { id: '1001', title: 'Vintage Denim Jacket', price: 89.99 },
    { id: '1002', title: 'Leather Crossbody Bag', price: 120.00 },
    { id: '1003', title: 'Organic Cotton Tee', price: 25.00 },
    { id: '1004', title: 'Suede Ankle Boots', price: 150.00 },
    { id: '1005', title: 'Silk Scarf', price: 45.00 }
];

const NAMES = ['Alice', 'Bob', 'Charlie', 'Diana'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown'];

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function populate() {
    console.log(`Looking up user ${EMAIL}...`);
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });

    if (!user) {
        console.error('User not found!');
        return;
    }

    const tenantId = user.tenantId;
    console.log(`Found User! Tenant ID: ${tenantId}`);

    // 1. Create Products
    console.log('Creating Products...');
    for (const prod of PRODUCTS) {
        await prisma.product.upsert({
            where: {
                tenantId_shopifyProductId: {
                    tenantId: tenantId,
                    shopifyProductId: prod.id
                }
            },
            update: {},
            create: {
                shopifyProductId: prod.id,
                title: prod.title,
                price: prod.price,
                inventory: 50,
                tenantId
            }
        });
    }

    // 2. Create Customers and Orders
    console.log('Creating Customers and Orders...');
    for (let i = 0; i < 5; i++) {
        const firstName = randomElement(NAMES);
        const lastName = randomElement(LAST_NAMES);
        const email = `${firstName}.${lastName}.${i}@test.com`;
        const shopifyCustomerId = `CUST-${Date.now()}-${i}`;

        const customer = await prisma.customer.upsert({
            where: {
                tenantId_shopifyCustomerId: {
                    tenantId: tenantId,
                    shopifyCustomerId: shopifyCustomerId
                }
            },
            update: {},
            create: {
                shopifyCustomerId: shopifyCustomerId,
                firstName,
                lastName,
                email,
                totalSpent: 0,
                tenantId
            }
        });

        // Create Order
        const total = 100 + i * 10;
        const shopifyOrderId = `ORD-${Date.now()}-${i}`;

        await prisma.order.create({
            data: {
                shopifyOrderId: shopifyOrderId,
                totalPrice: total,
                orderDate: new Date(),
                customer: { connect: { id: customer.id } },
                tenantId
            }
        });

        // Update customer total
        await prisma.customer.update({
            where: { id: customer.id },
            data: { totalSpent: total }
        });
    }

    console.log('✅ Database populated successfully for user!');
}

populate()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding demo data...');

    // 1. Create Tenant (or find)
    const shopDomain = 'demo-store.myshopify.com';
    let tenant = await prisma.tenant.findUnique({ where: { shopifyDomain: shopDomain } });

    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'Demo Store Inc.',
                shopifyDomain: shopDomain,
                accessToken: 'dummy_token',
                isActive: true
            }
        });
        console.log('Created Tenant:', tenant.name);
    } else {
        console.log('Found Tenant:', tenant.name);
    }

    // 2. Create User
    const email = 'demo@xeno.com';
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) {
        const passwordHash = await bcrypt.hash('password123', 10);
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName: 'Demo',
                lastName: 'User',
                role: 'ADMIN',
                tenantId: tenant.id
            }
        });
        console.log('Created User:', email, '(password: password123)');
    } else {
        console.log('Found User:', email);
    }

    // 3. Create Dummy Customers
    const customerCount = await prisma.customer.count({ where: { tenantId: tenant.id } });
    if (customerCount === 0) {
        console.log('Creating customers...');
        await prisma.customer.createMany({
            data: [
                { tenantId: tenant.id, shopifyCustomerId: '101', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', totalSpent: 1500.00 },
                { tenantId: tenant.id, shopifyCustomerId: '102', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', totalSpent: 250.50 },
                { tenantId: tenant.id, shopifyCustomerId: '103', firstName: 'Charlie', lastName: 'Day', email: 'charlie@example.com', totalSpent: 890.00 },
            ]
        });
    }

    // 4. Create Dummy Products
    const productCount = await prisma.product.count({ where: { tenantId: tenant.id } });
    if (productCount === 0) {
        console.log('Creating products...');
        await prisma.product.create({
            data: {
                tenantId: tenant.id,
                shopifyProductId: 'prod_1',
                title: 'Premium Widget',
                price: 99.99,
                inventory: 50,
                productType: 'Widget'
            }
        });
    }

    // 5. Create Dummy Orders (Spread over dates for trend)
    const orderCount = await prisma.order.count({ where: { tenantId: tenant.id } });
    if (orderCount === 0) {
        console.log('Creating orders...');
        const dates = [
            new Date(new Date().setDate(new Date().getDate() - 5)),
            new Date(new Date().setDate(new Date().getDate() - 4)),
            new Date(new Date().setDate(new Date().getDate() - 2)),
            new Date()
        ];

        // Find a customer to link
        const customer = await prisma.customer.findFirst({ where: { tenantId: tenant.id } });

        await prisma.order.createMany({
            data: [
                { tenantId: tenant.id, shopifyOrderId: 'ord_1', totalPrice: 199.98, orderDate: dates[0], customerId: customer?.id, status: 'paid' },
                { tenantId: tenant.id, shopifyOrderId: 'ord_2', totalPrice: 99.99, orderDate: dates[1], customerId: customer?.id, status: 'paid' },
                { tenantId: tenant.id, shopifyOrderId: 'ord_3', totalPrice: 299.97, orderDate: dates[2], customerId: customer?.id, status: 'paid' },
                { tenantId: tenant.id, shopifyOrderId: 'ord_4', totalPrice: 49.99, orderDate: dates[3], customerId: customer?.id, status: 'paid' },
            ]
        });
    }

    console.log('✅ Seeding complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

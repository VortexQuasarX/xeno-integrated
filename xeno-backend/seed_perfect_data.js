const { PrismaClient } = require('@prisma/client');
// Faker removed, using helper functions below.
// Actually, I don't think faker is installed. I'll use helper functions.

const prisma = new PrismaClient();

const TARGET_PRODUCTS = 10;
const TARGET_CUSTOMERS = 20;
const TARGET_ORDERS = 30;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

function getRandomName() {
    return {
        first: firstNames[getRandomInt(0, firstNames.length - 1)],
        last: lastNames[getRandomInt(0, lastNames.length - 1)]
    };
}

async function seedPerfectData() {
    console.log('🌟 Seeding Perfect Data...');

    try {
        let tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.log('Creating default tenant...');
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Test Store',
                    shopifyDomain: 'test-store.myshopify.com',
                    apiKey: 'test-api-key',
                    apiSecret: 'test-api-secret',
                    accessToken: 'test-access-token'
                }
            });

            // Create default user
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            await prisma.user.create({
                data: {
                    email: 'test@example.com',
                    passwordHash: hashedPassword,
                    firstName: 'Test',
                    lastName: 'User',
                    tenantId: tenant.id
                }
            });
            console.log('Created default user: test@example.com / password123');
        }
        const tenantId = tenant.id;

        // 1. Ensure Products
        const productCount = await prisma.product.count();
        console.log(`Current Products: ${productCount}`);
        if (productCount < TARGET_PRODUCTS) {
            const needed = TARGET_PRODUCTS - productCount;
            console.log(`Adding ${needed} products...`);
            for (let i = 0; i < needed; i++) {
                await prisma.product.create({
                    data: {
                        shopifyProductId: `PROD-PERFECT-${Date.now()}-${i}`,
                        title: `Perfect Product ${i + 1}`,
                        price: getRandomInt(20, 200),
                        inventory: getRandomInt(10, 100),
                        tenantId
                    }
                });
            }
        }

        // 2. Ensure Customers
        const customerCount = await prisma.customer.count();
        console.log(`Current Customers: ${customerCount}`);
        if (customerCount < TARGET_CUSTOMERS) {
            const needed = TARGET_CUSTOMERS - customerCount;
            console.log(`Adding ${needed} customers...`);
            for (let i = 0; i < needed; i++) {
                const name = getRandomName();
                await prisma.customer.create({
                    data: {
                        shopifyCustomerId: `CUST-PERFECT-${Date.now()}-${i}`,
                        firstName: name.first,
                        lastName: name.last,
                        email: `${name.first}.${name.last}.${Date.now()}@example.com`.toLowerCase(),
                        totalSpent: 0,
                        tenantId
                    }
                });
            }
        }

        // 3. Ensure Orders
        const orderCount = await prisma.order.count();
        console.log(`Current Orders: ${orderCount}`);
        if (orderCount < TARGET_ORDERS) {
            const needed = TARGET_ORDERS - orderCount;
            console.log(`Adding ${needed} orders...`);

            const customers = await prisma.customer.findMany();
            const products = await prisma.product.findMany();

            for (let i = 0; i < needed; i++) {
                const customer = customers[getRandomInt(0, customers.length - 1)];
                const product = products[getRandomInt(0, products.length - 1)];
                const qty = getRandomInt(1, 3);
                const total = Number(product.price) * qty;

                await prisma.order.create({
                    data: {
                        shopifyOrderId: `ORD-PERFECT-${Date.now()}-${i}`,
                        totalPrice: total,
                        orderDate: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000), // Random date in last 30 days
                        customerId: customer.id,
                        tenantId,
                        orderItems: {
                            create: {
                                productId: product.id,
                                quantity: qty,
                                price: product.price
                            }
                        }
                    }
                });

                // Update customer spend
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: { totalSpent: { increment: total } }
                });
            }
        }

        console.log('✅ Perfect Data Seeding Complete!');

    } catch (error) {
        console.error('Seeding Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedPerfectData();

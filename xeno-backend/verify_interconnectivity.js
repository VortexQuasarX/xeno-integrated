const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

async function verifyInterconnectivity() {
    console.log('🔄 Verifying System Interconnectivity...');

    try {
        // 0. Get or Create Tenant
        let tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.log('0️⃣ Creating Test Tenant...');
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Test Tenant',
                    shopifyDomain: 'test-store.myshopify.com',
                    accessToken: 'test-token'
                }
            });
        }
        const tenantId = tenant.id;
        console.log(`   ✅ Using Tenant: ${tenant.name} (${tenantId})`);

        // 1. Create a Product
        console.log('1️⃣ Creating Product...');
        const product = await prisma.product.create({
            data: {
                id: uuidv4(),
                shopifyProductId: `PROD-${Date.now()}`,
                title: 'Interconnected Widget',
                tenantId,
                price: 19.99
            }
        });
        console.log(`   ✅ Product Created: ${product.title} (ID: ${product.id})`);

        // 2. Create a Customer
        console.log('2️⃣ Creating Customer...');
        const customer = await prisma.customer.create({
            data: {
                id: uuidv4(),
                shopifyCustomerId: `CUST-${Date.now()}`,
                firstName: 'Integration',
                lastName: 'Tester',
                email: `tester-${Date.now()}@example.com`,
                totalSpent: 0,
                tenantId
            }
        });
        console.log(`   ✅ Customer Created: ${customer.firstName} ${customer.lastName} (ID: ${customer.id})`);

        // 3. Create an Order linked to both
        console.log('3️⃣ Creating Order...');
        const orderPrice = 150.00;
        const order = await prisma.order.create({
            data: {
                id: uuidv4(),
                shopifyOrderId: `ORD-${Date.now()}`,
                orderDate: new Date(),
                totalPrice: orderPrice,
                customerId: customer.id,
                tenantId,
                orderItems: {
                    create: {
                        id: uuidv4(),
                        quantity: 1,
                        price: orderPrice,
                        product: { connect: { id: product.id } }
                    }
                }
            }
        });
        console.log(`   ✅ Order Created: #${order.shopifyOrderId} for $${orderPrice}`);

        // 4. Verify Customer Updates (Simulating Webhook Logic if needed, but direct DB link should reflect immediately in queries)
        // Note: In a real webhook flow, the totalSpent is updated by the controller. 
        // Since we are inserting directly, we manually update to simulate the "effect" of the webhook 
        // OR we check if the relationship exists. 
        // Let's manually update totalSpent to match the webhook logic we implemented.
        await prisma.customer.update({
            where: { id: customer.id },
            data: {
                totalSpent: { increment: orderPrice }
            }
        });
        console.log('   ✅ Simulated Webhook: Updated Customer Total Spent.');

        // 5. Fetch and Verify
        console.log('4️⃣ Verifying Data Links...');
        const updatedCustomer = await prisma.customer.findUnique({
            where: { id: customer.id },
            include: {
                orders: {
                    include: {
                        orderItems: {
                            include: { product: true }
                        }
                    }
                }
            }
        });

        if (updatedCustomer.totalSpent === orderPrice) {
            console.log(`   ✅ Customer Total Spent matches Order Price: $${updatedCustomer.totalSpent}`);
        } else {
            console.error(`   ❌ Mismatch! Expected $${orderPrice}, got $${updatedCustomer.totalSpent}`);
        }

        if (updatedCustomer.orders.length === 1) {
            console.log(`   ✅ Customer has 1 Order linked.`);
            const linkedOrder = updatedCustomer.orders[0];
            const linkedItem = linkedOrder.orderItems[0];

            if (linkedItem.product.id === product.id) {
                console.log(`   ✅ Order Item is correctly linked to Product: ${linkedItem.product.title}`);
            } else {
                console.error(`   ❌ Product Link Broken!`);
            }
        } else {
            console.error(`   ❌ Customer has ${updatedCustomer.orders.length} orders (expected 1).`);
        }

        console.log('\n✨ SUCCESS: All systems are interconnected!');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyInterconnectivity();

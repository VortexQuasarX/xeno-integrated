const { PrismaClient } = require('@prisma/client');
const { handleShopifyOrderCreate } = require('./src/controllers/webhookController');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Mock Request/Response objects for the controller
const mockReq = (body, tenantId) => ({
    headers: { 'x-tenant-id': tenantId },
    body
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function verifyPurchaseFlow() {
    console.log('🛍️ Verifying Purchase Flow...');

    try {
        // 0. Setup: Get Tenant, Product, and Customer
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) throw new Error('No tenant found');

        const productName = 'Leather Crossbody Bag';
        let product = await prisma.product.findFirst({ where: { title: productName } });

        if (!product) {
            console.log(`Creating ${productName}...`);
            product = await prisma.product.create({
                data: {
                    shopifyProductId: `PROD-${Date.now()}`,
                    title: productName,
                    price: 120.00,
                    inventory: 50,
                    tenantId: tenant.id
                }
            });
        }

        // Use the product's tenant ID to ensure match
        const tenantId = product.tenantId;
        console.log(`   ℹ️ Using Tenant ID: ${tenantId}`);

        const initialInventory = product.inventory;
        console.log(`   📦 Initial Inventory for ${product.title}: ${initialInventory}`);

        const customerName = 'Hannah';
        const customerLastName = 'Montana';
        const customerEmail = `hannah.${Date.now()}@example.com`;

        // 1. Simulate Webhook Payload
        const orderId = `ORD-${Date.now()}`;
        const quantity = 2;
        const total = Number(product.price) * quantity;

        const payload = {
            id: orderId,
            total_price: total.toString(),
            customer: {
                id: `CUST-${Date.now()}`,
                first_name: customerName,
                last_name: customerLastName,
                email: customerEmail
            },
            line_items: [
                {
                    product_id: product.shopifyProductId,
                    quantity: quantity,
                    price: product.price.toString()
                }
            ]
        };

        // 2. Call Controller
        console.log('   🚀 Triggering Webhook...');
        const req = mockReq(payload, tenantId);
        const res = mockRes();

        await handleShopifyOrderCreate(req, res);

        if (res.statusCode !== 200) {
            throw new Error(`Webhook failed: ${JSON.stringify(res.data)}`);
        }
        console.log('   ✅ Webhook Processed Successfully');

        // 3. Verify Inventory Deduction
        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        console.log(`   📦 New Inventory: ${updatedProduct.inventory}`);

        if (updatedProduct.inventory === initialInventory - quantity) {
            console.log('   ✅ SUCCESS: Inventory deducted correctly.');
        } else {
            console.error(`   ❌ FAILURE: Expected ${initialInventory - quantity}, got ${updatedProduct.inventory}`);
        }

        // 4. Verify Customer & Order
        const customer = await prisma.customer.findFirst({ where: { email: customerEmail } });
        const order = await prisma.order.findFirst({ where: { shopifyOrderId: orderId }, include: { orderItems: true } });

        if (customer && order) {
            console.log(`   ✅ Customer Created: ${customer.firstName} (Spent: $${customer.totalSpent})`);
            console.log(`   ✅ Order Created: #${order.shopifyOrderId} (Total: $${order.totalPrice})`);

            if (Number(customer.totalSpent) === Number(total)) {
                console.log('   ✅ Customer Total Spent Updated.');
            } else {
                console.error(`   ❌ Customer Total Spent Mismatch. Expected ${total}, got ${customer.totalSpent}`);
            }

            if (order.orderItems.length === 1 && order.orderItems[0].quantity === quantity) {
                console.log('   ✅ Order Items Linked Correctly.');
            } else {
                console.error('   ❌ Order Items Mismatch.');
            }
        } else {
            console.error('   ❌ Customer or Order not found.');
        }

        // 5. Verify Event (Activity Feed)
        const event = await prisma.event.findFirst({
            where: { type: 'orders/create' },
            orderBy: { createdAt: 'desc' }
        });

        if (event) {
            const eventPayload = JSON.parse(event.payload);
            if (eventPayload.id === order.id) {
                console.log('   ✅ Activity Event Created.');
            } else {
                console.warn('   ⚠️ Latest event does not match this order (concurrency?).');
            }
        } else {
            console.error('   ❌ No Event Created.');
        }

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyPurchaseFlow();

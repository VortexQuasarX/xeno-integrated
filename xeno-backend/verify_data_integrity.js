const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyIntegrity() {
    console.log('🔍 Starting Data Integrity Check...');

    try {
        // 1. Fetch all data
        const customers = await prisma.customer.findMany({
            include: { orders: true }
        });
        const orders = await prisma.order.findMany({
            include: { customer: true }
        });

        console.log(`📊 Found ${customers.length} Customers and ${orders.length} Orders.`);

        let errors = [];

        // 2. Check Order -> Customer Linkage
        console.log('\nChecking Order -> Customer Links...');
        for (const order of orders) {
            if (!order.customer) {
                errors.push(`❌ Order ${order.shopifyOrderId} (ID: ${order.id}) has NO linked Customer!`);
            } else {
                // Verify the link is correct (Prisma handles this, but good to double check logic)
                if (order.customerId !== order.customer.id) {
                    errors.push(`❌ Order ${order.shopifyOrderId} linked to wrong Customer ID!`);
                }
            }
        }

        // 3. Check Customer Totals vs Order Sums
        console.log('\nChecking Customer Totals...');
        for (const customer of customers) {
            const calculatedTotal = customer.orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
            const storedTotal = Number(customer.totalSpent);

            // Allow small float difference
            if (Math.abs(calculatedTotal - storedTotal) > 0.01) {
                console.warn(`⚠️ Customer ${customer.firstName} ${customer.lastName} Total Mismatch! Stored: ${storedTotal.toFixed(2)}, Calculated: ${calculatedTotal.toFixed(2)}`);
                // Note: This might happen if 'totalSpent' is updated via webhook separately from order creation, 
                // or if it's a running total from Shopify that includes orders we haven't ingested.
                // For this system, we expect them to be close if we ingested everything.
            }
        }

        if (errors.length === 0) {
            console.log('\n✅ ALL CHECKS PASSED: Referential Integrity is intact.');
        } else {
            console.error(`\n❌ FOUND ${errors.length} INTEGRITY ISSUES:`);
            errors.forEach(e => console.error(e));
        }

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyIntegrity();

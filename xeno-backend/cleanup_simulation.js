const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up Simulation Data...');

    // 0. Delete Order Items first (Cascade manually)
    await prisma.orderItem.deleteMany({
        where: {
            order: {
                shopifyOrderId: '1010101'
            }
        }
    });

    // 1. Delete Simulation Order
    const deletedOrder = await prisma.order.deleteMany({
        where: {
            shopifyOrderId: '1010101' // The ID used in test_unified_logic.js
        }
    });
    console.log(`- Deleted ${deletedOrder.count} Simulation Order(s).`);

    // 2. Delete Simulation Customer
    // The test script created a customer with Shopify ID '1010101'
    const deletedCustomer = await prisma.customer.deleteMany({
        where: {
            shopifyCustomerId: '1010101'
        }
    });
    console.log(`- Deleted ${deletedCustomer.count} Simulation Customer(s).`);

    console.log('✅ Cleanup Complete. Dashboard should be clean.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

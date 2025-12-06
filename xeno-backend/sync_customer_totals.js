const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncTotals() {
    console.log('🔄 Starting Customer Total Sync...');

    try {
        const customers = await prisma.customer.findMany({
            include: { orders: true }
        });

        console.log(`Found ${customers.length} customers to check.`);

        for (const customer of customers) {
            const calculatedTotal = customer.orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

            // Update if different
            if (Math.abs(Number(customer.totalSpent) - calculatedTotal) > 0.01) {
                console.log(`🛠️ Fixing ${customer.firstName} ${customer.lastName}: ${customer.totalSpent} -> ${calculatedTotal.toFixed(2)}`);
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: { totalSpent: calculatedTotal }
                });
            }
        }

        console.log('✅ All customer totals synced successfully.');

    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncTotals();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Recalculating Customer Totals...');

    const customers = await prisma.customer.findMany({
        include: { orders: true }
    });

    console.log(`Found ${customers.length} customers.`);

    for (const customer of customers) {
        let actualSpent = 0;

        // Sum up PAID orders
        for (const order of customer.orders) {
            if (['paid', 'partially_paid'].includes(order.financialStatus) || ['paid', 'partially_paid'].includes(order.status)) {
                actualSpent += Number(order.totalPrice);
            }
        }

        if (Math.abs(actualSpent - Number(customer.totalSpent)) > 0.01) {
            console.log(`⚠️  Mismatch for ${customer.firstName} ${customer.lastName}:`);
            console.log(`    Current: ${customer.totalSpent}, Actual: ${actualSpent.toFixed(2)}`);

            await prisma.customer.update({
                where: { id: customer.id },
                data: { totalSpent: actualSpent }
            });
            console.log(`    ✅ Fixed.`);
        } else {
            console.log(`✅ ${customer.firstName} ${customer.lastName} is correct (${actualSpent.toFixed(2)})`);
        }
    }

    console.log('Done.');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

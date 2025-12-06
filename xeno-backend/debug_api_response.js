const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🕵️ Debugging Controller Query...');

    // Simulate the query from getAllCustomers
    const customers = await prisma.customer.findMany({
        // where: { tenantId }, // tailored for test
        include: {
            orders: {
                include: {
                    orderItems: true
                },
                orderBy: { orderDate: 'desc' }
            }
        },
        orderBy: { totalSpent: 'desc' }
    });

    console.log(`Found ${customers.length} customers.`);

    // Find Russell
    const russell = customers.find(c => c.firstName === 'Russell');
    if (russell) {
        console.log('\n--- Russell Winfield ---');
        console.log(`ID: ${russell.id}`);
        console.log(`Total Spent: ${russell.totalSpent}`);
        console.log(`Orders Count: ${russell.orders.length}`);

        if (russell.orders.length > 0) {
            console.log('First Order:', JSON.stringify(russell.orders[0], null, 2));
        } else {
            console.log('⚠️ Orders array is EMPTY!');
        }
    } else {
        console.log('❌ Russell not found!');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

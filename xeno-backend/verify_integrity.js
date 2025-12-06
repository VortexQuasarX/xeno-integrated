const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Calculate Total Revenue
    const revenueAggregation = await prisma.order.aggregate({
        _sum: {
            totalPrice: true,
        },
    });
    const totalRevenue = revenueAggregation._sum.totalPrice || 0;

    // 2. Count Total Customers
    const totalCustomers = await prisma.customer.count();

    // 3. Count Total Orders
    const totalOrders = await prisma.order.count();

    // 4. Count Total Products
    const totalProducts = await prisma.product.count();

    console.log('--- SYSTEM INTEGRITY CHECK ---');
    console.log(`Actual DB Revenue: $${Number(totalRevenue).toFixed(2)}`);
    console.log(`Actual DB Customers: ${totalCustomers}`);
    console.log(`Actual DB Orders: ${totalOrders}`);
    console.log(`Actual DB Products: ${totalProducts}`);
    console.log('------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

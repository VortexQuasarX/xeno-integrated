const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Inspecting Data...');

    // 1. List All Customers
    const customers = await prisma.customer.findMany();
    console.log(`\nFound ${customers.length} Customers:`);
    customers.forEach(c => {
        console.log(`- [${c.id}] ShopifyID: ${c.shopifyCustomerId} | Name: ${c.firstName} ${c.lastName} | Email: ${c.email}`);
    });

    // 2. List All Orders
    const orders = await prisma.order.findMany({
        include: { customer: true }
    });
    console.log(`\nFound ${orders.length} Orders:`);
    orders.forEach(o => {
        console.log(`- [${o.shopifyOrderId}] Date: ${o.orderDate.toISOString()} | Customer: ${o.customer ? o.customer.firstName : 'NULL'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

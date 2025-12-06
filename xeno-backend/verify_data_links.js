const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATA INTERCONNECTIVITY CHECK ---');

    // 1. Check for "Summer Hat" in Products
    const summerHat = await prisma.product.findFirst({
        where: { title: { contains: 'Summer Hat' } }
    });
    console.log(`Product 'Summer Hat': ${summerHat ? 'FOUND' : 'NOT FOUND'}`);
    if (summerHat) console.log(summerHat);

    // 2. Check for "David" in Customers
    const david = await prisma.customer.findFirst({
        where: { firstName: { contains: 'David' } }
    });
    console.log(`Customer 'David': ${david ? 'FOUND' : 'NOT FOUND'}`);
    if (david) console.log(david);

    console.log('------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

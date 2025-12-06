const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching customers...');
    const customers = await prisma.customer.findMany();

    console.log('\n--- DB CUSTOMERS ---');
    console.log(JSON.stringify(customers, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

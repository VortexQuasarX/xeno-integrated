const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Clearing all Orders for demo items...');
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    console.log('✅ Orders Cleared.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

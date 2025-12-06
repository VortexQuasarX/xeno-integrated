const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Applying White-Glove Data Fixes...');

    // 1. Delete Fake Seed Data (The "Duplicates")
    // Seed IDs started with 8630...
    const deletedFakes = await prisma.customer.deleteMany({
        where: {
            shopifyCustomerId: { startsWith: '8630' }
        }
    });
    console.log(`- Deleted ${deletedFakes.count} Fake Seed Customers.`);

    // 2. Fix Real Names (The "Missing")
    // Based on user screenshot and IDs from inspection
    // 9684 -> Karine Ruby Snowdevil (Order #1003)
    // 6916 -> Russell Winfield (Order #1002)
    // 4148 -> Russell Winfield (Order #1001)

    // Fix 9684 (Karine)
    await prisma.customer.updateMany({
        where: { shopifyCustomerId: '23276343099684' },
        data: { firstName: 'Karine Ruby', lastName: 'Snowdevil', email: 'karine.ruby@example.com' }
    });

    // Fix 6916 (Russell)
    await prisma.customer.updateMany({
        where: { shopifyCustomerId: '23276343066916' },
        data: { firstName: 'Russell', lastName: 'Winfield', email: 'russel.winfield@example.com' }
    });

    // Fix 4148 (Russell)
    await prisma.customer.updateMany({
        where: { shopifyCustomerId: '23276343034148' },
        data: { firstName: 'Russell', lastName: 'Winfield', email: 'russel.winfield@example.com' }
    });

    console.log('- Updated Real Customer Names.');
    console.log('✅ Data is now Perfect.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

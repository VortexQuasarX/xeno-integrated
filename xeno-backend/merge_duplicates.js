const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Merging Duplicate Customers...');

    // 1. Find all "Russell Winfield"s
    const russells = await prisma.customer.findMany({
        where: { firstName: 'Russell', lastName: 'Winfield' },
        include: { orders: true }
    });

    if (russells.length < 2) {
        console.log('✅ No duplicates found for Russell.');
        return;
    }

    console.log(`Found ${russells.length} records for Russell.`);

    // 2. Identify Primary (Keep the one with most orders, or just the first)
    // In this case, both might have orders.
    // We will keep the first one ([0]) and merge others into it.
    const primary = russells[0];
    const duplicates = russells.slice(1);

    console.log(`-> Keep: ${primary.id} (${primary.shopifyCustomerId})`);

    // 3. Merge
    let movedOrders = 0;
    let totalSpent = Number(primary.totalSpent);

    for (const dup of duplicates) {
        console.log(`   -> Merging ${dup.id} (${dup.shopifyCustomerId})...`);

        // Move Orders
        const updateResult = await prisma.order.updateMany({
            where: { customerId: dup.id },
            data: { customerId: primary.id }
        });
        movedOrders += updateResult.count;

        // Add Spent Amount
        totalSpent += Number(dup.totalSpent);

        // Delete Duplicate
        await prisma.customer.delete({ where: { id: dup.id } });
    }

    // 4. Update Primary Totals
    await prisma.customer.update({
        where: { id: primary.id },
        data: {
            totalSpent: totalSpent
        }
    });

    console.log(`✅ Merge Complete.`);
    console.log(`- Combined ${movedOrders} orders.`);
    console.log(`- New Total Spent: ${totalSpent}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

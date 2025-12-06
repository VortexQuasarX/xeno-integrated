const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Deduplicating Customers (Cleaning up Old Store Data)...');

    // 1. Fetch all customers
    const customers = await prisma.customer.findMany({
        orderBy: { updatedAt: 'desc' }
    });

    console.log(`Found ${customers.length} total customers.`);

    // 2. Group by normalized email
    const groups = {};
    for (const c of customers) {
        if (!c.email) continue;
        const key = c.email.toLowerCase().trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
    }

    let deletedCount = 0;

    // 3. Process duplicates
    for (const email in groups) {
        const group = groups[email];
        // If only 1, it's fine.
        if (group.length < 2) continue;

        console.log(`\nProcessing duplicate group: "${email}" (${group.length})`);

        // Sort by updatedAt DESC (Keep the one we just synced)
        // Since we fetched with orderBy, they should be sorted, but let's be sure.
        group.sort((a, b) => b.updatedAt - a.updatedAt);

        const keep = group[0];
        const remove = group.slice(1);

        console.log(`   ✅ Keeping: ${keep.firstName} ${keep.lastName} (ID: ${keep.id}, Updated: ${keep.updatedAt.toISOString()})`);

        for (const bad of remove) {
            console.log(`   ❌ Deleting: ${bad.firstName} ${bad.lastName} (ID: ${bad.id}, Updated: ${bad.updatedAt.toISOString()})`);

            // CLEANUP SEQUENCE to avoid ForeignKey Constraints
            // 1. Find Orders
            const orders = await prisma.order.findMany({ where: { customerId: bad.id } });

            for (const order of orders) {
                // 2. Delete OrderItems
                await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
                // 3. Delete Order
                await prisma.order.delete({ where: { id: order.id } });
            }
            console.log(`      ↳ Deleted ${orders.length} related orders.`);

            // 4. Delete Customer
            await prisma.customer.delete({ where: { id: bad.id } });
            deletedCount++;
        }
    }

    console.log(`\n✅ Cleanup Complete. Removed ${deletedCount} stale customer records.`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

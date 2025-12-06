const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Smart Deduplication of Products...');

    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
    });

    // Group by Title
    const groups = {};

    for (const p of products) {
        if (!groups[p.title]) groups[p.title] = [];
        groups[p.title].push(p);
    }

    for (const title in groups) {
        const group = groups[title];
        if (group.length < 2) continue;

        console.log(`Processing duplicate group: "${title}" (${group.length})`);

        // Count items for each
        const withCounts = [];
        for (const p of group) {
            const count = await prisma.orderItem.count({ where: { productId: p.id } });
            withCounts.push({ product: p, count });
        }

        // Sort: Most items first, then Newest
        withCounts.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count; // Higher count first
            return new Date(b.product.createdAt) - new Date(a.product.createdAt); // Newest first
        });

        // Keep [0], Delete rest
        const keep = withCounts[0];
        const remove = withCounts.slice(1);

        console.log(`   -> Keeping: ${keep.product.id} (Items: ${keep.count})`);

        for (const item of remove) {
            console.log(`   -> Deleting: ${item.product.id} (Items: ${item.count})`);

            // Reassign items if needed
            if (item.count > 0) {
                console.log(`      ↳ Reassigning ${item.count} items to ${keep.product.id}`);
                await prisma.orderItem.updateMany({
                    where: { productId: item.product.id },
                    data: { productId: keep.product.id }
                });
            }

            await prisma.product.delete({ where: { id: item.product.id } });
        }
    }

    console.log('✅ Smart Deduplication done.');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

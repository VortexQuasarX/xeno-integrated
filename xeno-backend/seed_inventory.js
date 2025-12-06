const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInventory() {
    console.log('📦 Seeding inventory for products...');

    try {
        const products = await prisma.product.findMany();
        console.log(`Found ${products.length} products.`);

        for (const product of products) {
            const randomInventory = Math.floor(Math.random() * 90) + 10; // 10 to 100
            await prisma.product.update({
                where: { id: product.id },
                data: { inventory: randomInventory }
            });
            console.log(`   Updated ${product.title}: ${randomInventory} in stock`);
        }

        console.log('✅ Inventory seeding complete.');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedInventory();

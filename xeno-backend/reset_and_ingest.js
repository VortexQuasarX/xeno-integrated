const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Clearing all data for demo user to ensure PURE API data...');

    // Get demo user
    const user = await prisma.user.findUnique({ where: { email: 'demo@xeno.com' } });
    if (!user) throw new Error('User not found');

    const tenantId = user.tenantId;

    // Delete existing data
    await prisma.orderItem.deleteMany({ where: { order: { tenantId } } });
    await prisma.order.deleteMany({ where: { tenantId } });
    await prisma.product.deleteMany({ where: { tenantId } });
    await prisma.customer.deleteMany({ where: { tenantId } });
    await prisma.event.deleteMany({ where: { tenantId } });

    console.log('✅ Data cleared. Starting fresh ingestion...');

    // Run ingestion script
    require('./ingest_from_shopify');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

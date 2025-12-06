const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_1_DOMAIN = 'xeno-demo-2028.myshopify.com';
const TENANT_2_DOMAIN = 'xeno-demo-2029.myshopify.com';

async function main() {
    console.log('🚀 Starting Consolidation to Single Admin Tenant (Tenant 2)...');

    // 1. Find Tenants
    const tenant1 = await prisma.tenant.findUnique({ where: { shopifyDomain: TENANT_1_DOMAIN } });
    const tenant2 = await prisma.tenant.findUnique({ where: { shopifyDomain: TENANT_2_DOMAIN } });

    if (!tenant2) {
        console.error('❌ Tenant 2 (Admin) not found! Cannot proceed.');
        process.exit(1);
    }
    console.log(`✅ Identified Admin Tenant (Tenant 2): ${tenant2.id}`);

    if (!tenant1) {
        console.log('⚠️ Tenant 1 not found. Already consolidated?');
    } else {
        console.log(`✅ Identified Tenant 1 to remove: ${tenant1.id}`);

        // 2. Migrate User(s)
        const user1 = await prisma.user.findUnique({ where: { email: 'demo@xeno.com' } });
        if (user1) {
            console.log('🔄 Migrating User "demo@xeno.com" to Admin Tenant...');
            await prisma.user.update({
                where: { email: 'demo@xeno.com' },
                data: { tenantId: tenant2.id } // Point to Tenant 2
            });
            console.log('✅ User migrated.');
        }

        // 3. Delete Data for Tenant 1 (Manual Cascade)
        console.log('🗑️ Deleting Tenant 1 Data...');

        // Delete Order Items (via Orders)
        const orders = await prisma.order.findMany({ where: { tenantId: tenant1.id } });
        for (const order of orders) {
            await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        }
        await prisma.order.deleteMany({ where: { tenantId: tenant1.id } });
        console.log('   - Orders deleted');

        // Delete Inventory & Locations
        await prisma.inventoryLevel.deleteMany({ where: { tenantId: tenant1.id } });
        await prisma.location.deleteMany({ where: { tenantId: tenant1.id } });
        console.log('   - Inventory deleted');

        // Delete Products
        await prisma.product.deleteMany({ where: { tenantId: tenant1.id } });
        console.log('   - Products deleted');

        // Delete Customers
        await prisma.customer.deleteMany({ where: { tenantId: tenant1.id } });
        console.log('   - Customers deleted');

        // Delete Events
        await prisma.event.deleteMany({ where: { tenantId: tenant1.id } });

        // 4. Delete Tenant 1
        await prisma.tenant.delete({ where: { id: tenant1.id } });
        console.log('✅ Tenant 1 Deleted.');
    }

    console.log('\n🎉 Consolidation Complete. All users now point to Tenant 2.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

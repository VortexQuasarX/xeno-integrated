const cron = require('node-cron');
const prisma = require('../lib/prisma');
const ShopifyService = require('./shopifyService');

const startScheduler = () => {
    // Schedule: Run every 15 minutes
    // This (*/15 * * * *) ensures data is synced frequently
    cron.schedule('*/15 * * * *', async () => {
        console.log('⏰ Running Scheduled 15-Minute Data Sync...');
        try {
            const tenants = await prisma.tenant.findMany({ where: { isActive: true } });

            for (const tenant of tenants) {
                console.log(`Syncing data for tenant: ${tenant.name}`);
                const shopifyService = new ShopifyService(tenant);

                await shopifyService.syncCustomers();
                await shopifyService.syncProducts();
                await shopifyService.syncOrders();
            }
            console.log('✅ Scheduled sync completed.');
        } catch (error) {
            console.error('❌ Scheduled sync error:', error);
        }
    });

    console.log('Scheduler started: Data sync every 15 minutes.');
};

module.exports = startScheduler;

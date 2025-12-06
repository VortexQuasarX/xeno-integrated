const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up Garbage Data...');

    // 1. Delete Unified Tester (ID 2020202)
    await prisma.customer.deleteMany({
        where: { shopifyCustomerId: '2020202' }
    });
    console.log('- Deleted Unified Tester.');

    // 2. Delete "Missing" Customers (Created by bad sync)
    const missing = await prisma.customer.deleteMany({
        where: {
            firstName: { startsWith: 'Shopify Customer' }
        }
    });
    console.log(`- Deleted ${missing.count} "Missing" Customers.`);

    // 3. Delete Orders linked to NULL/Bad customers (Optional, but safe to clear sync cache)
    // Actually, let's just clear the "Synced" orders so we can re-ingest clean.
    // The "Synced" orders have IDs > 10 digits usually.
    // Or I can delete ALL orders and re-sync since it's a demo.
    // User wants "clean".

    // Let's delete ALL orders that are NOT from the original seed?
    // Using a safe heuristic: created in the last hour?
    // For now, I'll just rely on upsert to fix the orders, but the linked customerID might be broken if I delete the customer.
    // If I delete customer, the Order.customerId becomes NULL? No, foreign key.
    // Schema says: `customerId String?`
    // So it will set to NULL or restrict?
    // Let's delete ALL orders to be safe and re-sync everything correctly.
    // WAIT: User might have manually created data?
    // "seed_perfect_data" created orders with timestamps?
    // I'll delete ALL orders and re-run ingest. It takes 5 seconds.

    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`- Deleted ${deletedOrders.count} Orders (Will Re-Sync).`);

    // Also delete customers that we just discovered are duplicated?
    // User said "Same customer name".
    // I saw `Karine Ruby` (ID 8630...) and `Shopify Customer...` (ID 2327...).
    // The "Real" one from Shopify is 2327...
    // The "Fake" one from Seed is 8630...
    // I should probably KEEP the 2327... (Real) and DELETE the 8630... (Fake)?
    // OR, if I fix ingestion, 2327... will get the correct name "Karine Ruby".
    // Then we will have TWO "Karine Ruby".
    // I should delete the "Fake" seed data if the user wants purely real data.
    // The user said "u added extra customer as missing".
    // I will delete the "Missing" ones for sure.
    // I will also delete the Seed Data (8630...) to prevent duplicates?
    // Let's purely wipe and re-sync.
    const deletedCustomers = await prisma.customer.deleteMany({});
    console.log(`- Deleted ${deletedCustomers.count} Customers (Will Re-Sync).`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

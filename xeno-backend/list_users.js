const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching users...');
    const users = await prisma.user.findMany({
        include: { tenant: true }
    });

    console.log('\n--- REGISTERED USERS ---');
    users.forEach(u => {
        console.log(`Email: ${u.email}`);
        console.log(`Tenant: ${u.tenant.name} (${u.tenant.shopifyDomain})`);
        console.log('-------------------------');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'demo@xeno.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { shopifyDomain: 'xeno-demo.myshopify.com' },
        update: {},
        create: {
            name: 'Xeno Demo Store',
            shopifyDomain: 'xeno-demo.myshopify.com',
            isActive: true,
        },
    });

    // Create User
    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash: hashedPassword },
        create: {
            email,
            passwordHash: hashedPassword,
            firstName: 'Demo',
            lastName: 'User',
            role: 'ADMIN',
            tenantId: tenant.id,
        },
    });

    console.log(`Seeding finished. User created: ${user.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

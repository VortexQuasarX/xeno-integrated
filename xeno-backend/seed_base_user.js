const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('🌱 Seeding Base User...');

        // 1. Create Tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: 'Test Store 614',
                shopifyDomain: 'xeno-demo-2028.myshopify.com',
                accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
                apiKey: process.env.SHOPIFY_API_KEY,
                apiSecret: process.env.SHOPIFY_API_SECRET
            }
        });
        console.log('✅ Tenant Created:', tenant.id);

        // 2. Create User
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
            data: {
                email: 'test_user_614@example.com',
                firstName: 'Test',
                lastName: 'User',
                passwordHash: hashedPassword,
                tenantId: tenant.id
            }
        });
        console.log('✅ User Created:', user.email);

    } catch (e) {
        console.error('❌ Seeding Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();

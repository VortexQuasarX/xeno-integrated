const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.update({
        where: { email: 'visva.r2004@gmail.com' },
        data: {
            firstName: 'Visva',
            lastName: 'R'
        }
    });
    console.log('Updated User:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

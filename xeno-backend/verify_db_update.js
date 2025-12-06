const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { id: '6e723a0b-93a3-472c-bb6d-a2f0c6700724' },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
        }
    });
    console.log('Database Record:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

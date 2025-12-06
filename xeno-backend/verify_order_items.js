const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const latestOrder = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            orderItems: {
                include: { product: true }
            },
            customer: true
        }
    });

    if (!latestOrder) {
        console.log('No orders found.');
        return;
    }

    console.log(`--- Latest Order: ${latestOrder.id} ---`);
    console.log(`Total: $${latestOrder.totalPrice}`);
    console.log(`Customer: ${latestOrder.customer.firstName} ${latestOrder.customer.lastName}`);
    console.log(`Items: ${latestOrder.orderItems.length}`);

    latestOrder.orderItems.forEach(item => {
        console.log(` - ${item.product.title} (Qty: ${item.quantity}) @ $${item.price}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

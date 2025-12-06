const prisma = require('../lib/prisma');

class IngestionService {

    /**
     * Upsert a Customer
     */
    async upsertCustomer(tenantId, data) {
        // Handle "missing" data gracefully (Shopify redaction or bad payload)
        // Handle "missing" data gracefully (Shopify redaction or bad payload)
        // Check both snake_case (Shopify API) and camelCase (Internal/Frontend)
        const email = data.email || data.contact_email || `missing_${data.id}@example.com`;
        const firstName = data.first_name || data.firstName || 'Shopify';
        const lastName = data.last_name || data.lastName || `Customer ${data.id.toString().slice(-4)}`;

        return await prisma.customer.upsert({
            where: {
                tenantId_shopifyCustomerId: {
                    tenantId: tenantId,
                    shopifyCustomerId: String(data.id),
                },
            },
            update: {
                email,
                firstName,
                lastName,
                totalSpent: data.total_spent,
                currency: data.currency,
                updatedAt: new Date(),
            },
            create: {
                tenantId,
                shopifyCustomerId: String(data.id),
                email,
                firstName,
                lastName,
                totalSpent: data.total_spent,
                currency: data.currency,
            },
        });
    }

    /**
     * Upsert a Product
     */
    async upsertProduct(tenantId, data) {
        // Calculate total inventory from variants if available
        let inventory = 0;
        let price = 0;

        if (data.variants && data.variants.length > 0) {
            price = data.variants[0].price;
            inventory = data.variants.reduce((acc, v) => acc + (v.inventory_quantity || 0), 0);
        }

        const images = data.images ? JSON.stringify(data.images.map(img => img.src)) : null;

        return await prisma.product.upsert({
            where: {
                tenantId_shopifyProductId: {
                    tenantId: tenantId,
                    shopifyProductId: String(data.id),
                },
            },
            update: {
                title: data.title,
                price: price || 0,
                inventory,
                images,
                updatedAt: new Date(),
            },
            create: {
                tenantId,
                shopifyProductId: String(data.id),
                title: data.title,
                price: price || 0,
                inventory,
                images
            },
        });
    }

    /**
     * Upsert an Order (and its Items)
     */
    async upsertOrder(tenantId, data) {
        // 1. Ensure Customer exists (if provided)
        let customerId = null;
        if (data.customer) {
            const customer = await this.upsertCustomer(tenantId, data.customer);
            customerId = customer.id;
        }

        // 2. Upsert the Order
        const order = await prisma.order.upsert({
            where: {
                tenantId_shopifyOrderId: {
                    tenantId: tenantId,
                    shopifyOrderId: String(data.id),
                },
            },
            update: {
                totalPrice: data.total_price,
                orderDate: new Date(data.created_at),
                status: data.financial_status || 'pending',
                financialStatus: data.financial_status,
                fulfillmentStatus: data.fulfillment_status,
                tags: data.tags,
                customerId,
                updatedAt: new Date(),
            },
            create: {
                tenantId,
                shopifyOrderId: String(data.id),
                totalPrice: data.total_price,
                orderDate: new Date(data.created_at),
                status: data.financial_status || 'pending',
                financialStatus: data.financial_status,
                fulfillmentStatus: data.fulfillment_status,
                tags: data.tags,
                customerId,
            },
        });

        // 3. Handle Line Items (Robust Sync)
        // Only if we have line_items data
        if (data.line_items && data.line_items.length > 0) {
            // Optional: Clear existing items to avoid duplicates on update?
            // For now, we will just create if not exists, but OrderItem doesn't have unique constraint on line_item_id in our schema.
            // Strategy: Delete all for this order and recreate. Safest for sync.
            await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

            for (const item of data.line_items) {
                if (!item.product_id) continue;

                // Try to find the product in our DB
                const product = await prisma.product.findFirst({
                    where: { tenantId: tenantId, shopifyProductId: String(item.product_id) }
                });

                // Create OrderItem even if product missing? Maybe just title.
                // Schema requires `quantity`, `price`. `productId` is optional relation?
                // Checking schema: `productId String?`, `product Product?`. So we can store even if product missing locally.

                await prisma.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: product ? product.id : null,
                        title: item.title || 'Unknown Item',
                        quantity: item.quantity,
                        price: item.price
                    }
                });
            }
        }

        // 4. Update Customer Total Spent (Recalculate locally to ensure data integrity)
        if (customerId) {
            await this.recalcCustomerTotal(customerId);
        }

        return order;
    }

    /**
     * Recalculate Total Spent for a Customer
     */
    async recalcCustomerTotal(customerId) {
        try {
            const aggregates = await prisma.order.aggregate({
                _sum: { totalPrice: true },
                where: {
                    customerId: customerId,
                    status: { in: ['paid', 'partially_paid'] } // Only count paid
                }
            });

            const total = aggregates._sum.totalPrice || 0;

            await prisma.customer.update({
                where: { id: customerId },
                data: { totalSpent: total }
            });
            console.log(`   -> Recalculated Customer ${customerId} Total: ${total}`);
        } catch (e) {
            console.error('Error recalculating total:', e);
        }
    }
}

module.exports = new IngestionService();

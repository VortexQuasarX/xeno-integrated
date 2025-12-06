const axios = require('axios');
const prisma = require('../lib/prisma');

class ShopifyService {
    constructor(tenant) {
        this.tenant = tenant;
        this.baseUrl = `https://${tenant.shopifyDomain}/admin/api/2024-10`;
        this.headers = {
            'X-Shopify-Access-Token': tenant.accessToken,
            'Content-Type': 'application/json',
        };
    }

    async syncCustomers() {
        try {
            let url = `${this.baseUrl}/customers.json?limit=250`;
            while (url) {
                const response = await axios.get(url, { headers: this.headers });
                const customers = response.data.customers;

                for (const customer of customers) {
                    await prisma.customer.upsert({
                        where: {
                            tenantId_shopifyCustomerId: {
                                tenantId: this.tenant.id,
                                shopifyCustomerId: String(customer.id),
                            },
                        },
                        update: {
                            email: customer.email,
                            firstName: customer.first_name,
                            lastName: customer.last_name,
                            totalSpent: customer.total_spent,
                            updatedAt: new Date(),
                        },
                        create: {
                            tenantId: this.tenant.id,
                            shopifyCustomerId: String(customer.id),
                            email: customer.email,
                            firstName: customer.first_name,
                            lastName: customer.last_name,
                            totalSpent: customer.total_spent,
                        },
                    });
                }

                // Pagination (Link header)
                const linkHeader = response.headers.link;
                if (linkHeader && linkHeader.includes('rel="next"')) {
                    const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                    url = match ? match[1] : null;
                } else {
                    url = null;
                }
            }
            console.log(`Synced customers for tenant ${this.tenant.name}`);
        } catch (error) {
            console.error(`Error syncing customers for tenant ${this.tenant.name}:`, error.message);
        }
    }

    async syncProducts() {
        try {
            let url = `${this.baseUrl}/products.json?limit=250`;
            while (url) {
                const response = await axios.get(url, { headers: this.headers });
                const products = response.data.products;

                for (const product of products) {
                    await prisma.product.upsert({
                        where: {
                            tenantId_shopifyProductId: {
                                tenantId: this.tenant.id,
                                shopifyProductId: String(product.id),
                            },
                        },
                        update: {
                            title: product.title,
                            price: product.variants[0]?.price || 0, // Simplified: taking first variant price
                            updatedAt: new Date(),
                        },
                        create: {
                            tenantId: this.tenant.id,
                            shopifyProductId: String(product.id),
                            title: product.title,
                            price: product.variants[0]?.price || 0,
                        },
                    });
                }

                const linkHeader = response.headers.link;
                if (linkHeader && linkHeader.includes('rel="next"')) {
                    const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                    url = match ? match[1] : null;
                } else {
                    url = null;
                }
            }
            console.log(`Synced products for tenant ${this.tenant.name}`);
        } catch (error) {
            console.error(`Error syncing products for tenant ${this.tenant.name}:`, error.message);
        }
    }

    async syncOrders() {
        try {
            let url = `${this.baseUrl}/orders.json?status=any&limit=250`;
            while (url) {
                const response = await axios.get(url, { headers: this.headers });
                const orders = response.data.orders;

                for (const order of orders) {
                    let customerId = null;
                    if (order.customer) {
                        const customer = await prisma.customer.findUnique({
                            where: {
                                tenantId_shopifyCustomerId: {
                                    tenantId: this.tenant.id,
                                    shopifyCustomerId: String(order.customer.id),
                                },
                            },
                        });
                        if (customer) customerId = customer.id;
                    }

                    const savedOrder = await prisma.order.upsert({
                        where: {
                            tenantId_shopifyOrderId: {
                                tenantId: this.tenant.id,
                                shopifyOrderId: String(order.id),
                            },
                        },
                        update: {
                            totalPrice: order.total_price,
                            orderDate: new Date(order.created_at),
                            customerId: customerId,
                            updatedAt: new Date(),
                        },
                        create: {
                            tenantId: this.tenant.id,
                            shopifyOrderId: String(order.id),
                            totalPrice: order.total_price,
                            orderDate: new Date(order.created_at),
                            customerId: customerId,
                        },
                    });

                    // Sync Order Items
                    // Note: This is a simplification. Ideally we should sync line items properly.
                    // For now, we just ensure the order exists.
                }

                const linkHeader = response.headers.link;
                if (linkHeader && linkHeader.includes('rel="next"')) {
                    const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                    url = match ? match[1] : null;
                } else {
                    url = null;
                }
            }
            console.log(`Synced orders for tenant ${this.tenant.name}`);
        } catch (error) {
            console.error(`Error syncing orders for tenant ${this.tenant.name}:`, error.message);
        }
    }
}

module.exports = ShopifyService;

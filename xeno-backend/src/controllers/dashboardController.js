const prisma = require('../lib/prisma');
const { syncTenant } = require('../services/syncService');

const getOverview = async (req, res) => {
    try {
        const tenantId = req.tenantId;

        const totalCustomers = await prisma.customer.count({
            where: { tenantId },
        });

        // Mock Data for Demo User
        if (req.user && req.user.id === 'demo-user-id') {
            return res.status(200).json({
                totalCustomers: 124,
                totalOrders: 45,
                totalRevenue: 15430.50,
            });
        }

        const totalOrders = await prisma.order.count({
            where: { tenantId },
        });

        const revenueResult = await prisma.order.aggregate({
            where: { tenantId },
            _sum: { totalPrice: true },
        });

        const totalRevenue = Number(revenueResult._sum.totalPrice) || 0;

        res.status(200).json({
            totalCustomers,
            totalOrders,
            totalRevenue,
        });
    } catch (error) {
        console.error('Dashboard Overview Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProducts = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const products = await prisma.product.findMany({
            where: { tenantId },
            orderBy: { title: 'asc' },
        });

        const formattedProducts = products.map(p => {
            let images = [];
            try {
                images = JSON.parse(p.images || '[]');
            } catch (e) {
                images = [];
            }

            return {
                id: p.id,
                title: p.title,
                price: Number(p.price),
                inventory: p.inventory,
                status: p.inventory > 0 ? 'Active' : 'Out of Stock',
                image: images[0] || null, // First image
                vendor: p.vendor,
                productType: p.productType
            };
        });

        res.status(200).json(formattedProducts);
    } catch (error) {
        console.error('Dashboard Products Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProductDetails = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;

        const product = await prisma.product.findFirst({
            where: { id, tenantId },
            include: {
                orderItems: {
                    include: {
                        order: {
                            include: {
                                customer: true
                            }
                        }
                    },
                    orderBy: {
                        order: {
                            orderDate: 'desc'
                        }
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Calculate total sold
        const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);

        // Format response
        const response = {
            id: product.id,
            title: product.title,
            price: Number(product.price),
            inventory: product.inventory,
            totalSold,
            orders: product.orderItems.map(item => ({
                orderId: item.order.shopifyOrderId,
                orderDate: item.order.orderDate,
                customerName: item.order.customer ? `${item.order.customer.firstName} ${item.order.customer.lastName}` : 'Unknown',
                quantity: item.quantity,
                totalPrice: Number(item.price) * item.quantity // Item price * quantity
            }))
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Product Details Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTopCustomers = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const customers = await prisma.customer.findMany({
            where: { tenantId },
            orderBy: { totalSpent: 'desc' },
            take: 5
        });
        res.json(customers);
    } catch (error) {
        console.error('Get Top Customers Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRevenueTrend = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { startDate, endDate } = req.query;

        // Mock Data for Demo User
        if (req.user && req.user.id === 'demo-user-id') {
            const mockTrend = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                mockTrend.push({
                    date: d.toISOString().split('T')[0],
                    revenue: Math.floor(Math.random() * 2000) + 500
                });
            }
            return res.json(mockTrend);
        }

        const where = { tenantId };
        if (startDate && endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            where.orderDate = {
                gte: new Date(startDate),
                lte: end
            };
        }

        const orders = await prisma.order.findMany({
            where,
            orderBy: { orderDate: 'asc' }
        });

        const isSingleDay = startDate && endDate && startDate === endDate;

        // Simple aggregation
        const trendMap = {};

        if (isSingleDay) {
            // Initialize all 24 hours with 0
            for (let i = 0; i < 24; i++) {
                const hour = i.toString().padStart(2, '0') + ':00';
                trendMap[hour] = 0;
            }

            orders.forEach(order => {
                const d = new Date(order.orderDate);
                const hour = d.getHours().toString().padStart(2, '0') + ':00';
                trendMap[hour] = (trendMap[hour] || 0) + Number(order.totalPrice);
            });
        } else {
            orders.forEach(order => {
                const date = new Date(order.orderDate).toISOString().split('T')[0];
                trendMap[date] = (trendMap[date] || 0) + Number(order.totalPrice);
            });
        }

        const trend = Object.keys(trendMap).map(key => ({
            date: key,
            revenue: trendMap[key]
        }));

        res.json(trend);
    } catch (error) {
        console.error('Get Revenue Trend Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRecentEvents = async (req, res) => {
    try {
        const tenantId = req.tenantId;

        // 1. Fetch recent Orders
        const recentOrders = await prisma.order.findMany({
            where: { tenantId },
            include: { customer: true },
            orderBy: { orderDate: 'desc' },
            take: 5
        });

        // 2. Fetch recent Customers
        const recentCustomers = await prisma.customer.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // 3. Combine and Format
        const activities = [
            ...recentOrders.map(o => ({
                id: `order_${o.id}`,
                type: 'ORDER_PLACED',
                message: `Order #${o.shopifyOrderId} placed by ${o.customer ? o.customer.firstName : 'Guest'}`,
                amount: Number(o.totalPrice),
                date: o.orderDate
            })),
            ...recentCustomers.map(c => ({
                id: `cust_${c.id}`,
                type: 'NEW_CUSTOMER',
                message: `New customer joined: ${c.firstName} ${c.lastName}`,
                amount: null,
                date: c.createdAt
            }))
        ];

        // 4. Sort by Date Descending
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 5. take top 10
        res.json(activities.slice(0, 10));

    } catch (error) {
        console.error('Get Recent Events Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllCustomers = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const customers = await prisma.customer.findMany({
            where: { tenantId },
            include: {
                orders: {
                    include: {
                        orderItems: true
                    },
                    orderBy: { orderDate: 'desc' }
                }
            },
            orderBy: { totalSpent: 'desc' }
        });

        const russell = customers.find(c => c.firstName === 'Russell');
        if (russell) {
            console.log('API RESPONSE DEBUG: Russell Orders:', russell.orders ? russell.orders.length : 'MISSING');
        } else {
            console.log('API RESPONSE DEBUG: Russell NOT FOUND');
        }

        res.json(customers);
    } catch (error) {
        console.error('Get All Customers Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrders = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { startDate, endDate } = req.query;

        const where = { tenantId };

        if (startDate && endDate && startDate !== 'undefined' && startDate !== '') {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            where.orderDate = {
                gte: new Date(startDate),
                lte: end
            };
        }

        // Fetch confirmed orders
        const orders = await prisma.order.findMany({
            where,
            include: { customer: true, orderItems: { include: { product: true } } },
            orderBy: { orderDate: 'desc' }
        });

        res.json(orders);
    } catch (error) {
        console.error('Get Orders Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



const triggerSync = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const result = await syncTenant(user.tenantId);

        res.json({ message: result.message });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
};

const getNotifications = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        // Interpret "Notifications" as the 5 most recent orders
        const recentOrders = await prisma.order.findMany({
            where: { tenantId },
            include: { customer: true },
            orderBy: { orderDate: 'desc' },
            take: 5
        });

        const notifications = recentOrders.map(order => ({
            id: order.id,
            title: 'New Order Received',
            message: `Order #${order.shopifyOrderId} from ${order.customer ? order.customer.firstName : 'Guest'} - $${Number(order.totalPrice).toFixed(2)}`,
            time: order.orderDate, // Frontend can format this relative time
            read: false, // Dummy read status
            type: 'order'
        }));

        res.json(notifications);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getOverview,
    getTopCustomers,
    getRevenueTrend,
    getRecentEvents,
    getOrders,
    getProducts,
    getAllCustomers,
    getProductDetails,
    triggerSync,
    getNotifications
};

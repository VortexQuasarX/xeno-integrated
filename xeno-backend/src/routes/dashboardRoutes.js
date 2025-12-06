const express = require('express');
const {
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
} = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/sync', triggerSync);

router.get('/overview', getOverview);
router.get('/customers/top', getTopCustomers);
router.get('/customers', getAllCustomers);
router.get('/revenue-trend', getRevenueTrend);
router.get('/events', getRecentEvents);
router.get('/orders', getOrders);
router.get('/products', getProducts);
router.get('/notifications', getNotifications);

module.exports = router;

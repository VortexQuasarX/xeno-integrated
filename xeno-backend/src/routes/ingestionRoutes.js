const express = require('express');
const {
    handleShopifyProductCreate,
    handleShopifyCustomerCreate,
    handleShopifyOrderCreate
} = require('../controllers/webhookController');

const router = express.Router();

router.get('/test', (req, res) => res.send('Ingestion Route Working'));

router.post('/products/create', handleShopifyProductCreate);
router.post('/customers/create', handleShopifyCustomerCreate);
router.post('/orders/create', handleShopifyOrderCreate);

module.exports = router;

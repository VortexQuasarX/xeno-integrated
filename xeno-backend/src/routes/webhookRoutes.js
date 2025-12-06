const express = require('express');
const {
    verifyWebhook,
    handleWebhook
} = require('../controllers/webhookController');

const router = express.Router();

router.get('/test', (req, res) => res.send('Webhook Route Working'));

// Apply Verification Middleware to ALL webhook POSTs
router.post('/shopify/products/create', verifyWebhook, handleWebhook);
router.post('/shopify/products/update', verifyWebhook, handleWebhook);

router.post('/shopify/customers/create', verifyWebhook, handleWebhook);
router.post('/shopify/customers/update', verifyWebhook, handleWebhook);

router.post('/shopify/orders/create', verifyWebhook, handleWebhook);
router.post('/shopify/orders/update', verifyWebhook, handleWebhook);

// Generic catch-all handler (Optional, if you configure Shopify to send all here)
router.post('/generic', verifyWebhook, handleWebhook);

module.exports = router;

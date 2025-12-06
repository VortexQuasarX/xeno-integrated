const ingestionQueue = require('../services/ingestionQueue');
const { verifyShopifyHmac } = require('../utils/shopifySignature');

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

// In-memory cache for recent Event IDs to prevent immediate replay attacks/duplicates
// In production, use Redis with TTL.
const processedEvents = new Set();

const verifyWebhook = (req, res, next) => {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const eventId = req.headers['x-shopify-event-id'];

    if (!hmac || !shopDomain) {
        return res.status(401).send('Missing webhook headers');
    }

    // 1. Verify HMAC
    // Check if SHOPIFY_API_SECRET is set (skip if testing locally without it, but warn)
    if (SHOPIFY_API_SECRET) {
        const isValid = verifyShopifyHmac(req.rawBody, hmac, SHOPIFY_API_SECRET);
        if (!isValid) {
            console.error('❌ Invalid Webhook HMAC');
            return res.status(401).send('Invalid signature');
        }
    } else {
        console.warn('⚠️ SHOPIFY_API_SECRET not set. Skipping HMAC verification (Unsafe for production).');
    }

    // 2. Duplicate Check
    if (processedEvents.has(eventId)) {
        console.log(`⚠️ Duplicate Webhook Event ID: ${eventId}, skipping.`);
        return res.status(200).send('Duplicate event');
    }

    // Add to cache and clear after 1 minute
    if (eventId) {
        processedEvents.add(eventId);
        setTimeout(() => processedEvents.delete(eventId), 60000);
    }

    next();
};

const handleWebhook = (req, res) => {
    const topic = req.headers['x-shopify-topic'];
    const shopDomain = req.headers['x-shopify-shop-domain'];

    console.log(`🔔 Received Webhook: ${topic} for ${shopDomain}`);

    // Push to Async Queue
    ingestionQueue.add({
        type: 'WEBHOOK_EVENT',
        topic: topic,
        shopDomain: shopDomain,
        payload: req.body
    });

    res.status(200).send('Webhook acknowledged');
};

module.exports = {
    // Export middleware + handler
    verifyWebhook,
    handleWebhook,

    // Maintain old exports for route compatibility if strictly needed, 
    // but better to update routes.js to use generic handler.
    handleShopifyProductCreate: handleWebhook,
    handleShopifyCustomerCreate: handleWebhook,
    handleShopifyOrderCreate: handleWebhook,
    handleGenericWebhook: handleWebhook
};

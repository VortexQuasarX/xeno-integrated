const crypto = require('crypto');

/**
 * Verifies the Shopify Webhook HMAC signature.
 * @param {string} rawBody - The raw body of the request (must be buffer or string, not parsed JSON).
 * @param {string} hmacHeader - The X-Shopify-Hmac-Sha256 header.
 * @param {string} apiSecret - The Shopify Client Secret.
 * @returns {boolean} isValid
 */
function verifyShopifyHmac(rawBody, hmacHeader, apiSecret) {
    if (!hmacHeader || !apiSecret) return false;

    // Shopify HMAC is calculated using SHA256
    const hash = crypto
        .createHmac('sha256', apiSecret)
        .update(rawBody, 'utf8')
        .digest('base64');

    return hash === hmacHeader;
}

module.exports = { verifyShopifyHmac };

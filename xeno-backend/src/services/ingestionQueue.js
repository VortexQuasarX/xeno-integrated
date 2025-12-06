const prisma = require('../lib/prisma');
const ingestionService = require('./ingestionService');

// Simple in-memory queue implementation
// In production, this would be replaced by Redis (BullMQ) or RabbitMQ
class IngestionQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    add(job) {
        console.log(`[Queue] Job added: ${job.type}`);
        this.queue.push(job);
        this.processNext();
    }

    async processNext() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const job = this.queue.shift();

        try {
            await this.processJob(job);
        } catch (error) {
            console.error(`[Queue] Job failed: ${job.type}`, error);
            // In a real system, we would retry or move to a dead-letter queue
        } finally {
            this.isProcessing = false;
            // Process next job immediately if any
            if (this.queue.length > 0) {
                this.processNext();
            }
        }
    }

    async processJob(job) {
        const { topic, shopDomain, payload } = job;
        console.log(`[Queue] Processing ${topic} for ${shopDomain}`);

        // Find tenant
        const tenant = await prisma.tenant.findUnique({
            where: { shopifyDomain: shopDomain },
        });

        if (!tenant) {
            console.error(`[Queue] Tenant not found for domain: ${shopDomain}`);
            return;
        }

        switch (topic) {
            // ... (Queue implementation)

            case 'customers/create':
            case 'customers/update':
                await ingestionService.upsertCustomer(tenant.id, payload);
                break;

            case 'products/create':
            case 'products/update':
                await ingestionService.upsertProduct(tenant.id, payload);
                break;

            case 'orders/create':
            case 'orders/update':
                await ingestionService.upsertOrder(tenant.id, payload);
                break;

            case 'checkouts/create':
            case 'checkouts/update':
                await prisma.event.create({
                    data: {
                        tenantId: tenant.id,
                        type: 'CHECKOUT_STARTED',
                        payload: JSON.stringify(payload),
                    },
                });
                break;

            default:
                await prisma.event.create({
                    data: {
                        tenantId: tenant.id,
                        type: topic || 'UNKNOWN',
                        payload: JSON.stringify(payload),
                    },
                });
                break;
        }
        console.log(`[Queue] Job completed: ${topic}`);
    }
}

const ingestionQueue = new IngestionQueue();
module.exports = ingestionQueue;

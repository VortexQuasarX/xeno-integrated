const { getRevenueTrend } = require('./src/controllers/dashboardController');
const prisma = require('./src/lib/prisma');

// Mock Request/Response
const req = {
    tenantId: 'tenant_123', // Adjust to match your seed data tenant
    query: {
        startDate: '2025-12-06',
        endDate: '2025-12-06'
    }
};

const res = {
    json: (data) => {
        console.log('--- API Response ---');
        console.log(JSON.stringify(data, null, 2));
    },
    status: (code) => ({
        json: (data) => console.log(`Status ${code}:`, data)
    })
};

// We need a real tenantId. Let's find one first.
async function run() {
    try {
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.log('No tenant found');
            return;
        }
        console.log('Using Tenant:', tenant.id);
        req.tenantId = tenant.id;

        // Force a date that matches today's or the seed data's date
        // If seed data is old, we might see all zeros, but STRUCTURE is what matters.
        const today = new Date().toISOString().split('T')[0];
        req.query.startDate = today;
        req.query.endDate = today;
        console.log('Querying for:', req.query);

        await getRevenueTrend(req, res);
    } catch (e) {
        console.error(e);
    }
}

run();

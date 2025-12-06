const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const fs = require('fs');
const path = require('path');

// Vercel/SQLite workaround: Copy DB to /tmp for write access
if (process.env.VERCEL) {
    try {
        const dbSource = path.resolve(__dirname, '../prisma/dev.db');
        const dbDest = '/tmp/dev.db';
        // Always copy to ensure fresh state or persistence (in warm lambdas)
        if (fs.existsSync(dbSource)) {
            fs.copyFileSync(dbSource, dbDest);
            console.log('Database copied to /tmp/dev.db');
            process.env.DATABASE_URL = "file:/tmp/dev.db";
        } else {
            console.warn('Source DB not found at:', dbSource);
        }
    } catch (e) {
        console.error('Failed to copy DB:', e);
    }
}

const startScheduler = require('./services/cron');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ingest', require('./routes/ingestionRoutes'));

app.get('/api/debug/user', require('./middleware/authMiddleware'), (req, res) => {
    res.json({ user: req.user, id: req.user.id });
});

// Start Scheduler
startScheduler();

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Routes registered: /api/webhooks/shopify/...');
    });
}

module.exports = app;

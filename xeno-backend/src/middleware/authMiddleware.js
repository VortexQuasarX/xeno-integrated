const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Emergency Frontend Bypass Token Support
        if (token === 'demo-token-bypass') {
            req.user = {
                id: 'demo-user-id',
                email: 'demo@xeno.com',
                tenantId: 'demo-tenant-id',
                role: 'ADMIN',
                tenant: { id: 'demo-tenant-id', isActive: true, name: 'Xeno Demo Store' }
            };
            req.tenantId = 'demo-tenant-id';
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Demo User Bypass
        if (decoded.userId === 'demo-user-id') {
            req.user = {
                id: 'demo-user-id',
                email: 'demo@xeno.com',
                tenantId: 'demo-tenant-id',
                role: 'ADMIN',
                tenant: {
                    id: 'demo-tenant-id',
                    isActive: true,
                    name: 'Xeno Demo Store'
                }
            };
            req.tenantId = 'demo-tenant-id';
            return next();
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { tenant: true },
        });

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }

        if (!user.tenant.isActive) {
            return res.status(403).json({ message: 'Forbidden: Tenant is inactive' });
        }

        req.user = user;
        req.tenantId = user.tenantId;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;

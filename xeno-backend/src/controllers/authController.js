const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const register = async (req, res) => {
    try {
        const { email, password, storeName, shopifyDomain } = req.body;

        if (!email || !password || !storeName || !shopifyDomain) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user or tenant already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const existingTenant = await prisma.tenant.findUnique({ where: { shopifyDomain } });
        if (existingTenant) {
            return res.status(400).json({ message: 'Shopify domain already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create Tenant and User in a transaction
        const result = await prisma.$transaction(async (prisma) => {
            const tenant = await prisma.tenant.create({
                data: {
                    name: storeName,
                    shopifyDomain,
                },
            });

            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    tenantId: tenant.id,
                    role: 'ADMIN',
                },
            });

            return { tenant, user };
        });

        // Generate Token
        const token = jwt.sign(
            { userId: result.user.id, tenantId: result.tenant.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                tenantId: result.tenant.id,
            },
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Demo User Bypass - REMOVED for specific snapshot db usage
        // Authentication will now proceed against the actual database file

        const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.tenant.isActive) {
            return res.status(403).json({ message: 'Tenant is inactive' });
        }

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenantId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                tenantId: user.tenantId,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login };

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/db');
const seedInitialData = require('./utils/seedData');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const statsRoutes = require('./routes/statsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Ensure public upload directories exist
const uploadsPath = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Static Files Serving
// 1. Uploaded images
app.use('/uploads', express.static(uploadsPath));

// 2. Admin dashboard
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// 3. Public website (serves root index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'online',
        bakery: 'RIFÉ Artisan Bakehouse — Maadi, Cairo',
        timestamp: new Date().toISOString()
    });
});

// Admin redirect helper
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'مسار API المطلوب غير موجود'
    });
});

// Central Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Seed initial data if empty
        await seedInitialData();

        return new Promise((resolve) => {
            const server = app.listen(PORT, () => {
                console.log('====================================================');
                console.log(`🍞 RIFÉ Artisan Bakehouse - Web server and admin dashboard are ready`);
                console.log(`🌐 الموقع العام:   http://localhost:${PORT}`);
                console.log(`🛠️ لوحة الإدارة: http://localhost:${PORT}/admin`);
                console.log(`📡 نقطة الـ API:   http://localhost:${PORT}/api/products`);
                console.log(`🔑 مدير افتراضي:   admin@reefmaadi.com (كلمة السر: admin123456)`);
                console.log('====================================================');
                resolve(server);
            });
        });
    } catch (error) {
        console.error('فشل في تشغيل الخادم:', error.message);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verifies JWT Bearer token
 */
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح بالدخول. يرجى تسجيل الدخول أولاً'
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'reef_maadi_secret_jwt_key_2026_secure_bakery_auth_token'
        );

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم صاحب هذا الرمز لم يعد موجوداً'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'هذا الحساب معطل، يرجى التواصل مع الإدارة'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'جلسة تسجيل الدخول غير صالحة أو منتهية الصلاحية',
            error: error.message
        });
    }
};

/**
 * Role-based access control
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول إلى هذا الإجراء'
            });
        }
        next();
    };
};

module.exports = { protect, authorize };

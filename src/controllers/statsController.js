const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * @desc    Get dashboard summary statistics
 * @route   GET /api/stats/overview
 * @access  Private/Admin
 */
const getOverviewStats = async (req, res, next) => {
    try {
        const [
            totalProducts,
            totalCategories,
            availableProducts,
            outOfStockProducts,
            inactiveProducts,
            discountedProducts,
            recentProducts
        ] = await Promise.all([
            Product.countDocuments(),
            Category.countDocuments(),
            Product.countDocuments({ isAvailable: true, isActive: true }),
            Product.countDocuments({ isAvailable: false }),
            Product.countDocuments({ isActive: false }),
            Product.countDocuments({ discountPrice: { $ne: null, $gt: 0 } }),
            Product.find()
                .populate('category', 'name slug')
                .sort({ updatedAt: -1 })
                .limit(5)
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalProducts,
                totalCategories,
                availableProducts,
                outOfStockProducts,
                inactiveProducts,
                discountedProducts
            },
            recentProducts
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverviewStats
};

const express = require('express');
const router = express.Router();
const {
    getPublicProducts,
    getAdminProducts,
    getProductById,
    createProduct,
    updateProduct,
    toggleProductStatus,
    deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route for public website
router.get('/', getPublicProducts);

// Admin route to see all products including inactive & out-of-stock
router.get('/admin', protect, authorize('admin', 'manager'), getAdminProducts);

// Single product details
router.get('/:id', getProductById);

// Admin protected management
router.post('/', protect, authorize('admin', 'manager'), createProduct);
router.put('/:id', protect, authorize('admin', 'manager'), updateProduct);
router.patch('/:id/toggle-status', protect, authorize('admin', 'manager'), toggleProductStatus);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;

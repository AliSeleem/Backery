const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @desc    Upload product image file
 * @route   POST /api/upload
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin', 'manager'), upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'يرجى اختيار صورة لرفعها'
        });
    }

    // Return the relative URL to access the uploaded image
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
        success: true,
        message: 'تم رفع الصورة بنجاح',
        imageUrl: fileUrl,
        filename: req.file.filename
    });
});

module.exports = router;

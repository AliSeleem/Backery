/**
 * Central Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log for server debugging
    console.error('Error occurred:', err);

    // Mongoose bad ObjectId / CastError
    if (err.name === 'CastError') {
        const message = `العنصر غير موجود (معرف غير صالح: ${err.value})`;
        return res.status(404).json({ success: false, message });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `هذه القيمة مسجلة بالفعل (${field}: ${err.keyValue[field]})`;
        return res.status(400).json({ success: false, message });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join('، ');
        return res.status(400).json({ success: false, message });
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت'
        });
    }

    // Default 500 error
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'حدث خطأ في الخادم الداخلي'
    });
};

module.exports = errorHandler;

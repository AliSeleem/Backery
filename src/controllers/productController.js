const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * @desc    Get all public active products
 * @route   GET /api/products
 * @access  Public
 */
const getPublicProducts = async (req, res, next) => {
    try {
        const { category, search, featured, bestSeller } = req.query;

        // Base filter: only active products shown on website
        let filter = { isActive: true };

        // Filter by category slug or ID
        if (category && category !== 'all') {
            if (category.match(/^[0-9a-fA-F]{24}$/)) {
                filter.category = category;
            } else {
                const catDoc = await Category.findOne({ slug: category });
                if (catDoc) {
                    filter.category = catDoc._id;
                } else {
                    // Category not found, return empty array
                    return res.status(200).json({
                        success: true,
                        count: 0,
                        products: []
                    });
                }
            }
        }

        // Filter by search query
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        // Optional filters
        if (featured === 'true') filter.isFeatured = true;
        if (bestSeller === 'true') filter.isBestSeller = true;

        const products = await Product.find(filter)
            .populate('category', 'name slug icon')
            .sort({ sortOrder: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all products for Admin (including inactive, out of stock)
 * @route   GET /api/products/admin
 * @access  Private/Admin
 */
const getAdminProducts = async (req, res, next) => {
    try {
        const { category, search, isAvailable, isActive } = req.query;
        let filter = {};

        if (category && category !== 'all') {
            filter.category = category;
        }

        if (isAvailable !== undefined && isAvailable !== '') {
            filter.isAvailable = isAvailable === 'true';
        }

        if (isActive !== undefined && isActive !== '') {
            filter.isActive = isActive === 'true';
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        const products = await Product.find(filter)
            .populate('category', 'name slug icon')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single product details
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name slug icon');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            description,
            price,
            discountPrice,
            category,
            imageUrl,
            isAvailable,
            isActive,
            isFeatured,
            isBestSeller,
            tag,
            sortOrder
        } = req.body;

        // Validation
        if (!name || !description || price === undefined || !category) {
            return res.status(400).json({
                success: false,
                message: 'يرجى استكمال الحقول الإلزامية: الاسم، الوصف، السعر، والقسم'
            });
        }

        // Verify category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: 'القسم المحدد غير موجود'
            });
        }

        const parsedPrice = parseFloat(price);
        const parsedDiscountPrice = discountPrice ? parseFloat(discountPrice) : null;

        if (parsedDiscountPrice && parsedDiscountPrice >= parsedPrice) {
            return res.status(400).json({
                success: false,
                message: 'سعر الخصم يجب أن يكون أقل من السعر الأساسي'
            });
        }

        const product = await Product.create({
            name: name.trim(),
            description: description.trim(),
            price: parsedPrice,
            discountPrice: parsedDiscountPrice,
            category,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
            isAvailable: isAvailable !== undefined ? isAvailable : true,
            isActive: isActive !== undefined ? isActive : true,
            isFeatured: isFeatured || false,
            isBestSeller: isBestSeller || false,
            tag: tag ? tag.trim() : '',
            sortOrder: sortOrder || 0
        });

        const populatedProduct = await Product.findById(product._id).populate('category', 'name slug icon');

        res.status(201).json({
            success: true,
            message: 'تم إضافة المنتج بنجاح',
            product: populatedProduct
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update existing product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        let product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        const {
            name,
            description,
            price,
            discountPrice,
            category,
            imageUrl,
            isAvailable,
            isActive,
            isFeatured,
            isBestSeller,
            tag,
            sortOrder
        } = req.body;

        // Verify category if changed
        if (category && category !== product.category.toString()) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: 'القسم المحدد غير موجود'
                });
            }
            product.category = category;
        }

        if (name) product.name = name.trim();
        if (description) product.description = description.trim();
        if (price !== undefined) product.price = parseFloat(price);

        if (discountPrice !== undefined) {
            if (discountPrice === '' || discountPrice === null) {
                product.discountPrice = null;
            } else {
                const parsedDiscount = parseFloat(discountPrice);
                if (parsedDiscount >= product.price) {
                    return res.status(400).json({
                        success: false,
                        message: 'سعر الخصم يجب أن يكون أقل من السعر الأساسي'
                    });
                }
                product.discountPrice = parsedDiscount;
            }
        }

        if (imageUrl) product.imageUrl = imageUrl.trim();
        if (isAvailable !== undefined) product.isAvailable = isAvailable;
        if (isActive !== undefined) product.isActive = isActive;
        if (isFeatured !== undefined) product.isFeatured = isFeatured;
        if (isBestSeller !== undefined) product.isBestSeller = isBestSeller;
        if (tag !== undefined) product.tag = tag.trim();
        if (sortOrder !== undefined) product.sortOrder = sortOrder;

        await product.save();

        const updatedProduct = await Product.findById(id).populate('category', 'name slug icon');

        res.status(200).json({
            success: true,
            message: 'تم تحديث المنتج بنجاح',
            product: updatedProduct
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Quick toggle product availability or active status
 * @route   PATCH /api/products/:id/toggle-status
 * @access  Private/Admin
 */
const toggleProductStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { field } = req.body; // 'isAvailable' or 'isActive'

        if (!['isAvailable', 'isActive'].includes(field)) {
            return res.status(400).json({
                success: false,
                message: 'الحقل المطلوب تبديله غير صالح'
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        product[field] = !product[field];
        await product.save();

        res.status(200).json({
            success: true,
            message: `تم تحديث حالة المنتج (${field === 'isAvailable' ? 'التوفر' : 'الظهور'}) بنجاح`,
            [field]: product[field]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            message: 'تم حذف المنتج بنجاح'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPublicProducts,
    getAdminProducts,
    getProductById,
    createProduct,
    updateProduct,
    toggleProductStatus,
    deleteProduct
};

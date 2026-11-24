const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * @desc    Get all categories (public gets active only, admin gets all)
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
    try {
        const isAdmin = req.query.admin === 'true';
        const filter = isAdmin ? {} : { isActive: true };

        const categories = await Category.find(filter)
            .sort({ sortOrder: 1, createdAt: 1 })
            .populate('productsCount');

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single category by ID or Slug
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        let category;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            category = await Category.findById(id).populate('productsCount');
        } else {
            category = await Category.findOne({ slug: id }).populate('productsCount');
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'القسم المطلوب غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res, next) => {
    try {
        let { name, slug, icon, description, sortOrder } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'اسم القسم مطلوب'
            });
        }

        // Auto-generate slug if not provided
        if (!slug) {
            slug = name
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\u0621-\u064A-]/g, '');
        } else {
            slug = slug.trim().toLowerCase().replace(/\s+/g, '-');
        }

        // Check if slug or name already exists
        const existingCategory = await Category.findOne({
            $or: [{ name: name.trim() }, { slug }]
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'اسم القسم أو المعرف (slug) مسجل بالفعل'
            });
        }

        const category = await Category.create({
            name: name.trim(),
            slug,
            icon: icon || 'fa-solid fa-bread-slice',
            description: description || '',
            sortOrder: sortOrder || 0
        });

        res.status(201).json({
            success: true,
            message: 'تم إضافة القسم بنجاح',
            category
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, icon, description, sortOrder, isActive } = req.body;

        let category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'القسم غير موجود'
            });
        }

        if (name) category.name = name.trim();
        if (slug) category.slug = slug.trim().toLowerCase().replace(/\s+/g, '-');
        if (icon !== undefined) category.icon = icon;
        if (description !== undefined) category.description = description;
        if (sortOrder !== undefined) category.sortOrder = sortOrder;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        res.status(200).json({
            success: true,
            message: 'تم تحديث بيانات القسم بنجاح',
            category
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'القسم غير موجود'
            });
        }

        // Check if any product is assigned to this category
        const productsInCat = await Product.countDocuments({ category: id });
        if (productsInCat > 0) {
            return res.status(400).json({
                success: false,
                message: `لا يمكن حذف هذا القسم لأنه يحتوي على ${productsInCat} منتج(ات). يرجى نقل المنتجات أولاً أو حذفها.`
            });
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'تم حذف القسم بنجاح'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};

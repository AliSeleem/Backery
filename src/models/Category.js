const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'اسم القسم مطلوب'],
            trim: true,
            unique: true,
            maxlength: [50, 'اسم القسم لا يمكن أن يتجاوز 50 حرفاً']
        },
        slug: {
            type: String,
            required: [true, 'المعرف اللاتيني (slug) مطلوب'],
            unique: true,
            lowercase: true,
            trim: true
        },
        icon: {
            type: String,
            default: 'fa-solid fa-bread-slice'
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        sortOrder: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual field to count products in this category
categorySchema.virtual('productsCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

module.exports = mongoose.model('Category', categorySchema);

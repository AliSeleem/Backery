const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'اسم المنتج مطلوب'],
            trim: true,
            maxlength: [100, 'اسم المنتج لا يمكن أن يتجاوز 100 حرف']
        },
        description: {
            type: String,
            required: [true, 'وصف المنتج مطلوب'],
            trim: true,
            maxlength: [500, 'الوصف لا يمكن أن يتجاوز 500 حرف']
        },
        price: {
            type: Number,
            required: [true, 'سعر المنتج مطلوب'],
            min: [0, 'السعر يجب أن يكون قيمة موجبة']
        },
        discountPrice: {
            type: Number,
            default: null,
            validate: {
                validator: function (val) {
                    if (val === null || val === undefined) return true;
                    return val < this.price;
                },
                message: 'سعر الخصم يجب أن يكون أقل من السعر الأصلي'
            }
        },
        imageUrl: {
            type: String,
            required: [true, 'صورة المنتج مطلوبة'],
            default: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'يجب تحديد قسم للمنتج']
        },
        isAvailable: {
            type: Boolean,
            default: true // true = متوفر, false = نفد من المخزون
        },
        isActive: {
            type: Boolean,
            default: true // true = معروض للجمهور, false = مخفي مؤقتاً
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        isBestSeller: {
            type: Boolean,
            default: false
        },
        tag: {
            type: String,
            trim: true,
            default: '' // e.g. "الأكثر مبيعاً", "طازج", "حِرفي", "فاخر"
        },
        sortOrder: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Indexes for fast searching and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1, isAvailable: 1 });

module.exports = mongoose.model('Product', productSchema);

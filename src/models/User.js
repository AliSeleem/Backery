const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'اسم المستخدم مطلوب'],
            trim: true,
            maxlength: [50, 'الاسم لا يمكن أن يتجاوز 50 حرفاً']
        },
        email: {
            type: String,
            required: [true, 'البريد الإلكتروني مطلوب'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'يرجى إدخال بريد إلكتروني صالح'
            ]
        },
        password: {
            type: String,
            required: [true, 'كلمة المرور مطلوبة'],
            minlength: [6, 'كلمة المرور يجب ألا تقل عن 6 أحرف'],
            select: false // Exclude from query results by default
        },
        role: {
            type: String,
            enum: ['admin', 'manager'],
            default: 'admin'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastLogin: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

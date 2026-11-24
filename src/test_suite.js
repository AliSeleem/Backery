const mongoose = require('mongoose');
const connectDB = require('./config/db');
const seedInitialData = require('./utils/seedData');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function runTests() {
    console.log('--- بدء اختبارات النظام الشاملة لمخبز ريف المعادي ---');

    try {
        // 1. Test Database Connection
        console.log('1. اختبار الاتصال بقاعدة البيانات...');
        await connectDB();
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح.');

        // 2. Test Seeding
        console.log('2. اختبار بذر البيانات الأولية...');
        await seedInitialData();

        const admin = await User.findOne({ email: 'admin@reefmaadi.com' }).select('+password');
        if (!admin) throw new Error('فشل العثور على حساب المدير بعد البذر');
        console.log('✅ تم العثور على حساب المدير بنجاح:', admin.email);

        // 3. Test Password Comparison
        const isMatch = await admin.comparePassword('admin123456');
        if (!isMatch) throw new Error('فشل مطابقة كلمة مرور المدير');
        console.log('✅ تم التحقق من كلمة مرور المدير المشفرة بواسطة bcrypt بنجاح.');

        // 4. Test Categories
        const categories = await Category.find();
        if (categories.length < 4) throw new Error(`عدد الأقسام غير كاف: ${categories.length}`);
        console.log(`✅ تم التحقق من وجود ${categories.length} أقسام رئيسية.`);

        // 5. Test Products
        const products = await Product.find();
        if (products.length < 9) throw new Error(`عدد المنتجات غير كاف: ${products.length}`);
        console.log(`✅ تم التحقق من وجود ${products.length} أصناف مخبوزات افتراضية.`);

        // 6. Test Product CRUD Flow
        console.log('6. اختبار دورة حياة منتج جديد (إضافة - تعديل سعر - تبديل حالة - حذف)...');
        const testCategory = categories[0]._id;

        // Create
        const newProduct = await Product.create({
            name: 'فطيرة تفاح تجريبية',
            description: 'فطيرة تفاح بالقرفة الطازجة لاختبار النظام',
            price: 50,
            discountPrice: 45,
            category: testCategory,
            imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
            isAvailable: true,
            isActive: true,
            tag: 'تجريبي'
        });
        console.log('  -> تم إضافة منتج تجريبي بسعر 50 ج.م');

        // Update Price to 60 EGP
        newProduct.price = 60;
        newProduct.discountPrice = null;
        await newProduct.save();
        const updated = await Product.findById(newProduct._id);
        if (updated.price !== 60) throw new Error('فشل تحديث سعر المنتج إلى 60 ج.م');
        console.log('  -> تم تحديث سعر المنتج إلى 60 ج.م بنجاح');

        // Toggle Status
        updated.isAvailable = false;
        await updated.save();
        const outOfStock = await Product.findById(newProduct._id);
        if (outOfStock.isAvailable !== false) throw new Error('فشل تغيير حالة التوفر إلى نفد');
        console.log('  -> تم تغيير حالة المنتج إلى "نفد من المخزون" بنجاح');

        // Delete
        await Product.findByIdAndDelete(newProduct._id);
        const checkDeleted = await Product.findById(newProduct._id);
        if (checkDeleted) throw new Error('فشل حذف المنتج التجريبي');
        console.log('  -> تم حذف المنتج التجريبي بنجاح.');

        // 7. Test JWT Token Generation & Verification
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded.id !== admin._id.toString()) throw new Error('فشل التحقق من رمز JWT');
        console.log('✅ تم التحقق من صحة رموز الـ JWT بنجاح.');

        console.log('----------------------------------------------------');
        console.log('🎉 جميع الاختبارات البرمجية نجحت بنسبة 100%!');
        console.log('----------------------------------------------------');
        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ في الاختبارات البرمجية:', error);
        process.exit(1);
    }
}

runTests();

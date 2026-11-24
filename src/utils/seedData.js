const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const connectDB = require('../config/db');
require('dotenv').config();

const defaultCategories = [
    {
        name: 'كرواسون ومخبوزات',
        slug: 'croissant',
        icon: 'fa-solid fa-bread-slice',
        description: 'مخبوزات فرنسية هشة بالزبدة الطبيعية',
        sortOrder: 1
    },
    {
        name: 'خبز طازج وساوردو',
        slug: 'bread',
        icon: 'fa-solid fa-wheat-awn',
        description: 'أرغفة الساوردو الطبيعية والباجيت الباريسي المقرمش',
        sortOrder: 2
    },
    {
        name: 'حلويات وتارت',
        slug: 'sweets',
        icon: 'fa-solid fa-cake-candles',
        description: 'تشكيلة فاخرة من التشيز كيك والسينابون والحلويات الغربية',
        sortOrder: 3
    },
    {
        name: 'قهوة ومشروبات',
        slug: 'drinks',
        icon: 'fa-solid fa-mug-hot',
        description: 'قهوة مختصة محضرة بعناية من أفضل حبوب البن',
        sortOrder: 4
    }
];

const defaultProducts = (categoryMap) => [
    {
        name: 'كرواسون زبدة فرنسي',
        description: 'طبقات مقرمشة وهشة مخبوزة بزبدة طبيعية نقية 100% تذوب في الفم.',
        price: 45,
        discountPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
        category: categoryMap['croissant'],
        isAvailable: true,
        isActive: true,
        isFeatured: true,
        isBestSeller: true,
        tag: 'الأكثر مبيعاً',
        sortOrder: 1
    },
    {
        name: 'بان أو شوكولا',
        description: 'كرواسون محشو بأصابع الشوكولاتة البلجيكية الداكنة الغنية والفاخرة.',
        price: 55,
        discountPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&w=600&q=80',
        category: categoryMap['croissant'],
        isAvailable: true,
        isActive: true,
        isFeatured: false,
        isBestSeller: false,
        tag: 'طازج',
        sortOrder: 2
    },
    {
        name: 'كرواسون اللوز المحمص',
        description: 'محشو بكريمة اللوز الغنية ومزين بشرائح اللوز المقرمشة والسكر الناعم.',
        price: 65,
        discountPrice: 60,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
        category: categoryMap['croissant'],
        isAvailable: true,
        isActive: true,
        isFeatured: true,
        isBestSeller: false,
        tag: 'مميز',
        sortOrder: 3
    },
    {
        name: 'خبز الساوردو الريفي',
        description: 'مخمر ببطء لمدة 24 ساعة بخميرة طبيعية حية لقشرة ذهبية مقرمشة ولب طري.',
        price: 75,
        discountPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80',
        category: categoryMap['bread'],
        isAvailable: true,
        isActive: true,
        isFeatured: true,
        isBestSeller: true,
        tag: 'حِرفي',
        sortOrder: 4
    },
    {
        name: 'باجيت فرنسي كلاسيكي',
        description: 'الباجيت الباريسي الشهير، قشرة مقرمشة من الخارج وهواء خفيف من الداخل.',
        price: 30,
        discountPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=600&q=80',
        category: categoryMap['bread'],
        isAvailable: true,
        isActive: true,
        isFeatured: false,
        isBestSeller: false,
        tag: 'يومي',
        sortOrder: 5
    },
    {
        name: 'فوكاشيا زيتون وإكليل الجبل',
        description: 'خبز إيطالي غني بزيت الزيتون البكر والروزماري العطري وزيتون كلاماتا.',
        price: 60,
        discountPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1579697096985-41fe1430e5df?auto=format&fit=crop&w=600&q=80',
        category: categoryMap['bread'],
        isAvailable: true,
        isActive: true,
        isFeatured: false,
        isBestSeller: false,
        tag: 'شهي',
        sortOrder: 6
    },
    {
        name: 'سينامون رول بكريمة الجبن',
        description: 'عجينة طرية ومحشوة بأجود قرفة سيلانية ومغطاة بطبقة غنية من الفروستنج الكريمي.',
        price: 60,
        discountPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=600&q=80',
        category: categoryMap['sweets'],
        isAvailable: true,
        isActive: true,
        isFeatured: true,
        isBestSeller: true,
        tag: 'محبوب الكل',
        sortOrder: 7
    },
    {
        name: 'تشيز كيك سان سيباستيان',
        description: 'كعكة الجبن الإسبانية المحروقة ذات القلب الكريمي الحريري مع صوص الشوكولاتة.',
        price: 85,
        discountPrice: 75,
        imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
        category: categoryMap['sweets'],
        isAvailable: true,
        isActive: true,
        isFeatured: true,
        isBestSeller: false,
        tag: 'فاخر',
        sortOrder: 8
    },
    {
        name: 'فلات وايت / كابتشينو',
        description: 'إسبريسو غني بحبوب بن أصلية مع حليب طازج مبخر بقوام مخملي مثالي.',
        price: 55,
        discountPrice: null,
        imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80',
        category: categoryMap['drinks'],
        isAvailable: true,
        isActive: true,
        isFeatured: false,
        isBestSeller: false,
        tag: 'مختصة',
        sortOrder: 9
    }
];

/**
 * Seed initial data if database is empty
 */
const seedInitialData = async () => {
    try {
        console.log('Checking database for initial data...');

        // 1. Seed Admin User
        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@reefmaadi.com').toLowerCase();
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            console.log(`Creating default admin account: ${adminEmail}...`);
            await User.create({
                name: 'مدير مخبز ريف المعادي',
                email: adminEmail,
                password: process.env.ADMIN_PASSWORD || 'admin123456',
                role: 'admin',
                isActive: true
            });
            console.log('Default admin created successfully.');
        } else {
            console.log('Admin account already exists.');
        }

        // 2. Seed Categories
        const categoryCount = await Category.countDocuments();
        const categoryMap = {};

        if (categoryCount === 0) {
            console.log('Seeding default categories...');
            for (const cat of defaultCategories) {
                const created = await Category.create(cat);
                categoryMap[created.slug] = created._id;
            }
            console.log('Default categories created successfully.');
        } else {
            console.log(`Found ${categoryCount} existing categories.`);
            const allCats = await Category.find();
            allCats.forEach(c => {
                categoryMap[c.slug] = c._id;
            });
        }

        // 3. Seed Products
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            console.log('Seeding initial bakery products...');
            const productsToInsert = defaultProducts(categoryMap);
            await Product.insertMany(productsToInsert);
            console.log(`Successfully seeded ${productsToInsert.length} bakery products.`);
        } else {
            console.log(`Found ${productCount} existing products.`);
        }

        console.log('Database initialization & seeding check complete.');
    } catch (error) {
        console.error('Error during data seeding:', error);
    }
};

// Standalone execution support
if (require.main === module) {
    (async () => {
        try {
            await connectDB();
            await seedInitialData();
            console.log('Seeding finished. Exiting process...');
            process.exit(0);
        } catch (err) {
            console.error('Seeding script failed:', err);
            process.exit(1);
        }
    })();
}

module.exports = seedInitialData;

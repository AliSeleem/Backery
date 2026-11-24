/**
 * مخبز ريف المعادي - Maadi Artisan Bakery
 * Public Website Logic: Dynamic Products & Categories from Backend APIs,
 * Responsive Mobile Navigation, and WhatsApp Order Integration.
 */

const BAKERY_PHONE = '201012345678'; // WhatsApp phone number for orders
let cachedProducts = [];
let activeCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Navigation & Scroll Behaviors
    initNavbar();

    // 2. Fetch and render dynamic content from Backend
    initPublicMenu();
});

// ==========================================================================
// 1. Navigation & Scroll Interactions
// ==========================================================================
function initNavbar() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const toggleIcon = menuToggle ? menuToggle.querySelector('i') : null;

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('show');
            if (toggleIcon) {
                if (isOpen) {
                    toggleIcon.classList.remove('fa-bars');
                    toggleIcon.classList.add('fa-xmark');
                } else {
                    toggleIcon.classList.remove('fa-xmark');
                    toggleIcon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking on any navigation link
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('show');
                if (toggleIcon) {
                    toggleIcon.classList.remove('fa-xmark');
                    toggleIcon.classList.add('fa-bars');
                }
            });
        });
    }

    // Header shadow on scroll
    const header = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (!header) return;
        if (window.scrollY > 30) {
            header.style.boxShadow = '0 4px 20px rgba(45, 24, 16, 0.08)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    // ScrollSpy: highlight active link in navbar
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links .nav-link');

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${sectionId}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    });
}

// ==========================================================================
// 2. Dynamic Categories & Products Loading
// ==========================================================================
async function initPublicMenu() {
    await loadCategories();
    await loadProducts();
}

/**
 * Fetch and Render Categories
 */
async function loadCategories() {
    const categoryTabsContainer = document.getElementById('categoryTabs');
    if (!categoryTabsContainer) return;

    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('فشل جلب الأقسام من الخادم');

        const data = await response.json();
        const categories = data.categories || [];

        // Always keep the 'All' category button
        let tabsHtml = `
            <button class="tab-btn active" data-category="all">
                <i class="fa-solid fa-border-all"></i> كل الأصناف
            </button>
        `;

        categories.forEach(cat => {
            tabsHtml += `
                <button class="tab-btn" data-category="${cat.slug}">
                    <i class="${cat.icon || 'fa-solid fa-bread-slice'}"></i> ${cat.name}
                </button>
            `;
        });

        categoryTabsContainer.innerHTML = tabsHtml;

        // Bind click events to category buttons
        categoryTabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                categoryTabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                activeCategory = btn.getAttribute('data-category');
                filterAndRenderProducts();
            });
        });

    } catch (error) {
        console.warn('Could not load dynamic categories, falling back to all:', error);
    }
}

/**
 * Fetch All Public Products from Backend
 */
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    try {
        productsGrid.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>جاري تحضير أشهى المخبوزات الطازجة من الفرن...</span>
            </div>
        `;

        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('فشل في جلب قائمة المخبوزات من قاعدة البيانات');

        const data = await response.json();
        cachedProducts = data.products || [];

        filterAndRenderProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        productsGrid.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>تعذر الاتصال بخادم المخبز لجلب الأصناف الحالية.</p>
                <button class="btn btn-outline mt-3" onclick="loadProducts()">
                    <i class="fa-solid fa-arrow-rotate-right"></i> إعادة المحاولة
                </button>
            </div>
        `;
    }
}

/**
 * Filter and Render Products Grid
 */
function filterAndRenderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    let filtered = cachedProducts;
    if (activeCategory !== 'all') {
        filtered = cachedProducts.filter(p => p.category && p.category.slug === activeCategory);
    }

    if (filtered.length === 0) {
        productsGrid.innerHTML = `
            <div class="loading-state" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-bread-slice" style="color: var(--accent); opacity: 0.6;"></i>
                <span>لا توجد منتجات متوفرة حالياً في هذا القسم. تفضل باختيار قسم آخر.</span>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = filtered.map(product => {
        const catSlug = product.category ? product.category.slug : 'all';
        const hasDiscount = product.discountPrice && product.discountPrice < product.price;
        const currentPrice = hasDiscount ? product.discountPrice : product.price;

        // Determine tag badge
        let tagHtml = '';
        if (!product.isAvailable) {
            tagHtml = `<span class="product-tag" style="background:#dc2626; color:#ffffff;">نفد مؤقتاً</span>`;
        } else if (hasDiscount) {
            tagHtml = `<span class="product-tag special">عرض خاص</span>`;
        } else if (product.tag) {
            tagHtml = `<span class="product-tag popular">${product.tag}</span>`;
        } else if (product.isBestSeller) {
            tagHtml = `<span class="product-tag popular">الأكثر مبيعاً</span>`;
        } else if (product.isFeatured) {
            tagHtml = `<span class="product-tag special">مميز</span>`;
        }

        // Price formatting
        let priceHtml = '';
        if (hasDiscount) {
            priceHtml = `
                <span class="product-price">
                    <span class="price-old">${product.price}</span> ${product.discountPrice} <small>ج.م</small>
                </span>
            `;
        } else {
            priceHtml = `
                <span class="product-price">${product.price} <small>ج.م</small></span>
            `;
        }

        // Action button based on availability
        let buttonHtml = '';
        if (product.isAvailable) {
            buttonHtml = `
                <button class="btn btn-order" onclick="orderViaWhatsApp('${escapeHtml(product.name)}', ${currentPrice})">
                    <i class="fa-brands fa-whatsapp"></i> اطلب عبر واتساب
                </button>
            `;
        } else {
            buttonHtml = `
                <button class="btn btn-order disabled" disabled>
                    <i class="fa-solid fa-clock"></i> نفد لليوم - سيتوفر غداً
                </button>
            `;
        }

        return `
            <article class="product-card" data-category="${catSlug}">
                <div class="product-image-container">
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'">
                    ${tagHtml}
                </div>
                <div class="product-info">
                    <div class="product-header">
                        <h3 class="product-name">${product.name}</h3>
                        ${priceHtml}
                    </div>
                    <p class="product-desc">${product.description}</p>
                    ${buttonHtml}
                </div>
            </article>
        `;
    }).join('');
}

/**
 * Handle WhatsApp order button click
 */
function orderViaWhatsApp(productName, price) {
    const message = `السلام عليكم ورحمة الله،\nأود طلب من مخبز ريف المعادي:\n- الصنف: ${productName}\n- السعر: ${price} جنيه مصري\n\nيرجى تأكيد التوافر وإجمالي المبلغ مع التوصيل داخل المعادي. شكراً لكم!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${BAKERY_PHONE}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

// Helper to escape HTML characters in strings for inline attributes
function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Global functions exposed to inline onclicks
window.orderViaWhatsApp = orderViaWhatsApp;
window.loadProducts = loadProducts;

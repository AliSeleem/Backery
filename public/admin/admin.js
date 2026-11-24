/**
 * مخبز ريف المعادي - Admin Dashboard Logic
 * Full CRUD for Products, Categories, Prices, Image Upload, and Authentication
 */

// Global State
const state = {
    token: localStorage.getItem('reef_admin_token') || null,
    user: JSON.parse(localStorage.getItem('reef_admin_user') || 'null'),
    categories: [],
    products: [],
    currentDeleteTarget: null, // { type: 'product'|'category', id: string, name: string }
    activeTab: 'overview'
};

// DOM Elements Cache
const DOM = {
    // Views
    loginView: document.getElementById('loginView'),
    dashboardView: document.getElementById('dashboardView'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginAlert: document.getElementById('loginAlert'),
    loginSubmitBtn: document.getElementById('loginSubmitBtn'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Topbar & Profile
    adminName: document.getElementById('adminName'),
    adminEmail: document.getElementById('adminEmail'),
    pageTitle: document.getElementById('pageTitle'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),

    // Navigation Items
    navItems: document.querySelectorAll('.sidebar-nav .nav-item'),
    tabPanels: document.querySelectorAll('.tab-panel'),

    // Overview Stats
    statTotalProducts: document.getElementById('statTotalProducts'),
    statAvailableProducts: document.getElementById('statAvailableProducts'),
    statOutOfStock: document.getElementById('statOutOfStock'),
    statTotalCategories: document.getElementById('statTotalCategories'),
    recentProductsTableBody: document.getElementById('recentProductsTableBody'),
    viewAllProductsBtn: document.getElementById('viewAllProductsBtn'),
    quickAddProductBtn: document.getElementById('quickAddProductBtn'),

    // Products Tab
    productSearchInput: document.getElementById('productSearchInput'),
    productCategoryFilter: document.getElementById('productCategoryFilter'),
    productStatusFilter: document.getElementById('productStatusFilter'),
    openAddProductModalBtn: document.getElementById('openAddProductModalBtn'),
    productsTableBody: document.getElementById('productsTableBody'),

    // Categories Tab
    openAddCategoryModalBtn: document.getElementById('openAddCategoryModalBtn'),
    categoriesTableBody: document.getElementById('categoriesTableBody'),

    // Modals
    productModal: document.getElementById('productModal'),
    productForm: document.getElementById('productForm'),
    productModalTitle: document.getElementById('productModalTitle'),
    productId: document.getElementById('productId'),
    prodName: document.getElementById('prodName'),
    prodCategory: document.getElementById('prodCategory'),
    prodPrice: document.getElementById('prodPrice'),
    prodDiscountPrice: document.getElementById('prodDiscountPrice'),
    prodDesc: document.getElementById('prodDesc'),
    prodTag: document.getElementById('prodTag'),
    prodImageFile: document.getElementById('prodImageFile'),
    prodImageUrl: document.getElementById('prodImageUrl'),
    prodImagePreview: document.getElementById('prodImagePreview'),
    prodIsAvailable: document.getElementById('prodIsAvailable'),
    prodIsActive: document.getElementById('prodIsActive'),
    prodIsFeatured: document.getElementById('prodIsFeatured'),
    prodIsBestSeller: document.getElementById('prodIsBestSeller'),
    tabUploadImg: document.getElementById('tabUploadImg'),
    tabUrlImg: document.getElementById('tabUrlImg'),
    uploadImgBox: document.getElementById('uploadImgBox'),
    urlImgBox: document.getElementById('urlImgBox'),

    // Quick Price Modal
    quickPriceModal: document.getElementById('quickPriceModal'),
    quickPriceForm: document.getElementById('quickPriceForm'),
    quickPriceProdId: document.getElementById('quickPriceProdId'),
    quickPriceProdName: document.getElementById('quickPriceProdName'),
    quickPriceInput: document.getElementById('quickPriceInput'),
    quickDiscountInput: document.getElementById('quickDiscountInput'),

    // Category Modal
    categoryModal: document.getElementById('categoryModal'),
    categoryForm: document.getElementById('categoryForm'),
    categoryModalTitle: document.getElementById('categoryModalTitle'),
    categoryId: document.getElementById('categoryId'),
    catName: document.getElementById('catName'),
    catSlug: document.getElementById('catSlug'),
    catIcon: document.getElementById('catIcon'),
    catDesc: document.getElementById('catDesc'),
    catSortOrder: document.getElementById('catSortOrder'),

    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteModalMessage: document.getElementById('deleteModalMessage'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
};

// ==========================================================================
// 1. Toast & Alert Helpers
// ==========================================================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'circle-check';
    if (type === 'error') icon = 'circle-exclamation';
    if (type === 'info') icon = 'circle-info';

    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==========================================================================
// 2. API Request Wrapper with Auth Headers
// ==========================================================================
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    const headers = options.headers || {};

    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (response.status === 401) {
            handleLogout(false);
            throw new Error(data.message || 'انتهت صلاحية جلسة الدخول');
        }

        if (!response.ok) {
            throw new Error(data.message || 'حدث خطأ في استجابة الخادم');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// ==========================================================================
// 3. Authentication Management
// ==========================================================================
async function checkAuth() {
    if (!state.token) {
        showLoginView();
        return;
    }

    try {
        const data = await apiRequest('/api/auth/me');
        state.user = data.user;
        localStorage.setItem('reef_admin_user', JSON.stringify(data.user));
        showDashboardView();
    } catch (err) {
        console.warn('Authentication check failed:', err.message);
        handleLogout(false);
    }
}

function showLoginView() {
    DOM.loginView.style.display = 'flex';
    DOM.dashboardView.style.display = 'none';
}

function showDashboardView() {
    DOM.loginView.style.display = 'none';
    DOM.dashboardView.style.display = 'flex';

    if (state.user) {
        DOM.adminName.textContent = state.user.name || 'مدير المخبز';
        DOM.adminEmail.textContent = state.user.email || 'admin@reefmaadi.com';
    }

    // Load initial data
    loadInitialDashboardData();
}

function handleLogout(notify = true) {
    state.token = null;
    state.user = null;
    localStorage.removeItem('reef_admin_token');
    localStorage.removeItem('reef_admin_user');
    showLoginView();
    if (notify) showToast('تم تسجيل الخروج بنجاح', 'info');
}

// Handle Login Form Submit
DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    DOM.loginAlert.style.display = 'none';
    DOM.loginSubmitBtn.disabled = true;
    DOM.loginSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';

    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'فشل تسجيل الدخول');
        }

        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('reef_admin_token', data.token);
        localStorage.setItem('reef_admin_user', JSON.stringify(data.user));

        showToast('مرحباً بك مجدداً! تم تسجيل الدخول بنجاح');
        showDashboardView();
    } catch (err) {
        DOM.loginAlert.textContent = err.message;
        DOM.loginAlert.style.display = 'block';
    } finally {
        DOM.loginSubmitBtn.disabled = false;
        DOM.loginSubmitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> تسجيل الدخول للوحة التحكم';
    }
});

DOM.logoutBtn.addEventListener('click', () => handleLogout(true));

// ==========================================================================
// 4. Tab Navigation Management
// ==========================================================================
function switchTab(tabId) {
    state.activeTab = tabId;

    DOM.navItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    DOM.tabPanels.forEach(panel => {
        if (panel.id === `tab-${tabId}`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });

    const titles = {
        overview: 'نظرة عامة والتحليلات',
        products: 'إدارة المنتجات والأسعار',
        categories: 'أقسام المخبوزات'
    };
    DOM.pageTitle.textContent = titles[tabId] || 'لوحة الإدارة';

    // Refresh data corresponding to tab
    if (tabId === 'overview') loadOverviewStats();
    if (tabId === 'products') loadProducts();
    if (tabId === 'categories') loadCategories();

    // Close mobile sidebar if open
    DOM.sidebar.classList.remove('open');
}

DOM.navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        switchTab(tab);
    });
});

if (DOM.viewAllProductsBtn) {
    DOM.viewAllProductsBtn.addEventListener('click', () => switchTab('products'));
}

if (DOM.quickAddProductBtn) {
    DOM.quickAddProductBtn.addEventListener('click', () => {
        switchTab('products');
        openProductModal();
    });
}

// Mobile sidebar toggle
if (DOM.sidebarToggle) {
    DOM.sidebarToggle.addEventListener('click', () => {
        DOM.sidebar.classList.toggle('open');
    });
}

// ==========================================================================
// 5. Data Fetching & Initial Loading
// ==========================================================================
async function loadInitialDashboardData() {
    await loadCategories();
    await loadOverviewStats();
    await loadProducts();
}

// Load Overview Statistics
async function loadOverviewStats() {
    try {
        const data = await apiRequest('/api/stats/overview');
        const s = data.stats;

        DOM.statTotalProducts.textContent = s.totalProducts || 0;
        DOM.statAvailableProducts.textContent = s.availableProducts || 0;
        DOM.statOutOfStock.textContent = s.outOfStockProducts || 0;
        DOM.statTotalCategories.textContent = s.totalCategories || 0;

        renderRecentProducts(data.recentProducts || []);
    } catch (err) {
        console.error('Error fetching stats:', err);
    }
}

function renderRecentProducts(items) {
    if (!items || items.length === 0) {
        DOM.recentProductsTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">لا توجد منتجات مسجلة حالياً</td></tr>`;
        return;
    }

    DOM.recentProductsTableBody.innerHTML = items.map(p => {
        const catName = p.category ? p.category.name : 'بدون قسم';
        const isAvail = p.isAvailable && p.isActive;
        const statusBadge = isAvail 
            ? `<span class="badge badge-success"><i class="fa-solid fa-check"></i> متوفر</span>`
            : `<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> نفد</span>`;

        return `
            <tr>
                <td><strong>${p.name}</strong></td>
                <td><span class="badge badge-primary">${catName}</span></td>
                <td><strong>${p.price} ج.م</strong></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="openProductModal('${p._id}')" title="تعديل">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================================================
// 6. Categories Management
// ==========================================================================
async function loadCategories() {
    try {
        const data = await apiRequest('/api/categories?admin=true');
        state.categories = data.categories || [];

        // Populate Category Filter dropdown
        DOM.productCategoryFilter.innerHTML = `<option value="all">جميع الأقسام</option>` + 
            state.categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');

        // Populate Category Dropdown inside Product Modal
        DOM.prodCategory.innerHTML = `<option value="">اختر القسم...</option>` + 
            state.categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');

        renderCategoriesTable();
    } catch (err) {
        console.error('Error loading categories:', err);
        showToast('تعذر جلب الأقسام', 'error');
    }
}

function renderCategoriesTable() {
    if (state.categories.length === 0) {
        DOM.categoriesTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">لا توجد أقسام مسجلة. اضغط "إضافة قسم جديد" للبدء.</td></tr>`;
        return;
    }

    DOM.categoriesTableBody.innerHTML = state.categories.map(c => {
        const count = c.productsCount !== undefined ? c.productsCount : '--';
        return `
            <tr>
                <td>
                    <div class="brand-icon" style="width: 36px; height: 36px; font-size: 1rem;">
                        <i class="${c.icon || 'fa-solid fa-bread-slice'}"></i>
                    </div>
                </td>
                <td><strong>${c.name}</strong></td>
                <td><code>${c.slug}</code></td>
                <td><span class="text-muted text-sm">${c.description || 'لا يوجد وصف'}</span></td>
                <td><span class="badge badge-primary">${count} منتج</span></td>
                <td>${c.sortOrder}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit-btn" onclick="openCategoryModal('${c._id}')" title="تعديل القسم">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="confirmDeleteCategory('${c._id}', '${c.name}')" title="حذف القسم">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Open Category Modal (Add / Edit)
function openCategoryModal(categoryId = null) {
    DOM.categoryForm.reset();
    DOM.categoryId.value = '';

    if (categoryId) {
        const cat = state.categories.find(c => c._id === categoryId);
        if (cat) {
            DOM.categoryModalTitle.textContent = 'تعديل قسم: ' + cat.name;
            DOM.categoryId.value = cat._id;
            DOM.catName.value = cat.name;
            DOM.catSlug.value = cat.slug;
            DOM.catIcon.value = cat.icon || 'fa-solid fa-bread-slice';
            DOM.catDesc.value = cat.description || '';
            DOM.catSortOrder.value = cat.sortOrder || 0;
        }
    } else {
        DOM.categoryModalTitle.textContent = 'إضافة قسم جديد';
        DOM.catIcon.value = 'fa-solid fa-bread-slice';
        DOM.catSortOrder.value = state.categories.length + 1;
    }

    openModal(DOM.categoryModal);
}

if (DOM.openAddCategoryModalBtn) {
    DOM.openAddCategoryModalBtn.addEventListener('click', () => openCategoryModal());
}

// Save Category Form
DOM.categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = DOM.categoryId.value;
    const body = {
        name: DOM.catName.value.trim(),
        slug: DOM.catSlug.value.trim(),
        icon: DOM.catIcon.value.trim(),
        description: DOM.catDesc.value.trim(),
        sortOrder: parseInt(DOM.catSortOrder.value, 10) || 0
    };

    try {
        if (id) {
            await apiRequest(`/api/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
            showToast('تم تحديث القسم بنجاح');
        } else {
            await apiRequest('/api/categories', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            showToast('تم إضافة القسم بنجاح');
        }

        closeModal(DOM.categoryModal);
        await loadCategories();
        await loadOverviewStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

function confirmDeleteCategory(id, name) {
    state.currentDeleteTarget = { type: 'category', id, name };
    DOM.deleteModalMessage.textContent = `هل أنت متأكد من حذف قسم "${name}"؟ إذا كان يحتوي على منتجات لن يمكن حذفه.`;
    openModal(DOM.deleteModal);
}

// ==========================================================================
// 7. Products Management
// ==========================================================================
async function loadProducts() {
    const search = DOM.productSearchInput.value.trim();
    const category = DOM.productCategoryFilter.value;
    const status = DOM.productStatusFilter.value;

    let query = '?';
    if (search) query += `search=${encodeURIComponent(search)}&`;
    if (category && category !== 'all') query += `category=${category}&`;
    if (status === 'available') query += `isAvailable=true&isActive=true&`;
    if (status === 'out') query += `isAvailable=false&`;
    if (status === 'inactive') query += `isActive=false&`;

    try {
        const data = await apiRequest(`/api/products/admin${query}`);
        state.products = data.products || [];
        renderProductsTable();
    } catch (err) {
        console.error('Error loading products:', err);
        showToast('تعذر جلب المنتجات', 'error');
    }
}

// Filter listeners with debounce
let searchDebounce;
DOM.productSearchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => loadProducts(), 300);
});
DOM.productCategoryFilter.addEventListener('change', () => loadProducts());
DOM.productStatusFilter.addEventListener('change', () => loadProducts());

function renderProductsTable() {
    if (state.products.length === 0) {
        DOM.productsTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">لا توجد منتجات مطابقة لخيارات البحث</td></tr>`;
        return;
    }

    DOM.productsTableBody.innerHTML = state.products.map(p => {
        const catName = p.category ? p.category.name : 'غير محدد';
        const hasDiscount = p.discountPrice && p.discountPrice < p.price;

        const priceHtml = hasDiscount 
            ? `<div class="price-box"><span class="price-original strike">${p.price} ج.م</span><span class="price-current text-primary">${p.discountPrice} ج.م</span></div>`
            : `<div class="price-box"><span class="price-current">${p.price} ج.م</span></div>`;

        const discountBadge = hasDiscount 
            ? `<span class="badge badge-warning">خصم ${p.price - p.discountPrice} ج.م</span>`
            : `<span class="text-muted text-sm">-</span>`;

        const availBadge = p.isAvailable 
            ? `<button class="badge badge-success" onclick="toggleStatus('${p._id}', 'isAvailable')" title="اضغط للتحويل إلى نفد"><i class="fa-solid fa-circle-check"></i> متوفر</button>`
            : `<button class="badge badge-danger" onclick="toggleStatus('${p._id}', 'isAvailable')" title="اضغط للتحويل إلى متوفر"><i class="fa-solid fa-circle-xmark"></i> نفد</button>`;

        const activeBadge = p.isActive 
            ? `<button class="badge badge-primary" onclick="toggleStatus('${p._id}', 'isActive')" title="معروض بالموقع - اضغط للإخفاء"><i class="fa-solid fa-eye"></i> ظاهر</button>`
            : `<button class="badge badge-gray" onclick="toggleStatus('${p._id}', 'isActive')" title="مخفي من الموقع - اضغط للإظهار"><i class="fa-solid fa-eye-slash"></i> مخفي</button>`;

        return `
            <tr>
                <td>
                    <img src="${p.imageUrl}" alt="${p.name}" class="table-img" onerror="this.src='https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=100&q=80'">
                </td>
                <td>
                    <strong>${p.name}</strong>
                    ${p.tag ? `<span class="badge badge-primary text-sm mt-1 d-block" style="width: fit-content;">${p.tag}</span>` : ''}
                </td>
                <td><span class="badge badge-primary">${catName}</span></td>
                <td>${priceHtml}</td>
                <td>${discountBadge}</td>
                <td>${availBadge}</td>
                <td>${activeBadge}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn price-btn" onclick="openQuickPriceModal('${p._id}')" title="تعديل السعر السريع">
                            <i class="fa-solid fa-coins"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="openProductModal('${p._id}')" title="تعديل بيانات المنتج">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="confirmDeleteProduct('${p._id}', '${p.name}')" title="حذف المنتج">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Toggle Availability or Active
async function toggleStatus(id, field) {
    try {
        const res = await apiRequest(`/api/products/${id}/toggle-status`, {
            method: 'PATCH',
            body: JSON.stringify({ field })
        });
        showToast(res.message);
        await loadProducts();
        await loadOverviewStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==========================================================================
// 8. Add / Edit Product Modal & Image Upload
// ==========================================================================
function openProductModal(productId = null) {
    DOM.productForm.reset();
    DOM.productId.value = '';
    DOM.prodImagePreview.src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';
    setImgTab('upload');

    if (productId) {
        const p = state.products.find(item => item._id === productId);
        if (p) {
            DOM.productModalTitle.textContent = 'تعديل منتج: ' + p.name;
            DOM.productId.value = p._id;
            DOM.prodName.value = p.name;
            DOM.prodCategory.value = p.category ? (p.category._id || p.category) : '';
            DOM.prodPrice.value = p.price;
            DOM.prodDiscountPrice.value = p.discountPrice || '';
            DOM.prodDesc.value = p.description;
            DOM.prodTag.value = p.tag || '';
            DOM.prodImageUrl.value = p.imageUrl || '';
            DOM.prodImagePreview.src = p.imageUrl || '';
            DOM.prodIsAvailable.checked = p.isAvailable;
            DOM.prodIsActive.checked = p.isActive;
            DOM.prodIsFeatured.checked = !!p.isFeatured;
            DOM.prodIsBestSeller.checked = !!p.isBestSeller;
            setImgTab('url');
        }
    } else {
        DOM.productModalTitle.textContent = 'إضافة منتج جديد للمخبز';
        DOM.prodIsAvailable.checked = true;
        DOM.prodIsActive.checked = true;
    }

    openModal(DOM.productModal);
}

if (DOM.openAddProductModalBtn) {
    DOM.openAddProductModalBtn.addEventListener('click', () => openProductModal());
}

// Image Tabs (Upload vs URL)
function setImgTab(tab) {
    if (tab === 'upload') {
        DOM.tabUploadImg.classList.add('active');
        DOM.tabUrlImg.classList.remove('active');
        DOM.uploadImgBox.style.display = 'block';
        DOM.urlImgBox.style.display = 'none';
    } else {
        DOM.tabUrlImg.classList.add('active');
        DOM.tabUploadImg.classList.remove('active');
        DOM.urlImgBox.style.display = 'block';
        DOM.uploadImgBox.style.display = 'none';
    }
}

DOM.tabUploadImg.addEventListener('click', () => setImgTab('upload'));
DOM.tabUrlImg.addEventListener('click', () => setImgTab('url'));

// Live preview when typing URL
DOM.prodImageUrl.addEventListener('input', (e) => {
    if (e.target.value.trim()) {
        DOM.prodImagePreview.src = e.target.value.trim();
    }
});

// Live preview when choosing file
DOM.prodImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            DOM.prodImagePreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Submit Product Form
DOM.productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = DOM.productId.value;
    const saveBtn = document.getElementById('saveProductBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

    try {
        let finalImageUrl = DOM.prodImageUrl.value.trim();

        // 1. If file uploaded, upload it first
        const imageFile = DOM.prodImageFile.files[0];
        if (imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${state.token}` },
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) {
                throw new Error(uploadData.message || 'فشل رفع صورة المنتج');
            }
            finalImageUrl = uploadData.imageUrl;
        }

        if (!finalImageUrl) {
            finalImageUrl = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';
        }

        const body = {
            name: DOM.prodName.value.trim(),
            description: DOM.prodDesc.value.trim(),
            price: parseFloat(DOM.prodPrice.value),
            discountPrice: DOM.prodDiscountPrice.value ? parseFloat(DOM.prodDiscountPrice.value) : null,
            category: DOM.prodCategory.value,
            imageUrl: finalImageUrl,
            tag: DOM.prodTag.value.trim(),
            isAvailable: DOM.prodIsAvailable.checked,
            isActive: DOM.prodIsActive.checked,
            isFeatured: DOM.prodIsFeatured.checked,
            isBestSeller: DOM.prodIsBestSeller.checked
        };

        if (id) {
            await apiRequest(`/api/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
            showToast('تم تحديث المنتج بنجاح');
        } else {
            await apiRequest('/api/products', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            showToast('تمت إضافة المنتج بنجاح');
        }

        closeModal(DOM.productModal);
        await loadProducts();
        await loadOverviewStats();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ المنتج';
    }
});

// ==========================================================================
// 9. Quick Price Update
// ==========================================================================
function openQuickPriceModal(productId) {
    const p = state.products.find(item => item._id === productId);
    if (!p) return;

    DOM.quickPriceProdId.value = p._id;
    DOM.quickPriceProdName.textContent = p.name;
    DOM.quickPriceInput.value = p.price;
    DOM.quickDiscountInput.value = p.discountPrice || '';

    openModal(DOM.quickPriceModal);
}

DOM.quickPriceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = DOM.quickPriceProdId.value;
    const price = parseFloat(DOM.quickPriceInput.value);
    const discountPrice = DOM.quickDiscountInput.value ? parseFloat(DOM.quickDiscountInput.value) : null;

    try {
        await apiRequest(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ price, discountPrice })
        });
        showToast('تم تحديث السعر بنجاح وسينعكس فوراً على الموقع العام');
        closeModal(DOM.quickPriceModal);
        await loadProducts();
        await loadOverviewStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// ==========================================================================
// 10. Delete Confirmation & Execution
// ==========================================================================
function confirmDeleteProduct(id, name) {
    state.currentDeleteTarget = { type: 'product', id, name };
    DOM.deleteModalMessage.textContent = `هل أنت متأكد من حذف منتج "${name}" نهائياً؟`;
    openModal(DOM.deleteModal);
}

DOM.confirmDeleteBtn.addEventListener('click', async () => {
    if (!state.currentDeleteTarget) return;
    const { type, id } = state.currentDeleteTarget;

    try {
        if (type === 'product') {
            await apiRequest(`/api/products/${id}`, { method: 'DELETE' });
            showToast('تم حذف المنتج بنجاح');
            await loadProducts();
        } else if (type === 'category') {
            await apiRequest(`/api/categories/${id}`, { method: 'DELETE' });
            showToast('تم حذف القسم بنجاح');
            await loadCategories();
        }
        await loadOverviewStats();
        closeModal(DOM.deleteModal);
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        state.currentDeleteTarget = null;
    }
});

// ==========================================================================
// 11. Modal Control Helpers
// ==========================================================================
function openModal(modalEl) {
    if (modalEl) modalEl.style.display = 'flex';
}

function closeModal(modalEl) {
    if (modalEl) modalEl.style.display = 'none';
}

// Close button bindings
document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        if (modal) closeModal(modal);
    });
});

// Close modal when clicking on overlay background
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    });
});

// Global functions exposed to inline HTML onclicks
window.openProductModal = openProductModal;
window.openCategoryModal = openCategoryModal;
window.openQuickPriceModal = openQuickPriceModal;
window.confirmDeleteProduct = confirmDeleteProduct;
window.confirmDeleteCategory = confirmDeleteCategory;
window.toggleStatus = toggleStatus;

// ==========================================================================
// 12. App Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

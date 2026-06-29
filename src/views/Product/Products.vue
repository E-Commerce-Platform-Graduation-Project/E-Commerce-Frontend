<template>
  <div class="container-fluid mobile-products-container px-4 py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
      <h1 class="h2 fw-bold text-dark mb-0">المنتجات</h1>
      <router-link to="/add-product" class="btn btn-success d-flex align-items-center gap-2 px-3 py-2">
        <i class="fas fa-plus"></i>
        إضافة منتج جديد
      </router-link>
    </div>

    <div class="row mb-4 g-3">
        <div class="col-lg-12">
            <div class="search-filter-container">
                <div class="search-container">
                    <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="البحث بالاسم أو رقم المعرف..."
                    class="form-control search-input"
                    />
                    <i class="fas fa-search search-icon"></i>
                </div>
                <div class="filter-container">
                    <select v-model="categoryFilter" class="form-control status-filter">
                        <option value="all">جميع الفئات</option>
                        <option v-for="category in categoryHierarchy" :key="category.id" :value="category.id" :class="{ 'parent-category': category.isParent }">
                            {{ category.name }}
                        </option>
                    </select>
                    <i class="fas fa-chevron-down filter-icon"></i>
                </div>
                <div class="filter-container">
                    <select v-model="statusFilter" class="form-control status-filter">
                        <option value="all">كل الحالات</option>
                        <option value="active">المنتجات الظاهرة</option>
                        <option value="inactive">المنتجات المخفية</option>
                        <option value="in_stock">المنتجات المتوفرة</option>
                        <option value="low_stock">المنتجات منخفضة المخزون</option>
                        <option value="out_of_stock">المنتجات منتهية المخزون</option>
                    </select>
                    <i class="fas fa-chevron-down filter-icon"></i>
                </div>
            </div>
        </div>
    </div>
    
    <div class="row mb-3">
      <div class="col-12">
        <div class="pagination-info">
          <span class="info-text">
            عرض {{ totalProducts > 0 ? startIndex + 1 : 0 }} - {{ endIndex }} من {{ totalProducts }} منتج
          </span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-dark" role="status"></div>
      <p class="mt-2 text-muted">جاري تحميل المنتجات...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="productsForDisplay.length > 0" class="products-wrapper">
      <div class="table-scroll-container">
        <ProductsList
            :products="productsForDisplay"
            @view-details="openDetailsModal"
            @edit-product="openEditModal"
        />
      </div>
    </div>
    
    <div v-else class="text-center py-5">
        <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
        <h4 class="text-muted">لا توجد منتجات تطابق البحث أو الفلاتر</h4>
        <p>حاول تغيير كلمات البحث أو الفلاتر المستخدمة.</p>
    </div>

    <div v-if="!isLoading && !error && totalProducts > 0" class="pagination-wrapper">
      <div class="pagination-container">
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="pagination-btn prev-btn">
          <i class="fas fa-chevron-right"></i>
          السابق
        </button>
        
        <div class="page-numbers">
          <button v-for="(page, index) in visiblePages" :key="index" @click="goToPage(page)"
            :class="['page-number', { 'active': page === currentPage, 'disabled': typeof page !== 'number' }]"
            :disabled="typeof page !== 'number'">
            {{ page }}
          </button>
        </div>

        <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
          class="pagination-btn next-btn">
          التالي
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>
      
      <div class="page-jump-container">
        <span class="page-jump-label">الانتقال إلى الصفحة:</span>
        <input 
          v-model.number="pageJumpInput" 
          type="number" 
          :min="1" 
          :max="totalPages"
          @keyup.enter="jumpToPage"
          @input="handlePageInputChange"
          class="page-jump-input"
          placeholder="رقم"
        />
        <button @click="jumpToPage" class="page-jump-btn" :disabled="!pageJumpInput">
          <i class="fas fa-arrow-left"></i>
        </button>
        <span class="page-jump-info">من {{ totalPages }}</span>
      </div>
    </div>


    <ProductDetails
        v-if="isDetailsModalVisible"
        :product="selectedProduct"
        @close="closeDetailsModal"
        @edit-product="handleEditFromDetails"
    />

    <EditProduct
        v-if="isEditModalVisible"
        :product="selectedProduct"
        @close="closeEditModal"
        @product-updated="handleProductUpdate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import EditProduct from '@/components/Product/EditProduct.vue';
import ProductDetails from '@/components/Product/ProductDetails.vue';
import ProductsList from '@/components/Product/ProductsList.vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const productStore = useProductStore();
const categoryStore = useCategoryStore();

// State for filters and modals
const searchQuery = ref('');
const categoryFilter = ref('all');
const statusFilter = ref('all');
const isEditModalVisible = ref(false);
const isDetailsModalVisible = ref(false);
const selectedProduct = ref(null);

// --- State for pagination ---
const currentPage = ref(parseInt(route.query.page) || 1);
const itemsPerPage = ref(10);
const pageJumpInput = ref('');

// Computed properties
const isLoading = computed(() => productStore.isLoading || categoryStore.isLoading);
const error = computed(() => productStore.error || categoryStore.error);

const categoryHierarchy = computed(() => {
    const hierarchy = [];
    const mainCategories = categoryStore.getMainCategories;
    mainCategories.forEach(main => {
        hierarchy.push({ id: main.id, name: main.name, isParent: true });
        const subCategories = categoryStore.getSubcategoriesByParent(main.id);
        subCategories.forEach(sub => {
            hierarchy.push({ id: sub.id, name: `\u00A0\u00A0\u00A0 ${sub.name}`, isParent: false });
        });
    });
    return hierarchy;
});

// --- Pagination computed properties ---
const totalProducts = computed(() => productStore.getProductsCount);

const totalPages = computed(() => {
  if (totalProducts.value === 0) return 1;
  return Math.ceil(totalProducts.value / itemsPerPage.value);
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const endIndex = computed(() => {
  const end = startIndex.value + itemsPerPage.value;
  return Math.min(end, totalProducts.value);
});

const visiblePages = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;
    const pageWindow = 5;
    const pages = [];

    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
        return pages;
    }

    if (current <= pageWindow - 2) {
        for (let i = 1; i <= pageWindow; i++) {
            pages.push(i);
        }
        pages.push('...');
        pages.push(total);
    }
    else if (current > total - (pageWindow - 2)) {
        pages.push(1);
        pages.push('...');
        for (let i = total - pageWindow + 1; i <= total; i++) {
            pages.push(i);
        }
    }
    else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
    }
    
    return pages;
});

// All filters are now handled by API
const productsForDisplay = computed(() => {
  const products = productStore.getAllProducts;

  return products.map(product => {
      const displayImage = product.mainImage ||
                          product.variants?.[0]?.images?.[0] ||
                          'https://placehold.co/300x300/eee/ccc?text=No+Image';
      return { ...product, displayImage };
  });
});

// Update URL query params without reloading
const updateUrlParams = () => {
  const query = { ...route.query };
  
  if (currentPage.value > 1) {
    query.page = currentPage.value.toString();
  } else {
    delete query.page;
  }
  
  router.replace({ query });
};

// Fetch products with all filters via API
const fetchProductsWithFilters = () => {
  const params = {
    page: currentPage.value,
    search: searchQuery.value
  };
  
  // Add category filter if not 'all'
  if (categoryFilter.value !== 'all') {
    params.category = categoryFilter.value;
  }
  
  // Add status/availability filters based on selected option
  if (statusFilter.value !== 'all') {
    switch (statusFilter.value) {
      case 'active':
        params.is_active = true;
        break;
      case 'inactive':
        params.is_active = false;
        break;
      case 'in_stock':
        params.availability = 'available';
        break;
      case 'out_of_stock':
        params.availability = 'out_of_stock';
        break;
      case 'low_stock':
        params.low_stock = true;
        break;
    }
  }
  
  // Update URL with current page
  updateUrlParams();
  
  productStore.fetchProducts(params);
};

// Watcher for search query with debounce
let debounceTimer = null;
watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchProductsWithFilters();
  }, 500);
});

// Watcher for category filter
watch(categoryFilter, () => {
  currentPage.value = 1;
  fetchProductsWithFilters();
});

// Watcher for status filter
watch(statusFilter, () => {
  currentPage.value = 1;
  fetchProductsWithFilters();
});

watch(totalPages, (newTotalPages) => {
  if (currentPage.value > newTotalPages && newTotalPages > 0) {
    currentPage.value = newTotalPages;
  } else if (newTotalPages === 0) {
    currentPage.value = 1;
  }
});

// Methods
onMounted(() => {
  // Initialize from URL query params
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page) || 1;
  }
  
  fetchProductsWithFilters();
  categoryStore.fetchCategories();
  
  const openProductId = route.query.openProduct;
  if (openProductId) {
    openDetailsModal({ id: parseInt(openProductId) });
  }
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && typeof page === 'number') {
    currentPage.value = page;
    fetchProductsWithFilters();
  }
};

const jumpToPage = () => {
  const page = parseInt(pageJumpInput.value);
  
  if (!pageJumpInput.value || isNaN(page)) {
    alert('الرجاء إدخال رقم صفحة صحيح');
    return;
  }
  
  if (page < 1) {
    alert(`رقم الصفحة يجب أن يكون 1 أو أكثر`);
    pageJumpInput.value = '';
    return;
  }
  
  if (page > totalPages.value) {
    alert(`رقم الصفحة يجب أن يكون ${totalPages.value} أو أقل`);
    pageJumpInput.value = '';
    return;
  }
  
  goToPage(page);
  pageJumpInput.value = '';
};

const handlePageInputChange = () => {
  if (pageJumpInput.value < 1) {
    pageJumpInput.value = '';
  }
  if (pageJumpInput.value > totalPages.value) {
    pageJumpInput.value = totalPages.value;
  }
};

const openDetailsModal = async (product) => {
    const result = await productStore.fetchProductDetails(product.id);
    if (result.success) {
        selectedProduct.value = result.data;
        isDetailsModalVisible.value = true;
    } else {
        console.error("Failed to fetch product details:", result.error);
    }
};

const closeDetailsModal = () => {
    isDetailsModalVisible.value = false;
    selectedProduct.value = null;
};

const openEditModal = async (product) => {
    const result = await productStore.fetchProductDetails(product.id);
    if (result.success) {
        selectedProduct.value = { ...result.data };
        isEditModalVisible.value = true;
    } else {
        console.error("Failed to fetch product details for editing:", result.error);
    }
};

const closeEditModal = () => {
    isEditModalVisible.value = false;
    if (!isDetailsModalVisible.value) {
        selectedProduct.value = null;
    }
};

const handleEditFromDetails = () => {
  isEditModalVisible.value = true;
};

const handleProductUpdate = () => {
    const updatedProduct = productStore.getProductById(selectedProduct.value.id);
    if (isDetailsModalVisible.value && updatedProduct) {
        selectedProduct.value = updatedProduct;
    }
    closeEditModal();
};
</script>

<style scoped>
/* IMPORTANT: Allow horizontal scroll on mobile */
:deep(.main-content) {
  overflow-x: visible !important;
}

@media (max-width: 1170px) {
  :deep(.main-content),
  :deep(.p-3),
  :deep(.p-md-4) {
    overflow-x: visible !important;
    overflow-y: visible !important;
  }
}

/* Container adjustments */
.mobile-products-container {
  overflow: visible;
}

@media (max-width: 1170px) {
  .mobile-products-container {
    overflow-x: hidden !important;
    overflow-y: visible !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
}

/* --- Styles for search/filter and info --- */
.search-filter-container {
  display: flex;
  gap: 20px;
  align-items: center;
}
.search-container {
  position: relative;
  flex: 1;
}
.search-input, .status-filter {
  padding: 18px 50px 18px 20px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 18px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  text-align: right;
  direction: rtl;
  width: 100%;
}
.search-input:focus, .status-filter:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 4px 20px rgba(0, 123, 255, 0.2);
}
.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 18px;
}
.filter-container {
  position: relative;
  min-width: 220px;
}

@media (max-width: 1170px) {
  .filter-container {
    min-width: 100%;
  }
}

.status-filter {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
.filter-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
}

@media (max-width: 1170px) {
  .filter-icon {
    left: 15px;
  }
}

.parent-category {
    font-weight: bold;
    color: #000;
}

.pagination-info {
  text-align: center;
  margin-bottom: 15px;
}

.info-text {
  color: #6c757d;
  font-size: 14px;
  background-color: #f8f9fa;
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
}

/* Products wrapper and scroll container */
.products-wrapper {
  position: relative;
  width: 100%;
  overflow: visible;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
}

@media (max-width: 1170px) {
  .products-wrapper {
    overflow: visible !important;
    max-width: 100vw;
    width: calc(100% + 1rem);
  }
}

.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

@media (max-width: 1170px) {
  .table-scroll-container {
    overflow-x: scroll !important;
    overflow-y: visible !important;
    border-radius: 0 0 12px 12px;
    width: 100%;
    max-width: 100%;
  }
}

.table-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* PAGINATION STYLES */
.pagination-wrapper {
  margin-top: 30px;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 15px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #292929;
  color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(29, 29, 29, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.page-numbers {
  display: flex;
  flex-wrap: nowrap; 
  gap: 5px;
  margin: 0 15px; 
}

.page-number {
  min-width: 40px;
  height: 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover:not(.disabled) {
  border-color: #313131;
  color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(131, 131, 131, 0.2);
}

.page-number.active {
  border-color: #313131;
  background: #0f0f0f;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.page-number.active:hover {
  border-color: #b9b9b9;
  color: rgb(189, 189, 189);
  transform: translateY(-2px);
}

.page-number.disabled {
  cursor: default;
  background-color: #f8f9fa;
  border-color: #e9ecef;
}

.page-jump-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-jump-label {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.page-jump-input {
  width: 70px;
  height: 40px;
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  direction: ltr;
}

.page-jump-input:focus {
  outline: none;
  border-color: #313131;
  box-shadow: 0 0 0 3px rgba(49, 49, 49, 0.1);
}

.page-jump-input::-webkit-inner-spin-button,
.page-jump-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-jump-input[type=number] {
  -moz-appearance: textfield;
}

.page-jump-input:invalid {
  border-color: #dc3545;
}

.page-jump-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-jump-btn:hover:not(:disabled) {
  border-color: #313131;
  color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(29, 29, 29, 0.2);
}

.page-jump-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-jump-info {
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
}

/* Responsive design */
@media (max-width: 1170px) {
  .products-wrapper {
    overflow: visible !important;
    max-width: 100vw;
    width: calc(100% + 1rem);
  }
  
  .table-scroll-container {
    overflow-x: scroll !important;
    overflow-y: visible !important;
  }
  
  .search-filter-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .search-container {
    width: 100%;
  }
  
  .filter-container {
    width: 100%;
    min-width: 100%;
  }
  
  .search-input,
  .status-filter {
    width: 100%;
  }
  
  .pagination-container {
    flex-direction: column;
    gap: 20px;
  }

  .page-numbers {
    order: -1;
  }

  .page-jump-container {
    margin-top: 0;
  }
  
  .row {
    margin-left: 0;
    margin-right: 0;
    max-width: 95%;
  }
  
  .col-lg-12 {
    padding-left: 0;
    padding-right: 0;
  }
}

@media (max-width: 500px) {
  .search-input,
  .status-filter {
    padding: 14px 45px 14px 15px;
    font-size: 16px;
  }
  
  .search-icon {
    right: 15px;
    font-size: 16px;
  }
  
  .filter-icon {
    left: 15px;
  }
  
  .pagination-container {
    padding: 15px 10px;
  }

  .pagination-btn {
    padding: 8px 12px;
    font-size: 12px;
    gap: 5px;
    min-width: 80px;
  }
  
  .page-numbers {
    gap: 3px;
    margin: 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-number {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
    padding: 0;
  }

  .page-jump-container {
    padding: 12px 15px;
  }

  .page-jump-label {
    font-size: 12px;
  }

  .page-jump-input {
    width: 60px;
    height: 32px;
    font-size: 12px;
    padding: 6px 8px;
  }

  .page-jump-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .page-jump-info {
    font-size: 12px;
  }
  
  .search-filter-container {
    gap: 12px;
  }
}
</style>
<template>
  <div class="container-fluid px-4 py-4">
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

    <ProductsList
        v-else-if="productsForDisplay.length > 0"
        :products="productsForDisplay"
        @view-details="openDetailsModal"
        @edit-product="openEditModal"
    />
    
    <div v-else class="text-center py-5">
        <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
        <h4 class="text-muted">لا توجد منتجات تطابق البحث أو الفلاتر</h4>
        <p>حاول تغيير كلمات البحث أو الفلاتر المستخدمة.</p>
    </div>

    <div v-if="!isLoading && !error && totalProducts > 0" class="pagination-container">
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
import { useRoute } from 'vue-router';

const route = useRoute();

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
const currentPage = ref(1);
const itemsPerPage = ref(10); // API default is 10

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
    const pageWindow = 5; // The number of pages to show in a sequence at the start/end
    const pages = [];

    // If there are 7 or fewer pages in total, show all of them.
    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
        return pages;
    }

    // Case 1: The current page is near the beginning.
    if (current <= pageWindow - 2) {
        for (let i = 1; i <= pageWindow; i++) {
            pages.push(i);
        }
        pages.push('...');
        pages.push(total);
    }
    // Case 2: The current page is near the end.
    else if (current > total - (pageWindow - 2)) {
        pages.push(1);
        pages.push('...');
        for (let i = total - pageWindow + 1; i <= total; i++) {
            pages.push(i);
        }
    }
    // Case 3: The current page is in the middle.
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


// This computed applies client-side filters to the paginated data from the store
const productsForDisplay = computed(() => {
  // Start with the products for the current page from the store
  let products = productStore.getAllProducts;

  // Apply client-side category filter
  if (categoryFilter.value !== 'all') {
    products = products.filter(product => {
        const selectedCatId = parseInt(categoryFilter.value);
        const isParent = categoryStore.getMainCategories.some(cat => cat.id === selectedCatId);
        if (isParent) {
            const childIds = categoryStore.getSubcategoriesByParent(selectedCatId).map(sub => sub.id);
            return childIds.includes(product.categoryId);
        } else {
            return product.categoryId === selectedCatId;
        }
    });
  }

  // Apply client-side status filter
  if (statusFilter.value !== 'all') {
    products = products.filter(product => {
        const status = statusFilter.value;
        if (status === 'active') return product.is_active;
        if (status === 'inactive') return !product.is_active;
        
        const quantity = productStore.getProductTotalQuantity(product.id);
        if (status === 'out_of_stock') return quantity <= 0;
        if (status === 'low_stock') return quantity > 0 && quantity <= 15;
        if (status === 'in_stock') return quantity > 15;
        return true;
    });
  }

  // Map to add displayImage property
  return products.map(product => {
      const displayImage = product.mainImage ||
                          product.variants?.[0]?.images?.[0] ||
                          'https://placehold.co/300x300/eee/ccc?text=No+Image';
      return { ...product, displayImage };
  });
});


// Watcher for search query with debounce
let debounceTimer = null;
watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1; // Reset to first page on new search
    productStore.fetchProducts({ page: 1, search: newQuery });
  }, 500); // 500ms delay
});


// Methods
onMounted(() => {
  productStore.fetchProducts(); // Fetch initial data for page 1
  categoryStore.fetchCategories();
  const openProductId = route.query.openProduct;
  if (openProductId) {
    // Fetch the product details and open the modal
    openDetailsModal({ id: parseInt(openProductId) });
  }
});

// Method to change pages
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && typeof page === 'number') {
    currentPage.value = page;
    productStore.fetchProducts({ page: page, search: searchQuery.value });
  }
};

// Modal handling methods remain the same
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

/* PAGINATION STYLES */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
</style>
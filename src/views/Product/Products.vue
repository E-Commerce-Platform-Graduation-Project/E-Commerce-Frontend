<template>
  <div class="container-fluid px-4 py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
      <h1 class="h2 fw-bold text-dark mb-0">المنتجات</h1>
      <router-link to="/products/add" class="btn btn-success d-flex align-items-center gap-2 px-3 py-2">
        <i class="fas fa-plus"></i>
        إضافة منتج جديد
      </router-link>
    </div>

    <!-- Filters -->
    <div class="row mb-4 g-3">
        <div class="col-lg-12">
            <div class="search-filter-container">
                <div class="search-container">
                    <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="البحث باسم المنتج..."
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
                    </select>
                    <i class="fas fa-chevron-down filter-icon"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading & Error States -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">جاري تحميل المنتجات...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Products Grid -->
    <div v-else-if="filteredProducts.length > 0" class="row g-4">
      <div v-for="product in filteredProducts" :key="product.id" class="col-xl-3 col-lg-4 col-md-6">
        <div class="card product-card h-100" :class="{ 'product-disabled': !product.is_active }" @click="openDetailsModal(product)">
          <img :src="product.images[0]" class="card-img-top" :alt="product.name" @error="onImageError">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ product.name }}</h5>
            <p class="card-text text-muted small flex-grow-1">{{ getCategoryName(product.categoryId) }}</p>
            
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="price fw-bold fs-5">{{ product.sellingPrice }} دينار</span>
              <span class="badge" :class="getStockBadgeClass(product.quantity)">
                {{ getStockStatus(product.quantity) }}
              </span>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top" @click.stop>
                <div class="status-toggle-container">
                    <button 
                        @click="productStore.toggleProductStatus(product.id)"
                        :class="['status-toggle', { 'active': product.is_active }]"
                        >
                        <div class="toggle-slider"></div>
                    </button>
                    <label class="form-check-label small">
                        {{ product.is_active ? 'ظاهر' : 'مخفي' }}
                    </label>
                </div>
              <button class="btn btn-outline-secondary btn-sm" @click="openEditModal(product)">
                <i class="fas fa-pen"></i> تعديل
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-5">
        <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
        <h4 class="text-muted">لا توجد منتجات تطابق الفلتر</h4>
        <p>حاول تغيير كلمات البحث أو الفلاتر المستخدمة.</p>
    </div>

    <!-- Product Details Modal -->
    <ProductDetails
        v-if="isDetailsModalVisible"
        :product="selectedProduct"
        @close="closeDetailsModal"
        @edit-product="handleEditFromDetails"
    />

    <!-- Edit Product Modal -->
    <EditProduct 
        v-if="isEditModalVisible" 
        :product="selectedProduct" 
        @close="closeEditModal"
        @product-updated="handleProductUpdate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import EditProduct from '@/components/Product/EditProduct.vue'; 
import ProductDetails from '@/components/Product/ProductDetails.vue';

const productStore = useProductStore();
const categoryStore = useCategoryStore();

// State for filters and modals
const searchQuery = ref('');
const categoryFilter = ref('all');
const statusFilter = ref('all');
const isEditModalVisible = ref(false);
const isDetailsModalVisible = ref(false);
const selectedProduct = ref(null);

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
            hierarchy.push({ id: sub.id, name: ` ${sub.name}`, isParent: false });
        });
    });
    return hierarchy;
});

const filteredProducts = computed(() => {
  return productStore.getAllProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    let matchesCategory = true;
    if (categoryFilter.value !== 'all') {
        const selectedCatId = parseInt(categoryFilter.value);
        const isParent = categoryStore.getMainCategories.some(cat => cat.id === selectedCatId);
        
        if (isParent) {
            const childIds = categoryStore.getSubcategoriesByParent(selectedCatId).map(sub => sub.id);
            matchesCategory = childIds.includes(product.categoryId);
        } else {
            matchesCategory = product.categoryId === selectedCatId;
        }
    }
    
    const matchesStatus = statusFilter.value === 'all' || (statusFilter.value === 'active' ? product.is_active : !product.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
});

// Methods
onMounted(() => {
  productStore.fetchProducts();
  categoryStore.fetchCategories();
});

const getCategoryName = (categoryId) => {
    const category = categoryStore.getAllCategories.find(cat => cat.id == categoryId);
    return category ? category.name : 'فئة غير معروفة';
};

const getStockStatus = (quantity) => {
    if (quantity > 10) return 'متوفر';
    if (quantity > 0) return 'كمية محدودة';
    return 'نفذ المخزون';
};

const getStockBadgeClass = (quantity) => {
    if (quantity > 10) return 'bg-success-subtle text-success-emphasis';
    if (quantity > 0) return 'bg-warning-subtle text-warning-emphasis';
    return 'bg-danger-subtle text-danger-emphasis';
};

const onImageError = (event) => {
    event.target.src = 'https://placehold.co/600x600/CCCCCC/FFFFFF?text=No+Image';
};

const openDetailsModal = (product) => {
    selectedProduct.value = product;
    isDetailsModalVisible.value = true;
};

const closeDetailsModal = () => {
    isDetailsModalVisible.value = false;
    selectedProduct.value = null;
};

const openEditModal = (product) => {
    selectedProduct.value = { ...product };
    isEditModalVisible.value = true;
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
/* Search and Filter Styling */
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
  padding: 12px 45px 12px 20px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  background-color: white;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  text-align: right;
  direction: rtl;
  width: 100%;
}
.search-input:focus, .status-filter:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 2px 10px rgba(0, 123, 255, 0.15);
}
.search-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}
.filter-container {
  position: relative;
  min-width: 200px;
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

/* Product Card Styling */
.product-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, opacity 0.3s ease-in-out;
  border: 1px solid #e9ecef;
  cursor: pointer;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
.product-disabled {
    opacity: 0.6;
}
.product-disabled:hover {
    transform: none;
    box-shadow: none;
}
.card-img-top {
  height: 200px;
  object-fit: cover;
}
.price {
  color: #329c32;
}

/* Custom Toggle Switch */
.status-toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status-toggle {
  position: relative;
  width: 50px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: #dc3545;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}
.status-toggle.active {
  background-color: #198754;
}
.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
.status-toggle.active .toggle-slider {
  transform: translateX(26px);
}
</style>
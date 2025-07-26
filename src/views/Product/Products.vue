<template>
  <div class="container-fluid px-4 py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
      <h1 class="h2 fw-bold text-dark mb-0">المنتجات</h1>
      <router-link to="/products/add" class="btn btn-success d-flex align-items-center gap-2 px-3 py-2">
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

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
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
        <h4 class="text-muted">لا توجد منتجات تطابق الفلتر</h4>
        <p>حاول تغيير كلمات البحث أو الفلاتر المستخدمة.</p>
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
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import EditProduct from '@/components/Product/EditProduct.vue'; 
import ProductDetails from '@/components/Product/ProductDetails.vue';
import ProductsList from '@/components/Product/ProductsList.vue'; 

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
            // Indent sub-category names for better readability
            hierarchy.push({ id: sub.id, name: `\u00A0\u00A0\u00A0 ${sub.name}`, isParent: false });
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

// NEW: Prepares products for display, adding a 'displayImage' property.
// This allows child components like ProductsList to easily show a thumbnail.
const productsForDisplay = computed(() => {
    return filteredProducts.value.map(product => {
        // Find the first image from the first color variant to use as the main display image.
        const firstVariant = product.variants?.[0];
        const displayImage = firstVariant?.images?.[0] || 'https://placehold.co/300x300/eee/ccc?text=No+Image';

        return {
            ...product,
            displayImage // Add the calculated display image to the product object
        };
    });
});


// Methods
onMounted(() => {
  productStore.fetchProducts();
  categoryStore.fetchCategories();
});

const openDetailsModal = (product) => {
    // The product object received from the event already contains all original data
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
    // Re-fetch the product from the store to ensure data is fresh
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
</style>
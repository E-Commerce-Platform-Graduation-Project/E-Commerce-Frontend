<template>
  <div class="products-container">
    <!-- List Header -->
    <div class="product-header">
      <div class="header-item name">المنتج</div>
      <div class="header-item id">رقم المعرف</div>
      <div class="header-item category">الفئة</div>
      <div class="header-item purchase-price">سعر الشراء</div>
      <div class="header-item selling-price">سعر البيع</div>
      <div class="header-item quantity">الكمية</div>
      <div class="header-item stock-status">الحالة</div>
      <div class="header-item actions text-center">الإجراء</div>
    </div>

    <!-- Product Rows -->
    <div 
      v-for="product in products" 
      :key="product.id"
      class="product-row"
      :class="{ 'disabled-product': !product.is_active }"
      @click="$emit('view-details', product)"
    >
      <!-- Product Name & Image -->
      <div class="product-info">
        <img :src="product.images[0]" class="product-image" alt="Product Image" @error="onImageError">
        <div class="product-details">
          <div class="product-name">{{ product.name }}</div>
        </div>
      </div>

      <!-- Product ID -->
      <div class="product-id">#{{ product.id }}</div>

      <!-- Category Path -->
      <div class="product-category">{{ getCategoryPath(product.categoryId) }}</div>

      <!-- Purchase Price -->
      <div class="product-price purchase">{{ product.purchasePrice }} دينار</div>
      
      <!-- Selling Price -->
      <div class="product-price selling">{{ product.sellingPrice }} دينار</div>

      <!-- Quantity -->
      <div class="product-quantity">{{ product.quantity }} {{ getQuantityUnit(product.quantity) }}</div>

      <!-- Stock Status -->
      <div class="product-stock-status">
        <span class="badge" :class="getStockBadgeClass(product.quantity)">
          {{ getStockStatus(product.quantity) }}
        </span>
      </div>

      <!-- Actions (Toggle & Edit) -->
      <div class="product-actions" @click.stop>
        <div class="status-toggle-container">
            <button 
                @click="productStore.toggleProductStatus(product.id)"
                :class="['status-toggle', { 'active': product.is_active }]"
                >
                <div class="toggle-slider"></div>
            </button>
        </div>
        <button class="btn btn-outline-secondary btn-sm edit-btn" @click="$emit('edit-product', product)">
            <i class="fas fa-pen"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';

defineProps({
  products: {
    type: Array,
    required: true,
  },
});

defineEmits(['view-details', 'edit-product']);

const productStore = useProductStore();
const categoryStore = useCategoryStore();

const getCategoryPath = (subCategoryId) => {
    const subCategory = categoryStore.getCategoryById(subCategoryId);
    if (!subCategory) return 'غير معروف';
    
    if (subCategory.parentCategoryID) {
        const parentCategory = categoryStore.getCategoryById(subCategory.parentCategoryID);
        if (parentCategory) {
            return `${parentCategory.name} -> ${subCategory.name}`;
        }
    }
    return subCategory.name; // It might be a main category
};

const getQuantityUnit = (quantity) => {
    if (quantity >= 3 && quantity <= 10) {
        return 'قطع';
    }
    return 'قطعة';
};

const getStockStatus = (quantity) => {
    if (quantity <= 0) return 'نفذ المخزون';
    if (quantity <= 15) return 'منخفض';
    return 'متوفر';
};

const getStockBadgeClass = (quantity) => {
    if (quantity <= 0) return 'bg-danger-subtle text-danger-emphasis';
    if (quantity <= 15) return 'bg-warning-subtle text-warning-emphasis';
    return 'bg-success-subtle text-success-emphasis';
};

const onImageError = (event) => {
    event.target.src = 'https://placehold.co/60x60/CCCCCC/FFFFFF?text=N/A';
};
</script>

<style scoped>
.products-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.product-header {
  display: grid;
  grid-template-columns: 2.5fr 1fr 1.5fr 1fr 1fr 0.8fr 1fr 1.2fr;
  gap: 20px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  color: #495057;
  text-align: right;
}

.header-item {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #2c3e50;
  font-weight: 600;
}

.product-row {
  display: grid;
  grid-template-columns: 2.5fr 1fr 1.5fr 1fr 1fr 0.8fr 1fr 1.2fr;
  gap: 20px;
  padding: 15px 25px;
  border-bottom: 1px solid #f1f3f4;
  align-items: center;
  transition: all 0.3s ease;
  text-align: right;
  cursor: pointer;
}

.product-row:hover {
  background-color: #f8f9fc;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.product-row:last-child {
  border-bottom: none;
}

.disabled-product {
  opacity: 0.5;
  background-color: #f8f9fa;
}

.disabled-product:hover {
    transform: none;
    box-shadow: none;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.product-image {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #e9ecef;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.product-id, .product-category, .product-price, .product-quantity {
    font-size: 15px;
    color: #212529;
    font-weight: 500;
}

.product-price.selling {
    font-weight: 600;
    color: #198754;
}
.product-price.purchase {
    color: #495057;
    font-weight: 500;
}

.product-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.edit-btn {
    padding: 5px 10px;
}

/* Custom Toggle Switch */
.status-toggle-container {
  display: flex;
  align-items: center;
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
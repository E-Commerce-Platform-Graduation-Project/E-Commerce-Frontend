<template>
  <div class="products-container">
    <div class="product-header bg-dark text-white">
      <div class="header-item expand"></div>
      <div class="header-item name">المنتج</div>
      <div class="header-item id">رقم المعرف</div>
      <div class="header-item category">الفئة</div>
      <div class="header-item purchase-price">سعر الشراء</div>
      <div class="header-item selling-price">سعر البيع</div>
      <div class="header-item quantity">الكمية</div>
      <div class="header-item stock-status">الحالة</div>
      <div class="header-item actions text-center">الإجراء</div>
    </div>

    <div v-for="product in products" :key="product.id">
      <div class="product-row"
        :class="{ 'disabled-product': !product.is_active, 'expanded': expandedProducts[product.id] }" 
        @click="$emit('view-details', product)">
        
        <div class="expand-arrow" @click.stop="toggleProductExpansion(product.id)">
          <i class="fas fa-chevron-down" 
             :class="{ 'rotated': expandedProducts[product.id] }"></i>
        </div>

        <div class="product-info">
          <img :src="product.mainImage" class="product-image" alt="Product Image" @error="onImageError">
          <div class="product-details">
            <div class="product-name">{{ product.name }}</div>
          </div>
        </div>

        <div class="product-id">#{{ product.id }}</div>

        <div class="product-category">{{ getCategoryPath(product.categoryId) }}</div>

        <div class="product-price purchase">{{ product.purchasePrice }} دينار</div>

        <div class="product-price selling">{{ product.sellingPrice }} دينار</div>

        <div class="product-quantity">
          {{ productStore.getProductTotalQuantity(product.id) }}
          {{ getQuantityUnit(productStore.getProductTotalQuantity(product.id)) }}
        </div>

        <div class="product-stock-status">
          <span class="badge" :class="getStockBadgeClass(productStore.getProductTotalQuantity(product.id))">
            {{ getStockStatus(productStore.getProductTotalQuantity(product.id)) }}
          </span>
        </div>

        <div class="product-actions" @click.stop>
          <div class="status-toggle-container">
            <button @click="productStore.toggleProductStatus(product.id)"
              :class="['status-toggle', { 'active': product.is_active }]">
              <div class="toggle-slider"></div>
            </button>
          </div>
          <button class="btn btn-outline-secondary btn-sm edit-btn" @click="$emit('edit-product', product)">
            <i class="fas fa-pen"></i>
          </button>
        </div>
      </div>
      
      <Transition name="slide-fade">
        <div v-if="expandedProducts[product.id]" class="variants-container">
          <div class="variants-header">
            <div class="variant-header-item image">الصورة</div>
            <div class="variant-header-item sku">رقم SKU</div>
            <div class="variant-header-item variant-id">معرف المتغير</div>
            <div class="variant-header-item attributes">الخصائص</div>
            <div class="variant-header-item quantity">الكمية</div>
          </div>
          
          <div v-for="variant in getProductVariants(product)" :key="variant.id" class="variant-row">
            <div class="variant-image">
              <img :src="getVariantImage(product, variant)" 
                   class="variant-img" 
                   alt="Variant Image" 
                   @error="onVariantImageError">
            </div>
            
            <div class="variant-sku">{{ variant.sku }}</div>
            
            <div class="variant-id">#{{ variant.id }}</div>
            
            <div class="variant-attributes">
              <!-- MODIFIED: Logic now uses a helper to identify color attributes -->
              <div v-for="attr in variant.attribute_values" :key="attr.attribute_name" class="attribute-tag">
                <span class="attr-name">{{ attr.attribute_name }}:</span>
                <span class="attr-value" 
                      :style="isHexColor(attr.value) ? { 
                        backgroundColor: attr.value, 
                        color: getContrastColor(attr.value),
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      } : {}">
                  {{ attr.value }}
                </span>
              </div>
            </div>
            
            <div class="variant-quantity">
              <span :class="getVariantQuantityClass(variant.quantity_in_stock)">
                {{ variant.quantity_in_stock }} {{ getQuantityUnit(variant.quantity_in_stock) }}
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
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
const expandedProducts = ref({});

const toggleProductExpansion = (productId) => {
  expandedProducts.value[productId] = !expandedProducts.value[productId];
};

const getProductVariants = (product) => {
  const rawProduct = productStore.getProductById(product.id);
  return rawProduct?.rawVariants || [];
};

// NEW: Helper to check if a string is a hex color code.
const isHexColor = (value) => {
  if (typeof value !== 'string') return false;
  return /^#[0-9A-F]{6}$/i.test(value);
};

// MODIFIED: This function now dynamically finds the color attribute value.
const getVariantImage = (product, variant) => {
  const colorAttribute = variant.attribute_values?.find(attr => isHexColor(attr.value));
  const colorHex = colorAttribute?.value;

  if (!colorHex) return product.mainImage || 'https://placehold.co/40x40/CCCCCC/FFFFFF?text=N/A';
  
  const colorVariant = product.variants?.find(v => v.colorHex.toLowerCase() === colorHex.toLowerCase());
  if (colorVariant && colorVariant.images && colorVariant.images.length > 0) {
    return colorVariant.images[0];
  }
  
  return product.mainImage || 'https://placehold.co/40x40/CCCCCC/FFFFFF?text=N/A';
};

const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const getVariantQuantityClass = (quantity) => {
  if (quantity <= 0) return 'quantity-out';
  if (quantity <= 10) return 'quantity-low';
  return 'quantity-good';
};

const getCategoryPath = (subCategoryId) => {
  const subCategory = categoryStore.getCategoryById(subCategoryId);
  if (!subCategory) return 'غير معروف';
  if (subCategory.parentCategoryID) {
    const parentCategory = categoryStore.getCategoryById(subCategory.parentCategoryID);
    if (parentCategory) {
      return `${parentCategory.name} -> ${subCategory.name}`;
    }
  }
  return subCategory.name;
};

const getQuantityUnit = (quantity) => {
  return (quantity >= 3 && quantity <= 10) ? 'قطع' : 'قطعة';
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

const onVariantImageError = (event) => {
  event.target.src = 'https://placehold.co/40x40/CCCCCC/FFFFFF?text=N/A';
};
</script>

<style scoped>
/* NEW CSS: Added styles for the slide-fade animation */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: max-height 0.4s ease-in-out, opacity 0.3s ease-out;
  overflow: hidden;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 1000px; /* A large value to ensure it can contain any number of variants */
  opacity: 1;
}

.products-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* Updated grid layout to include expand arrow column */
.product-header,
.product-row {
  display: grid;
  grid-template-columns: 40px 2.5fr 1fr 1.5fr 1fr 1fr 0.8fr 1fr 1.2fr;
  gap: 20px;
  padding: 15px 25px;
  align-items: center;
  text-align: right;
}

.product-header {
  padding-top: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
}

.header-item {
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 600;
}

.product-row {
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-row:hover {
  background-color: #f8f9fc;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.product-row.expanded {
  background-color: #f8f9fc;
  border-bottom: 2px solid #007bff;
}

.disabled-product {
  opacity: 0.5;
  background-color: #f8f9fa;
}

/* Expand arrow styling */
.expand-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  border: 1px solid rgb(214, 214, 214);
}

.expand-arrow:hover {
  background-color: #e9ecef;
}

.expand-arrow i {
  transition: transform 0.3s ease;
  color: #6c757d;
}

.expand-arrow i.rotated {
  transform: rotate(180deg);
  color: #007bff;
}

/* Product info styling remains the same */
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

.product-id,
.product-category,
.product-price,
.product-quantity {
  font-size: 15px;
  font-weight: 500;
}

.product-price.selling {
  font-weight: 600;
  color: #198754;
}

.product-price.purchase {
  color: #495057;
}

.product-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* Variants container styling */
.variants-container {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-top: 1px solid #e9ecef;
  padding: 0;
  margin: 0;
}

.variants-header {
  display: grid;
  grid-template-columns: 80px 2fr 1fr 2fr 1fr;
  gap: 20px;
  padding: 15px 25px;
  background: linear-gradient(135deg, #e9ecef, #f1f3f4);
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  color: #495057;
}

.variant-row {
  display: grid;
  grid-template-columns: 80px 2fr 1fr 2fr 1fr;
  gap: 20px;
  padding: 12px 25px;
  align-items: center;
  border-bottom: 1px solid #f1f3f4;
  text-align: right;
}

.variant-row:last-child {
  border-bottom: none;
}

.variant-row:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.variant-image {
  display: flex;
  justify-content: center;
}

.variant-img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #dee2e6;
}

.variant-sku {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #495057;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.variant-id {
  font-size: 13px;
  color: #6c757d;
  font-weight: 500;
}

.variant-attributes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attribute-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.attr-name {
  color: #6c757d;
  font-weight: 500;
}

.attr-value {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}



.quantity-good {
  color: #198754;
  font-weight: 600;
}

.quantity-low {
  color: #fd7e14;
  font-weight: 600;
}

.quantity-out {
  color: #dc3545;
  font-weight: 600;
}

/* Other existing styles */
.badge {
  padding: 0.5em 0.75em;
  font-size: 0.8rem;
  font-weight: 600;
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
}

.status-toggle.active .toggle-slider {
  transform: translateX(26px);
}

</style>

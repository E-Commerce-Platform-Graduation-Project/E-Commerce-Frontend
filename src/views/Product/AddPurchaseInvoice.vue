<template>
  <div class="add-product-container">
    <div class="header">
      <h1 class="title">فاتورة شراء جديدة</h1>
      <p class="subtitle">إضافة كميات وتحديث أسعار المنتجات عبر تحديد المتغيرات</p>
    </div>

    <div class="form-container">
      <div class="selection-section">
        <h3 class="section-title">الخطوة 1: ابحث عن المنتج</h3>
        <div class="search-row">
          <div class="form-group search-group">
            <label class="form-label">البحث عن المنتج</label>
            <div class="search-wrapper">
              <input 
                v-model="searchQuery" 
                type="text" 
                class="search-input" 
                placeholder="اكتب اسم المنتج للبحث..."
                @input="handleSearchInput"
              />
              <div v-if="isSearching" class="search-loading">
                <div class="loading-spinner"></div>
              </div>
            </div>
            
            <!-- Search Results Dropdown -->
            <div v-if="showSearchResults && searchResults.length > 0" class="search-results">
              <div 
                v-for="product in searchResults" 
                :key="product.id"
                class="search-result-item"
                :class="{ 'selected': selectedProductId === product.id }"
                @click="selectProduct(product)"
              >
                <div class="product-result">
                  <img v-if="product.mainImage" :src="product.mainImage" :alt="product.name" class="product-thumb" />
                  <div class="product-result-info">
                    <span class="product-result-name">{{ product.name }}</span>
                    <span class="product-result-desc">{{ product.description || 'لا يوجد وصف' }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- No Results Message -->
            <div v-if="showSearchResults && searchResults.length === 0 && searchQuery.length > 0" class="no-results">
              لم يتم العثور على منتجات تطابق "{{ searchQuery }}"
            </div>
          </div>
        </div>
        
        <!-- Loading indicator for product details -->
        <div v-if="loadingProductDetails" class="loading-state">
          <div class="loading-spinner"></div>
          <span>جاري تحميل تفاصيل المنتج...</span>
        </div>
      </div>

      <div v-if="selectedProductDetails && !loadingProductDetails" class="selection-section">
        <h3 class="section-title">الخطوة 2: اختر المتغير</h3>
        <div class="selected-product-info">
          <h4 class="selected-product-name">{{ selectedProductDetails.name }}</h4>
          <p class="selected-product-desc">{{ selectedProductDetails.description }}</p>
        </div>
        
        <div class="variants-grid">
          <div 
            v-for="variant in selectedProductDetails.variants" 
            :key="variant.id" 
            class="variant-card"
            :class="{ 'selected': selectedVariant?.id === variant.id }"
            @click="selectVariant(variant)"
          >
            <div class="variant-header">
              <h4 class="variant-sku">{{ variant.sku }}</h4>
              <span class="stock-badge" :class="getStockBadgeClass(variant.quantity_in_stock)">
                المخزون: {{ variant.quantity_in_stock }}
              </span>
            </div>
            
            <div class="variant-attributes">
              <div 
                v-for="attr in variant.attribute_values" 
                :key="attr.attribute_name" 
                class="attribute-item"
              >
                <span class="attribute-label">{{ attr.attribute_name }}:</span>
                <span v-if="attr.attribute_name === 'اللون'" class="attribute-value">
                  <span class="color-dot" :style="{ backgroundColor: attr.value }"></span>
                  {{ attr.value }}
                </span>
                <span v-else class="attribute-value">{{ attr.value }}</span>
              </div>
            </div>
            
            <div v-if="variant.images && variant.images.length > 0" class="variant-images">
              <img 
                v-for="image in variant.images.slice(0, 3)" 
                :key="image.image"
                :src="image.image" 
                :alt="`صورة ${variant.sku}`"
                class="variant-image"
                @error="handleImageError"
              />
              <span v-if="variant.images.length > 3" class="more-images">
                +{{ variant.images.length - 3 }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="add-item-row">
          <button @click="addVariantToInvoice" type="button" class="btn btn-add" :disabled="!selectedVariant">
            <span class="btn-icon">+</span>
            إضافة للفاتورة
          </button>
        </div>
      </div>

      <div v-if="invoiceItems.length > 0" class="invoice-table-container">
        <h3 class="section-title">الخطوة 3: مراجعة الفاتورة</h3>
        <div class="table-wrapper">
          <table class="invoice-table">
            <thead>
              <tr>
                <th class="col-product">المنتج</th>
                <th class="col-variant">المتغير</th>
                <th class="col-attributes">الخواص</th>
                <th class="col-price">سعر الشراء</th>
                <th class="col-quantity">الكمية</th>
                <th class="col-price">سعر البيع المقترح</th>
                <th class="col-total">الإجمالي</th>
                <th class="col-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in invoiceItems" :key="item.uniqueId" class="invoice-row">
                <td class="col-product">
                  <div class="product-info">
                    <span class="product-name">{{ item.productName }}</span>
                    <small class="product-margin">هامش ربح: {{ item.profitMargin }}%</small>
                  </div>
                </td>
                <td class="col-variant">
                  <span class="variant-sku">{{ item.variantSku }}</span>
                </td>
                <td class="col-attributes">
                  <div class="props-display">
                    <span v-for="attr in item.attributes" :key="attr.attribute_name" class="prop-chip">
                      <span v-if="attr.attribute_name === 'اللون'" class="prop-color-dot" :style="{ backgroundColor: attr.value }"></span>
                      <strong class="prop-name">{{ attr.attribute_name }}:</strong>
                      {{ attr.value }}
                    </span>
                  </div>
                </td>
                <td class="col-price">
                  <input 
                    v-model.number="item.purchasePrice" 
                    type="number" 
                    class="table-input" 
                    placeholder="0.00"
                    step="0.01"
                    :class="{ 'input-error': (!item.purchasePrice || item.purchasePrice <= 0) && error }"
                    @input="syncPurchasePrice(item, item.purchasePrice)"
                  />
                </td>
                <td class="col-quantity">
                  <input 
                    v-model.number="item.quantity" 
                    type="number" 
                    class="table-input" 
                    placeholder="0" 
                    min="1"
                    :class="{ 'input-error': (!item.quantity || item.quantity <= 0) && error }" 
                  />
                </td>
                <td class="col-price">
                  <span class="calculated-price">{{ formatCurrency(calculateSellingPrice(item), '') }}</span>
                </td>
                <td class="col-total">
                  <span class="total-amount">{{ formatCurrency((item.purchasePrice || 0) * (item.quantity || 0)) }}</span>
                </td>
                <td class="col-actions">
                  <button @click="removeItem(index)" type="button" class="btn-remove" title="حذف المنتج">
                    <span>×</span>
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="7" class="total-label">إجمالي فاتورة الشراء:</td>
                <td class="total-amount-cell">{{ formatCurrency(totalInvoiceAmount) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <h4>الفاتورة فارغة</h4>
        <p>ابدأ بالبحث عن منتج واختيار متغير من القوائم أعلاه.</p>
      </div>

      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div class="form-actions">
        <button @click="clearInvoice" type="button" class="btn btn-secondary" :disabled="invoiceItems.length === 0">
          مسح الفاتورة
        </button>
        <button @click="handleSubmit" type="button" class="btn btn-primary" :disabled="invoiceItems.length === 0 || productStore.isLoading">
          <span v-if="productStore.isLoading" class="loading-spinner"></span>
          حفظ الفاتورة
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';
import { useProductStore } from '@/stores/productStore';
import { storeToRefs } from 'pinia';

const categoryStore = useCategoryStore();
const productStore = useProductStore();
const { getAllProducts } = storeToRefs(productStore);

// State for search functionality
const searchQuery = ref('');
const searchResults = ref([]);
const showSearchResults = ref(false);
const isSearching = ref(false);
const searchTimeout = ref(null);

// State for selection process
const selectedProductId = ref(null);
const selectedProductDetails = ref(null);
const selectedVariant = ref(null);
const loadingProductDetails = ref(false);

// State for the invoice itself
const invoiceItems = reactive([]);
const error = ref('');
const successMessage = ref('');

// Computed properties for UI
const totalInvoiceAmount = computed(() => {
  return invoiceItems.reduce((total, item) => total + ((item.purchasePrice || 0) * (item.quantity || 0)), 0);
});

// Search functionality
const handleSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  searchTimeout.value = setTimeout(() => {
    performSearch();
  }, 300); // Debounce search by 300ms
};

const performSearch = async () => {
  if (searchQuery.value.length < 2) {
    showSearchResults.value = false;
    searchResults.value = [];
    return;
  }
  
  isSearching.value = true;
  
  try {
    // Use the existing fetchProducts method with search parameter
    const result = await productStore.fetchProducts({ 
      page: 1, 
      search: searchQuery.value 
    });
    
    if (result.success) {
      searchResults.value = getAllProducts.value;
      showSearchResults.value = true;
    } else {
      searchResults.value = [];
      showSearchResults.value = true;
    }
  } catch (err) {
    console.error('Search error:', err);
    searchResults.value = [];
    showSearchResults.value = true;
  } finally {
    isSearching.value = false;
  }
};

const selectProduct = async (product) => {
  selectedProductId.value = product.id;
  searchQuery.value = product.name;
  showSearchResults.value = false;
  searchResults.value = [];
  
  await fetchProductDetails(product.id);
};

// Hide search results when clicking outside
const hideSearchResults = () => {
  setTimeout(() => {
    showSearchResults.value = false;
  }, 200);
};

// Fetch product details from API
const fetchProductDetails = async (productId) => {
  loadingProductDetails.value = true;
  error.value = '';
  
  try {
    // Use the new method that returns raw API data with variants
    const result = await productStore.fetchProductDetailsWithVariants(productId);
    
    if (result.success) {
      selectedProductDetails.value = result.data;
      console.log('Product details loaded:', result.data);
    } else {
      error.value = result.error || 'فشل في تحميل تفاصيل المنتج';
    }
  } catch (err) {
    console.error('Error fetching product details:', err);
    error.value = 'فشل في تحميل تفاصيل المنتج';
  } finally {
    loadingProductDetails.value = false;
  }
};

const selectVariant = (variant) => {
  selectedVariant.value = variant;
};

const getStockBadgeClass = (quantity) => {
  if (quantity === 0) return 'stock-zero';
  if (quantity < 10) return 'stock-low';
  return 'stock-good';
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};

const calculateSellingPrice = (item) => {
  if (item.purchasePrice > 0 && item.profitMargin >= 0) {
    const calculatedPrice = item.purchasePrice * (1 + item.profitMargin / 100);
    return parseFloat(calculatedPrice.toFixed(2));
  }
  return 0;
};

onMounted(async () => {
  await categoryStore.fetchCategories();
  await productStore.fetchProducts();
});

// Core Logic Functions
const addVariantToInvoice = () => {
  if (!selectedVariant.value || !selectedProductDetails.value) return;

  // Check if variant already exists in invoice
  const existingItemIndex = invoiceItems.findIndex(item => item.variantId === selectedVariant.value.id);
  
  if (existingItemIndex !== -1) {
    // If variant already exists, just increment quantity
    invoiceItems[existingItemIndex].quantity += 1;
    error.value = '';
    successMessage.value = 'تم زيادة كمية المتغير الموجود';
    setTimeout(() => { successMessage.value = '' }, 3000);
    return;
  }

  // Check if there's already an item with the same productId to get its price
  const existingProductItem = invoiceItems.find(item => item.productId === selectedProductDetails.value.id);
  const defaultPrice = existingProductItem ? existingProductItem.purchasePrice : 0;
  
  // Get profit margin from selectedProductDetails (raw API data)
  const profitMargin = selectedProductDetails.value.profit_margin 
    ? parseFloat(selectedProductDetails.value.profit_margin) 
    : 0;
  
  invoiceItems.push({
    uniqueId: Date.now(),
    productId: selectedProductDetails.value.id,
    productName: selectedProductDetails.value.name,
    variantId: selectedVariant.value.id,
    variantSku: selectedVariant.value.sku,
    attributes: selectedVariant.value.attribute_values,
    purchasePrice: defaultPrice,
    quantity: 1,
    profitMargin: profitMargin,
    currentStock: selectedVariant.value.quantity_in_stock
  });

  // Reset for next entry
  selectedVariant.value = null;
  
  successMessage.value = 'تم إضافة المتغير للفاتورة بنجاح';
  setTimeout(() => { successMessage.value = '' }, 3000);
};

const removeItem = (index) => {
  invoiceItems.splice(index, 1);
};

const clearInvoice = () => {
  invoiceItems.length = 0;
  selectedProductId.value = null;
  selectedProductDetails.value = null;
  selectedVariant.value = null;
  searchQuery.value = '';
  showSearchResults.value = false;
  searchResults.value = [];
  error.value = '';
  successMessage.value = '';
};

// Function to sync purchase prices across same product variants
const syncPurchasePrice = (changedItem, newPrice) => {
  invoiceItems.forEach(item => {
    if (item.productId === changedItem.productId && item.uniqueId !== changedItem.uniqueId) {
      item.purchasePrice = newPrice;
    }
  });
};

const validateInvoice = () => {
  error.value = '';
  for (const item of invoiceItems) {
    if (!item.purchasePrice || item.purchasePrice <= 0) {
      error.value = `سعر الشراء للمتغير "${item.variantSku}" غير صالح.`;
      return false;
    }
    if (!item.quantity || item.quantity <= 0) {
      error.value = `الكمية للمتغير "${item.variantSku}" يجب أن تكون أكبر من صفر.`;
      return false;
    }
  }
  return true;
};

const handleSubmit = async () => {
  if (!validateInvoice()) return;
  successMessage.value = '';

  // Create the payload in the format expected by the API
  const productsMap = new Map();
  
  invoiceItems.forEach(item => {
    if (!productsMap.has(item.productId)) {
      productsMap.set(item.productId, {
        product_id: item.productId,
        purchase_price: item.purchasePrice.toFixed(2),
        selling_price: calculateSellingPrice(item).toFixed(2),
        items: []
      });
    }
    
    const productData = productsMap.get(item.productId);
    productData.items.push({
      variant_id: item.variantId,
      quantity: item.quantity
    });
  });

  const payload = {
    products: Array.from(productsMap.values())
  };

  console.log('Submitting purchase invoice:', payload);

  try {
    // Call the API endpoint for purchase invoices
    const result = await productStore.submitPurchaseInvoice(payload);

    if (result.success) {
      successMessage.value = 'تم حفظ فاتورة الشراء بنجاح! سيتم تحديث المخزون والأسعار.';
      clearInvoice();
      setTimeout(() => { successMessage.value = '' }, 5000);
    } else {
      error.value = result.error || 'فشل في حفظ فاتورة الشراء';
    }
  } catch (err) {
    console.error('Error submitting invoice:', err);
    error.value = 'فشل في حفظ فاتورة الشراء';
  }
};

const formatCurrency = (amount, currencySymbol = ' د.ل') => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${formatted}${currencySymbol ? ` ${currencySymbol}` : ''}`;
};
</script>

<style scoped>
/* General Layout */
.add-product-container {
  padding: 20px;
  direction: rtl;
  background-color: #f5f7fa;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #1f2937;
}

.subtitle {
  color: #6b7280;
}

.form-container {
  background: white;
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.selection-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  border: 1px solid #e2e8f0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

/* Search Styles */
.search-row {
  display: flex;
  align-items: end;
  gap: 20px;
}

.search-group {
  flex: 1;
  position: relative;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  padding-left: 40px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-loading {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.search-result-item:hover,
.search-result-item.selected {
  background-color: #f8fafc;
}

.search-result-item:last-child {
  border-bottom: none;
}

.product-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
}

.product-margin {
  font-size: 12px;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.variant-sku {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
  background: #f1f5f9;
  padding: 4px 6px;
  border-radius: 4px;
}

.table-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-align: center;
  background-color: white;
}

.table-input.input-error {
  border-color: #ef4444;
}

/* Properties Display in Table */
.props-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.prop-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #eef2ff;
  color: #4338ca;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.prop-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.prop-name {
  color: #64748b;
}

.calculated-price,
.total-amount {
  font-weight: 600;
}

.btn-remove {
  background: transparent;
  color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 24px;
}

.total-row {
  background-color: #f8fafc;
  font-weight: bold;
}

.total-label {
  text-align: left;
  padding-left: 20px;
}

.total-amount-cell {
  font-weight: bold;
  color: #059669;
  font-size: 18px;
  text-align: right;
}

/* Empty State & Alerts */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  background-color: #f8fafc;
  border-radius: 12px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 10px;
}

.alert {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
}

.alert-error {
  background-color: #fef2f2;
  color: #dc2626;
}

.alert-success {
  background-color: #f0fdf4;
  color: #16a34a;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  background-color: #a1a1aa;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .variants-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .add-product-container {
    padding: 10px;
  }
  
  .form-container {
    padding: 20px;
  }
  
  .variants-grid {
    grid-template-columns: 1fr;
  }
  
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-wrapper {
    overflow-x: auto;
  }
  
  .invoice-table {
    min-width: 800px;
  }
}result {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

.product-result-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-result-name {
  font-weight: 600;
  color: #1f2937;
}

.product-result-desc {
  font-size: 12px;
  color: #6b7280;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

/* Selected Product Info */
.selected-product-info {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
}

.selected-product-name {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.selected-product-desc {
  color: #6b7280;
  margin: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #6b7280;
}

/* Variants Grid */
.variants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.variant-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.variant-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.variant-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.variant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.variant-sku {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
}

.stock-badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.stock-badge.stock-zero {
  background: #fef2f2;
  color: #dc2626;
}

.stock-badge.stock-low {
  background: #fef3c7;
  color: #d97706;
}

.stock-badge.stock-good {
  background: #f0fdf4;
  color: #16a34a;
}

.variant-attributes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.attribute-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.attribute-label {
  font-weight: 500;
  color: #6b7280;
  min-width: 60px;
}

.attribute-value {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 400;
  color: #1f2937;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.variant-images {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
}

.variant-image {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

.more-images {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.add-item-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* Form Elements */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.btn-add {
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-add:disabled {
  background-color: #a1a1aa;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 20px;
}

/* Invoice Table */
.invoice-table-container {
  margin-bottom: 30px;
}

.table-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
}

.invoice-table th {
  background: #1e293b;
  color: white;
  padding: 16px 12px;
  text-align: right;
}

.invoice-table td {
  padding: 12px;
  text-align: right;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.invoice-row:hover {
  background-color: #f8fafc;
}

.col-product {
  width: 20%;
}

.col-variant {
  width: 15%;
}

.col-attributes {
  width: 20%;
}

.col-price,
.col-total {
  width: 12%;
}

.col-quantity {
  width: 8%;
}

.col-actions {
  width: 6%;
  text-align: center;
}

.product-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
}

.product-margin {
  font-size: 12px;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.variant-sku {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
  background: #f1f5f9;
  padding: 4px 6px;
  border-radius: 4px;
}

.table-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-align: center;
  background-color: white;
}

.table-input.input-error {
  border-color: #ef4444;
}

/* Properties Display in Table */
.props-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.prop-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #eef2ff;
  color: #4338ca;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.prop-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.prop-name {
  color: #64748b;
}

.calculated-price,
.total-amount {
  font-weight: 600;
}

.btn-remove {
  background: transparent;
  color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 24px;
}

.total-row {
  background-color: #f8fafc;
  font-weight: bold;
}

.total-label {
  text-align: left;
  padding-left: 20px;
}

.total-amount-cell {
  font-weight: bold;
  color: #059669;
  font-size: 18px;
  text-align: right;
}

/* Empty State & Alerts */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  background-color: #f8fafc;
  border-radius: 12px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 10px;
}

.alert {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
}

.alert-error {
  background-color: #fef2f2;
  color: #dc2626;
}

.alert-success {
  background-color: #f0fdf4;
  color: #16a34a;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  background-color: #a1a1aa;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
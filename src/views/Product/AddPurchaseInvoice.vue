<template>
  <div class="add-product-container">
    <div class="header">
      <h1 class="title">فاتورة شراء جديدة</h1>
      <p class="subtitle">إضافة كميات وتحديث أسعار المنتجات عبر تحديد خواصها</p>
    </div>

    <div class="form-container">
      <div class="selection-section">
        <h3 class="section-title">الخطوة 1: اختر المنتج</h3>
        <div class="selection-row">
          <div class="form-group">
            <label class="form-label">الفئة الرئيسية</label>
            <select v-model="selectedMainCategory" class="form-select">
              <option :value="null" disabled>اختر فئة...</option>
              <option v-for="cat in mainCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">الفئة الفرعية</label>
            <select v-model="selectedSubCategory" class="form-select" :disabled="!selectedMainCategory">
              <option :value="null" disabled>اختر فئة...</option>
              <option v-for="cat in subCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group product-selector">
            <label class="form-label">المنتج</label>
            <select v-model="selectedProductId" class="form-select" :disabled="!selectedSubCategory">
              <option :value="null" disabled>اختر المنتج...</option>
              <option v-for="prod in availableProducts" :key="prod.id" :value="prod.id">{{ prod.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="selectedProduct" class="selection-section">
        <h3 class="section-title">الخطوة 2: حدد الخواص </h3>
        <div class="properties-grid">
          <div class="form-group" v-if="availableProperties.colors.length">
            <label class="form-label">اللون</label>
            <div class="color-swatch-container">
              <div v-for="color in availableProperties.colors" :key="color" class="color-swatch"
                :class="{ 'selected': variantProperties.color === color }" :style="{ backgroundColor: color }"
                @click="variantProperties.color = color">
              </div>
            </div>
          </div>

          <div class="form-group" v-for="prop in availableProperties.otherProps" :key="prop.name">
            <label class="form-label">{{ prop.name }}</label>
            <select v-model="variantProperties[prop.name]" class="form-select">
              <option value="" disabled>اختر {{ prop.name }}...</option>
              <option v-for="(value, index) in prop.values" :key="`${prop.name}-${index}`" :value="value">
                {{ value }}
              </option>
            </select>
          </div>
        </div>
        <div class="add-item-row">
          <button @click="addProductToInvoice" type="button" class="btn btn-add" :disabled="!isVariantComplete">
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
                <th class="col-props">الخواص</th>
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
                    <span class="product-name">{{ item.name }}</span>
                    <small class="product-margin">هامش ربح: {{ getProductById(item.productId)?.profitMargin || 0
                      }}%</small>
                  </div>
                </td>
                <td class="col-props">
                  <div class="props-display">
                    <span v-for="(value, propName) in item.properties" :key="propName" class="prop-chip">
                      <span v-if="propName === 'color'" class="prop-color-dot" :style="{ backgroundColor: value }"></span>
                      <strong class="prop-name">{{ propName === 'color' ? 'اللون' : propName }}:</strong>
                      {{ value }}
                    </span>
                  </div>
                </td>
                <td class="col-price">
                  <input v-model.number="item.purchasePrice" type="number" class="table-input" placeholder="0.00"
                    :class="{ 'input-error': (!item.purchasePrice || item.purchasePrice <= 0) && error }"
                    @input="syncPurchasePrice(item, item.purchasePrice)" />
                </td>
                <td class="col-quantity">
                  <input v-model.number="item.quantityToAdd" type="number" class="table-input" placeholder="0" min="1"
                    :class="{ 'input-error': (!item.quantityToAdd || item.quantityToAdd <= 0) && error }" />
                </td>
                <td class="col-price">
                  <span class="calculated-price">{{ formatCurrency(calculateSellingPrice(item), '') }}</span>
                </td>
                <td class="col-total">
                  <span class="total-amount">{{ formatCurrency((item.purchasePrice || 0) * (item.quantityToAdd || 0))
                    }}</span>
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
                <td colspan="6" class="total-label">إجمالي فاتورة الشراء:</td>
                <td class="total-amount-cell">{{ formatCurrency(totalInvoiceAmount) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <h4>الفاتورة فارغة</h4>
        <p>ابدأ باختيار منتج من القوائم أعلاه.</p>
      </div>

      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div class="form-actions">
        <button @click="clearInvoice" type="button" class="btn btn-secondary" :disabled="invoiceItems.length === 0">مسح
          الفاتورة</button>
        <button @click="handleSubmit" type="button" class="btn btn-primary"
          :disabled="invoiceItems.length === 0 || productStore.isLoading">
          <span v-if="productStore.isLoading" class="loading-spinner"></span>
          حفظ الفاتورة
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';
import { useProductStore } from '@/stores/productStore';
import { storeToRefs } from 'pinia';

const categoryStore = useCategoryStore();
const productStore = useProductStore();

const { getProductById, getAllProducts } = storeToRefs(productStore);

// State for selection process
const selectedMainCategory = ref(null);
const selectedSubCategory = ref(null);
const selectedProductId = ref(null);
const selectedProduct = ref(null);
const variantProperties = ref({});

// State for the invoice itself
const invoiceItems = reactive([]);
const error = ref('');
const successMessage = ref('');

// Computed properties for UI
const mainCategories = computed(() => categoryStore.getMainCategories);
const subCategories = computed(() => selectedMainCategory.value ? categoryStore.getSubcategoriesByParent(selectedMainCategory.value) : []);
const availableProducts = computed(() => {
  if (!selectedSubCategory.value) return [];
  return getAllProducts.value.filter(p => p.categoryId === selectedSubCategory.value);
});

const availableProperties = computed(() => {
  if (!selectedProduct.value) return { colors: [], otherProps: [] };

  console.log('Selected Product:', selectedProduct.value); // Debug log
  console.log('Product Properties:', selectedProduct.value.properties); // Debug log

  // Get colors from variants (using colorHex)
  const colors = selectedProduct.value.variants ? selectedProduct.value.variants.map(v => v.colorHex) : [];
  
  // Get other properties - fixed to handle the nested structure
  const otherProps = [];
  
  if (selectedProduct.value.properties) {
    Object.entries(selectedProduct.value.properties).forEach(([propName, propData]) => {
      console.log(`Processing property ${propName}:`, propData); // Debug log
      
      // Check if propData has a legacy array (based on your console output)
      if (propData && typeof propData === 'object' && propData.legacy && Array.isArray(propData.legacy)) {
        otherProps.push({
          name: propName,
          values: propData.legacy
        });
      }
      // Fallback: if it's directly an array
      else if (Array.isArray(propData)) {
        otherProps.push({
          name: propName,
          values: propData
        });
      }
      // Fallback: if it's a simple value, convert to array
      else if (propData && typeof propData === 'string') {
        otherProps.push({
          name: propName,
          values: [propData]
        });
      }
    });
  }

  console.log('Available Properties:', { colors, otherProps }); // Debug log
  return { colors, otherProps };
});

const isVariantComplete = computed(() => {
  if (!selectedProduct.value) return false;
  const requiredProps = availableProperties.value.otherProps.map(p => p.name);
  if (availableProperties.value.colors.length > 0) {
    requiredProps.push('color');
  }

  return requiredProps.every(propName => variantProperties.value[propName]);
});

const totalInvoiceAmount = computed(() => {
  return invoiceItems.reduce((total, item) => total + ((item.purchasePrice || 0) * (item.quantityToAdd || 0)), 0);
});

const calculateSellingPrice = (item) => {
  const product = getProductById.value(item.productId);
  if (item.purchasePrice > 0 && product && product.profitMargin >= 0) {
    const calculatedPrice = item.purchasePrice * (1 + product.profitMargin / 100);
    return parseFloat(calculatedPrice.toFixed(2));
  }
  return 0;
};

// Watchers to reset selections
watch(selectedMainCategory, () => { selectedSubCategory.value = null; });
watch(selectedSubCategory, () => { selectedProductId.value = null; });
watch(selectedProductId, (newId) => {
  selectedProduct.value = newId ? getProductById.value(newId) : null;
  variantProperties.value = {}; // Reset properties when product changes
});

onMounted(async () => {
  await categoryStore.fetchCategories();
  await productStore.fetchProducts();
  console.log('All Products loaded:', getAllProducts.value); // Debug log
});

// Core Logic Functions
const addProductToInvoice = () => {
  if (!isVariantComplete.value) return;

  const product = selectedProduct.value;
  
  // Check if there's already an item with the same productId to get its price
  const existingItem = invoiceItems.find(item => item.productId === product.id);
  const defaultPrice = existingItem ? existingItem.purchasePrice : 0;
  
  invoiceItems.push({
    uniqueId: Date.now(),
    productId: product.id,
    name: product.name,
    properties: { ...variantProperties.value },
    purchasePrice: defaultPrice,
    quantityToAdd: 1,
  });

  // Reset for next entry
  variantProperties.value = {};
};

const removeItem = (index) => {
  invoiceItems.splice(index, 1);
};

const clearInvoice = () => {
  invoiceItems.length = 0;
  selectedProductId.value = null;
  selectedMainCategory.value = null;
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
      error.value = `سعر الشراء للمنتج "${item.name}" غير صالح.`; return false;
    }
    if (!item.quantityToAdd || item.quantityToAdd <= 0) {
      error.value = `الكمية للمنتج "${item.name}" يجب أن تكون أكبر من صفر.`; return false;
    }
  }
  return true;
};

const handleSubmit = async () => {
  if (!validateInvoice()) return;
  successMessage.value = '';

  // Adapt the flexible UI data to the store's expected format
  const payload = invoiceItems.map(item => ({
    productId: item.productId,
    purchasePrice: item.purchasePrice,
    quantityToAdd: item.quantityToAdd,
    properties: item.properties, // Pass the whole properties object
  }));

  const result = await productStore.processPurchaseInvoice(payload);

  if (result.success) {
    successMessage.value = `تم حفظ فاتورة الشراء بنجاح! سيتم تحديث المخزون والأسعار.`;
    clearInvoice();
    setTimeout(() => { successMessage.value = '' }, 5000);
  } else {
    error.value = result.error;
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

/* Selection Rows & Grids */
.selection-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 20px;
  align-items: end;
}

.product-selector {
  flex-grow: 2;
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
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

.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
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

/* Color Swatches */
.color-swatch-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: border-color 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-swatch.selected {
  border-color: #3b82f6;
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
  width: 25%;
}

.col-props {
  width: 25%;
}

.col-price,
.col-total {
  width: 13%;
}

.col-quantity {
  width: 10%;
}

.col-actions {
  width: 6%;
  text-align: center;
}

/* Corrected to include profit margin */
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
  gap: 8px;
  align-items: center;
}

.prop-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #eef2ff;
  color: #4338ca;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.prop-color-dot {
  width: 14px;
  height: 14px;
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
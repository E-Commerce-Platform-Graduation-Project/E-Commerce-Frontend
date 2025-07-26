<template>
  <div class="add-product-container">
    <div class="header">
      <h1 class="title">فاتورة شراء جديدة</h1>
      <p class="subtitle">إضافة كميات وتحديث أسعار المنتجات عبر تحديد اللون والمقاس</p>
    </div>

    <div class="form-container">
      <div class="selection-section">
        <h3 class="section-title">إضافة منتج للفاتورة</h3>
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
          <div class="form-group">
            <label class="form-label">المنتج</label>
            <select v-model="selectedProductId" class="form-select" :disabled="!selectedSubCategory">
              <option :value="null" disabled>اختر المنتج...</option>
              <option v-for="prod in availableProducts" :key="prod.id" :value="prod.id">{{ prod.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <button @click="addProductToInvoice" type="button" class="btn btn-add" :disabled="!selectedProductId">
              <span class="btn-icon">+</span>
              إضافة منتج
            </button>
          </div>
        </div>
      </div>

      <div v-if="invoiceItems.length > 0" class="invoice-table-container">
        <h3 class="section-title">منتجات الفاتورة</h3>
        <div class="table-wrapper">
          <table class="invoice-table">
            <thead>
              <tr>
                <th class="col-product">المنتج</th>
                <th class="col-variant">اللون</th>
                <th class="col-variant">المقاس</th>
                <th class="col-price">سعر الشراء</th>
                <th class="col-quantity">الكمية</th>
                <th class="col-price">سعر البيع المقترح</th>
                <th class="col-total">الإجمالي</th>
                <th class="col-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in invoiceItems" :key="index" class="invoice-row">
                <td class="col-product">
                  <div class="product-info">
                    <span class="product-name">{{ item.name }}</span>
                    <small class="product-margin">هامش ربح: {{ getProductById(item.productId)?.profitMargin || 0
                    }}%</small>
                  </div>
                </td>
                <td class="col-variant">
                  <select v-model="item.color" class="table-input" :class="{ 'input-error': !item.color && error }">
                    <option value="" disabled>اختر لون...</option>
                    <option v-for="variant in getProductById(item.productId)?.variants" :key="variant.colorName"
                      :value="variant.colorName">
                      {{ variant.colorName }}
                    </option>
                  </select>
                </td>
                <td class="col-variant">
                  <select v-model="item.size" class="table-input" :disabled="!getSizesForProduct(item.productType)"
                    :class="{ 'input-error': !item.size && error }">
                    <option value="" disabled>اختر مقاس...</option>
                    <option v-if="!getSizesForProduct(item.productType)" value="مقاس واحد">مقاس واحد</option>
                    <option v-for="size in getSizesForProduct(item.productType)" :key="size" :value="size">
                      {{ size }}
                    </option>
                  </select>
                </td>
                <td class="col-price">
                  <input v-model.number="item.purchasePrice" type="number" class="table-input" placeholder="0.00"
                    :class="{ 'input-error': (!item.purchasePrice || item.purchasePrice <= 0) && error }"
                    @change="syncPricesForProduct(item)" />
                </td>
                <td class="col-quantity">
                  <input v-model.number="item.quantityToAdd" type="number" class="table-input" placeholder="0" min="1"
                    :class="{ 'input-error': (!item.quantityToAdd || item.quantityToAdd <= 0) && error }" />
                </td>
                <td class="col-price">
                  <span class="calculated-price">{{ formatCurrency(item.sellingPrice, '') }}</span>
                </td>
                <td class="col-total">
                  <span class="total-amount">{{ formatCurrency((item.purchasePrice || 0) * (item.quantityToAdd || 0))
                  }}</span>
                </td>
                <td class="col-actions">
                  <button @click="removeItem(index)" type="button" class="btn-remove" title="حذف المنتج">
                    <span class="btn-icon">×</span>
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
        <h4>لا توجد منتجات في الفاتورة</h4>
        <p>استخدم القوائم أعلاه لإضافة أول منتج.</p>
      </div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
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

const selectedMainCategory = ref(null);
const selectedSubCategory = ref(null);
const selectedProductId = ref(null);
const invoiceItems = reactive([]);
const error = ref('');
const successMessage = ref('');

const SIZES_BY_TYPE = {
  shirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  pants: ['28', '30', '32', '34', '36', '38', '40'],
  shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  accessory: null,
};

const getSizesForProduct = (productType) => SIZES_BY_TYPE[productType] || null;

const mainCategories = computed(() => categoryStore.getMainCategories);
const subCategories = computed(() => selectedMainCategory.value ? categoryStore.getSubcategoriesByParent(selectedMainCategory.value) : []);
const availableProducts = computed(() => {
  if (!selectedSubCategory.value) return [];
  return getAllProducts.value.filter(p => p.categoryId === selectedSubCategory.value);
});
const totalInvoiceAmount = computed(() => {
  return invoiceItems.reduce((total, item) => total + ((item.purchasePrice || 0) * (item.quantityToAdd || 0)), 0);
});


watch(selectedMainCategory, () => { selectedSubCategory.value = null; selectedProductId.value = null; });
watch(selectedSubCategory, () => { selectedProductId.value = null; });
watch(invoiceItems, (items) => {
  items.forEach(item => {
    const product = getProductById.value(item.productId);
    if (item.purchasePrice > 0 && product && product.profitMargin >= 0) {
      const calculatedPrice = item.purchasePrice * (1 + product.profitMargin / 100);
      item.sellingPrice = parseFloat(calculatedPrice.toFixed(2));
    } else {
      item.sellingPrice = 0;
    }
  });
}, { deep: true });

onMounted(() => {
  categoryStore.fetchCategories();
  productStore.fetchProducts();
});

// MODIFIED: This function now populates the last known prices for the product
const addProductToInvoice = () => {
  const product = getProductById.value(selectedProductId.value);
  if (product) {
    const defaultSize = getSizesForProduct(product.productType) ? '' : 'مقاس واحد';
    invoiceItems.push({
      productId: product.id,
      name: product.name,
      productType: product.productType,
      purchasePrice: product.purchasePrice || 0, // Pre-fill with last purchase price
      sellingPrice: product.sellingPrice || 0,  // Pre-fill with last selling price
      color: '',
      size: defaultSize,
      quantityToAdd: 1,
    });
    selectedProductId.value = null;
  }
};

// NEW: This function syncs the purchase price across all rows of the same product
const syncPricesForProduct = (changedItem) => {
  const newPrice = changedItem.purchasePrice;
  const productId = changedItem.productId;

  invoiceItems.forEach(item => {
    // If it's the same product but not the exact same item, update its price
    if (item.productId === productId && item !== changedItem) {
      item.purchasePrice = newPrice;
    }
  });
};

const removeItem = (index) => {
  invoiceItems.splice(index, 1);
};

const clearInvoice = () => {
  invoiceItems.length = 0;
  selectedMainCategory.value = null;
  error.value = '';
  successMessage.value = '';
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
    if (!item.color) {
      error.value = `يجب اختيار لون للمنتج "${item.name}".`; return false;
    }
    if (!item.size) {
      error.value = `يجب اختيار مقاس للمنتج "${item.name}".`; return false;
    }
  }
  return true;
};

const handleSubmit = async () => {
  if (!validateInvoice()) return;
  successMessage.value = '';

  const payload = invoiceItems.map(item => ({
    productId: item.productId,
    purchasePrice: item.purchasePrice,
    quantityToAdd: item.quantityToAdd,
    color: item.color,
    size: item.size,
  }));

  const result = await productStore.processPurchaseInvoice(payload);

  if (result.success) {
    successMessage.value = `تم حفظ فاتورة الشراء بنجاح!`;
    clearInvoice();
  } else {
    error.value = result.error;
  }
};

const formatCurrency = (amount, currencySymbol = ' د.ل') => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${formatted}${currencySymbol ? `${currencySymbol}` : ''}`;
};
</script>

<style scoped>
/* All styles from your previous file are correct and retained */
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

.selection-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr auto;
  gap: 20px;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #374151;
}

.form-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
}

.btn-add {
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

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
  text-align: center;
}

.invoice-table td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.invoice-row:hover {
  background-color: #f8fafc;
}

.col-product {
  width: 25%;
  text-align: right;
}

.col-variant {
  width: 13%;
}

.col-price {
  width: 12%;
}

.col-quantity {
  width: 10%;
}

.col-total {
  width: 12%;
}

.col-actions {
  width: 8%;
}

.product-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: right;
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
  padding: 2px 6px;
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

.calculated-price {
  font-weight: 600;
  background-color: #f1f5f9;
  padding: 8px 10px;
  border-radius: 6px;
  display: inline-block;
  min-width: 80px;
}

.btn-remove {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
}

.total-row {
  background-color: #f8fafc;
}

.total-label {
  font-weight: 600;
  text-align: right;
}

.total-amount-cell {
  font-weight: bold;
  color: #059669;
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 64px;
}

.alert {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert-error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.alert-success {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-left: 8px;
}
</style>
<template>
  <div class="add-product-container">
    <div class="header">
      <h1 class="title">فاتورة شراء جديدة</h1>
      <p class="subtitle">إضافة كميات وتحديث أسعار المنتجات</p>
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
            <button @click="addProductToInvoice" type="button" class="btn btn-add"
              :disabled="!selectedProductId">
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
                <th class="col-price">سعر الشراء للوحدة</th>
                <th class="col-quantity">الكمية</th>
                <th class="col-price">سعر البيع (محسوب)</th>
                <th class="col-total">إجمالي الشراء</th>
                <th class="col-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in invoiceItems" :key="item.productId" class="invoice-row">
                <td class="col-product">
                  <div class="product-info">
                    <span class="product-name">{{ item.name }}</span>
                    <small class="product-margin">هامش ربح: {{ item.profitMargin }}%</small>
                  </div>
                </td>
                <td class="col-price">
                  <input 
                    v-model.number="item.purchasePrice" 
                    type="number" 
                    class="table-input" 
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </td>
                <td class="col-quantity">
                  <input 
                    v-model.number="item.quantityToAdd" 
                    type="number" 
                    class="table-input" 
                    placeholder="0"
                    min="1"
                    step="1"
                  />
                </td>
                <td class="col-price">
                  <span class="calculated-price">
                    {{ formatCurrency(item.sellingPrice, '') }}
                  </span>
                </td>
                <td class="col-total">
                  <span class="total-amount">
                    {{ formatCurrency((item.purchasePrice || 0) * (item.quantityToAdd || 0)) }}
                  </span>
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
                <td colspan="4" class="total-label">إجمالي فاتورة الشراء:</td>
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
        <p>ابدأ بإضافة منتجات للفاتورة من الأعلى</p>
      </div>

      <div v-if="invoiceItems.length > 0" class="invoice-summary">
        <div class="summary-card">
          <h4 class="summary-title">ملخص الفاتورة</h4>
          <div class="summary-row">
            <span>عدد المنتجات:</span>
            <strong>{{ invoiceItems.length }}</strong>
          </div>
          <div class="summary-row">
            <span>إجمالي الكميات:</span>
            <strong>{{ totalQuantity }}</strong>
          </div>
          <div class="summary-row total-row">
            <span>إجمالي المبلغ:</span>
            <strong class="total-price">{{ formatCurrency(totalInvoiceAmount) }}</strong>
          </div>
        </div>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <div class="form-actions">
        <button @click="clearInvoice" type="button" class="btn btn-secondary" 
          :disabled="invoiceItems.length === 0">
          مسح الفاتورة
        </button>
        <button @click="handleSubmit" type="button" class="btn btn-primary"
          :disabled="invoiceItems.length === 0 || productStore.isLoading">
          <span v-if="productStore.isLoading" class="loading-spinner"></span>
          <span class="btn-icon">💾</span>
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

const categoryStore = useCategoryStore();
const productStore = useProductStore();

// Selection state
const selectedMainCategory = ref(null);
const selectedSubCategory = ref(null);
const selectedProductId = ref(null);

// Invoice state
const invoiceItems = reactive([]);
const error = ref('');
const successMessage = ref('');

// Computed properties for dropdowns
const mainCategories = computed(() => categoryStore.getMainCategories);
const subCategories = computed(() => selectedMainCategory.value ? categoryStore.getSubcategoriesByParent(selectedMainCategory.value) : []);
const availableProducts = computed(() => {
  if (!selectedSubCategory.value) return [];
  const itemIds = invoiceItems.map(item => item.productId);
  return productStore.getAllProducts.filter(p => p.categoryId === selectedSubCategory.value && !itemIds.includes(p.id));
});

// Computed for totals
const totalInvoiceAmount = computed(() => {
  return invoiceItems.reduce((total, item) => {
    return total + ((item.purchasePrice || 0) * (item.quantityToAdd || 0));
  }, 0);
});

const totalQuantity = computed(() => {
  return invoiceItems.reduce((total, item) => total + (item.quantityToAdd || 0), 0);
});

// Watchers
watch(selectedMainCategory, () => { selectedSubCategory.value = null; selectedProductId.value = null; });
watch(selectedSubCategory, () => { selectedProductId.value = null; });

// Watch each item in the invoice for price calculations
watch(invoiceItems, (items) => {
  items.forEach(item => {
    if (item.purchasePrice > 0 && item.profitMargin >= 0) {
      const calculatedPrice = item.purchasePrice * (1 + item.profitMargin / 100);
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

const addProductToInvoice = () => {
  const product = productStore.getProductById(selectedProductId.value);
  if (product) {
    const calculatedPrice = (product.purchasePrice || 0) * (1 + (product.profitMargin || 0) / 100);
    invoiceItems.push({
      productId: product.id,
      name: product.name,
      purchasePrice: product.purchasePrice || 0,
      profitMargin: product.profitMargin || 0,
      sellingPrice: parseFloat(calculatedPrice.toFixed(2)),
      quantityToAdd: 1,
    });
    // Reset product dropdown
    selectedProductId.value = null;
  }
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

const formatCurrency = (amount, currencySymbol = ' دينار') => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${formattedAmount}${currencySymbol ? ` ${currencySymbol}` : ''}`;
};


const validateInvoice = () => {
  error.value = '';
  for (const item of invoiceItems) {
    if (!item.purchasePrice || item.purchasePrice <= 0) { 
      error.value = `سعر الشراء للمنتج "${item.name}" غير صالح.`; 
      return false; 
    }
    if (!item.quantityToAdd || item.quantityToAdd <= 0) { 
      error.value = `الكمية المضافة للمنتج "${item.name}" يجب أن تكون أكبر من صفر.`; 
      return false; 
    }
  }
  return true;
};

const handleSubmit = async () => {
  if (!validateInvoice()) return;

  successMessage.value = '';
  // Map to the required payload for the store action
  const payload = invoiceItems.map(item => ({
    productId: item.productId,
    purchasePrice: item.purchasePrice,
    quantityToAdd: item.quantityToAdd,
  }));
  
  const result = await productStore.processPurchaseInvoice(payload);

  if (result.success) {
    successMessage.value = `تم حفظ فاتورة الشراء بنجاح! تم تحديث ${invoiceItems.length} منتج بإجمالي مبلغ ${formatCurrency(totalInvoiceAmount.value)}`;
    invoiceItems.length = 0;
    selectedMainCategory.value = null;
  } else {
    error.value = result.error;
  }
};
</script>

<style scoped>
.add-product-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  direction: rtl;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.subtitle {
  color: #6b7280;
  font-size: 16px;
}

.form-container {
  background: white;
  max-width: 1400px;
  width: 100%;
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
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 14px;
}

.form-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.form-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.form-select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-add {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  min-width: 140px;
  justify-content: center;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Table Styles */
.invoice-table-container {
  margin-bottom: 30px;
}

.table-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.invoice-table th {
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
  padding: 16px 12px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 2px solid #0f172a;
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

.col-product { width: 25%; text-align: right; }
.col-price { width: 15%; }
.col-quantity { width: 12%; }
.col-total { width: 15%; }
.col-actions { width: 8%; }

.product-info {
  text-align: right;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
}

.product-margin {
    font-size: 12px;
    color: #64748b;
}

.table-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
  transition: all 0.2s;
}

.table-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  outline: none;
}

.calculated-price {
    font-weight: 600;
    color: #1e293b;
    background-color: #f1f5f9;
    padding: 8px 10px;
    border-radius: 6px;
    display: inline-block;
    min-width: 80px;
}

.btn-remove {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.btn-icon {
  font-size: 16px;
  font-weight: bold;
}

.total-amount {
  font-weight: 600;
  color: #059669;
  font-size: 13px;
}

.total-row {
  background-color: #f8fafc;
  border-top: 2px solid #e2e8f0;
}

.total-label {
  font-weight: 600;
  color: #1e293b;
  text-align: right;
}

.total-amount-cell {
  font-weight: bold;
  color: #059669;
  font-size: 16px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h4 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #475569;
}

/* Invoice Summary */
.invoice-summary {
  margin-bottom: 30px;
}

.summary-card {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  max-width: 300px;
  margin-left: auto;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #0c4a6e;
  margin-bottom: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.summary-row.total-row {
  border-top: 1px solid #bae6fd;
  padding-top: 12px;
  margin-top: 12px;
  font-size: 16px;
}

.total-price {
  color: #059669;
  font-size: 18px;
}

/* Alerts */
.alert {
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  font-weight: 500;
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

/* Form Actions */
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
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  min-width: 160px;
  justify-content: center;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .selection-row {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .btn-add {
    grid-column: 1 / -1;
    justify-self: start;
  }
}

@media (max-width: 768px) {
  .add-product-container {
    padding: 10px;
  }
  
  .form-container {
    padding: 20px;
  }
  
  .table-wrapper {
    overflow-x: auto;
  }
  
  .invoice-table {
    min-width: 800px;
  }
  
  .selection-row {
    grid-template-columns: 1fr;
  }
  
  .summary-card {
    max-width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
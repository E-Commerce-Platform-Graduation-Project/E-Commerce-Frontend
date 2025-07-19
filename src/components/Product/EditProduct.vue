<template>
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5); z-index: 1060;" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header bg-warning">
          <h5 class="modal-title">تعديل المنتج: {{ form.name }}</h5>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <!-- Name & Description -->
            <div class="mb-3">
              <label for="editName" class="form-label">اسم المنتج</label>
              <input type="text" v-model="form.name" class="form-control" id="editName">
            </div>
            <div class="mb-3">
              <label for="editDesc" class="form-label">الوصف</label>
              <textarea v-model="form.description" class="form-control" id="editDesc" rows="3"></textarea>
            </div>

            <!-- Accounting Info Alert -->
            <div class="info-alert">
                <i class="fas fa-info-circle"></i>
                <p>للحصول على تقارير محاسبية بشكل صحيح بما يتعلق بالمبيعات والمشتريات ,يرجى استخدام خاصية فاتورة الشراء</p>
            </div>

            <!-- Purchase & Selling Price -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label for="purchasePrice" class="form-label">سعر الشراء</label>
                <div class="input-group">
                  <input type="number" :value="form.purchasePrice" class="form-control" id="purchasePrice" disabled>
                  <span class="input-group-text">دينار</span>
                </div>
              </div>
              <div class="col-md-6">
                <label for="editPrice" class="form-label">سعر البيع</label>
                <div class="input-group">
                  <input 
                    type="number" 
                    v-model.number="form.sellingPrice" 
                    class="form-control" 
                    id="editPrice"
                    :class="{ 'is-invalid': errors.sellingPrice }"
                    :disabled="autoCalculatePrice"
                  >
                  <span class="input-group-text">دينار</span>
                </div>
                 <div v-if="errors.sellingPrice" class="invalid-feedback d-block">
                    {{ errors.sellingPrice }}
                </div>
              </div>
            </div>

            <!-- Profit Margin & Quantity -->
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <label for="profitMargin" class="form-label">هامش الربح</label>
                    <div class="input-with-checkbox">
                        <div class="input-group">
                            <input
                                id="profitMargin"
                                v-model.number="form.profitMargin"
                                type="number"
                                class="form-control"
                                placeholder="0"
                                :disabled="!autoCalculatePrice"
                            />
                            <span class="input-group-text">%</span>
                        </div>
                        <div class="checkbox-container">
                            <input type="checkbox" id="autoCalcCheck" v-model="autoCalculatePrice" class="form-check-input"/>
                            <label for="autoCalcCheck" class="form-check-label">تلقائي</label>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <label for="editQty" class="form-label">الكمية</label>
                    <input type="number" v-model.number="form.quantity" class="form-control" id="editQty">
                </div>
            </div>

            <!-- Category & Status -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label for="editCategory" class="form-label">الفئة</label>
                <select v-model="form.categoryId" class="form-select" id="editCategory">
                    <option disabled value="">اختر فئة فرعية...</option>
                    <optgroup v-for="group in subCategoryGroups" :key="group.id" :label="group.name">
                        <option v-for="subCategory in group.subCategories" :key="subCategory.id" :value="subCategory.id">
                            {{ subCategory.name }}
                        </option>
                    </optgroup>
                </select>
              </div>
              <div class="col-md-6 d-flex align-items-end">
                <div class="status-toggle-container border rounded w-100 p-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="status-info">
                      <label class="form-label fw-semibold mb-1">حالة المنتج</label>
                      <p class="text-muted small mb-0">
                        {{ form.is_active ? 'المنتج ظاهر للعملاء' : 'المنتج مخفي عن العملاء' }}
                      </p>
                    </div>
                    <div class="form-check form-switch">
                      <input 
                        class="form-check-input status-switch" 
                        type="checkbox" 
                        role="switch" 
                        id="editStatus" 
                        v-model="form.is_active"
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Image Management -->
             <div class="mb-3">
                <label class="form-label">الصور</label>
                <div class="image-preview-grid mb-2">
                    <div v-for="(image, index) in form.images" :key="index" class="image-preview">
                        <img :src="image" alt="معاينة المنتج" />
                        <button @click="removeImage(index)" class="remove-btn" type="button">&times;</button>
                    </div>
                </div>
                <input type="file" multiple @change="handleImageUpload" class="form-control" accept="image/*">
                <div class="form-text">يمكنك إضافة صور جديدة. الحد الأقصى 10 صور.</div>
            </div>

          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">إلغاء</button>
          <button type="button" class="btn btn-warning" @click="handleSubmit" :disabled="productStore.isLoading || Object.keys(errors).length > 0">
            <span v-if="productStore.isLoading" class="spinner-border spinner-border-sm me-2"></span>
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(['close', 'product-updated']);

const productStore = useProductStore();
const categoryStore = useCategoryStore();

// --- Local State ---
const form = reactive({ ...props.product });
const autoCalculatePrice = ref(false);
const errors = reactive({});

// --- Computed Properties ---
const subCategoryGroups = computed(() => {
    const mainCategories = categoryStore.getMainCategories;
    return mainCategories
        .map(main => ({
            id: main.id,
            name: main.name,
            subCategories: categoryStore.getSubcategoriesByParent(main.id)
        }))
        .filter(group => group.subCategories.length > 0);
});

// --- Watchers for Price Calculation ---
watch(autoCalculatePrice, (isAuto) => {
    if (isAuto) {
        form.profitMargin = form.profitMargin || 0;
        updatePriceFromProfit();
    } else {
        updateProfitFromPrices();
    }
});

watch(() => form.sellingPrice, () => {
    if (!autoCalculatePrice.value) {
        updateProfitFromPrices();
    }
    validateForm(); // Validate on change
});

watch(() => form.profitMargin, () => {
    if (autoCalculatePrice.value) {
        updatePriceFromProfit();
    }
});

// --- Methods ---
const updateProfitFromPrices = () => {
  if (form.purchasePrice > 0 && form.sellingPrice > form.purchasePrice) {
    const profit = form.sellingPrice - form.purchasePrice;
    const margin = (profit / form.purchasePrice) * 100;
    form.profitMargin = parseFloat(margin.toFixed(2));
  } else {
    form.profitMargin = null;
  }
};

const updatePriceFromProfit = () => {
    if (form.purchasePrice > 0 && form.profitMargin !== null && form.profitMargin >= 0) {
        const calculatedPrice = form.purchasePrice * (1 + form.profitMargin / 100);
        form.sellingPrice = Math.round(calculatedPrice / 5) * 5;
    } else {
        form.sellingPrice = form.purchasePrice;
    }
};

const validateForm = () => {
    delete errors.sellingPrice;
    let isValid = true;
    if (form.sellingPrice <= form.purchasePrice) {
        errors.sellingPrice = 'سعر البيع يجب أن يكون أعلى من سعر الشراء.';
        isValid = false;
    }
    return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  const result = await productStore.updateProduct(form.id, form);
  if (result.success) {
    emit('product-updated');
  }
};

// --- Image handling logic ---
const removeImage = (index) => {
    form.images.splice(index, 1);
};

const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        if (form.images.length < 10) {
            form.images.push(URL.createObjectURL(file));
        }
    });
};

// --- Lifecycle ---
onMounted(() => {
    // Initialize profit margin based on initial prices
    updateProfitFromPrices();
});
</script>

<style scoped>
.info-alert {
  display: flex;
  align-items: center;
  gap: 15px;
  background-color: #e7f3ff;
  border: 1px solid #b8daff;
  color: #0c5460;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}
.info-alert i {
  font-size: 1.25rem;
}
.info-alert p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}
.input-with-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
}
.checkbox-container {
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
}
.image-preview-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
.image-preview {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
}
.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.remove-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(0,0,0,0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}
.status-switch {
  width: 3em !important;
  height: 1.5em !important;
  cursor: pointer;
}
</style>

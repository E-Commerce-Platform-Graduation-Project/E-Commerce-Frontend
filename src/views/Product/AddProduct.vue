<template>
  <div class="add-product-container">
    <div class="header">
      <h1 class="title">إضافة منتج جديد</h1>
      <p class="subtitle">أضف منتجًا جديدًا إلى المخزون الخاص بك</p>
    </div>

    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="product-form" novalidate>
        <!-- Product Name -->
        <div class="form-group">
          <label for="productName" class="form-label">اسم المنتج</label>
          <input
            id="productName"
            v-model="productData.name"
            type="text"
            class="form-input"
            :class="{ 'error': errors.name }"
            placeholder="مثال: قميص قطني"
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>

        <!-- Product Description -->
        <div class="form-group">
          <label for="productDescription" class="form-label">الوصف</label>
          <textarea
            id="productDescription"
            v-model="productData.description"
            class="form-textarea"
            placeholder="أدخل وصفًا تفصيليًا للمنتج"
            rows="4"
          ></textarea>
        </div>

        <!-- Category Selection -->
        <div class="form-row">
            <!-- Main Category -->
            <div class="form-group">
                <label for="mainCategory" class="form-label">الفئة الرئيسية</label>
                <div class="select-wrapper">
                    <select id="mainCategory" v-model="selectedMainCategory" class="form-select" :class="{ 'error': errors.categoryId }">
                        <option :value="null">اختر فئة رئيسية</option>
                        <option v-for="category in mainCategories" :key="category.id" :value="category.id">
                            {{ category.name }}
                        </option>
                    </select>
                </div>
            </div>
            <!-- Sub Category -->
            <div class="form-group" v-if="subCategories.length > 0">
                <label for="productCategory" class="form-label">الفئة الفرعية</label>
                 <div class="select-wrapper">
                    <select id="productCategory" v-model="productData.categoryId" class="form-select" :class="{ 'error': errors.categoryId }">
                        <option value="">اختر فئة فرعية</option>
                        <option v-for="category in subCategories" :key="category.id" :value="category.id">
                            {{ category.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="form-group" v-if="errors.categoryId">
             <span class="error-message">{{ errors.categoryId }}</span>
        </div>


        <!-- Pricing Fields -->
        <div class="form-row">
          <!-- Purchase Price -->
          <div class="form-group">
            <label for="purchasePrice" class="form-label">سعر الشراء</label>
            <div class="input-wrapper">
                <input
                  id="purchasePrice"
                  v-model.number="productData.purchasePrice"
                  type="number"
                  class="form-input"
                  :class="{ 'error': errors.purchasePrice }"
                  placeholder="0.00"
                />
                <span class="input-unit">دينار</span>
            </div>
            <span v-if="errors.purchasePrice" class="error-message">{{ errors.purchasePrice }}</span>
          </div>

          <!-- Selling Price -->
          <div class="form-group">
            <label for="sellingPrice" class="form-label">سعر البيع</label>
            <div class="input-wrapper">
                <input
                  id="sellingPrice"
                  v-model.number="productData.sellingPrice"
                  type="number"
                  class="form-input"
                  :class="{ 'error': errors.sellingPrice }"
                  placeholder="0.00"
                  :disabled="autoCalculatePrice"
                />
                 <span class="input-unit">دينار</span>
            </div>
            <span v-if="errors.sellingPrice" class="error-message">{{ errors.sellingPrice }}</span>
          </div>
        </div>
        
        <!-- Profit Margin & Quantity -->
        <div class="form-row">
            <!-- Profit Margin -->
            <div class="form-group">
                <label for="profitMargin" class="form-label">هامش الربح</label>
                <div class="input-with-checkbox">
                    <div class="input-wrapper">
                        <input
                            id="profitMargin"
                            v-model.number="productData.profitMargin"
                            type="number"
                            class="form-input"
                            placeholder="0"
                            :disabled="!autoCalculatePrice"
                        />
                        <span class="input-unit">%</span>
                    </div>
                    <div class="checkbox-container">
                        <input type="checkbox" id="autoCalcCheck" v-model="autoCalculatePrice" class="form-checkbox"/>
                        <label for="autoCalcCheck">حساب تلقائي</label>
                    </div>
                </div>
            </div>

            <!-- Quantity -->
            <div class="form-group">
              <label for="quantity" class="form-label">الكمية</label>
              <input
                id="quantity"
                v-model.number="productData.quantity"
                type="number"
                class="form-input"
                 :class="{ 'error': errors.quantity }"
                placeholder="0"
              />
              <span v-if="errors.quantity" class="error-message">{{ errors.quantity }}</span>
            </div>
        </div>

        <!-- Product Images -->
        <div class="form-group">
          <label class="form-label">صور المنتج</label>
          <div class="image-uploader" :class="{ 'error': errors.images }">
            <div v-if="!productData.images.length" class="upload-prompt">
              <i class="fas fa-cloud-upload-alt" ></i>
              <p>اسحب وأفلت الصور هنا أو انقر للتصفح</p>
              <span>(بحد أقصى 10 صور)</span>
            </div>
            <input
              type="file"
              multiple
              @change="handleImageUpload"
              accept="image/*"
              class="file-input"
            />
            <div class="image-preview-grid">
              <div v-for="(image, index) in productData.images" :key="index" class="image-preview">
                <img :src="image.url" alt="معاينة المنتج" />
                <button @click="removeImage(index)" class="remove-btn" type="button">&times;</button>
              </div>
            </div>
          </div>
           <span v-if="errors.images" class="error-message">{{ errors.images }}</span>
        </div>

        <!-- Alerts -->
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="handleCancel" class="btn btn-secondary" :disabled="isLoading">
            إلغاء
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? 'جاري الحفظ...' : 'حفظ المنتج' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCategoryStore } from '@/stores/categoryStore';
// import { useProductStore } from '@/stores/productStore';

const router = useRouter();
const categoryStore = useCategoryStore();
// const productStore = useProductStore(); 

// --- STATE MANAGEMENT ---
const productData = reactive({
  name: '',
  description: '',
  categoryId: '',
  purchasePrice: null,
  sellingPrice: null,
  profitMargin: null,
  quantity: null,
  images: [], 
});

const errors = reactive({});
const isLoading = ref(false); 
const error = ref(''); 
const successMessage = ref('');
const autoCalculatePrice = ref(false);
const selectedMainCategory = ref(null);


// --- COMPUTED PROPERTIES ---
const mainCategories = computed(() => categoryStore.getMainCategories);
const subCategories = computed(() => {
    if (selectedMainCategory.value) {
        return categoryStore.getSubcategoriesByParent(selectedMainCategory.value);
    }
    return [];
});


// --- WATCHERS for price calculation ---
watch(autoCalculatePrice, (isAuto) => {
    if (isAuto) {
        productData.profitMargin = productData.profitMargin || 0;
        updatePriceFromProfit();
    } else {
        updateProfitFromPrices();
    }
});

watch(() => [productData.purchasePrice, productData.sellingPrice], () => {
    if (!autoCalculatePrice.value) {
        updateProfitFromPrices();
    }
});

watch(() => [productData.purchasePrice, productData.profitMargin], () => {
    if (autoCalculatePrice.value) {
        updatePriceFromProfit();
    }
});

// --- WATCHER for category selection ---
watch(selectedMainCategory, (newMainCatId) => {
    productData.categoryId = ''; 
    if (newMainCatId && subCategories.value.length === 0) {
        productData.categoryId = newMainCatId;
    }
});


// --- LIFECYCLE HOOKS ---
onMounted(() => {
    categoryStore.fetchCategories();
});


// --- METHODS ---

const updateProfitFromPrices = () => {
  if (productData.purchasePrice > 0 && productData.sellingPrice > productData.purchasePrice) {
    const profit = productData.sellingPrice - productData.purchasePrice;
    const margin = (profit / productData.purchasePrice) * 100;
    productData.profitMargin = parseFloat(margin.toFixed(2));
  } else {
    productData.profitMargin = null;
  }
};

const updatePriceFromProfit = () => {
    if (productData.purchasePrice > 0 && productData.profitMargin !== null && productData.profitMargin >= 0) {
        const calculatedPrice = productData.purchasePrice * (1 + productData.profitMargin / 100);
        productData.sellingPrice = Math.round(calculatedPrice / 5) * 5;
    } else {
        productData.sellingPrice = productData.purchasePrice;
    }
};

const validateForm = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  let isValid = true;

  if (!productData.name.trim()) {
    errors.name = 'اسم المنتج مطلوب';
    isValid = false;
  }
  if (!productData.categoryId) {
    errors.categoryId = 'يجب اختيار فئة للمنتج (رئيسية وفرعية)';
    isValid = false;
  }
  if (!productData.purchasePrice || productData.purchasePrice <= 0) {
    errors.purchasePrice = 'سعر الشراء يجب أن يكون أكبر من صفر';
    isValid = false;
  }
  if (!productData.sellingPrice || productData.sellingPrice <= 0) {
    errors.sellingPrice = 'سعر البيع يجب أن يكون أكبر من صفر';
    isValid = false;
  }
   if (productData.sellingPrice <= productData.purchasePrice) {
    errors.sellingPrice = 'سعر البيع يجب أن يكون أعلى من سعر الشراء';
    isValid = false;
  }
  if (productData.quantity === null || productData.quantity < 0) {
    errors.quantity = 'الكمية مطلوبة ولا يمكن أن تكون سالبة';
    isValid = false;
  }
  if (productData.images.length === 0) {
    errors.images = 'يجب تحميل صورة واحدة على الأقل';
    isValid = false;
  }

  return isValid;
};


const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageLimit = 10;
    const remainingSlots = imageLimit - productData.images.length;

    if(files.length > remainingSlots) {
        alert(`لا يمكنك تحميل أكثر من ${remainingSlots} صور إضافية.`);
    }

    files.slice(0, remainingSlots).forEach(file => {
        productData.images.push({
            file: file,
            url: URL.createObjectURL(file),
        });
    });

    if (productData.images.length > 0) {
        delete errors.images;
    }
};

const removeImage = (index) => {
  URL.revokeObjectURL(productData.images[index].url);
  productData.images.splice(index, 1);
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  error.value = '';
  successMessage.value = '';
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
   const result = { success: true };

  if (result.success) {
    successMessage.value = 'تمت إضافة المنتج بنجاح!';
  } else {
    error.value = "فشل في إضافة المنتج. الرجاء المحاولة مرة أخرى.";
  }
  
  isLoading.value = false;
};

const handleCancel = () => {
  router.push('/products');
};
</script>

<style scoped>
.add-product-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
  direction: rtl;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 10px;
}

.subtitle {
  color: #6b7280;
  font-size: 16px;
}

.form-container {
  background: white;
  max-width: 700px;
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px 40px;
  margin: 0 auto;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideInUp 0.5s ease-out;
  animation-fill-mode: both;
}

/* Staggered animation for form groups */
.form-group:nth-child(1) { animation-delay: 0.1s; }
.form-group:nth-child(2) { animation-delay: 0.2s; }
.form-group:nth-child(3) { animation-delay: 0.3s; }
.form-group:nth-child(4) { animation-delay: 0.4s; }
.form-group:nth-child(5) { animation-delay: 0.5s; }
.form-group:nth-child(6) { animation-delay: 0.6s; }
.form-group:nth-child(7) { animation-delay: 0.7s; }


.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    animation: slideInUp 0.5s ease-out;
    animation-fill-mode: both;
}

.product-form .form-row:nth-of-type(1) { animation-delay: 0.3s; }
.product-form .form-row:nth-of-type(2) { animation-delay: 0.4s; }
.product-form .form-row:nth-of-type(3) { animation-delay: 0.5s; }


.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input, .form-textarea, .form-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s, background-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.form-input:disabled, .form-select:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error, .form-textarea.error, .form-select.error {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}


/* Select Wrapper for custom arrow - Fixed for RTL */
.select-wrapper {
    position: relative;
}
.select-wrapper .form-select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    padding-right: 40px; 
    padding-left: 16px; 
}
.select-wrapper::after {
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    pointer-events: none;
}

/* Input Wrapper for units */
.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}
.input-wrapper .form-input {
    padding-left: 55px; /* Make space for the unit */
}
.input-unit {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-size: 14px;
    pointer-events: none;
}


/* Input with Checkbox */
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
.form-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
}


/* Image Uploader */
.image-uploader {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    position: relative;
    transition: border-color 0.3s;
}
.image-uploader:hover {
    border-color: #3b82f6;
}
.image-uploader.error {
    border-color: #ef4444;
}

.upload-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #6b7280;
}
.upload-prompt i {
    font-size: 40px;
    color: #9ca3af;
    margin-bottom: 12px;
}
.upload-prompt p {
    margin: 0;
    font-weight: 500;
}
.upload-prompt span {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 4px;
}

.file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}

.image-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
    margin-top: 10px;
}

.image-preview {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}
.remove-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0,0,0,0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: background 0.2s;
}
.remove-btn:hover {
    background: #ef4444;
}


/* Alerts */
.alert {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
}
.alert-error {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.alert-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  animation: slideInUp 0.5s ease-out 0.8s;
  animation-fill-mode: both;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
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
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<template>
  <div class="add-product-container">
    <div class="header">
      <h1 class="title">إضافة منتج جديد</h1>
      <p class="subtitle">أضف تعريف المنتج الأساسي، ثم أضف الألوان والصور الخاصة بكل لون</p>
    </div>

    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="product-form" novalidate>
        <div class="form-group">
          <label for="productName" class="form-label">اسم المنتج</label>
          <input id="productName" v-model="productData.name" type="text" class="form-input"
            :class="{ 'error': errors.name }" placeholder="مثال: قميص قطني" />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>
        <div class="form-group">
          <label for="productDescription" class="form-label">الوصف</label>
          <textarea id="productDescription" v-model="productData.description" class="form-textarea"
            placeholder="أدخل وصفًا تفصيليًا للمنتج" rows="4"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="mainCategory" class="form-label">الفئة الرئيسية</label>
            <select id="mainCategory" v-model="selectedMainCategory" class="form-select"
              :class="{ 'error': errors.categoryId }">
              <option :value="null">اختر فئة رئيسية</option>
              <option v-for="category in mainCategories" :key="category.id" :value="category.id">{{ category.name }}
              </option>
            </select>
          </div>
          <div class="form-group" v-if="subCategories.length > 0">
            <label for="productCategory" class="form-label">الفئة الفرعية</label>
            <select id="productCategory" v-model="productData.categoryId" class="form-select"
              :class="{ 'error': errors.categoryId }">
              <option value="">اختر فئة فرعية</option>
              <option v-for="category in subCategories" :key="category.id" :value="category.id">{{ category.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-group" v-if="errors.categoryId"><span class="error-message">{{ errors.categoryId }}</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="productType" class="form-label">نوع المنتج (لتحديد المقاسات)</label>
            <select id="productType" v-model="productData.productType" class="form-select"
              :class="{ 'error': errors.productType }">
              <option value="">اختر نوع المنتج...</option>
              <option value="shirt">ملابس (S, M, L)</option>
              <option value="pants">بناطيل (مقاس رقمي)</option>
              <option value="shoes">أحذية (مقاس أوروبي)</option>
              <option value="accessory">إكسسوار (مقاس واحد)</option>
            </select>
            <span v-if="errors.productType" class="error-message">{{ errors.productType }}</span>
          </div>
          <div class="form-group">
            <label for="profitMargin" class="form-label">هامش الربح (%)</label>
            <input id="profitMargin" v-model.number="productData.profitMargin" type="number" class="form-input"
              :class="{ 'error': errors.profitMargin }" placeholder="مثال: 50" min="0" />
            <span v-if="errors.profitMargin" class="error-message">{{ errors.profitMargin }}</span>
          </div>
        </div>

        <div class="variations-section">
          <div class="section-header">
            <h3 class="section-title">ألوان المنتج وصورها</h3>
            <button @click="addColorVariation" type="button" class="btn btn-add-color">
              <i class="fas fa-plus"></i> إضافة لون
            </button>
          </div>
          <span v-if="errors.colorVariations" class="error-message">{{ errors.colorVariations }}</span>

          <div v-if="productData.colorVariations.length === 0" class="empty-variations">
            <p>يجب إضافة لون واحد على الأقل للمنتج.</p>
          </div>

          <div v-for="(variation, index) in productData.colorVariations" :key="variation.id" class="variation-card">
            <div class="variation-header">
              <div class="form-group">
                <label class="form-label">اسم اللون</label>
                <input v-model="variation.colorName" type="text" class="form-input" placeholder="مثال: أحمر داكن">
              </div>
              <div class="form-group">
                <label class="form-label">كود اللون</label>
                <div class="color-picker-wrapper">
                  <input v-model="variation.colorHex" type="color" class="color-picker">
                  <span>{{ variation.colorHex }}</span>
                </div>
              </div>
              <button @click="removeColorVariation(index)" class="btn-remove-variation" type="button"
                title="حذف اللون">&times;</button>
            </div>

            <div class="form-group">
              <label class="form-label">صور هذا اللون</label>
              <div class="image-uploader">
                <input type="file" multiple @change="e => handleImageUpload(e, index)" accept="image/*"
                  class="file-input" />
                <div v-if="variation.images.length === 0" class="upload-prompt">
                  <p>اسحب الصور أو انقر هنا</p>
                </div>
                <div class="image-preview-grid">
                  <div v-for="(image, imgIndex) in variation.images" :key="imgIndex" class="image-preview">
                    <img :src="image.url" />
                    <button @click="removeImage(index, imgIndex)" class="remove-btn" type="button">&times;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="productStore.error" class="alert alert-error">{{ productStore.error }}</div>
        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
        <div class="form-actions">
          <button type="button" @click="handleCancel" class="btn btn-secondary"
            :disabled="productStore.isLoading">إلغاء</button>
          <button type="submit" class="btn btn-primary" :disabled="productStore.isLoading">
            <span v-if="productStore.isLoading" class="loading-spinner"></span>
            {{ productStore.isLoading ? 'جاري الحفظ...' : 'حفظ المنتج' }}
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
import { useProductStore } from '@/stores/productStore';

const router = useRouter();
const categoryStore = useCategoryStore();
const productStore = useProductStore();

// MODIFIED: Initial data structure
const getInitialProductData = () => ({
  name: '',
  description: '',
  categoryId: '',
  productType: '',
  profitMargin: null,
  colorVariations: [], // Changed from images to colorVariations
});

const productData = reactive(getInitialProductData());
const errors = reactive({});
const successMessage = ref('');
const selectedMainCategory = ref(null);

const mainCategories = computed(() => categoryStore.getMainCategories);
const subCategories = computed(() => selectedMainCategory.value ? categoryStore.getSubcategoriesByParent(selectedMainCategory.value) : []);

watch(selectedMainCategory, () => { productData.categoryId = ''; });
onMounted(() => { categoryStore.fetchCategories(); });

// NEW: Methods for handling color variations
const addColorVariation = () => {
  productData.colorVariations.push({
    id: Date.now(), // Unique key for v-for
    colorName: '',
    colorHex: '#000000',
    images: [],
  });
};

const removeColorVariation = (index) => {
  productData.colorVariations.splice(index, 1);
};

const handleImageUpload = (event, variationIndex) => {
  const files = Array.from(event.target.files);
  const variation = productData.colorVariations[variationIndex];
  if (variation) {
    files.forEach(file => {
      variation.images.push({ file, url: URL.createObjectURL(file) });
    });
  }
};

const removeImage = (variationIndex, imageIndex) => {
  const variation = productData.colorVariations[variationIndex];
  if (variation) {
    URL.revokeObjectURL(variation.images[imageIndex].url);
    variation.images.splice(imageIndex, 1);
  }
};

// MODIFIED: Validation logic
const validateForm = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  let isValid = true;
  if (!productData.name.trim()) { errors.name = 'اسم المنتج مطلوب'; isValid = false; }
  if (!productData.categoryId) { errors.categoryId = 'يجب اختيار فئة للمنتج'; isValid = false; }
  if (!productData.productType) { errors.productType = 'يجب تحديد نوع المنتج'; isValid = false; }
  if (productData.profitMargin === null || productData.profitMargin < 0) { errors.profitMargin = 'هامش الربح مطلوب'; isValid = false; }

  if (productData.colorVariations.length === 0) {
    errors.colorVariations = 'يجب إضافة لون واحد على الأقل للمنتج.';
    isValid = false;
  } else {
    productData.colorVariations.forEach((v, i) => {
      if (!v.colorName.trim()) {
        errors.colorVariations = `اسم اللون في البند #${i + 1} مطلوب.`;
        isValid = false;
      }
      if (v.images.length === 0) {
        errors.colorVariations = `يجب إضافة صورة واحدة على الأقل للون "${v.colorName || 'غير المسمى'}".`;
        isValid = false;
      }
    });
  }
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  successMessage.value = '';
  // Assuming productStore has clearError method
  // productStore.clearError();

  const result = await productStore.addProduct(productData);

  if (result.success) {
    successMessage.value = 'تمت إضافة المنتج وألوانه بنجاح!';
    Object.assign(productData, getInitialProductData());
    selectedMainCategory.value = null;
  }
};

const handleCancel = () => { router.push('/products'); };
</script>

<style scoped>
/* Basic styles are the same, new styles for variations are added below */
.add-product-container {
  direction: rtl;
  padding: 40px 20px;
  background-color: #f5f7fa;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 28px;
  font-weight: bold;
}

.subtitle {
  color: #6b7280;
}

.form-container {
  background: white;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px 40px;
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
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input,
.form-textarea,
.form-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
}

/* NEW: Styles for the variations section */
.variations-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.btn-add-color {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-variations {
  text-align: center;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
}

.variation-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
}

.variation-header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 16px;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 5px 10px;
  background: white;
}

.color-picker {
  height: 40px;
  width: 40px;
  border: none;
  padding: 0;
  cursor: pointer;
  background-color: transparent;
}

.btn-remove-variation {
  background-color: #fee2e2;
  color: #ef4444;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  position: absolute;
  top: 10px;
  left: 10px;
}

.image-uploader {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  position: relative;
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
}

.image-preview img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
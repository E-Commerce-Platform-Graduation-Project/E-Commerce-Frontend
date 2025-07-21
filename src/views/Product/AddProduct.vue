<template>
  <div class="add-product-container">
    <div class="header">
      <h1 class="title">إضافة منتج جديد</h1>
      <p class="subtitle">أضف تعريف المنتج الأساسي، بما في ذلك هامش الربح لأسعار البيع المستقبلية</p>
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
            <div class="select-wrapper">
              <select id="mainCategory" v-model="selectedMainCategory" class="form-select" :class="{ 'error': errors.categoryId }">
                <option :value="null">اختر فئة رئيسية</option>
                <option v-for="category in mainCategories" :key="category.id" :value="category.id">{{ category.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group" v-if="subCategories.length > 0">
            <label for="productCategory" class="form-label">الفئة الفرعية</label>
            <div class="select-wrapper">
              <select id="productCategory" v-model="productData.categoryId" class="form-select" :class="{ 'error': errors.categoryId }">
                <option value="">اختر فئة فرعية</option>
                <option v-for="category in subCategories" :key="category.id" :value="category.id">{{ category.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-group" v-if="errors.categoryId"><span class="error-message">{{ errors.categoryId }}</span></div>

        <div class="form-group">
            <label for="profitMargin" class="form-label">هامش الربح (%)</label>
            <input id="profitMargin" v-model.number="productData.profitMargin" type="number" class="form-input"
                :class="{ 'error': errors.profitMargin }" placeholder="مثال: 50" min="0" />
            <span v-if="errors.profitMargin" class="error-message">{{ errors.profitMargin }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">صور المنتج</label>
          <div class="image-uploader" :class="{ 'error': errors.images }">
            <div v-if="!productData.images.length" class="upload-prompt">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>اسحب وأفلت الصور هنا أو انقر للتصفح</p>
              <span>(بحد أقصى 10 صور)</span>
            </div>
            <input type="file" multiple @change="handleImageUpload" accept="image/*" class="file-input" />
            <div class="image-preview-grid">
              <div v-for="(image, index) in productData.images" :key="index" class="image-preview">
                <img :src="image.url" alt="معاينة المنتج" />
                <button @click="removeImage(index)" class="remove-btn" type="button">&times;</button>
              </div>
            </div>
          </div>
          <span v-if="errors.images" class="error-message">{{ errors.images }}</span>
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

const getInitialProductData = () => ({
  name: '',
  description: '',
  categoryId: '',
  profitMargin: null,
  images: [],
});

const productData = reactive(getInitialProductData());
const errors = reactive({});
const successMessage = ref('');
const selectedMainCategory = ref(null);

const mainCategories = computed(() => categoryStore.getMainCategories);
const subCategories = computed(() => selectedMainCategory.value ? categoryStore.getSubcategoriesByParent(selectedMainCategory.value) : []);

watch(selectedMainCategory, () => { productData.categoryId = ''; });

onMounted(() => { categoryStore.fetchCategories(); });

const validateForm = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  let isValid = true;
  if (!productData.name.trim()) { errors.name = 'اسم المنتج مطلوب'; isValid = false; }
  if (!productData.categoryId) { errors.categoryId = 'يجب اختيار فئة فرعية للمنتج'; isValid = false; }
  if (productData.profitMargin === null || productData.profitMargin < 0) { errors.profitMargin = 'هامش الربح مطلوب ويجب أن يكون رقمًا موجبًا.'; isValid = false; }
  if (productData.images.length === 0) { errors.images = 'يجب تحميل صورة واحدة على الأقل'; isValid = false; }
  return isValid;
};

const handleImageUpload = (event) => {
  const files = Array.from(event.target.files);
  files.slice(0, 10 - productData.images.length).forEach(file => {
    productData.images.push({ file, url: URL.createObjectURL(file) });
  });
  if (productData.images.length > 0) delete errors.images;
};

const removeImage = (index) => {
  URL.revokeObjectURL(productData.images[index].url);
  productData.images.splice(index, 1);
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  successMessage.value = '';
  productStore.clearError();

  const result = await productStore.addProduct(productData);

  if (result.success) {
    successMessage.value = 'تمت إضافة المنتج بنجاح! يمكنك الآن إضافة كميات وأسعار عبر فاتورة شراء.';
    // Reset form
    Object.assign(productData, getInitialProductData());
    selectedMainCategory.value = null;
    // Clear file input visually if possible (standard behavior might not allow this)
  }
};

const handleCancel = () => { router.push('/products'); };
</script>

<style scoped>
/* Using the same styles from your original AddProduct.vue */
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
  max-width: 600px;
  margin: 0 auto;
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
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-input.error,
.form-select.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
}

.select-wrapper {
  position: relative;
}

.select-wrapper .form-select {
  -webkit-appearance: none;
  appearance: none;
  padding-right: 40px;
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

.image-uploader {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.upload-prompt i {
  font-size: 40px;
  color: #9ca3af;
  margin-bottom: 12px;
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
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  cursor: pointer;
}

.alert {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
}

.alert-error {
  background-color: #fee2e2;
  color: #dc2626;
}

.alert-success {
  background-color: #d1fae5;
  color: #065f46;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
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
</style>
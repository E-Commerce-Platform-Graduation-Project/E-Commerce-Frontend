<template>
  <div class="add-product-container">
    <div class="header">
      <h1 class="title">إضافة منتج جديد</h1>
      <p class="subtitle">أضف تعريف المنتج الأساسي، ثم أضف الخواص، الألوان والصور الخاصة بكل لون</p>
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

        <div class="form-group">
          <label class="form-label">الصورة الرئيسية للمنتج</label>
          <div class="main-image-uploader" :class="{ 'error-border': errors.mainImage }">
            <input type="file" @change="handleMainImageUpload" accept="image/*" class="file-input" />

            <div v-if="!productData.mainImage" class="upload-prompt">
              <p>اسحب الصورة أو انقر هنا</p>
            </div>

            <div v-if="productData.mainImage" class="image-preview main-image-preview">
              <img :src="productData.mainImage.url" />
              <button @click="removeMainImage" class="remove-btn" type="button">&times;</button>
            </div>
          </div>
          <span v-if="errors.mainImage" class="error-message">{{ errors.mainImage }}</span>
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

        <div class="properties-section">
          <h3 class="section-title">خواص المنتج</h3>
          <div v-if="propertiesLoading" class="loading">جاري تحميل الخواص...</div>
          <div v-else-if="availableProperties.length === 0" class="no-properties">
            <p>لا توجد خواص متاحة. يرجى إضافة خواص من صفحة إدارة الخواص أولاً.</p>
          </div>
          <div v-else class="properties-grid">
            <div v-for="prop in availableProperties" :key="prop.id" class="property-group">
            <div class="property-combo-box">
                <button type="button" class="combo-box-button" :class="{ 'active': openComboBox === prop.id }"
                  @click="toggleComboBox(prop.id)">
                  <span class="combo-box-title">{{ prop.name }}</span>
                  <span class="selected-count" v-if="getSelectedCountForProperty(prop.name) > 0">
                    ({{ getSelectedCountForProperty(prop.name) }} محدد)
                  </span>
                  <i class="fas fa-chevron-down combo-box-icon" :class="{ 'rotated': openComboBox === prop.id }"></i>
                </button>

                <div v-show="openComboBox === prop.id" class="combo-box-dropdown">
                  <div v-if="prop.values && prop.values.length > 0" class="checkbox-section">
                    <div class="section-header-small">
                      <span>قيم عامة</span>
                      <button type="button" class="select-all-btn"
                        @click="toggleSelectAllLegacy(prop.name, prop.values.map(v => v.value || v))">
                        {{ areAllLegacyValuesSelected(prop.name, prop.values.map(v => v.value || v)) ? 'إلغاء تحديد الكل' : 'تحديد الكل' }}
                      </button>
                    </div>
                    <div class="checkbox-container">
                      <label v-for="value in prop.values" :key="`legacy-${value.id || value}`" class="checkbox-label">
                        <input type="checkbox" 
                          :value="value.value || value" 
                          :checked="isLegacyValueSelected(prop.name, value.value || value)"
                          @change="handleLegacyPropertyChange(prop.name, value.value || value, $event)">
                        <span class="checkbox-text">{{ value.value || value }}</span>
                      </label>
                    </div>
                  </div>

                  <div v-if="(!prop.values || prop.values.length === 0)" class="empty-dropdown">
                    <p>لا توجد قيم متاحة لهذه الخاصية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span v-if="errors.properties" class="error-message">{{ errors.properties }}</span>
        </div>

        <div class="form-group">
          <label for="profitMargin" class="form-label">هامش الربح (%)</label>
          <input id="profitMargin" v-model.number="productData.profitMargin" type="number" class="form-input"
            :class="{ 'error': errors.profitMargin }" placeholder="مثال: 50" min="0.01" step="0.01" />
          <span v-if="errors.profitMargin" class="error-message">{{ errors.profitMargin }}</span>
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
                <label class="form-label">كود اللون</label>
                <div class="color-selection-container">
                  <div class="color-picker-wrapper" @click="toggleColorPicker(index)">
                    <div class="selected-color-preview" :style="{ backgroundColor: variation.colorHex }"></div>
                    <span class="color-hex-text">{{ variation.colorHex }}</span>
                    <i class="fas fa-chevron-down" :class="{ 'rotated': variation.showColorPicker }"></i>
                  </div>
                  
                  <div v-if="variation.showColorPicker" class="color-dropdown" @click.stop>
                    <div class="color-dropdown-header">
                      <span>اختر لوناً</span>
                      <button type="button" @click="closeColorPicker(index)" class="close-dropdown-btn">×</button>
                    </div>
                    
                    <div v-if="availableColors.length > 0" class="used-colors-section">
                      <h4 class="color-section-title">الألوان المتاحة</h4>
                      <div class="color-grid">
                        <div 
                          v-for="color in availableColors" 
                          :key="color"
                          class="color-option"
                          :class="{ 'selected': variation.colorHex === color }"
                          @click="selectUsedColor(index, color)"
                        >
                          <div class="color-circle" :style="{ backgroundColor: color }"></div>
                          <span class="color-code">{{ color }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="custom-color-section">
                      <h4 class="color-section-title">أو اختر لون جديد</h4>
                      <div class="custom-color-picker">
                        <input 
                          v-model="variation.colorHex" 
                          type="color" 
                          class="color-input"
                          @change="handleHexColorChange(index, false)"
                        >
                        <input 
                          v-model="variation.colorHex" 
                          type="text" 
                          class="color-hex-input" 
                          placeholder="#000000"
                          pattern="^#[0-9A-Fa-f]{6}$"
                          @change="handleHexColorChange(index, true)"
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <span v-if="variation.error" class="error-message">{{ variation.error }}</span>
              </div>
              <button @click="removeColorVariation(index)" class="btn-remove-variation" type="button"
                title="حذف اللون">&times;</button>
            </div>

            <div class="form-group">
              <label class="form-label">صور هذا اللون</label>
              <div class="image-uploader" :class="{ 'error-border': errors[`color_${index}_images`] }">
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
              <span v-if="errors[`color_${index}_images`]" class="error-message">{{ errors[`color_${index}_images`]
                }}</span>
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
import { usePropStore } from '@/stores/propStore';
import { storeToRefs } from 'pinia';

const router = useRouter();
const categoryStore = useCategoryStore();
const productStore = useProductStore();
const propStore = usePropStore();

const getInitialProductData = () => ({
  name: '',
  description: '',
  mainImage: null, // { file, url }
  categoryId: '',
  profitMargin: null,
  selectedProperties: {},
  colorVariations: [], // each variation: { id, colorHex, images, showColorPicker, error }
});

const productData = reactive(getInitialProductData());
const errors = reactive({});
const successMessage = ref('');
const selectedMainCategory = ref(null);
const openComboBox = ref(null);
const propertiesLoading = ref(false);

const mainCategories = computed(() => categoryStore.getMainCategories);
const subCategories = computed(() => selectedMainCategory.value ? categoryStore.getSubcategoriesByParent(selectedMainCategory.value) : []);

// --- CHANGE START: Logic to filter properties and get available colors ---
const { properties: allProperties } = storeToRefs(propStore);

// Filter out the 'Color' attribute from the list of selectable properties
const availableProperties = computed(() => {
  return allProperties.value.filter(p => p.name !== 'اللون');
});

// Get the list of predefined colors from the 'Color' attribute
const availableColors = computed(() => {
    const colorProp = allProperties.value.find(p => p.name === 'اللون');
    return colorProp && Array.isArray(colorProp.values) 
      ? colorProp.values.map(v => v.value) 
      : [];
});
// --- CHANGE END ---

watch(selectedMainCategory, () => { productData.categoryId = ''; });

onMounted(async () => { 
  categoryStore.fetchCategories();
  
  propertiesLoading.value = true;
  try {
    await propStore.fetchAttributes();
  } catch (error) {
    console.error('Error loading properties:', error);
  } finally {
    propertiesLoading.value = false;
  }
});

const toggleComboBox = (propId) => {
  openComboBox.value = openComboBox.value === propId ? null : propId;
};

const isLegacyValueSelected = (propName, value) => productData.selectedProperties[propName]?.legacy?.includes(value) || false;

const getSelectedCountForProperty = (propName) => {
  const propData = productData.selectedProperties[propName];
  if (!propData) return 0;
  let count = 0;
  if (propData.legacy) count += propData.legacy.length;
  if (propData.subtitles) { Object.values(propData.subtitles).forEach(values => { count += values.length; }); }
  return count;
};

const areAllLegacyValuesSelected = (propName, values) => {
  const selected = productData.selectedProperties[propName]?.legacy || [];
  return values.length > 0 && values.every(v => selected.includes(v));
};

const initializeProperty = (propName) => {
  if (!productData.selectedProperties[propName]) {
    productData.selectedProperties[propName] = { legacy: [], subtitles: {} };
  }
};

const toggleSelectAllLegacy = (propName, values) => {
  initializeProperty(propName);
  const areAllSelected = areAllLegacyValuesSelected(propName, values);
  productData.selectedProperties[propName].legacy = areAllSelected ? [] : [...values];
  cleanupPropertyData(propName);
};

const handleLegacyPropertyChange = (propName, value, event) => {
  initializeProperty(propName);
  const legacyValues = productData.selectedProperties[propName].legacy;
  if (event.target.checked) {
    if (!legacyValues.includes(value)) legacyValues.push(value);
  } else {
    const index = legacyValues.indexOf(value);
    if (index > -1) legacyValues.splice(index, 1);
  }
  cleanupPropertyData(propName);
};

const cleanupPropertyData = (propName) => {
  const prop = productData.selectedProperties[propName];
  if (!prop) return;
  if (prop.legacy && prop.legacy.length === 0) delete prop.legacy;
  if (prop.subtitles) {
    Object.keys(prop.subtitles).forEach(sub => {
      if (prop.subtitles[sub].length === 0) delete prop.subtitles[sub];
    });
    if (Object.keys(prop.subtitles).length === 0) delete prop.subtitles;
  }
  if (Object.keys(prop).length === 0) delete productData.selectedProperties[propName];
};

const handleMainImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (productData.mainImage) {
      URL.revokeObjectURL(productData.mainImage.url);
    }
    productData.mainImage = { file, url: URL.createObjectURL(file) };
  }
};
const removeMainImage = () => {
  if (productData.mainImage) {
    URL.revokeObjectURL(productData.mainImage.url);
    productData.mainImage = null;
  }
};

const addColorVariation = () => {
  productData.colorVariations.push({
    id: Date.now(),
    colorHex: '#000000',
    images: [],
    showColorPicker: false,
    error: null,
  });
};

const removeColorVariation = (index) => {
  productData.colorVariations[index].images.forEach(img => URL.revokeObjectURL(img.url));
  productData.colorVariations.splice(index, 1);
  validateForm();
};

const toggleColorPicker = (index) => {
  productData.colorVariations.forEach((variation, i) => {
    if (i !== index) {
      variation.showColorPicker = false;
    }
  });
  productData.colorVariations[index].showColorPicker = !productData.colorVariations[index].showColorPicker;
};

const selectUsedColor = (index, colorHex) => {
  productData.colorVariations[index].colorHex = colorHex;
  handleHexColorChange(index, true);
};

const closeColorPicker = (index) => {
  productData.colorVariations[index].showColorPicker = false;
};

const handleHexColorChange = (index, shouldClosePicker) => {
  const variation = productData.colorVariations[index];

  let color = variation.colorHex.toLowerCase();
  if (!color.startsWith('#')) {
    color = '#' + color;
  }
  variation.colorHex = color;

  const isDuplicate = productData.colorVariations.some(
    (v, i) => i !== index && v.colorHex.toLowerCase() === variation.colorHex.toLowerCase()
  );

  if (isDuplicate) {
    variation.error = 'هذا اللون تم اختياره بالفعل.';
  } else {
    variation.error = null;
  }
  
  if (shouldClosePicker) {
    variation.showColorPicker = false;
  }
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

const validateForm = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  let isValid = true;
  if (!productData.name.trim()) { errors.name = 'اسم المنتج مطلوب'; isValid = false; }
  if (!productData.mainImage) { errors.mainImage = 'الصورة الرئيسية للمنتج مطلوبة'; isValid = false; }
  if (!productData.categoryId) { errors.categoryId = 'يجب اختيار فئة للمنتج'; isValid = false; }
  
  if (productData.profitMargin === null || productData.profitMargin === undefined || productData.profitMargin === '') {
    errors.profitMargin = 'هامش الربح مطلوب';
    isValid = false;
  } else if (isNaN(productData.profitMargin)) {
    errors.profitMargin = 'هامش الربح يجب أن يكون رقماً صحيحاً';
    isValid = false;
  } else if (productData.profitMargin <= 0) {
    errors.profitMargin = 'هامش الربح يجب أن يكون أكثر من صفر';
    isValid = false;
  }

  if (Object.keys(productData.selectedProperties).length === 0) {
    errors.properties = 'يجب اختيار خاصية واحدة على الأقل للمنتج (مثل المقاس).';
    isValid = false;
  }

  if (productData.colorVariations.length === 0) {
    errors.colorVariations = 'يجب إضافة لون واحد على الأقل للمنتج.';
    isValid = false;
  } else {
    const colorSet = new Set();
    let hasDuplicateColor = false;
    productData.colorVariations.forEach((v, i) => {
      const lowerCaseColor = v.colorHex.toLowerCase();
      if (colorSet.has(lowerCaseColor)) {
        v.error = 'هذا اللون تم اختياره بالفعل.';
        hasDuplicateColor = true;
        isValid = false;
      } else {
        v.error = null;
        colorSet.add(lowerCaseColor);
      }
      
      if (v.images.length === 0) {
        errors[`color_${i}_images`] = `يجب إضافة صورة واحدة على الأقل للون ${v.colorHex}.`;
        isValid = false;
      }
    });
     if (hasDuplicateColor) {
        errors.colorVariations = 'لا يمكن اختيار نفس اللون أكثر من مرة.';
      }
  }
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  successMessage.value = '';

  const result = await productStore.addProduct(productData);

  if (result.success) {
    successMessage.value = 'تمت إضافة المنتج بنجاح!';
    
    Object.assign(productData, getInitialProductData());
    selectedMainCategory.value = null;
    openComboBox.value = null;

    setTimeout(() => successMessage.value = '', 4000);
  }
};

const handleCancel = () => { router.push('/products'); };
</script>

<style scoped>
.color-selection-container {
  position: relative;
}
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}
.color-picker-wrapper:hover {
  border-color: #3b82f6;
}
.selected-color-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  flex-shrink: 0;
}
.color-hex-text {
  flex: 1;
  font-family: monospace;
  font-size: 14px;
  color: #374151;
}
.color-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}
.color-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f8fafc;
  font-weight: 600;
  color: #374151;
}
.close-dropdown-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.close-dropdown-btn:hover {
  background-color: #e5e7eb;
  color: #374151;
}
.color-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  margin: 0 0 8px 0;
}
.used-colors-section {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 2px solid transparent;
}
.color-option:hover {
  background-color: #f3f4f6;
}
.color-option.selected {
  background-color: #dbeafe;
  border-color: #3b82f6;
}
.color-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  flex-shrink: 0;
}
.color-code {
  font-size: 10px;
  font-family: monospace;
  color: #6b7280;
  text-align: center;
}
.custom-color-section {
  padding: 16px;
}
.custom-color-picker {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
}
.color-input {
  width: 60px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
}
.color-hex-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
}
.color-hex-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
.main-image-uploader {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  position: relative;
  min-height: 100px;
  max-width: 200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}
.main-image-preview {
  width: 120px;
  height: 120px;
}
.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.variation-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
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
.upload-prompt {
  color: #6b7280;
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
.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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
  border: none;
  cursor: pointer;
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
  display: inline-block;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.alert-error {
  background-color: #fee2e2;
  color: #ef4444;
  border: 1px solid #fecaca;
}
.alert-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.btn-remove-variation {
  position: absolute;
  top: -10px;
  left: -10px;
  background-color: #fee2e2;
  color: #ef4444;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.error-border {
  border-color: #ef4444;
}
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}
.properties-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}
.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.property-group,
.property-combo-box {
  position: relative;
}
.combo-box-button {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  text-align: right;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  transition: all 0.2s ease;
}
.combo-box-button:hover {
  border-color: #3b82f6;
}
.combo-box-button.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
.combo-box-title {
  color: #374151;
  font-weight: 600;
}
.selected-count {
  color: #3b82f6;
  font-size: 12px;
  font-weight: 500;
}
.combo-box-icon {
  color: #6b7280;
  font-size: 12px;
  transition: transform 0.2s ease;
}
.combo-box-icon.rotated {
  transform: rotate(180deg);
}
.combo-box-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;
}
.checkbox-section {
  border-bottom: 1px solid #f3f4f6;
}
.checkbox-section:last-child {
  border-bottom: none;
}
.section-header-small {
  background-color: #f8fafc;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.select-all-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}
.select-all-btn:hover {
  background-color: rgba(59, 130, 246, 0.1);
}
.checkbox-container {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}
.checkbox-label:hover {
  background-color: #f3f4f6;
}
.checkbox-label input[type="checkbox"] {
  margin: 0;
}
.checkbox-text {
  font-size: 14px;
  color: #374151;
}
.empty-dropdown {
  padding: 20px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}
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
</style>
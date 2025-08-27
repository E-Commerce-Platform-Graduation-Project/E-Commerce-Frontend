<template>
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5); z-index: 1060;" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header bg-warning">
          <h5 class="modal-title">تعديل المنتج: {{ form.name }}</h5>
        </div>
        <div class="modal-body p-4">
          <form @submit.prevent="handleSubmit">
            <div class="row">
              <div class="col-md-8">
                <div class="row">
                  <div class="col-md-8 mb-3">
                    <label for="editName" class="form-label">اسم المنتج</label>
                    <input type="text" v-model="form.name" class="form-control" id="editName">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label for="profitMargin" class="form-label">هامش الربح</label>
                    <div class="input-group">
                      <input id="profitMargin" v-model.number="form.profitMargin" type="number" class="form-control" placeholder="0" min="0.01" step="0.01" />
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="editDesc" class="form-label">الوصف</label>
                  <textarea v-model="form.description" class="form-control" id="editDesc" rows="4"></textarea>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">الصورة الرئيسية</label>
                <div class="main-image-uploader">
                  <input type="file" @change="handleMainImageUpload" accept="image/*" class="file-input" title="انقر لتغيير الصورة الرئيسية" />
                  <div v-if="mainImagePreview" class="image-preview main-image-preview">
                    <img :src="mainImagePreview" alt="Main product image preview" />
                    <button @click.prevent="removeMainImage" class="remove-btn" type="button" title="إزالة الصورة">&times;</button>
                  </div>
                  <div v-else class="upload-prompt">
                    <i class="fas fa-camera"></i>
                    <p>اختر صورة</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="row g-3 mb-4">
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
              <div class="col-md-6">
                <label class="form-label">حالة المنتج</label>
                <div class="status-container">
                  <div class="form-check form-switch">
                    <input class="form-check-input status-switch" type="checkbox" role="switch" id="editStatus" v-model="form.is_active">
                    <label class="form-check-label" for="editStatus">
                      {{ form.is_active ? 'ظاهر' : 'مخفي' }}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="properties-section border rounded p-3 mb-4">
              <h5 class="mb-3">خواص المنتج</h5>
              <div class="properties-grid">
                <div v-for="prop in availableProperties" :key="prop.id" class="property-group">
                  <div class="property-combo-box">
                    <button type="button" class="combo-box-button" :class="{ 'active': openComboBox === prop.id }" @click="toggleComboBox(prop.id)">
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
                          <button type="button" class="select-all-btn" @click="toggleSelectAllLegacy(prop.name, prop.values.map(v => v.value))">
                            {{ areAllLegacyValuesSelected(prop.name, prop.values.map(v => v.value)) ? 'إلغاء تحديد الكل' : 'تحديد الكل' }}
                          </button>
                        </div>
                        <div class="checkbox-container">
                          <label v-for="value in prop.values" :key="`legacy-${value.id}`" class="checkbox-label">
                            <input type="checkbox" 
                              :value="value.value" 
                              :checked="isLegacyValueSelected(prop.name, value.value)" 
                              @change="handleLegacyPropertyChange(prop.name, value.value, $event)">
                            <span class="checkbox-text">{{ value.value }}</span>
                          </label>
                        </div>
                      </div>
                      <div v-for="subtitle in prop.subtitles" :key="subtitle.id" class="checkbox-section">
                        <div class="section-header-small">
                          <span>{{ subtitle.name }}</span>
                           <button type="button" class="select-all-btn" @click="toggleSelectAllSubtitle(prop.name, subtitle.name, subtitle.values.map(v => v.value))">
                            {{ areAllSubtitleValuesSelected(prop.name, subtitle.name, subtitle.values.map(v => v.value)) ? 'إلغاء تحديد الكل' : 'تحديد الكل' }}
                          </button>
                        </div>
                        <div class="checkbox-container">
                          <label v-for="value in subtitle.values" :key="`${subtitle.id}-${value.id}`" class="checkbox-label">
                            <input type="checkbox" 
                              :value="value.value" 
                              :checked="isSubtitleValueSelected(prop.name, subtitle.name, value.value)" 
                              @change="handleSubtitlePropertyChange(prop.name, subtitle.name, value.value, $event)">
                            <span class="checkbox-text">{{ value.value }}</span>
                          </label>
                        </div>
                      </div>
                      <div v-if="(!prop.values || prop.values.length === 0) && prop.subtitles.length === 0" class="empty-dropdown">
                        <p>لا توجد قيم متاحة لهذه الخاصية</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="variations-section border-top pt-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">الألوان والصور</h5>
                <button @click="addColorVariant" type="button" class="btn btn-primary btn-sm">
                  <i class="fas fa-plus"></i> إضافة لون جديد
                </button>
              </div>

              <div v-for="(variant, index) in form.variants" :key="index" class="variation-card">
                <div class="variation-header">
                  <div class="form-group">
                    <label class="form-label">كود اللون</label>
                    <div class="color-selection-container">
                      <div class="color-picker-wrapper" @click="toggleColorPicker(index)">
                        <div class="selected-color-preview" :style="{ backgroundColor: variant.colorHex }"></div>
                        <span class="color-hex-text">{{ variant.colorHex }}</span>
                        <i class="fas fa-chevron-down" :class="{ 'rotated': variant.showColorPicker }"></i>
                      </div>
                      
                      <div v-if="variant.showColorPicker" class="color-dropdown" @click.stop>
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
                              :class="{ 'selected': variant.colorHex.toLowerCase() === color.toLowerCase() }"
                              @click="selectUsedColor(index, color)"
                            >
                              <div class="color-circle" :style="{ backgroundColor: color }"></div>
                              <span class="color-code">{{ color }}</span>
                            </div>
                          </div>
                        </div>
                        <div v-else class="no-used-colors">
                          <p class="text-muted">لا توجد ألوان متاحة</p>
                        </div>
                        
                        <div class="custom-color-section">
                          <h4 class="color-section-title">أو اختر لون جديد</h4>
                          <div class="custom-color-picker">
                            <input 
                              v-model="variant.colorHex" 
                              type="color" 
                              class="color-input"
                              @change="handleHexColorChange(index, false)"
                            >
                            <input 
                              v-model="variant.colorHex" 
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
                    <span v-if="variant.error" class="error-message">{{ variant.error }}</span>
                  </div>
                  <button @click="removeColorVariant(index)" class="btn-remove-variation" type="button" title="حذف اللون">&times;</button>
                </div>

                <div class="form-group mt-3">
                  <label class="form-label">صور هذا اللون</label>
                  <div class="image-uploader">
                    <input type="file" multiple @change="e => addImagesToVariant(e, index)" accept="image/*" class="file-input" />
                    <div class="image-preview-grid">
                      <div v-for="(image, imgIndex) in (variant.images || [])" :key="`existing-${imgIndex}`" class="image-preview">
                        <img :src="image" />
                        <button @click="removeImageFromVariant(index, imgIndex, false)" class="remove-btn" type="button">&times;</button>
                      </div>
                      <div v-for="(newImg, newImgIndex) in getNewImagesForVariant(index)" :key="`new-${newImgIndex}`" class="image-preview">
                        <img :src="newImg.url" />
                        <button @click="removeImageFromVariant(index, newImgIndex, true)" class="remove-btn" type="button">&times;</button>
                      </div>
                      <div class="upload-prompt"><span>+</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">إلغاء</button>
          <button type="button" class="btn btn-warning" @click="handleSubmit" :disabled="productStore.isLoading">
            <span v-if="productStore.isLoading" class="spinner-border spinner-border-sm me-2"></span>
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

// Replace the script section in EditProduct.vue with this:

<script setup>
import { reactive, computed, ref, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { usePropStore } from '@/stores/propStore';
import { storeToRefs } from 'pinia';

const props = defineProps({
  product: { type: Object, required: true },
});
const emit = defineEmits(['close', 'product-updated']);

const productStore = useProductStore();
const categoryStore = useCategoryStore();
const propStore = usePropStore();

// --- CHANGE START ---
const { properties: allProperties } = storeToRefs(propStore);

// Filter out the 'Color' attribute from the list of selectable properties
const availableProperties = computed(() => {
  return allProperties.value.filter(p => p.name !== 'Ø§Ù„Ù„ÙˆÙ†');
});

// Get the list of predefined colors from the 'Color' attribute, like in AddProduct.vue
const availableColors = computed(() => {
    const colorProp = allProperties.value.find(p => p.name === 'Ø§Ù„Ù„ÙˆÙ†');
    return colorProp && Array.isArray(colorProp.values) 
      ? colorProp.values.map(v => v.value) 
      : [];
});
// --- CHANGE END ---


const form = reactive(JSON.parse(JSON.stringify(props.product)));
form.selectedProperties = {};
const openComboBox = ref(null);

// State for managing new file uploads
const newMainImageFile = ref(null);
const newMainImageURL = ref(null);
const newVariantImages = ref([]);

// Computed property for main image preview
const mainImagePreview = computed(() => {
  if (newMainImageURL.value) {
    return newMainImageURL.value;
  }
  return form.mainImage;
});

// Initialize form data and sync with product properties
const initializeFormProperties = () => {
  if (form.properties && typeof form.properties === 'object') {
    Object.keys(form.properties).forEach(propName => {
      const propData = form.properties[propName];
      form.selectedProperties[propName] = {
        legacy: propData.legacy ? [...propData.legacy] : [],
        subtitles: propData.subtitles ? JSON.parse(JSON.stringify(propData.subtitles)) : {}
      };
    });
  }

  if (form.variants) {
    form.variants.forEach(variant => {
      variant.showColorPicker = variant.showColorPicker || false;
      variant.error = variant.error || null;
    });
  }
};

const subCategoryGroups = computed(() => {
  const mainCategories = categoryStore.getMainCategories;
  return mainCategories.map(main => ({
    id: main.id,
    name: main.name,
    subCategories: categoryStore.getSubcategoriesByParent(main.id)
  })).filter(group => group.subCategories.length > 0);
});

onMounted(async () => {
  if (propStore.properties.length === 0) {
    await propStore.fetchAttributes();
  }
  
  // This fetch is kept in case other parts of the component rely on the full product list
  if (productStore.products.length === 0) {
    await productStore.fetchProducts();
  }
  
  initializeFormProperties();
});

// Main image management
const handleMainImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (newMainImageURL.value) {
    URL.revokeObjectURL(newMainImageURL.value);
  }
  
  newMainImageFile.value = file;
  newMainImageURL.value = URL.createObjectURL(file);
};

const removeMainImage = () => {
  if (newMainImageURL.value) {
    URL.revokeObjectURL(newMainImageURL.value);
    newMainImageURL.value = null;
    newMainImageFile.value = null;
  }
  form.mainImage = null;
};

// Properties management functions
const toggleComboBox = (propId) => {
  openComboBox.value = openComboBox.value === propId ? null : propId;
};

const isLegacyValueSelected = (propName, value) => {
  return form.selectedProperties[propName]?.legacy?.includes(value) || false;
};

const isSubtitleValueSelected = (propName, subtitleName, value) => {
  return form.selectedProperties[propName]?.subtitles?.[subtitleName]?.includes(value) || false;
};

const getSelectedCountForProperty = (propName) => {
  const propData = form.selectedProperties[propName];
  if (!propData) return 0;
  let count = 0;
  if (propData.legacy) count += propData.legacy.length;
  if (propData.subtitles) {
    Object.values(propData.subtitles).forEach(values => { 
      if (Array.isArray(values)) count += values.length; 
    });
  }
  return count;
};

const areAllLegacyValuesSelected = (propName, values) => {
  const selected = form.selectedProperties[propName]?.legacy || [];
  return values.length > 0 && values.every(v => selected.includes(v));
};

const areAllSubtitleValuesSelected = (propName, subtitleName, values) => {
  const selected = form.selectedProperties[propName]?.subtitles?.[subtitleName] || [];
  return values.length > 0 && values.every(v => selected.includes(v));
};

const initializeProperty = (propName) => {
  if (!form.selectedProperties[propName]) {
    form.selectedProperties[propName] = { legacy: [], subtitles: {} };
  }
};

const toggleSelectAllLegacy = (propName, values) => {
  initializeProperty(propName);
  const areAllSelected = areAllLegacyValuesSelected(propName, values);
  form.selectedProperties[propName].legacy = areAllSelected ? [] : [...values];
  cleanupPropertyData(propName);
};

const toggleSelectAllSubtitle = (propName, subtitleName, values) => {
  initializeProperty(propName);
  if (!form.selectedProperties[propName].subtitles) {
    form.selectedProperties[propName].subtitles = {};
  }
  const areAllSelected = areAllSubtitleValuesSelected(propName, subtitleName, values);
  form.selectedProperties[propName].subtitles[subtitleName] = areAllSelected ? [] : [...values];
  cleanupPropertyData(propName);
};

const handleLegacyPropertyChange = (propName, value, event) => {
  if (!form.selectedProperties[propName]) {
    form.selectedProperties[propName] = { legacy: [], subtitles: {} };
  }
  if (!form.selectedProperties[propName].legacy) {
    form.selectedProperties[propName].legacy = [];
  }
  
  if (event.target.checked) {
    if (!form.selectedProperties[propName].legacy.includes(value)) {
      form.selectedProperties[propName].legacy.push(value);
    }
  } else {
    const index = form.selectedProperties[propName].legacy.indexOf(value);
    if (index > -1) {
      form.selectedProperties[propName].legacy.splice(index, 1);
    }
  }
  cleanupPropertyData(propName);
};

const handleSubtitlePropertyChange = (propName, subtitleName, value, event) => {
  if (!form.selectedProperties[propName]) {
    form.selectedProperties[propName] = { legacy: [], subtitles: {} };
  }
  if (!form.selectedProperties[propName].subtitles) {
    form.selectedProperties[propName].subtitles = {};
  }
  if (!form.selectedProperties[propName].subtitles[subtitleName]) {
    form.selectedProperties[propName].subtitles[subtitleName] = [];
  }
  
  if (event.target.checked) {
    if (!form.selectedProperties[propName].subtitles[subtitleName].includes(value)) {
      form.selectedProperties[propName].subtitles[subtitleName].push(value);
    }
  } else {
    const index = form.selectedProperties[propName].subtitles[subtitleName].indexOf(value);
    if (index > -1) {
      form.selectedProperties[propName].subtitles[subtitleName].splice(index, 1);
    }
  }
  cleanupPropertyData(propName);
};

const cleanupPropertyData = (propName) => {
  const prop = form.selectedProperties[propName];
  if (!prop) return;
  
  if (prop.legacy && prop.legacy.length === 0) {
    delete prop.legacy;
  }
  
  if (prop.subtitles) {
    Object.keys(prop.subtitles).forEach(sub => {
      if (!prop.subtitles[sub] || prop.subtitles[sub].length === 0) {
        delete prop.subtitles[sub];
      }
    });
    if (Object.keys(prop.subtitles).length === 0) {
      delete prop.subtitles;
    }
  }
  
  if (Object.keys(prop).length === 0) {
    delete form.selectedProperties[propName];
  }
};

// Color variants management
const addColorVariant = () => {
  if (!form.variants) form.variants = [];
  form.variants.push({ 
    colorHex: '#000000', 
    images: [], 
    stock: [], 
    showColorPicker: false, 
    error: null 
  });
};

const removeColorVariant = (index) => {
  form.variants.splice(index, 1);
};

const toggleColorPicker = (index) => {
  form.variants.forEach((v, i) => { 
    if (i !== index) v.showColorPicker = false; 
  });
  form.variants[index].showColorPicker = !form.variants[index].showColorPicker;
};

const selectUsedColor = (index, colorHex) => {
  form.variants[index].colorHex = colorHex;
  handleHexColorChange(index, true);
};

const closeColorPicker = (index) => {
  form.variants[index].showColorPicker = false;
};

const handleHexColorChange = (index, shouldClosePicker) => {
  const variant = form.variants[index];
  let color = variant.colorHex.toLowerCase();
  if (!color.startsWith('#')) color = '#' + color;
  variant.colorHex = color;
  
  const isDuplicate = form.variants.some((v, i) => 
    i !== index && v.colorHex.toLowerCase() === variant.colorHex.toLowerCase()
  );
  variant.error = isDuplicate ? 'Ù‡Ø°Ø§ Ø§Ù„Ù„ÙˆÙ† ØªÙ… Ø§Ø®ØªÙŠØ§Ø±Ù‡ Ø¨Ø§Ù„ÙØ¹Ù„.' : null;
  
  if (shouldClosePicker) variant.showColorPicker = false;
};

// Variant image management
const getNewImagesForVariant = (variantIndex) => {
  return newVariantImages.value.filter(img => img.variantIndex === variantIndex);
};

const addImagesToVariant = (event, variantIndex) => {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    newVariantImages.value.push({
      variantIndex,
      file,
      url: URL.createObjectURL(file)
    });
  });
};

const removeImageFromVariant = (variantIndex, imageIndex, isNew) => {
  if (isNew) {
    const newImagesForVariant = getNewImagesForVariant(variantIndex);
    const targetImage = newImagesForVariant[imageIndex];
    const overallIndex = newVariantImages.value.findIndex(img => img === targetImage);
    
    if (overallIndex > -1) {
      URL.revokeObjectURL(newVariantImages.value[overallIndex].url);
      newVariantImages.value.splice(overallIndex, 1);
    }
  } else {
    const variant = form.variants[variantIndex];
    if (variant && variant.images) {
      variant.images.splice(imageIndex, 1);
    }
  }
};

// Form submission
const handleSubmit = async () => {
  const updateData = {
    ...form,
    properties: form.selectedProperties,
  };
  delete updateData.selectedProperties;

  const variantFiles = newVariantImages.value.map(img => ({
    variantIndex: img.variantIndex,
    file: img.file
  }));

  const result = await productStore.updateProduct(
    form.id, 
    updateData, 
    newMainImageFile.value,
    variantFiles
  );

  if (result.success) {
    if (newMainImageURL.value) URL.revokeObjectURL(newMainImageURL.value);
    newVariantImages.value.forEach(img => URL.revokeObjectURL(img.url));
    
    emit('product-updated');
  } else {
    console.error("Failed to update product:", result.error);
  }
};
</script>
<style scoped>
/* All styles are unchanged */
/* Modal and layout fixes */
.modal-xl {
  max-width: 1000px;
}

/* Status switch improvements */
.status-container {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 12px 16px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background-color: #fff;
}

.form-check.form-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 0;
}

.status-switch {
  width: 3.5em !important;
  height: 1.75em !important;
  cursor: pointer;
  margin: 0 !important;
}

.form-check-label {
  font-weight: 500;
  color: #374151;
  margin: 0 !important;
  cursor: pointer;
}

/* Main image uploader improvements */
.main-image-uploader {
  border: 2px dashed #ced4da;
  border-radius: 8px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background-color: #f8f9fa;
  overflow: hidden;
}

.main-image-uploader .upload-prompt {
  text-align: center;
  color: #6c757d;
}

.main-image-uploader .upload-prompt i {
  font-size: 2rem;
  margin-bottom: 8px;
  display: block;
}

.main-image-preview {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.main-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.main-image-preview .remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Properties section styles */
.properties-section {
  background-color: #f8f9fa;
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.property-group, .property-combo-box {
  position: relative;
}

.combo-box-button {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ced4da;
  border-radius: 6px;
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
  font-weight: 600; 
  color: #374151;
}

.selected-count { 
  color: #3b82f6; 
  font-size: 12px; 
  font-weight: 500;
}

.combo-box-icon { 
  transition: transform 0.2s ease; 
  color: #6b7280;
  font-size: 12px;
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
  border: 1px solid #ced4da;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;
}

.checkbox-section { 
  border-bottom: 1px solid #e9ecef; 
}

.checkbox-section:last-child { 
  border-bottom: none; 
}

.section-header-small {
  background-color: #f8f9fa;
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
  border-radius: 4px; 
  transition: background-color 0.15s ease;
}

.checkbox-label:hover { 
  background-color: #f8f9fa; 
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

/* Enhanced Color Selection Styles */
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

.no-used-colors {
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.no-used-colors p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
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

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

/* Variations Section Styles */
.variation-card {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
}

.variation-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.form-group { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
}

.form-group .form-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  margin-bottom: 4px;
}

.btn-remove-variation {
  background-color: #f8d7da;
  color: #721c24;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-remove-variation:hover {
  background-color: #f5c6cb;
  transform: scale(1.1);
}

.image-uploader { 
  position: relative; 
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background-color: #f9fafb;
}

.image-preview-grid { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 10px; 
  margin-top: 10px;
}

.image-preview, .upload-prompt {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-prompt { 
  border: 2px dashed #ced4da; 
  color: #6c757d; 
  font-size: 24px; 
  background-color: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.upload-prompt:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.image-preview img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.remove-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

/* Responsive improvements */
@media (max-width: 768px) {
  .variation-header {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .btn-remove-variation {
    position: static;
    width: 100%;
    border-radius: 6px;
    margin-top: 12px;
  }
  
  .properties-grid {
    grid-template-columns: 1fr;
  }
  
  .color-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }
}
</style>
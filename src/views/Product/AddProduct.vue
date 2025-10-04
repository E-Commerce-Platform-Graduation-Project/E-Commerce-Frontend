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
          <div id="mainImageUploader" class="main-image-uploader" :class="{ 'error-border': errors.mainImage }">
            <input type="file" @change="handleMainImageUpload" accept="image/*" class="file-input" />

            <div v-if="!productData.mainImage" class="upload-prompt">
              <p>اسحب الصورة أو انقر هنا</p>
            </div>

            <div v-if="productData.mainImage" class="image-preview main-image-preview">
              <img :src="productData.mainImage.url" />
              <button @click="removeMainImage" class="remove-btn" type="button">&times;</button>
              <!-- ADDED: Progress Overlay -->
              <div v-if="productData.mainImage.compressing" class="compression-overlay">
                <div class="progress-bar-container">
                  <div class="progress-bar" :style="{ width: productData.mainImage.progress + '%' }"></div>
                </div>
                <span class="progress-text">جاري الضغط... {{ productData.mainImage.progress }}%</span>
              </div>
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

        <div id="propertiesSection" class="properties-section" :class="{ 'is-focused': openComboBox !== null }">
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

        <div id="variationsSection" class="variations-section">
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

          <div v-for="(variation, index) in productData.colorVariations" :key="variation.id" class="variation-card" :class="{ 'is-focused': variation.showColorPicker }">
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

            <div class="form-group images-section" :class="{ 'pushed-down': variation.showColorPicker }">
              <label class="form-label">صور هذا اللون</label>
              <div :id="`colorImagesUploader-${index}`" class="image-uploader" :class="{ 'error-border': errors[`color_${index}_images`] }">
                <input type="file" multiple @change="e => handleImageUpload(e, index)" accept="image/*"
                  class="file-input" />
                <div v-if="variation.images.length === 0" class="upload-prompt">
                  <p>اسحب الصور أو انقر هنا</p>
                </div>
                <div class="image-preview-grid">
                  <div v-for="(image, imgIndex) in variation.images" :key="imgIndex" class="image-preview">
                    <img :src="image.url" />
                    <button @click="removeImage(index, imgIndex)" class="remove-btn" type="button">&times;</button>
                     <!-- ADDED: Progress Overlay -->
                    <div v-if="image.compressing" class="compression-overlay">
                      <div class="progress-bar-container">
                        <div class="progress-bar" :style="{ width: image.progress + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ image.progress }}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <span v-if="errors[`color_${index}_images`]" class="error-message">{{ errors[`color_${index}_images`]
                }}</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="handleCancel" class="btn btn-secondary"
            :disabled="productStore.isLoading">إلغاء</button>
          <button type="submit" class="btn btn-dark" :disabled="productStore.isLoading">
            <span v-if="productStore.isLoading" class="loading-spinner"></span>
            {{ productStore.isLoading ? 'جاري الاضافة...' : 'اضافة المنتج' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-dialog success-modal" @click.stop>
        <div class="modal-icon success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>تم بنجاح!</h3>
        <p>تمت إضافة المنتج بنجاح!</p>
        <button @click="closeSuccessModal" class="btn btn-dark">موافق</button>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-dialog error-modal" @click.stop>
        <div class="modal-icon error-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <h3>حدث خطأ!</h3>
        <p>{{ modalErrorMessage }}</p>
        <button @click="closeErrorModal" class="btn btn-danger">إغلاق</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useCategoryStore } from '@/stores/categoryStore';
import { useProductStore, compressImage } from '@/stores/productStore'; // Import compressImage
import { usePropStore } from '@/stores/propStore';
import { storeToRefs } from 'pinia';
import heic2any from 'heic2any';

const router = useRouter();
const categoryStore = useCategoryStore();
const productStore = useProductStore();
const propStore = usePropStore();

const getInitialProductData = () => ({
  name: '',
  description: '',
  mainImage: null, // Will now be an object: { file, url, compressing, progress }
  categoryId: '',
  profitMargin: null,
  selectedProperties: {},
  colorVariations: [], // Images inside will be objects too
});

const productData = reactive(getInitialProductData());
const errors = reactive({});
const selectedMainCategory = ref(null);
const openComboBox = ref(null);
const propertiesLoading = ref(false);
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const modalErrorMessage = ref('');


const mainCategories = computed(() => categoryStore.getMainCategories);
const subCategories = computed(() => selectedMainCategory.value ? categoryStore.getSubcategoriesByParent(selectedMainCategory.value) : []);

const { properties: allProperties } = storeToRefs(propStore);

const isHexColorValue = (value) => /^#[0-9A-F]{6}$/i.test(value);

const availableProperties = computed(() => {
  return allProperties.value.filter(prop => {
    const isColorProp = prop.values?.some(v => isHexColorValue(v.value));
    return !isColorProp;
  });
});

const availableColors = computed(() => {
    const colorProp = allProperties.value.find(p => p.values?.some(v => isHexColorValue(v.value)));
    return colorProp && Array.isArray(colorProp.values) 
      ? colorProp.values.map(v => v.value) 
      : [];
});

watch(selectedMainCategory, () => { productData.categoryId = ''; });

const handleClickOutside = (event) => {
  const isClickInsidePropertyBox = event.target.closest('.property-combo-box');
  const isClickInsideColorPicker = event.target.closest('.color-selection-container');

  if (!isClickInsidePropertyBox && !isClickInsideColorPicker) {
    openComboBox.value = null;
    productData.colorVariations.forEach(variation => {
      variation.showColorPicker = false;
    });
  }
};

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
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// REVISED: Logic to show progress bar correctly
const handleMainImageUpload = async (event) => {
  const file = event.target.files[0];

  // If a file was previously selected, release its memory
  if (productData.mainImage && productData.mainImage.url) {
    URL.revokeObjectURL(productData.mainImage.url);
  }

  // If the user cancelled the file selection, clear the image and return
  if (!file) {
    productData.mainImage = null;
    return;
  }

  // 1. ✅ Process the file (convert if HEIC, validate if not)
  let processedFile = null;
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic');

  if (isHeic) {
    try {
      console.log(`Converting HEIC main image: ${file.name}`);
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8,
      });
      // Restore the filename
      convertedBlob.name = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
      processedFile = convertedBlob;
    } catch (error) {
      console.error("Main image HEIC conversion failed:", error);
      processedFile = null; // Set to null on failure
    }
  } else if (file.type.startsWith('image/')) {
    // It's a standard, valid image file
    processedFile = file;
  }
  
  // Always reset the file input to allow re-selecting the same file
  event.target.value = null;

  // 2. ✅ Check if processing was successful
  // If processedFile is null, the file was invalid or conversion failed
  if (!processedFile) {
    errors.mainImage = 'الملف المحدد ليس صورة صالحة أو فشل تحويله.';
    productData.mainImage = null; // Clear any existing image
    return; // Stop the function
  }

  // 3. ✅ If validation passes, proceed with the processed file
  // Clear any previous error
  if (errors.mainImage) delete errors.mainImage;

  // Create reactive object and set state immediately
  const imageObject = reactive({
    file: processedFile, // Use the processed (potentially converted) file
    url: URL.createObjectURL(processedFile),
    compressing: true,
    progress: 0,
  });
  productData.mainImage = imageObject;

  const onProgress = (p) => {
    imageObject.progress = p;
  };

  // Start compression in the background
  compressImage(processedFile, onProgress)
    .then(compressedFile => {
      imageObject.file = compressedFile;
    })
    .catch(error => {
      console.error("Compression failed for main image:", error);
    })
    .finally(() => {
      imageObject.compressing = false;
    });
};

const removeMainImage = () => {
  if (productData.mainImage) {
    URL.revokeObjectURL(productData.mainImage.url);
    productData.mainImage = null;
  }
};

// REVISED: Logic to show progress bar correctly
const handleImageUpload = async (event, variationIndex) => { 
  const allFiles = Array.from(event.target.files);
  const variation = productData.colorVariations[variationIndex];
  
  if (!variation) return;

  // Clear any previous errors for this input
  if (errors[`color_${variationIndex}_images`]) {
    delete errors[`color_${variationIndex}_images`];
  }

  // Use Promise.all to handle all file processing (including conversion)
  const processedFiles = await Promise.all(allFiles.map(async (file) => {
    // 3. Check if the file is HEIC/HEIF
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic');
    
    if (isHeic) {
      try {
        console.log(`Converting HEIC file: ${file.name}`);
        // Convert the file to JPEG. The result is a Blob.
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8, // You can adjust the quality
        });
        // The library doesn't keep the original filename, so we add it back.
        convertedBlob.name = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
        return convertedBlob;
      } catch (error) {
        console.error("HEIC conversion failed:", error);
        // If conversion fails, return null to filter it out later
        return null; 
      }
    }
    
    // If it's a regular image file, return it as is
    if (file.type.startsWith('image/')) {
      return file;
    }

    // If it's not a supported image type at all, return null
    return null;
  }));

  // Filter out any files that failed conversion or were invalid
  const validFiles = processedFiles.filter(file => file !== null);

  // If some files were invalid (not images or failed conversion), show an error
  if (validFiles.length !== allFiles.length) {
    errors[`color_${variationIndex}_images`] = 'تم تجاهل بعض الملفات لأنها غير مدعومة أو فشل تحويلها.';
  }
  
  // 4. Continue with your existing logic using the valid (and converted) files
  validFiles.forEach(file => {
    const imageObject = reactive({
      file: file, // This is now either the original image or the converted JPEG
      url: URL.createObjectURL(file),
      compressing: true,
      progress: 0,
    });
    variation.images.push(imageObject);

    const onProgress = (p) => {
      imageObject.progress = p;
    };

    compressImage(file, onProgress)
      .then(compressedFile => {
        imageObject.file = compressedFile;
      })
      .catch(error => {
        console.error("Compression failed for variant image:", error);
      })
      .finally(() => {
        imageObject.compressing = false;
      });
  });

  // Reset the file input
  event.target.value = null;
};


const removeImage = (variationIndex, imageIndex) => {
  const variation = productData.colorVariations[variationIndex];
  if (variation && variation.images[imageIndex]) {
    URL.revokeObjectURL(variation.images[imageIndex].url);
    variation.images.splice(imageIndex, 1);
  }
};

const addColorVariation = () => {
  productData.colorVariations.push({
    id: Date.now(),
    colorHex: '#000000',
    images: [], // Images will be objects
    showColorPicker: false,
    error: null,
  });
};

const removeColorVariation = (index) => {
  productData.colorVariations[index].images.forEach(img => URL.revokeObjectURL(img.url));
  productData.colorVariations.splice(index, 1);
  validateForm(); // Re-validate after removing
};

// --- Form logic and other methods (unchanged unless specified) ---

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
const validateForm = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  let isValid = true;
  if (!productData.name.trim()) { errors.name = 'اسم المنتج مطلوب'; isValid = false; }
  if (!productData.mainImage) { if(!errors.mainImage) errors.mainImage ='الصورة الرئيسية للمنتج مطلوبة'; isValid = false; }
  if (!productData.categoryId) { errors.categoryId = 'يجب اختيار فئة للمنتج'; isValid = false; }
  
  if (productData.profitMargin === null || productData.profitMargin === undefined || productData.profitMargin === '') {
    errors.profitMargin = 'هامش الربح مطلوب';
    isValid = false;
  } else if (isNaN(productData.profitMargin) || productData.profitMargin <= 0) {
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
    productData.colorVariations.forEach((v, i) => {
      const lowerCaseColor = v.colorHex.toLowerCase();
      if (colorSet.has(lowerCaseColor)) {
        v.error = 'هذا اللون تم اختياره بالفعل.';
        errors.colorVariations = 'لا يمكن اختيار نفس اللون أكثر من مرة.';
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
  }
  return isValid;
};
const getFieldId = (fieldName) => {
  if (fieldName.startsWith('color_')) {
    const index = fieldName.split('_')[1];
    return `colorImagesUploader-${index}`;
  }
  const fieldIdMap = {
    name: 'productName', mainImage: 'mainImageUploader', categoryId: 'mainCategory',
    properties: 'propertiesSection', profitMargin: 'profitMargin', colorVariations: 'variationsSection',
  };
  return fieldIdMap[fieldName] || fieldName;
};
const scrollToFirstError = async () => {
  await nextTick();
  const firstErrorKey = Object.keys(errors)[0];
  if (firstErrorKey) {
    const elementId = getFieldId(firstErrorKey);
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

const handleSubmit = async () => {
  if (!validateForm()) {
    await scrollToFirstError();
    return;
  }

  // The productData object now contains the compressed files, so it's ready to be sent.
  const result = await productStore.addProduct(productData);
  if (result.success) {
    showSuccessModal.value = true;
    Object.assign(productData, getInitialProductData());
    selectedMainCategory.value = null;
  } else {
    modalErrorMessage.value = result.error || 'حدث خطأ غير متوقع.';
    showErrorModal.value = true;
  }
};

const handleCancel = () => { router.push('/products'); };
const closeSuccessModal = () => { showSuccessModal.value = false; router.push('/products'); };
const closeErrorModal = () => { showErrorModal.value = false; };
</script>

<style scoped>
/* ADDED: Styles for compression progress overlay */
.image-preview {
  position: relative; /* Ensure the preview container is a positioning context */
}

.compression-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  border-radius: 8px; /* Match the image preview border-radius */
  z-index: 10;
  pointer-events: none; /* Make it non-interactive */
}

.progress-bar-container {
  width: 80%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background-color: #3b82f6; /* Use your primary color */
  border-radius: 4px;
  transition: width 0.2s ease-in-out;
}

.progress-text {
  font-size: 12px;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}


/* --- Other styles remain unchanged --- */
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
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1001; /* Higher than combo box dropdown */
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
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
.btn{
  cursor: pointer;
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
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 6px;
  margin-top: 8px;
}
.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
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
  width: 28px;
  height: 28px;
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
  padding: 12px 16px;
}
.custom-color-picker {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
}
.color-input {
  width: 50px;
  height: 36px;
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
  transition: all 0.3s ease;
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
.images-section {
  transition: margin-top 0.3s ease;
}

.images-section.pushed-down {
  margin-top: 320px; /* Adjust this value based on your color dropdown height */
}

.image-uploader {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
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
  z-index: 20; /* Ensure it's above the overlay */
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
  transition: all 0.3s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-dark {
  background-color: #363636;
  color: white;
}
.btn-dark:hover:not(:disabled) {
  background-color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}
.btn-secondary {
  background-color: #6b7280;
  color: white;
}
.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
  transform: translateY(-2px);
}
.btn-danger {
  background: #e74c3c;
  color: white;
}
.btn-danger:hover:not(:disabled) { 
  background: #c0392b; 
  transform: translateY(-2px);
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
  z-index: 5;
}
.error-border {
  border-color: #ef4444 !important;
  border-style: solid !important;
}
.add-product-container {
  direction: rtl;
  padding: 40px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #cacacab5 100%);
  min-height: 100vh;
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
  overflow: visible; /* Changed from hidden to visible */
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
  transition: all 0.3s ease;
}
.form-input.error,
.form-textarea.error,
.form-select.error {
    border-color: #ef4444;
    background: #fef2f2;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: block;
  animation: errorSlideIn 0.3s ease-out;
}
@keyframes errorSlideIn {
  from { 
    opacity: 0; 
    transform: translateY(-10px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
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
  position: relative;
  z-index: 1;
}
.property-group,
.property-combo-box {
  position: relative;
}
.property-group {
  position: relative;
  z-index: 2;
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
  background-color: #0f0f0f;
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
  overflow: visible;
  z-index: 1; /* Lower z-index for variation cards */
}

.variation-card.is-focused {
  z-index: 50; /* Higher when color picker is open */
}

.properties-section.is-focused {
  position: relative;
  z-index: 100;
}

.property-combo-box {
  position: relative;
  z-index: 10;
}

.combo-box-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000; /* Increased z-index */
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
}

.combo-box-button.active + .combo-box-dropdown,
.color-picker-wrapper + .color-dropdown {
  z-index: 9999;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-50px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
}

.success-icon {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
}

.error-icon {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.modal-dialog h3 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.modal-dialog p {
  color: #7f8c8d;
  margin: 0 0 30px 0;
  font-size: 16px;
}

/* Error Highlighting */
.error-highlight {
  border-color: #e74c3c !important; 
  background-color: #fef2f2;
  box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.2);
  animation: errorPulse 0.5s ease-in-out;
}

.form-input.error-highlight, 
.form-textarea.error-highlight, 
.form-select.error-highlight, 
.main-image-uploader.error-highlight, 
.image-uploader.error-highlight {
  border-style: solid !important;
}

@keyframes errorPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Slide-in Animation */
.form-group, .properties-section, .variations-section, .form-actions, .form-row {
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;
}

/* Stagger the animations */
.product-form > .form-group:nth-of-type(1) { animation-delay: 0.1s; }
.product-form > .form-group:nth-of-type(2) { animation-delay: 0.2s; }
.product-form > .form-group:nth-of-type(3) { animation-delay: 0.3s; }
.form-row { animation-delay: 0.4s; }
.properties-section { animation-delay: 0.5s; }
.form-group:has(#profitMargin) { animation-delay: 0.6s; }
.variations-section { animation-delay: 0.7s; }
.form-actions { animation-delay: 0.8s; }

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .add-product-container { padding: 10px; }
  .title { font-size: 24px; }
  .form-container { padding: 30px 20px; }
  .form-row { grid-template-columns: 1fr; gap: 15px; }
  .form-actions { flex-direction: column; }
  .btn { width: 100%; }
}
</style>


<template>
  <div
    class="modal fade show d-block"
    style="background-color: rgba(0, 0, 0, 0.5); z-index: 1060"
    tabindex="-1"
  >
    <div
      class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
    >
      <div class="modal-content edit-product-modal">
        <div class="modal-header bg-warning">
          <h5 class="modal-title">تعديل المنتج: {{ form.name }}</h5>
        </div>
        <div class="modal-body p-4">
          <form @submit.prevent="handleSubmit" novalidate>
            <div class="row">
              <div class="col-md-8">
                <div class="row">
                  <div class="col-md-8 mb-3">
                    <label for="editName" class="form-label">اسم المنتج</label>
                    <input
                      type="text"
                      v-model="form.name"
                      class="form-control"
                      :class="{ 'is-invalid': errors.name }"
                      id="editName"
                    />
                    <div v-if="errors.name" class="invalid-feedback d-block">
                      {{ errors.name }}
                    </div>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label for="profitMargin" class="form-label"
                      >هامش الربح</label
                    >
                    <div class="input-group">
                      <input
                        id="profitMargin"
                        v-model.number="form.profitMargin"
                        type="number"
                        class="form-control"
                        :class="{ 'is-invalid': errors.profitMargin }"
                        placeholder="0"
                        min="0.01"
                        step="0.01"
                      />
                      <span class="input-group-text">%</span>
                    </div>
                    <div
                      v-if="errors.profitMargin"
                      class="invalid-feedback d-block"
                    >
                      {{ errors.profitMargin }}
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="editDesc" class="form-label">الوصف</label>
                  <textarea
                    v-model="form.description"
                    class="form-control"
                    id="editDesc"
                    rows="4"
                  ></textarea>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">الصورة الرئيسية</label>
                <div
                  class="main-image-uploader"
                  @click="triggerMainImageUpload"
                >
                  <input
                    ref="mainImageInput"
                    type="file"
                    @change="handleMainImageUpload"
                    accept="image/*"
                    class="file-input"
                  />
                  <div
                    v-if="mainImagePreview"
                    class="image-preview main-image-preview"
                  >
                    <img
                      :src="mainImagePreview"
                      alt="Main product image preview"
                      @click.stop="openImageModal(mainImagePreview)"
                    />
                    <button
                      @click.stop="removeMainImage"
                      class="remove-btn"
                      type="button"
                      title="إزالة الصورة"
                    >
                      &times;
                    </button>
                  </div>
                  <div v-else class="upload-prompt">
                    <i class="fas fa-camera"></i>
                    <p>اختر صورة</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-9">
                <label for="editCategory" class="form-label">الفئة</label>
                <select
                  v-model="form.categoryId"
                  class="form-select py-3"
                  :class="{ 'is-invalid': errors.categoryId }"
                  id="editCategory"
                >
                  <option disabled value="">اختر فئة فرعية...</option>
                  <optgroup
                    v-for="group in subCategoryGroups"
                    :key="group.id"
                    :label="group.name"
                  >
                    <option
                      v-for="subCategory in group.subCategories"
                      :key="subCategory.id"
                      :value="subCategory.id"
                    >
                      {{ subCategory.name }}
                    </option>
                  </optgroup>
                </select>
                <div v-if="errors.categoryId" class="invalid-feedback d-block">
                  {{ errors.categoryId }}
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label">حالة المنتج</label>
                <div class="status-container py-3">
                  <div class="status-toggle-wrapper">
                    <button
                      @click="form.is_active = !form.is_active"
                      type="button"
                      :class="['status-toggle', { active: form.is_active }]"
                    >
                      <div class="toggle-slider"></div>
                    </button>
                    <label class="status-label">
                      {{ form.is_active ? "نشط" : "غير نشط" }}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="properties-section border rounded p-3 mb-4">
              <h5 class="mb-3">خواص المنتج</h5>
              <div class="properties-grid">
                <div
                  v-for="prop in availableProperties"
                  :key="prop.id"
                  class="property-group"
                >
                  <div class="property-combo-box">
                    <button
                      type="button"
                      class="combo-box-button"
                      :class="{ active: openComboBox === prop.id }"
                      @click="toggleComboBox(prop.id)"
                    >
                      <span class="combo-box-title">{{ prop.name }}</span>
                      <span
                        class="selected-count"
                        v-if="getSelectedCountForProperty(prop.name) > 0"
                      >
                        ({{ getSelectedCountForProperty(prop.name) }} محدد)
                      </span>
                      <i
                        class="fas fa-chevron-down combo-box-icon"
                        :class="{ rotated: openComboBox === prop.id }"
                      ></i>
                    </button>
                    <div
                      v-show="openComboBox === prop.id"
                      class="combo-box-dropdown"
                    >
                      <div
                        v-if="prop.values && prop.values.length > 0"
                        class="checkbox-section"
                      >
                        <div class="section-header-small">
                          <span>قيم عامة</span>
                          <button
                            type="button"
                            class="select-all-btn"
                            @click="
                              toggleSelectAllLegacy(
                                prop.name,
                                prop.values.map((v) => v.value)
                              )
                            "
                          >
                            {{
                              areAllLegacyValuesSelected(
                                prop.name,
                                prop.values.map((v) => v.value)
                              )
                                ? "إلغاء تحديد الكل"
                                : "تحديد الكل"
                            }}
                          </button>
                        </div>
                        <div class="checkbox-container">
                          <label
                            v-for="value in prop.values"
                            :key="`legacy-${value.id}`"
                            class="checkbox-label"
                          >
                            <input
                              type="checkbox"
                              :value="value.value"
                              :checked="
                                isLegacyValueSelected(prop.name, value.value)
                              "
                              @change="
                                handleLegacyPropertyChange(
                                  prop.name,
                                  value.value,
                                  $event
                                )
                              "
                            />
                            <span class="checkbox-text">{{ value.value }}</span>
                          </label>
                        </div>
                      </div>
                      <div
                        v-for="subtitle in prop.subtitles"
                        :key="subtitle.id"
                        class="checkbox-section"
                      >
                        <div class="section-header-small">
                          <span>{{ subtitle.name }}</span>
                          <button
                            type="button"
                            class="select-all-btn"
                            @click="
                              toggleSelectAllSubtitle(
                                prop.name,
                                subtitle.name,
                                subtitle.values.map((v) => v.value)
                              )
                            "
                          >
                            {{
                              areAllSubtitleValuesSelected(
                                prop.name,
                                subtitle.name,
                                subtitle.values.map((v) => v.value)
                              )
                                ? "إلغاء تحديد الكل"
                                : "تحديد الكل"
                            }}
                          </button>
                        </div>
                        <div class="checkbox-container">
                          <label
                            v-for="value in subtitle.values"
                            :key="`${subtitle.id}-${value.id}`"
                            class="checkbox-label"
                          >
                            <input
                              type="checkbox"
                              :value="value.value"
                              :checked="
                                isSubtitleValueSelected(
                                  prop.name,
                                  subtitle.name,
                                  value.value
                                )
                              "
                              @change="
                                handleSubtitlePropertyChange(
                                  prop.name,
                                  subtitle.name,
                                  value.value,
                                  $event
                                )
                              "
                            />
                            <span class="checkbox-text">{{ value.value }}</span>
                          </label>
                        </div>
                      </div>
                      <div
                        v-if="
                          (!prop.values || prop.values.length === 0) &&
                          (!prop.subtitles || prop.subtitles.length === 0)
                        "
                        class="empty-dropdown"
                      >
                        <p>لا توجد قيم متاحة لهذه الخاصية</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="variations-section border-top pt-4">
              <div
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <h5 class="mb-0">الألوان والصور</h5>
                <button
                  @click="addColorVariant"
                  type="button"
                  class="add-color"
                >
                  <i class="fas fa-plus"></i> إضافة لون جديد
                </button>
              </div>

              <div
                v-for="(variant, index) in form.variants"
                :key="index"
                class="variation-card"
              >
                <div class="variation-header">
                  <div class="form-group">
                    <label class="form-label">كود اللون</label>
                    <div class="color-display-container">
                      <div class="color-display-wrapper">
                        <div
                          class="selected-color-preview"
                          :style="{ backgroundColor: variant.colorHex }"
                        ></div>
                        <span class="color-hex-text">{{
                          variant.colorHex
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-group mt-3">
                  <label class="form-label">صور هذا اللون</label>
                  <div
                    class="image-uploader"
                    @click="triggerVariantImageUpload(index)"
                  >
                    <input
                      :ref="
                        (el) => {
                          variantImageInputs[index] = el;
                        }
                      "
                      type="file"
                      multiple
                      @change="(e) => addImagesToVariant(e, index)"
                      accept="image/*"
                      class="file-input"
                    />
                    <div class="image-preview-grid">
                      <div
                        v-for="(image, imgIndex) in variant.images || []"
                        :key="`existing-${imgIndex}`"
                        class="image-preview"
                      >
                        <img :src="image" @click.stop="openImageModal(image)" />
                        <button
                          @click.stop="
                            removeImageFromVariant(index, imgIndex, false)
                          "
                          class="remove-btn"
                          type="button"
                        >
                          &times;
                        </button>
                      </div>
                      <div
                        v-for="(newImg, newImgIndex) in getNewImagesForVariant(
                          variant.colorHex
                        )"
                        :key="`new-${newImgIndex}`"
                        class="image-preview"
                      >
                        <img
                          :src="newImg.url"
                          @click.stop="openImageModal(newImg.url)"
                        />
                        <button
                          @click.stop="
                            removeImageFromVariant(index, newImgIndex, true)
                          "
                          class="remove-btn"
                          type="button"
                        >
                          &times;
                        </button>
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
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            إلغاء
          </button>
          <button
            type="button"
            class="btn btn-warning"
            @click="handleSubmit"
            :disabled="productStore.isLoading"
          >
            <span
              v-if="productStore.isLoading"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>

    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="image-modal-content" @click.stop>
        <button @click="closeImageModal" class="image-modal-close">
          &times;
        </button>
        <img :src="modalImageSrc" alt="عرض الصورة" />
      </div>
    </div>

    <div
      v-if="showSuccessModal"
      class="modal-overlay"
      @click="closeSuccessModal"
    >
      <div class="modal-dialog success-modal" @click.stop>
        <div class="modal-icon success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>تم بنجاح!</h3>
        <p>تم تحديث المنتج بنجاح!</p>
        <button @click="closeSuccessModal" class="btn btn-primary">
          موافق
        </button>
      </div>
    </div>

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
import { reactive, computed, ref, onMounted } from "vue";
import { useProductStore } from "@/stores/productStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { usePropStore } from "@/stores/propStore";
import { storeToRefs } from "pinia";

const props = defineProps({
  product: { type: Object, required: true },
});
const emit = defineEmits(["close", "product-updated"]);

const productStore = useProductStore();
const categoryStore = useCategoryStore();
const propStore = usePropStore();

const { properties: allProperties } = storeToRefs(propStore);

// Form and UI state
const form = reactive(JSON.parse(JSON.stringify(props.product)));
form.selectedProperties = {};
const openComboBox = ref(null);
const errors = reactive({});

// Image modal state
const showImageModal = ref(false);
const modalImageSrc = ref("");

// Success/Error Modal State
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const modalErrorMessage = ref("");

// Refs for file inputs
const mainImageInput = ref(null);

// State for managing new file uploads
const newMainImageFile = ref(null);
const newMainImageURL = ref(null);
const newVariantImages = ref([]); // Shape: { colorHex: string, file: File, url: string }
const variantImageInputs = reactive({});

const availableProperties = computed(() => {
  return allProperties.value.filter((p) => p.name !== "اللون");
});

const subCategoryGroups = computed(() => {
  const mainCategories = categoryStore.getMainCategories;
  return mainCategories
    .map((main) => ({
      id: main.id,
      name: main.name,
      subCategories: categoryStore.getSubcategoriesByParent(main.id),
    }))
    .filter((group) => group.subCategories.length > 0);
});

const mainImagePreview = computed(() => {
  return newMainImageURL.value || form.mainImage;
});

// Image modal methods
const openImageModal = (imageSrc) => {
  modalImageSrc.value = imageSrc;
  showImageModal.value = true;
  document.body.style.overflow = "hidden";
};
const closeImageModal = () => {
  showImageModal.value = false;
  modalImageSrc.value = "";
  document.body.style.overflow = "auto";
};

// --- Success/Error Modal Methods ---
const closeSuccessModal = () => {
  showSuccessModal.value = false;
  emit("product-updated"); // Signal parent to refresh and close
};
const closeErrorModal = () => {
  showErrorModal.value = false;
};
const openErrorModal = (error) => {
  if (typeof error === "object" && error !== null) {
    // Handle validation errors like { name: ["This field may not be blank."] }
    const firstKey = Object.keys(error)[0];
    const firstMessage = error[firstKey];
    modalErrorMessage.value = `${firstKey}: ${
      Array.isArray(firstMessage) ? firstMessage.join(", ") : firstMessage
    }`;
  } else if (typeof error === "string") {
    modalErrorMessage.value = error;
  } else {
    modalErrorMessage.value = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
  }
  showErrorModal.value = true;
};

// File input trigger methods
const triggerMainImageUpload = () => mainImageInput.value?.click();
const triggerVariantImageUpload = (index) => {
  const input = variantImageInputs[index];
  if (input) {
    input.click();
  }
};

const initializeFormProperties = () => {
  const newSelectedProperties = {};
  const productData = props.product;
  if (
    productData &&
    productData.properties &&
    typeof productData.properties === "object"
  ) {
    Object.keys(productData.properties).forEach((propName) => {
      if (propName === "اللون") return;
      const propData = productData.properties[propName];
      newSelectedProperties[propName] = {
        legacy: propData.legacy ? [...propData.legacy] : [],
        subtitles: propData.subtitles
          ? JSON.parse(JSON.stringify(propData.subtitles))
          : {},
      };
    });
  }
  form.selectedProperties = newSelectedProperties;
};

onMounted(async () => {
  if (propStore.properties.length === 0) await propStore.fetchAttributes();
  if (categoryStore.categories.length === 0)
    await categoryStore.fetchCategories();
  initializeFormProperties();
});

const handleMainImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (newMainImageURL.value) URL.revokeObjectURL(newMainImageURL.value);
  newMainImageFile.value = file;
  newMainImageURL.value = URL.createObjectURL(file);
  event.target.value = "";
};

const removeMainImage = () => {
  if (newMainImageURL.value) {
    URL.revokeObjectURL(newMainImageURL.value);
    newMainImageURL.value = null;
    newMainImageFile.value = null;
  }
  form.mainImage = null;
};

// Properties management
const toggleComboBox = (propId) => {
  openComboBox.value = openComboBox.value === propId ? null : propId;
};
const isLegacyValueSelected = (propName, value) =>
  form.selectedProperties[propName]?.legacy?.includes(value) || false;
const isSubtitleValueSelected = (propName, subtitleName, value) =>
  form.selectedProperties[propName]?.subtitles?.[subtitleName]?.includes(
    value
  ) || false;
const getSelectedCountForProperty = (propName) => {
  const propData = form.selectedProperties[propName];
  if (!propData) return 0;
  let count = propData.legacy?.length || 0;
  if (propData.subtitles) {
    Object.values(propData.subtitles).forEach((values) => {
      if (Array.isArray(values)) count += values.length;
    });
  }
  return count;
};
const areAllLegacyValuesSelected = (propName, values) => {
  const selected = form.selectedProperties[propName]?.legacy || [];
  return values.length > 0 && values.every((v) => selected.includes(v));
};
const areAllSubtitleValuesSelected = (propName, subtitleName, values) => {
  const selected =
    form.selectedProperties[propName]?.subtitles?.[subtitleName] || [];
  return values.length > 0 && values.every((v) => selected.includes(v));
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
  form.selectedProperties[propName].subtitles ??= {};
  const areAllSelected = areAllSubtitleValuesSelected(
    propName,
    subtitleName,
    values
  );
  form.selectedProperties[propName].subtitles[subtitleName] = areAllSelected
    ? []
    : [...values];
  cleanupPropertyData(propName);
};
const handleLegacyPropertyChange = (propName, value, event) => {
  initializeProperty(propName);
  form.selectedProperties[propName].legacy ??= [];
  if (event.target.checked) {
    if (!form.selectedProperties[propName].legacy.includes(value))
      form.selectedProperties[propName].legacy.push(value);
  } else {
    const index = form.selectedProperties[propName].legacy.indexOf(value);
    if (index > -1) form.selectedProperties[propName].legacy.splice(index, 1);
  }
  cleanupPropertyData(propName);
};
const handleSubtitlePropertyChange = (propName, subtitleName, value, event) => {
  initializeProperty(propName);
  form.selectedProperties[propName].subtitles ??= {};
  form.selectedProperties[propName].subtitles[subtitleName] ??= [];
  if (event.target.checked) {
    if (
      !form.selectedProperties[propName].subtitles[subtitleName].includes(value)
    )
      form.selectedProperties[propName].subtitles[subtitleName].push(value);
  } else {
    const index =
      form.selectedProperties[propName].subtitles[subtitleName].indexOf(value);
    if (index > -1)
      form.selectedProperties[propName].subtitles[subtitleName].splice(
        index,
        1
      );
  }
  cleanupPropertyData(propName);
};
const cleanupPropertyData = (propName) => {
  const prop = form.selectedProperties[propName];
  if (!prop) return;
  if (prop.legacy?.length === 0) delete prop.legacy;
  if (prop.subtitles) {
    Object.keys(prop.subtitles).forEach((sub) => {
      if (prop.subtitles[sub]?.length === 0) delete prop.subtitles[sub];
    });
    if (Object.keys(prop.subtitles).length === 0) delete prop.subtitles;
  }
  if (Object.keys(prop).length === 0) delete form.selectedProperties[propName];
};

// Color variants management
const addColorVariant = () => {
  form.variants ??= [];
  form.variants.push({
    colorHex: "#000000",
    images: [],
    stock: [],
    error: null,
  });
};
const getNewImagesForVariant = (colorHex) => {
  return newVariantImages.value.filter(
    (img) => img.colorHex.toLowerCase() === colorHex.toLowerCase()
  );
};
const addImagesToVariant = (event, variantIndex) => {
  const files = Array.from(event.target.files);
  const variant = form.variants[variantIndex];
  if (!variant) return;
  files.forEach((file) =>
    newVariantImages.value.push({
      colorHex: variant.colorHex,
      file,
      url: URL.createObjectURL(file),
    })
  );
  event.target.value = "";
};
const removeImageFromVariant = (variantIndex, imageIndex, isNew) => {
  const variant = form.variants[variantIndex];
  if (!variant) return;
  if (isNew) {
    const newImagesForColor = getNewImagesForVariant(variant.colorHex);
    if (imageIndex < newImagesForColor.length) {
      const targetImage = newImagesForColor[imageIndex];
      const overallIndex = newVariantImages.value.findIndex(
        (img) => img === targetImage
      );
      if (overallIndex > -1) {
        URL.revokeObjectURL(newVariantImages.value[overallIndex].url);
        newVariantImages.value.splice(overallIndex, 1);
      }
    }
  } else {
    if (variant.images?.[imageIndex]) {
      variant.images.splice(imageIndex, 1);
    }
  }
};

const validateForm = () => {
  Object.keys(errors).forEach((key) => delete errors[key]);
  let isValid = true;
  if (!form.name || !form.name.trim()) {
    errors.name = "اسم المنتج مطلوب";
    isValid = false;
  }
  if (!form.categoryId) {
    errors.categoryId = "يجب اختيار فئة للمنتج";
    isValid = false;
  }
  if (
    form.profitMargin === null ||
    form.profitMargin === undefined ||
    form.profitMargin === ""
  ) {
    errors.profitMargin = "هامش الربح مطلوب";
    isValid = false;
  } else if (isNaN(form.profitMargin) || form.profitMargin <= 0) {
    errors.profitMargin = "هامش الربح يجب أن يكون رقماً أكبر من صفر";
    isValid = false;
  }
  if (!form.variants || form.variants.length === 0) {
    openErrorModal("يجب أن يحتوي المنتج على لون واحد على الأقل.");
    isValid = false;
  }
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }
  const updateData = { ...form, properties: form.selectedProperties };
  delete updateData.selectedProperties;

  const variantFiles = newVariantImages.value.map((img) => ({
    file: img.file,
    colorHex: img.colorHex,
  }));

  const result = await productStore.updateProduct(
    form.id,
    updateData,
    newMainImageFile.value,
    variantFiles
  );

  if (result.success) {
    if (newMainImageURL.value) URL.revokeObjectURL(newMainImageURL.value);
    newVariantImages.value.forEach((img) => URL.revokeObjectURL(img.url));
    showSuccessModal.value = true;
  } else {
    console.error("Failed to update product:", result.error);
    openErrorModal(result.error);
  }
};
</script>

<style scoped>
/* Copied from AddProduct.vue for consistency */
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
  z-index: 9999; /* Ensure it's on top of everything */
}
.modal-dialog.success-modal,
.modal-dialog.error-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
  flex-direction: column;
}
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
}
.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
}
.btn {
  cursor: pointer;
  padding: 12px 24px;
  border-radius: 8px;
}

/* Existing Scoped Styles */
.modal-xl {
  max-width: 1000px;
}
.edit-product-modal {
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  cursor: pointer;
  overflow: auto;
}
.image-modal-content {
  position: relative;
  max-width: 85vw;
  max-height: 85vh;
  cursor: default;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-modal-content img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  max-width: 80vw;
  max-height: 80vh;
}
.image-modal-close {
  position: absolute;
  top: -45px;
  right: -45px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2001;
}
.image-modal-close:hover {
  background: white;
  transform: scale(1.1);
}
.status-container {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background-color: #fff;
}
.status-toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}
.status-toggle {
  position: relative;
  width: 50px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: #dc3545;
  cursor: pointer;
  transition: all 0.3s ease;
}
.status-toggle.active {
  background-color: #198754;
}
.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  transition: all 0.3s ease;
}
.status-toggle.active .toggle-slider {
  transform: translateX(26px);
}
.status-label {
  font-weight: 500;
  color: #374151;
  margin: 0;
  cursor: pointer;
}
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
  cursor: pointer;
  transition: all 0.3s ease;
}
.main-image-uploader:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}
.main-image-uploader .upload-prompt {
  text-align: center;
  color: #6c757d;
  pointer-events: none;
  transition: color 0.3s ease;
}
.main-image-uploader:hover .upload-prompt {
  color: #3b82f6;
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
  cursor: pointer;
  transition: transform 0.2s ease;
}
.main-image-preview img:hover {
  transform: scale(1.02);
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
  z-index: 10;
  transition: all 0.2s ease;
}
.main-image-preview .remove-btn:hover {
  background: rgba(220, 53, 69, 0.9);
  transform: scale(1.1);
}
.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.properties-section {
  background-color: #f8f9fa;
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
.color-display-container {
  position: relative;
}
.color-display-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
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
  font-weight: 500;
}
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
  grid-template-columns: 1fr;
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
.image-uploader {
  position: relative;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background-color: #f9fafb;
  cursor: pointer;
  transition: all 0.3s ease;
}
.image-uploader:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}
.image-uploader:hover .upload-prompt {
  color: #3b82f6;
}
.image-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.image-preview,
.upload-prompt {
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
  transition: all 0.3s ease;
  pointer-events: none;
}
.image-uploader:hover .upload-prompt {
  border-color: #3b82f6;
  color: #3b82f6;
}
.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.image-preview img:hover {
  transform: scale(1.05);
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
  z-index: 10;
}
.remove-btn:hover {
  background: rgba(220, 53, 69, 0.9);
  transform: scale(1.1);
}
.add-color {
  background: linear-gradient(135deg, #84e297 0%, #0b6b28 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}
.add-color:hover {
  transform: translateY(-3px);
}
.add-color:active {
  transform: translateY(1px);
}
@media (max-width: 768px) {
  .variation-header {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .properties-grid {
    grid-template-columns: 1fr;
  }
  .image-modal-close {
    top: 10px;
    right: 10px;
    width: 35px;
    height: 35px;
    font-size: 20px;
  }
  .image-modal-content {
    max-width: 95vw;
    max-height: 85vh;
  }
  .image-modal-content img {
    max-width: 90vw;
    max-height: 75vh;
  }
}
</style>
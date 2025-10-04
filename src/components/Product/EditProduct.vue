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
                  id="mainImageUploader"
                  class="main-image-uploader"
                  :class="{ 'is-invalid': errors.mainImage }"
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
                    <!-- ADDED: Progress Overlay for New Main Image -->
                    <div v-if="newMainImageFile && newMainImageFile.compressing" class="compression-overlay">
                        <div class="progress-bar-container">
                            <div class="progress-bar" :style="{ width: newMainImageFile.progress + '%' }"></div>
                        </div>
                        <span class="progress-text">جاري الضغط... {{ newMainImageFile.progress }}%</span>
                    </div>
                  </div>
                  <div v-else class="upload-prompt">
                    <i class="fas fa-camera"></i>
                    <p>اختر صورة</p>
                  </div>
                </div>
                <div v-if="errors.mainImage" class="invalid-feedback d-block">
                  {{ errors.mainImage }}
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
                            v-if="
                              getUnselectedLegacyValues(
                                prop.name,
                                prop.values.map((v) => v.value)
                              ).length > 0
                            "
                            type="button"
                            class="select-all-btn"
                            @click="
                              selectAllUnselectedLegacy(
                                prop.name,
                                prop.values.map((v) => v.value)
                              )
                            "
                          >
                            تحديد الكل
                          </button>
                        </div>

                        <div
                          v-if="
                            getOriginallySelectedLegacyValues(
                              prop.name,
                              prop.values.map((v) => v.value)
                            ).length > 0
                          "
                          class="selected-values-container"
                        >
                          <div class="selected-values-header">
                            <i class="fas fa-check-circle"></i>
                            <span>القيم المحددة مسبقاً</span>
                          </div>
                          <div class="readonly-checkbox-container">
                            <label
                              v-for="value in getOriginallySelectedLegacyValues(
                                prop.name,
                                prop.values.map((v) => v.value)
                              )"
                              :key="`originally-selected-legacy-${prop.id}-${value}`"
                              class="checkbox-label readonly-checkbox"
                            >
                              <input
                                type="checkbox"
                                :value="value"
                                checked
                                disabled
                              />
                              <span class="checkbox-text readonly-text">{{
                                value
                              }}</span>
                            </label>
                          </div>
                        </div>

                        <div
                          v-if="
                            getNewlySelectedLegacyValues(
                              prop.name,
                              prop.values.map((v) => v.value)
                            ).length > 0
                          "
                          class="newly-selected-values-container"
                        >
                          <div class="newly-selected-values-header">
                            <i class="fas fa-plus-check-circle"></i>
                            <span>القيم المحددة حديثاً</span>
                          </div>
                          <div class="checkbox-container">
                            <label
                              v-for="value in getNewlySelectedLegacyValues(
                                prop.name,
                                prop.values.map((v) => v.value)
                              )"
                              :key="`newly-selected-legacy-${prop.id}-${value}`"
                              class="checkbox-label newly-selected-checkbox"
                            >
                              <input
                                type="checkbox"
                                :value="value"
                                :checked="true"
                                @change="
                                  handleLegacyPropertyChange(
                                    prop.name,
                                    value,
                                    $event
                                  )
                                "
                              />
                              <span class="checkbox-text newly-selected-text">{{
                                value
                              }}</span>
                              <i class="fas fa-edit newly-selected-icon"></i>
                            </label>
                          </div>
                        </div>

                        <div
                          v-if="
                            getUnselectedLegacyValues(
                              prop.name,
                              prop.values.map((v) => v.value)
                            ).length > 0
                          "
                          class="available-values-container"
                        >
                          <div class="available-values-header">
                            <i class="fas fa-plus-circle"></i>
                            <span>قيم متاحة للإضافة</span>
                          </div>
                          <div class="checkbox-container">
                            <label
                              v-for="value in getUnselectedLegacyValues(
                                prop.name,
                                prop.values.map((v) => v.value)
                              )"
                              :key="`available-legacy-${prop.id}-${value}`"
                              class="checkbox-label available-checkbox"
                            >
                              <input
                                type="checkbox"
                                :value="value"
                                :checked="false"
                                @change="
                                  handleLegacyPropertyChange(
                                    prop.name,
                                    value,
                                    $event
                                  )
                                "
                              />
                              <span class="checkbox-text">{{ value }}</span>
                            </label>
                          </div>
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
                            v-if="
                              getUnselectedSubtitleValues(
                                prop.name,
                                subtitle.name,
                                subtitle.values.map((v) => v.value)
                              ).length > 0
                            "
                            type="button"
                            class="select-all-btn"
                            @click="
                              selectAllUnselectedSubtitle(
                                prop.name,
                                subtitle.name,
                                subtitle.values.map((v) => v.value)
                              )
                            "
                          >
                            تحديد الكل
                          </button>
                        </div>

                        <div
                          v-if="
                            getOriginallySelectedSubtitleValues(
                              prop.name,
                              subtitle.name,
                              subtitle.values.map((v) => v.value)
                            ).length > 0
                          "
                          class="selected-values-container"
                        >
                          <div class="selected-values-header">
                            <i class="fas fa-check-circle"></i>
                            <span>القيم المحددة أصلاً (للقراءة فقط)</span>
                          </div>
                          <div class="readonly-checkbox-container">
                            <label
                              v-for="value in getOriginallySelectedSubtitleValues(
                                prop.name,
                                subtitle.name,
                                subtitle.values.map((v) => v.value)
                              )"
                              :key="`originally-selected-${subtitle.id}-${value}`"
                              class="checkbox-label readonly-checkbox"
                            >
                              <input
                                type="checkbox"
                                :value="value"
                                checked
                                disabled
                              />
                              <span class="checkbox-text readonly-text">{{
                                value
                              }}</span>
                              <i class="fas fa-lock readonly-icon"></i>
                            </label>
                          </div>
                        </div>

                        <div
                          v-if="
                            getNewlySelectedSubtitleValues(
                              prop.name,
                              subtitle.name,
                              subtitle.values.map((v) => v.value)
                            ).length > 0
                          "
                          class="newly-selected-values-container"
                        >
                          <div class="newly-selected-values-header">
                            <i class="fas fa-plus-check-circle"></i>
                            <span>القيم المحددة حديثاً</span>
                          </div>
                          <div class="checkbox-container">
                            <label
                              v-for="value in getNewlySelectedSubtitleValues(
                                prop.name,
                                subtitle.name,
                                subtitle.values.map((v) => v.value)
                              )"
                              :key="`newly-selected-${subtitle.id}-${value}`"
                              class="checkbox-label newly-selected-checkbox"
                            >
                              <input
                                type="checkbox"
                                :value="value"
                                :checked="true"
                                @change="
                                  handleSubtitlePropertyChange(
                                    prop.name,
                                    subtitle.name,
                                    value,
                                    $event
                                  )
                                "
                              />
                              <span class="checkbox-text newly-selected-text">{{
                                value
                              }}</span>
                              <i class="fas fa-edit newly-selected-icon"></i>
                            </label>
                          </div>
                        </div>

                        <div
                          v-if="
                            getUnselectedSubtitleValues(
                              prop.name,
                              subtitle.name,
                              subtitle.values.map((v) => v.value)
                            ).length > 0
                          "
                          class="available-values-container"
                        >
                          <div class="available-values-header">
                            <i class="fas fa-plus-circle"></i>
                            <span>قيم متاحة للإضافة</span>
                          </div>
                          <div class="checkbox-container">
                            <label
                              v-for="value in getUnselectedSubtitleValues(
                                prop.name,
                                subtitle.name,
                                subtitle.values.map((v) => v.value)
                              )"
                              :key="`available-${subtitle.id}-${value}`"
                              class="checkbox-label available-checkbox"
                            >
                              <input
                                type="checkbox"
                                :value="value"
                                :checked="false"
                                @change="
                                  handleSubtitlePropertyChange(
                                    prop.name,
                                    subtitle.name,
                                    value,
                                    $event
                                  )
                                "
                              />
                              <span class="checkbox-text">{{ value }}</span>
                            </label>
                          </div>
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

            <div
              id="variations-section"
              class="variations-section border-top pt-4"
            >
              <div
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <h5 class="mb-0">الألوان والصور</h5>
                <button
                  @click="addColorVariant"
                  type="button"
                  class="add-color bg-dark"
                >
                  <i class="fas fa-plus"></i> إضافة لون جديد
                </button>
              </div>
              <div
                v-if="errors.colorVariations"
                class="alert alert-danger"
              >
                {{ errors.colorVariations }}
              </div>

              <div
                v-for="(variant, index) in form.variants"
                :key="index"
                class="variation-card"
                :class="{ 'is-focused': variant.showColorPicker }"
                :ref="(el) => setVariantRef(el, index)"
                :id="`variation-card-${index}`"
              >
                <div class="variation-header">
                  <div class="form-group">
                    <label class="form-label">كود اللون</label>
                    <div v-if="variant.isNew" class="color-selection-container">
                      <div
                        class="color-picker-wrapper"
                        @click="toggleColorPicker(index)"
                      >
                        <div
                          class="selected-color-preview"
                          :style="{ backgroundColor: variant.colorHex }"
                        ></div>
                        <span class="color-hex-text">{{
                          variant.colorHex
                        }}</span>
                        <i
                          class="fas fa-chevron-down"
                          :class="{ rotated: variant.showColorPicker }"
                        ></i>
                      </div>

                      <div
                        v-if="variant.showColorPicker"
                        class="color-dropdown"
                        @click.stop
                      >
                        <div class="color-dropdown-header">
                          <span>اختر لوناً</span>
                          <button
                            type="button"
                            @click="closeColorPicker(index)"
                            class="close-dropdown-btn"
                          >
                            ×
                          </button>
                        </div>

                        <div
                          v-if="availableColors.length > 0"
                          class="used-colors-section"
                        >
                          <h4 class="color-section-title">الألوان المتاحة</h4>
                          <div class="color-grid">
                            <div
                              v-for="color in availableColors"
                              :key="color"
                              class="color-option"
                              :class="{ selected: variant.colorHex === color }"
                              @click="selectUsedColor(index, color)"
                            >
                              <div
                                class="color-circle"
                                :style="{ backgroundColor: color }"
                              ></div>
                              <span class="color-code">{{ color }}</span>
                            </div>
                          </div>
                        </div>
                        <div class="custom-color-section">
                          <h4 class="color-section-title">أو اختر لون جديد</h4>
                          <div class="custom-color-picker">
                            <input
                              v-model="variant.colorHex"
                              type="color"
                              class="color-input"
                              @change="handleHexColorChange(index, false)"
                            />
                            <input
                              v-model="variant.colorHex"
                              type="text"
                              class="color-hex-input"
                              placeholder="#000000"
                              pattern="^#[0-9A-Fa-f]{6}$"
                              @change="handleHexColorChange(index, true)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="color-display-container">
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
                    <span v-if="variant.error" class="error-message">{{
                      variant.error
                    }}</span>
                  </div>
                  <button
                    v-if="variant.isNew"
                    @click="removeColorVariation(index)"
                    class="btn-remove-variation"
                    type="button"
                    title="حذف اللون"
                  >
                    &times;
                  </button>
                </div>

                <div
                  class="form-group mt-3 images-section"
                  :class="{ 'pushed-down': variant.showColorPicker }"
                >
                  <label class="form-label">صور هذا اللون</label>
                  <div
                    class="image-uploader"
                    :class="{ 'error-border': errors[`color_${index}_images`] }"
                    @click="triggerVariantImageUpload(index)"
                  >
                    <input
                      :ref="(el) => { variantImageInputs[index] = el; }"
                      type="file"
                      multiple
                      @change="(e) => addImagesToVariant(e, index)"
                      accept="image/*"
                      class="file-input"
                    />
                    <div class="image-preview-grid">
                      <div
                        v-for="(image, imgIndex) in variant.imagesWithIds || []"
                        :key="`existing-${image.id || imgIndex}`"
                        class="image-preview"
                      >
                        <img
                          :src="image.url"
                          @click.stop="openImageModal(image.url)"
                        />
                        <div class="image-controls">
                          <button
                            @click.stop="showDeleteConfirmation(index, imgIndex, false)"
                            class="delete-btn"
                            type="button"
                            title="حذف الصورة"
                            :disabled="deletingImages.has(image.id)"
                          >
                            <i
                              v-if="deletingImages.has(image.id)"
                              class="fas fa-spinner fa-spin"
                            ></i>
                            <span v-else>&times;</span>
                          </button>
                        </div>
                      </div>
                      <div
                        v-for="(newImg, newImgIndex) in getNewImagesForVariant(variant.colorHex)"
                        :key="`new-${newImgIndex}`"
                        class="image-preview new-image"
                      >
                        <img
                          :src="newImg.url"
                          @click.stop="openImageModal(newImg.url)"
                        />
                        <div class="image-controls">
                          <button
                            @click.stop="showDeleteConfirmation(index, newImgIndex, true)"
                            class="delete-btn"
                            type="button"
                            title="حذف الصورة"
                          >
                            &times;
                          </button>
                        </div>
                        <div class="new-image-badge">جديد</div>
                        <!-- ADDED: Progress Overlay for New Variant Images -->
                        <div v-if="newImg.compressing" class="compression-overlay">
                          <div class="progress-bar-container">
                            <div class="progress-bar" :style="{ width: newImg.progress + '%' }"></div>
                          </div>
                          <span class="progress-text">{{ newImg.progress }}%</span>
                        </div>
                      </div>
                      <div class="upload-prompt"><span>+</span></div>
                    </div>
                  </div>

                  <span
                    v-if="errors[`color_${index}_images`]"
                    class="error-message"
                    >{{ errors[`color_${index}_images`] }}</span
                  >
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
    
    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click="closeDeleteConfirmModal">
      <div class="modal-dialog confirm-modal" @click.stop>
        <div class="modal-icon warning-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>تأكيد حذف الصورة</h3>
        <p>هل أنت متأكد من رغبتك في حذف هذه الصورة؟ لا يمكن التراجع عن هذا الإجراء.</p>
        
        <div v-if="deleteConfirmData.imageUrl" class="delete-preview-image">
          <img :src="deleteConfirmData.imageUrl" alt="صورة للحذف" />
        </div>
        
        <div class="modal-buttons">
          <button @click="closeDeleteConfirmModal" class="btn btn-secondary">
            إلغاء
          </button>
          <button @click="confirmDeleteImage" class="btn btn-danger">
            <i class="fas fa-trash"></i>
            حذف الصورة
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted, nextTick, onBeforeUnmount } from "vue";
import { useProductStore, compressImage } from "@/stores/productStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { usePropStore } from "@/stores/propStore";
import { storeToRefs } from "pinia";
import heic2any from 'heic2any';
import api from "@/api";

const props = defineProps({ product: { type: Object, required: true } });
const emit = defineEmits(["close", "product-updated"]);

const productStore = useProductStore();
const categoryStore = useCategoryStore();
const propStore = usePropStore();

const { properties: allProperties } = storeToRefs(propStore);

const form = reactive(JSON.parse(JSON.stringify(props.product)));
form.selectedProperties = {};
const openComboBox = ref(null);
const errors = reactive({});

const showImageModal = ref(false);
const modalImageSrc = ref("");
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const modalErrorMessage = ref("");
const mainImageInput = ref(null);
const newMainImageFile = ref(null); // Will hold a reactive object: { file, url, compressing, progress }
const newMainImageURL = ref(null);
const newVariantImages = ref([]); // Will hold an array of reactive objects
const variantImageInputs = reactive({});
const variantRefs = ref([]);

const deletingImages = ref(new Set());
const originalProperties = ref({});

const showDeleteConfirmModal = ref(false);
const deleteConfirmData = ref({
  variantIndex: null,
  imageIndex: null,
  isNewImage: false,
  imageUrl: null
});

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

const handleClickOutside = (event) => {
  const isClickInsidePropertyBox = event.target.closest('.property-combo-box');
  const isClickInsideColorPicker = event.target.closest('.color-selection-container');

  if (!isClickInsidePropertyBox && !isClickInsideColorPicker) {
    openComboBox.value = null;
    form.variants.forEach(variant => {
      if (variant.showColorPicker) {
        variant.showColorPicker = false;
      }
    });
  }
};

onMounted(async () => {
  if (propStore.properties.length === 0) await propStore.fetchAttributes();
  if (categoryStore.categories.length === 0) await categoryStore.fetchCategories();
  await initializeFormProperties();
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

const setVariantRef = (el, index) => {
  if (el) {
    variantRefs.value[index] = el;
  }
};

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

const closeSuccessModal = () => {
  showSuccessModal.value = false;
  emit("product-updated");
};

const closeErrorModal = () => {
  showErrorModal.value = false;
};

const openErrorModal = (error) => {
  modalErrorMessage.value = typeof error === 'string' ? error : "حدث خطأ غير متوقع.";
  showErrorModal.value = true;
};

const showDeleteConfirmation = (variantIndex, imageIndex, isNewImage = false) => {
  const variant = form.variants[variantIndex];
  let imageUrl = null;
  
  if (isNewImage) {
    const newImagesForColor = getNewImagesForVariant(variant.colorHex);
    if (imageIndex < newImagesForColor.length) {
      imageUrl = newImagesForColor[imageIndex].url;
    }
  } else {
    if (variant.imagesWithIds?.[imageIndex]) {
      imageUrl = variant.imagesWithIds[imageIndex].url;
    }
  }
  
  deleteConfirmData.value = {
    variantIndex,
    imageIndex,
    isNewImage,
    imageUrl
  };
  showDeleteConfirmModal.value = true;
};

const closeDeleteConfirmModal = () => {
  showDeleteConfirmModal.value = false;
  deleteConfirmData.value = {
    variantIndex: null,
    imageIndex: null,
    isNewImage: false,
    imageUrl: null
  };
};

const confirmDeleteImage = async () => {
  const { variantIndex, imageIndex, isNewImage } = deleteConfirmData.value;
  if (isNewImage) {
    removeImageFromVariant(variantIndex, imageIndex, true);
  } else {
    await deleteExistingImage(variantIndex, imageIndex);
  }
  
  closeDeleteConfirmModal();
};


const triggerMainImageUpload = () => mainImageInput.value?.click();
const triggerVariantImageUpload = (index) => variantImageInputs[index]?.click();

const initializeFormProperties = async () => {
  try {
    const response = await api.get(`products/products/${props.product.id}/`);
    const detailedProduct = response.data;
    
    const newSelectedProperties = {};
    const productData = props.product;
    if (productData && productData.properties && typeof productData.properties === "object") {
      Object.keys(productData.properties).forEach((propName) => {
        const propData = productData.properties[propName];
        newSelectedProperties[propName] = {
          legacy: propData.legacy ? [...propData.legacy] : [],
          subtitles: propData.subtitles ? JSON.parse(JSON.stringify(propData.subtitles)) : {},
        };
      });
    }
    form.selectedProperties = newSelectedProperties;
    originalProperties.value = JSON.parse(JSON.stringify(newSelectedProperties));

    if (form.variants) {
      form.variants.forEach(variant => {
        variant.isNew = false;
        variant.showColorPicker = false;
        
        const colorHex = variant.colorHex.toLowerCase();
        const imagesByAttribute = detailedProduct.images_by_attribute || {};
        const imagesForColor = imagesByAttribute[variant.colorHex] || imagesByAttribute[colorHex] || [];
        
        variant.imagesWithIds = imagesForColor
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map(img => ({
            id: img.id,
            url: img.image.startsWith('http') ? img.image : `http://13.48.136.207${img.image}`,
            display_order: img.display_order || 0
          }));
          
      });
    }
  } catch (error) {
    console.error('Error fetching detailed product data:', error);
    const newSelectedProperties = {};
    const productData = props.product;
    if (productData && productData.properties && typeof productData.properties === "object") {
      Object.keys(productData.properties).forEach((propName) => {
        const propData = productData.properties[propName];
        newSelectedProperties[propName] = {
          legacy: propData.legacy ? [...propData.legacy] : [],
          subtitles: propData.subtitles ? JSON.parse(JSON.stringify(propData.subtitles)) : {},
        };
      });
    }
    form.selectedProperties = newSelectedProperties;
    
    if (form.variants) {
      form.variants.forEach(variant => {
        variant.isNew = false;
        variant.showColorPicker = false;
        variant.imagesWithIds = variant.images?.map((url, index) => ({
          id: null,
          url,
          display_order: index + 1
        })) || [];
      });
    }
  }
};

// REVISED: Logic to show progress bar correctly
const handleMainImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // NEW: Process the file - convert HEIC or validate other image types
  let processedFile = null;
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic');

  if (isHeic) {
    try {
      console.log(`Converting HEIC file: ${file.name}`);
      const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
      convertedBlob.name = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
      processedFile = convertedBlob;
    } catch (error) {
      console.error("HEIC conversion failed:", error);
      alert('Failed to convert HEIC image.'); // Optional: Inform user
      event.target.value = ""; // Reset file input
      return; // Stop execution
    }
  } else if (file.type.startsWith('image/')) {
    processedFile = file; // It's a valid, standard image
  } else {
    errors.mainImage = 'الملف المحدد ليس صورة صالحة أو فشل تحويله.';
    event.target.value = ""; // Reset file input
    return; // Stop execution
  }
  // END NEW

  if (newMainImageURL.value) {
    URL.revokeObjectURL(newMainImageURL.value);
  }

  // 1. Create the reactive object using the processed file
  const imageObject = reactive({
    file: processedFile,
    url: URL.createObjectURL(processedFile), // Use the processed file
    compressing: true,
    progress: 0,
  });
  
  newMainImageFile.value = imageObject;
  newMainImageURL.value = imageObject.url;
  
  const onProgress = (p) => {
    imageObject.progress = p;
  };

  // 2. Start compression with the processed file
  try {
    const compressedFile = await compressImage(processedFile, onProgress);
    imageObject.file = compressedFile;
  } catch (error) {
    console.error("Compression failed for main image:", error);
  } finally {
    imageObject.compressing = false;
  }
  
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

const toggleColorPicker = (index) => {
  form.variants.forEach((variation, i) => {
    if (i !== index) {
      variation.showColorPicker = false;
    }
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
  const variation = form.variants[index];
  let color = variation.colorHex.toLowerCase();
  if (!color.startsWith('#')) {
    color = '#' + color;
  }
  variation.colorHex = color;

  const isDuplicate = form.variants.some(
    (v, i) => i !== index && v.colorHex.toLowerCase() === variation.colorHex.toLowerCase()
  );

  if (isDuplicate) {
    variation.error = 'هذا اللون تم اختياره بالفعل.';
  } else {
    if (variation.error === 'هذا اللون تم اختياره بالفعل.') {
      variation.error = null;
    }
  }
  
  if (shouldClosePicker) {
    variation.showColorPicker = false;
  }
};

const toggleComboBox = (propId) => {
  openComboBox.value = openComboBox.value === propId ? null : propId;
};

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

const initializeProperty = (propName) => {
  if (!form.selectedProperties[propName]) {
    form.selectedProperties[propName] = { legacy: [], subtitles: {} };
  }
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

const getOriginallySelectedLegacyValues = (propName, allValues) => {
  const originalSelected = originalProperties.value[propName]?.legacy || [];
  return allValues.filter(value => originalSelected.includes(value));
};

const getNewlySelectedLegacyValues = (propName, allValues) => {
  const originalSelected = originalProperties.value[propName]?.legacy || [];
  const currentSelected = form.selectedProperties[propName]?.legacy || [];
  const newlySelected = currentSelected.filter(value => !originalSelected.includes(value));
  return allValues.filter(value => newlySelected.includes(value));
};

const getUnselectedLegacyValues = (propName, allValues) => {
  const selected = form.selectedProperties[propName]?.legacy || [];
  return allValues.filter(value => !selected.includes(value));
};

const getOriginallySelectedSubtitleValues = (propName, subtitleName, allValues) => {
  const originalSelected = originalProperties.value[propName]?.subtitles?.[subtitleName] || [];
  return allValues.filter(value => originalSelected.includes(value));
};

const getNewlySelectedSubtitleValues = (propName, subtitleName, allValues) => {
  const originalSelected = originalProperties.value[propName]?.subtitles?.[subtitleName] || [];
  const currentSelected = form.selectedProperties[propName]?.subtitles?.[subtitleName] || [];
  const newlySelected = currentSelected.filter(value => !originalSelected.includes(value));
  return allValues.filter(value => newlySelected.includes(value));
};

const getUnselectedSubtitleValues = (propName, subtitleName, allValues) => {
  const selected = form.selectedProperties[propName]?.subtitles?.[subtitleName] || [];
  return allValues.filter(value => !selected.includes(value));
};

const selectAllUnselectedLegacy = (propName, allValues) => {
  initializeProperty(propName);
  const unselected = getUnselectedLegacyValues(propName, allValues);
  const currentSelected = form.selectedProperties[propName].legacy || [];
  form.selectedProperties[propName].legacy = [...currentSelected, ...unselected];
  cleanupPropertyData(propName);
};

const selectAllUnselectedSubtitle = (propName, subtitleName, allValues) => {
  initializeProperty(propName);
  form.selectedProperties[propName].subtitles ??= {};
  const unselected = getUnselectedSubtitleValues(propName, subtitleName, allValues);
  const currentSelected = form.selectedProperties[propName].subtitles[subtitleName] || [];
  form.selectedProperties[propName].subtitles[subtitleName] = [...currentSelected, ...unselected];
  cleanupPropertyData(propName);
};

const addColorVariant = async () => {
  form.variants ??= [];
  const newIndex = form.variants.length;
  form.variants.push({
    colorHex: "#000000",
    images: [],
    imagesWithIds: [],
    stock: [],
    error: null,
    isNew: true,
    showColorPicker: false,
  });
  
  await nextTick();
  if (variantRefs.value[newIndex]) {
    variantRefs.value[newIndex].scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
};

const removeColorVariation = (index) => {
  const variant = form.variants[index];
  if (variant && variant.isNew) {
    const newImagesForColor = getNewImagesForVariant(variant.colorHex);
    newImagesForColor.forEach(img => {
      URL.revokeObjectURL(img.url);
    });
    newVariantImages.value = newVariantImages.value.filter(
      img => img.colorHex.toLowerCase() !== variant.colorHex.toLowerCase()
    );
    
    form.variants.splice(index, 1);
  }
};

const deleteExistingImage = async (variantIndex, imageIndex) => {
  const variant = form.variants[variantIndex];
  const image = variant.imagesWithIds[imageIndex];
  
  if (!image || !image.id) return;
  
  deletingImages.value.add(image.id);
  
  try {
    await api.delete(`products/product-images/${image.id}/`);
    variant.imagesWithIds.splice(imageIndex, 1);
  } catch (error) {
    console.error('Error deleting image:', error);
    openErrorModal('فشل في حذف الصورة. يرجى المحاولة مرة أخرى.');
  } finally {
    deletingImages.value.delete(image.id);
  }
};

const getNewImagesForVariant = (colorHex) => {
  return newVariantImages.value.filter(
    (img) => img.colorHex.toLowerCase() === colorHex.toLowerCase()
  );
};

// REVISED: Logic to show progress bar correctly
const addImagesToVariant = async (event, variantIndex) => {
  const files = Array.from(event.target.files);
  const variant = form.variants[variantIndex];
  if (!variant) return;

  // 1. THIS LINE IS UPDATED to match your template's error name
  const errorKey = `color_${variantIndex}_images`;

  // Clear any previous error with this name
  delete errors[errorKey];

  // Process all files concurrently (convert & validate)
  const processedFiles = await Promise.all(files.map(async (file) => {
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic');
    
    if (isHeic) {
      try {
        const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
        convertedBlob.name = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
        return convertedBlob;
      } catch (error) {
        console.error("HEIC conversion failed:", error);
        return null;
      }
    }
    
    if (file.type.startsWith('image/')) {
      return file;
    }

    return null;
  }));

  const validFiles = processedFiles.filter(file => file !== null);
  
  // 2. THIS LINE IS ALSO UPDATED to set the correct error
  if (validFiles.length !== files.length) {
    errors[errorKey] = 'تم تجاهل بعض الملفات لأنها ليست صورًا صالحة.';
  }

  // Process only the valid files
  validFiles.forEach(file => {
    const imageObject = reactive({
      file: file,
      url: URL.createObjectURL(file),
      compressing: true,
      progress: 0,
      colorHex: variant.colorHex
    });

    newVariantImages.value.push(imageObject);

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
        (img) => img.url === targetImage.url
      );
      if (overallIndex > -1) {
        URL.revokeObjectURL(newVariantImages.value[overallIndex].url);
        newVariantImages.value.splice(overallIndex, 1);
      }
    }
  } else {
    // This part is for existing images and remains unchanged
    if (variant.imagesWithIds?.[imageIndex]) {
      variant.imagesWithIds.splice(imageIndex, 1);
    }
  }
};

const validateForm = () => {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!form.name || !form.name.trim()) errors.name = "اسم المنتج مطلوب";
  if (!form.categoryId) errors.categoryId = "يجب اختيار فئة للمنتج";
  if (form.profitMargin === null || form.profitMargin <= 0) errors.profitMargin = "هامش الربح يجب أن يكون رقماً أكبر من صفر";
  
  if (!form.mainImage && !newMainImageFile.value) {
    if(!errors.mainImage) errors.mainImage = "يجب ادراج صورة اساسية للمنتج";
  }
  
  if (!form.variants || form.variants.length === 0) {
    errors.colorVariations = "يجب أن يحتوي المنتج على لون واحد على الأقل.";
    return false;
  }

  const colorSet = new Set();
  let hasDuplicateColors = false;
  
  form.variants.forEach((variant, i) => {
    const lowerCaseColor = variant.colorHex.toLowerCase();
    if (colorSet.has(lowerCaseColor)) {
      variant.error = 'هذا اللون تم اختياره بالفعل.';
      hasDuplicateColors = true;
    } else {
      if (variant.error === 'هذا اللون تم اختياره بالفعل.') {
        variant.error = null;
      }
      colorSet.add(lowerCaseColor);
    }
  });
  
  form.variants.forEach((variant, index) => {
    const hasExistingImages = variant.imagesWithIds && variant.imagesWithIds.length > 0;
    const hasNewImages = getNewImagesForVariant(variant.colorHex).length > 0;
    
    if (!hasExistingImages && !hasNewImages) {
      errors[`color_${index}_images`] = `يجب إضافة صورة واحدة على الأقل للون ${variant.colorHex}.`;
    }
  });

  if (hasDuplicateColors) {
    errors.colorVariations = 'لا يمكن اختيار نفس اللون أكثر من مرة.';
  }
  
  return Object.keys(errors).length === 0 && !hasDuplicateColors;
};

const getFieldId = (fieldName) => {
  if (fieldName.startsWith('color_')) {
    const index = fieldName.split('_')[1];
    return `variation-card-${index}`;
  }
  const fieldIdMap = {
    name: 'editName',
    mainImage: 'mainImageUploader', 
    categoryId: 'editCategory',
    profitMargin: 'profitMargin',
    colorVariations: 'variations-section',
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
    } else if (firstErrorKey.startsWith('color_')) {
      const index = firstErrorKey.split('_')[1];
      if (variantRefs.value[index]) {
        variantRefs.value[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
};

// MODIFIED: handleSubmit to extract compressed files
const handleSubmit = async () => {
  if (!validateForm()) {
    await scrollToFirstError();
    return;
  }

  const updateData = { ...form, properties: form.selectedProperties };
  delete updateData.selectedProperties;

  // Extract the compressed file from the object
  const variantFiles = newVariantImages.value.map((imgObj) => ({
    file: imgObj.file,
    colorHex: imgObj.colorHex,
  }));

  // Extract the compressed file from the object
  const mainImageFile = newMainImageFile.value ? newMainImageFile.value.file : null;

  const result = await productStore.updateProduct(
    form.id,
    updateData,
    mainImageFile, // Pass the file, not the object
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
/* ADDED: CSS for compression progress overlay */
.image-preview {
  position: relative; 
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
  border-radius: 6px;
  z-index: 10;
  pointer-events: none;
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
  background-color: #ffc107; /* Warning/edit color */
  border-radius: 4px;
  transition: width 0.2s ease-in-out;
}
.progress-text {
  font-size: 12px;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* --- Other styles remain unchanged --- */

/* Modal and General Styles */
.main-image-uploader.is-invalid {
  border-color: #dc3545;
}
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
  z-index: 99999;
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
  z-index: 20;
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
  overflow: hidden;
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

.selected-values-container {
  background-color: #f8f9fa;
  border-left: 4px solid #28a745;
  margin-bottom: 8px;
}

.selected-values-header {
  background-color: #e8f5e8;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #155724;
  border-bottom: 1px solid #d4edda;
  display: flex;
  align-items: center;
  gap: 6px;
}

.selected-values-header i {
  color: #28a745;
}

.readonly-checkbox-container {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.readonly-checkbox {
  background-color: #f8f9fa !important;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  opacity: 0.8;
  cursor: not-allowed !important;
}

.readonly-checkbox input[type="checkbox"] {
  cursor: not-allowed;
}

.readonly-text {
  color: #6c757d !important;
  font-style: italic;
}

.readonly-icon {
  color: #6c757d;
  font-size: 10px;
  margin-left: 8px;
}

.newly-selected-values-container {
  background-color: #fff8e1;
  border-left: 4px solid #ff9800;
  margin-bottom: 8px;
}

.newly-selected-values-header {
  background-color: #fff3c4;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #e65100;
  border-bottom: 1px solid #ffcc80;
  display: flex;
  align-items: center;
  gap: 6px;
}

.newly-selected-values-header i {
  color: #ff9800;
}

.newly-selected-checkbox {
  background-color: #fff8e1 !important;
  border: 1px solid #ffcc80;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.newly-selected-checkbox:hover {
  background-color: #fff3c4 !important;
  border-left: 2px solid #ff9800;
}

.newly-selected-text {
  color: #e65100 !important;
  font-weight: 500;
}

.newly-selected-icon {
  color: #ff9800;
  font-size: 10px;
  margin-left: 8px;
}

.newly-selected-checkbox input[type="checkbox"] {
  accent-color: #ff9800;
}

.newly-selected-checkbox input[type="checkbox"]:checked ~ .checkbox-text {
  color: #e65100 !important;
  font-weight: 600;
}

.newly-selected-checkbox {
  animation: newSelectionPulse 0.5s ease-out;
}

@keyframes newSelectionPulse {
  0% {
    background-color: #ffecb3;
    transform: scale(1.02);
  }
  100% {
    background-color: #fff8e1;
    transform: scale(1);
  }
}

.available-values-container {
  background-color: #fff;
  border-left: 4px solid #007bff;
}

.available-values-header {
  background-color: #e7f3ff;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #004085;
  border-bottom: 1px solid #b8daff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.available-values-header i {
  color: #007bff;
}

.available-checkbox {
  transition: all 0.15s ease;
}

.available-checkbox:hover {
  background-color: #f0f9ff;
  border-left: 2px solid #007bff;
}

.available-checkbox input[type="checkbox"]:checked ~ .checkbox-text {
  color: #007bff;
  font-weight: 500;
}

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
  font-weight: 500;
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
  z-index: 1001;
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

.variation-card {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
  overflow: visible;
  z-index: 1;
}

.variation-card.is-focused {
  z-index: 50;
}

.variation-header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
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

.images-section {
  transition: margin-top 0.3s ease;
}

.images-section.pushed-down {
  margin-top: 320px !important;
}

.btn-remove-variation {
  position: absolute;
  top: -10px;
  right: -10px;
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
  transition: all 0.15s ease;
}

.btn-remove-variation:hover {
  background-color: #fecaca;
  transform: scale(1.1);
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

.image-controls {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

.delete-btn {
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

.delete-btn:hover {
  background: rgba(220, 53, 69, 0.9);
  transform: scale(1.1);
}

.delete-btn:disabled {
  background: rgba(0, 0, 0, 0.4);
  cursor: not-allowed;
  transform: none;
}

.image-preview.draggable {
  cursor: move;
  transition: all 0.2s ease;
}

.image-preview.draggable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.drag-indicator {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 10px;
  opacity: 0.8;
}

.image-preview.draggable:hover .drag-indicator {
  opacity: 1;
}

.new-image-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  z-index: 10;
}

.new-image {
  border: 2px solid #10b981;
}

.order-change-indicator {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.add-color {
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
  box-shadow: 0 8px 25px rgb(0, 0, 0)
}

.add-color:active {
  transform: translateY(1px);
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

/* NEW: CSS for error borders */
.error-border {
  border-color: #ef4444 !important;
  border-style: solid !important;
  background-color: #fef2f2 !important;
}

.image-uploader.error-border {
  border-width: 2px !important;
}

/* ADDED: CSS for the confirmation modal */
.modal-dialog.confirm-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 450px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
  flex-direction: column;
  pointer-events: auto; /* Add this line if needed */
}

.warning-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.delete-preview-image {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}

.delete-preview-image img {
  max-width: 120px;
  max-height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.modal-buttons .btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
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

  .color-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }

  .images-section.pushed-down {
    margin-top: 280px;
  }

  .modal-xl {
    max-width: 95vw;
  }

  .main-image-uploader {
    height: 150px;
  }

  .btn-remove-variation {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }

  .image-preview,
  .upload-prompt {
    width: 80px;
    height: 80px;
  }

  .drag-indicator {
    font-size: 8px;
    padding: 1px 3px;
  }

  .selected-values-header,
  .available-values-header {
    font-size: 11px;
    padding: 6px 10px;
  }

  .readonly-icon {
    font-size: 9px;
  }
  
  /* ADDED: Media query styles for confirm modal */
  .modal-dialog.confirm-modal {
    max-width: 95vw;
    padding: 30px 20px;
  }
  
  .modal-buttons {
    flex-direction: column;
  }
  
  .modal-buttons .btn {
    width: 100%;
    justify-content: center;
  }
  
  .delete-preview-image img {
    max-width: 100px;
    max-height: 100px;
  }
}
</style>


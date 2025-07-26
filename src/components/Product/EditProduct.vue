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
              <div class="col-md-6 mb-3">
                <label for="editName" class="form-label">اسم المنتج</label>
                <input type="text" v-model="form.name" class="form-control" id="editName">
              </div>
              <div class="col-md-6 mb-3">
                <label for="profitMargin" class="form-label">هامش الربح</label>
                <div class="input-group">
                  <input id="profitMargin" v-model.number="form.profitMargin" type="number" class="form-control"
                    placeholder="0" />
                  <span class="input-group-text">%</span>
                </div>
              </div>
            </div>
            <div class="mb-3">
              <label for="editDesc" class="form-label">الوصف</label>
              <textarea v-model="form.description" class="form-control" id="editDesc" rows="3"></textarea>
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
              <div class="col-md-6 d-flex align-items-end">
                <div class="form-check form-switch p-3 border rounded w-100">
                  <label class="form-check-label ms-3" for="editStatus">حالة المنتج ({{ form.is_active ? 'ظاهر' : 'مخفي'
                    }})</label>
                  <input class="form-check-input status-switch" type="checkbox" role="switch" id="editStatus"
                    v-model="form.is_active">
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
                    <label class="form-label">اسم اللون</label>
                    <input v-model="variant.colorName" type="text" class="form-control" placeholder="مثال: أزرق سماوي">
                  </div>
                  <div class="form-group">
                    <label class="form-label">كود اللون</label>
                    <div class="color-picker-wrapper">
                      <input v-model="variant.colorHex" type="color" class="color-picker">
                      <span>{{ variant.colorHex }}</span>
                    </div>
                  </div>
                  <button @click="removeColorVariant(index)" class="btn-remove-variation" type="button"
                    title="حذف اللون">&times;</button>
                </div>

                <div class="form-group mt-3">
                  <label class="form-label">صور هذا اللون</label>
                  <div class="image-uploader">
                    <input type="file" multiple @change="e => addImagesToVariant(e, index)" accept="image/*"
                      class="file-input" />
                    <div class="image-preview-grid">
                      <div v-for="(image, imgIndex) in variant.images" :key="imgIndex" class="image-preview">
                        <img :src="image" />
                        <button @click="removeImageFromVariant(index, imgIndex)" class="remove-btn"
                          type="button">&times;</button>
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

<script setup>
import { reactive, computed } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';

const props = defineProps({
  product: { type: Object, required: true },
});
const emit = defineEmits(['close', 'product-updated']);

const productStore = useProductStore();
const categoryStore = useCategoryStore();

const form = reactive(JSON.parse(JSON.stringify(props.product)));

const subCategoryGroups = computed(() => {
  const mainCategories = categoryStore.getMainCategories;
  return mainCategories.map(main => ({
    id: main.id,
    name: main.name,
    subCategories: categoryStore.getSubcategoriesByParent(main.id)
  })).filter(group => group.subCategories.length > 0);
});

// --- FIXED: This function now correctly initializes a new variant ---
const addColorVariant = () => {
  if (!form.variants) form.variants = [];
  form.variants.push({
    colorName: '',
    colorHex: '#000000',
    images: [],
    stock: [] // This line was missing and caused the error
  });
};

const removeColorVariant = (index) => {
  form.variants.splice(index, 1);
};

const addImagesToVariant = (event, variantIndex) => {
  const files = Array.from(event.target.files);
  const variant = form.variants[variantIndex];
  if (variant) {
    files.forEach(file => {
      variant.images.push(URL.createObjectURL(file));
    });
  }
};

const removeImageFromVariant = (variantIndex, imageIndex) => {
  const variant = form.variants[variantIndex];
  if (variant) {
    const imageUrl = variant.images[imageIndex];
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    variant.images.splice(imageIndex, 1);
  }
};

const handleSubmit = async () => {
  const result = await productStore.updateProduct(form.id, form);
  if (result.success) {
    emit('product-updated');
  } else {
    console.error("Failed to update product:", result.error);
  }
};
</script>

<style scoped>
/* All previous styles remain the same */
.modal-xl {
  max-width: 900px;
}

.status-switch {
  width: 3.5em !important;
  height: 1.75em !important;
  cursor: pointer;
}

.variations-section {
  background-color: #f8f9fa;
  margin: -1rem;
  padding: 1.5rem;
  border-radius: 0 0 .3rem .3rem;
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
  grid-template-columns: 1fr auto auto;
  gap: 20px;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 5px 10px;
  background: #fff;
}

.color-picker {
  height: 36px;
  width: 36px;
  border: none;
  padding: 0;
  cursor: pointer;
  background-color: transparent;
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
}

.image-uploader {
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
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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
}
</style>
<template>
  <div class="add-category-container">
    <div class="header">
      <h1 class="title">إضافة فئة جديدة</h1>
      <p class="subtitle">أنشئ فئة جديدة لتنظيم المنتجات</p>
    </div>

    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="category-form">
        <div class="form-group">
          <label for="categoryName" class="form-label">
            اسم الفئة
          </label>
          <input
            id="categoryName"
            v-model="formData.name"
            type="text"
            class="form-input"
            :class="{ 'error': errors.name }"
            placeholder="أدخل اسم الفئة"
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label for="categoryDescription" class="form-label">
            وصف الفئة
          </label>
          <textarea
            id="categoryDescription"
            v-model="formData.description"
            class="form-textarea"
            placeholder="أدخل وصف الفئة (اختياري)"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">نوع الفئة</label>
          <div class="radio-group">
            <label class="radio-option" :class="{ 'selected': categoryType === 'main' }">
              <input
                type="radio"
                v-model="categoryType"
                value="main"
                name="categoryType"
              />
              <div class="radio-card">
                <div class="radio-icon main-icon">
                  <span class="material-icons fs-3">category</span>
                </div>
                <span class="radio-text">فئة رئيسية</span>
              </div>
            </label>
            <label class="radio-option" :class="{ 'selected': categoryType === 'sub' }">
              <input
                type="radio"
                v-model="categoryType"
                value="sub"
                name="categoryType"
              />
              <div class="radio-card">
                <div class="radio-icon sub-icon">
                  <span class="material-icons fs-3">category</span>
                </div>
                <span class="radio-text">فئة فرعية</span>
              </div>
            </label>
          </div>
        </div>

        <div v-if="categoryType === 'sub'" class="form-group">
          <label for="parentCategory" class="form-label">
            الفئة الأساسية *
          </label>
          <select
            id="parentCategory"
            v-model="formData.parentCategoryID"
            class="form-select"
            :class="{ 'error': errors.parentCategoryID }"
            
          >
            <option value="">اختر الفئة الأساسية</option>
            <option
              v-for="category in mainCategories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
          <span v-if="errors.parentCategoryID" class="error-message">
            {{ errors.parentCategoryID }}
          </span>
        </div>

        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>

        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>

        <div class="form-actions">
          <button
            type="button"
            @click="handleCancel"
            class="btn btn-secondary"
            :disabled="isLoading"
          >
            إلغاء
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? 'جاري الحفظ...' : 'حفظ الفئة' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="success-modal" @click.stop>
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>تم بنجاح!</h3>
        <p>تمت إضافة الفئة بنجاح</p>
        <button @click="closeSuccessModal" class="btn btn-primary">موافق</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useCategoryStore } from '@/stores/categoryStore'
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'AddCategory',
  setup() {
    const categoryStore = useCategoryStore()
    const router = useRouter()

    // Reactive data
    const formData = reactive({
      name: '',
      description: '',
      parentCategoryID: null
    })

    const categoryType = ref('main')
    const errors = reactive({})
    const successMessage = ref('')
    const showSuccessModal = ref(false)

    // Computed properties
    const mainCategories = computed(() => categoryStore.getMainCategories)
    const isLoading = computed(() => categoryStore.getIsLoading)
    const error = computed(() => categoryStore.getError)

    // Methods
    const validateForm = () => {
      // Clear previous errors
      Object.keys(errors).forEach(key => delete errors[key])

      let isValid = true

      // Validate name - improved logic
      const trimmedName = formData.name ? formData.name.trim() : ''
      
      if (!trimmedName) {
        errors.name = 'اسم الفئة مطلوب'
        isValid = false
      } else if (trimmedName.length < 2) {
        errors.name = 'اسم الفئة يجب أن يكون على الأقل حرفين'
        isValid = false
      }

      // Validate parent category for subcategories
      if (categoryType.value === 'sub' && !formData.parentCategoryID) {
        errors.parentCategoryID = 'الفئة الأساسية مطلوبة للفئات الفرعية'
        isValid = false
      }

      return isValid
    }

    const scrollToFirstError = () => {
      // Find the first field with an error
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField) {
        // Get the corresponding input element
        const fieldElement = document.getElementById(getFieldId(firstErrorField))
        if (fieldElement) {
          // Scroll to the field with smooth animation
          fieldElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          // Focus the field
          fieldElement.focus()
          // Add a visual highlight effect
          fieldElement.classList.add('error-highlight')
          setTimeout(() => {
            fieldElement.classList.remove('error-highlight')
          }, 2000)
        }
      }
    }

    const getFieldId = (fieldName) => {
      // Map field names to their corresponding input IDs
      const fieldIdMap = {
        'name': 'categoryName',
        'parentCategoryID': 'parentCategory'
      }
      return fieldIdMap[fieldName] || fieldName.toLowerCase()
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        // Force reactivity update
        nextTick(() => {
          scrollToFirstError()
        })
        return
      }

      // Clear previous messages
      categoryStore.clearError()
      successMessage.value = ''

      // Prepare data
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parentCategoryID: categoryType.value === 'main' ? null : formData.parentCategoryID
      }

      // Create category
      const result = await categoryStore.createCategory(categoryData)

      if (result.success) {
        showSuccessModal.value = true
        
        // Reset form
        formData.name = ''
        formData.description = ''
        formData.parentCategoryID = null
        categoryType.value = 'main'
        Object.keys(errors).forEach(key => delete errors[key])
      } else {
        // Handle specific errors and scroll to relevant field
        if (result.error && result.error.includes('اسم الفئة')) {
          errors.name = result.error
          nextTick(() => {
            scrollToFirstError()
          })
        }
      }
    }

    const handleCancel = () => {
      router.push('/categories')
    }

    const closeSuccessModal = () => {
      showSuccessModal.value = false
      router.push('/categories')
    }

    // Watch category type to reset parent selection
    const resetParentCategory = () => {
      if (categoryType.value === 'main') {
        formData.parentCategoryID = null
      }
    }

    // Lifecycle
    onMounted(async () => {
      // Fetch categories to populate parent dropdown
      await categoryStore.fetchCategories()
    })

    return {
      formData,
      categoryType,
      errors,
      successMessage,
      showSuccessModal,
      mainCategories,
      isLoading,
      error,
      handleSubmit,
      handleCancel,
      closeSuccessModal,
      resetParentCategory,
      scrollToFirstError
    }
  },
  watch: {
    categoryType() {
      this.resetParentCategory()
    }
  }
}
</script>

<style scoped>
.add-category-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffffff 0%, #cacacab5 100%);
  padding: 20px;
  direction: rtl;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  max-width: 600px;
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin: 0 auto;
}

.category-form {
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

.form-group:nth-child(1) { animation-delay: 0.1s; }
.form-group:nth-child(2) { animation-delay: 0.2s; }
.form-group:nth-child(3) { animation-delay: 0.3s; }
.form-group:nth-child(4) { animation-delay: 0.4s; }
.form-group:nth-child(5) { animation-delay: 0.5s; }

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #000000;
}

.form-input.error {
  border-color: #ef4444;
}

.form-input.error-highlight {
  border-color: #ef4444;
  background: #fdf2f2;
  animation: errorPulse 0.5s ease-in-out;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
}

@keyframes errorPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.form-textarea {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  resize: none;
  min-height: 120px;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #000000;
}

.form-select {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  transition: border-color 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: #000000;
}

.form-select.error {
  border-color: #ef4444;
}

.form-select.error-highlight {
  border-color: #ef4444;
  background: #fdf2f2;
  animation: errorPulse 0.5s ease-in-out;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
}

.radio-group {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.radio-option {
  flex: 1;
  cursor: pointer;
  position: relative;
}

.radio-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.radio-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #f8f9fa;
  transition: all 0.3s ease;
  min-height: 120px;
}

.radio-option:hover .radio-card {
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.radio-option.selected .radio-card {
  border-color: #000000;
  background: #f8fafc;
  box-shadow: 0 4px 12px rgba(58, 58, 58, 0.15);
}

.radio-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: white;
}

.main-icon {
  background: #0f0f0f;
}

.sub-icon {
  background: white;
  color: #0f0f0f;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.radio-option.selected .main-icon {
  background: #0f0f0f;
}

.radio-option.selected .sub-icon {
  background: white;
}

.radio-text {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

.radio-option.selected .radio-text {
  color: #1f2937;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.alert {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
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

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  animation: slideInUp 0.5s ease-out 0.6s;
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
  background-color: #0f0f0ff5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0f0f0f;
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

/* Success Modal */
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

.success-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
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

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
}

.success-modal h3 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.success-modal p {
  color: #7f8c8d;
  margin: 0 0 30px 0;
  font-size: 16px;
}

/* Animation for form elements */
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

/* Responsive design */
@media (max-width: 768px) {
  .add-category-container {
    padding: 16px;
  }
  
  .form-container {
    padding: 20px;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .radio-card {
    min-height: 80px;
    padding: 16px;
  }
  
  .radio-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 8px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    justify-content: center;
  }
}
</style>
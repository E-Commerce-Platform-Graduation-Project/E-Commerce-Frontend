<template>
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <!-- Modal Header -->
        <div class="modal-header bg-warning text-dark">
          <h5 class="modal-title">
            <i class="fas fa-edit me-2"></i>
            تعديل الفئة
          </h5>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <form @submit.prevent="submitForm">
            <!-- Category Name -->
            <div class="mb-3">
              <label for="categoryName" class="form-label fw-semibold">
                <i class="fas fa-tag me-2 text-warning"></i>
                اسم الفئة *
              </label>
              <input
                type="text"
                id="categoryName"
                v-model="form.Name"
                class="form-control form-control-lg"
                :class="{ 'is-invalid': errors.Name }"
                placeholder="أدخل اسم الفئة"
                style="direction: rtl;"
                required
              />
              <div v-if="errors.Name" class="invalid-feedback">
                {{ errors.Name }}
              </div>
            </div>

            <!-- Category Description -->
            <div class="mb-3">
              <label for="categoryDescription" class="form-label fw-semibold">
                <i class="fas fa-align-left me-2 text-warning"></i>
                وصف الفئة
              </label>
              <textarea
                id="categoryDescription"
                v-model="form.Description"
                class="form-control"
                :class="{ 'is-invalid': errors.Description }"
                rows="3"
                placeholder="أدخل وصف الفئة (اختياري)"
                style="direction: rtl;"
              ></textarea>
              <div v-if="errors.Description" class="invalid-feedback">
                {{ errors.Description }}
              </div>
            </div>

            <!-- Parent Category -->
            <div class="mb-3">
              <label for="parentCategory" class="form-label fw-semibold">
                <span class="material-icons text-warning me-2">category</span>
                الفئة الرئيسية
              </label>
              
              <!-- Show restriction message for parent categories with children -->
              <div v-if="isParentCategoryWithChildren" class="alert alert-info d-flex align-items-center mb-3">
                <i class="fas fa-info-circle me-2"></i>
                <div>
                  <strong>تنبيه:</strong> لا يمكن تعيين فئة رئيسية للفئات الرئيسية التي تحتوي على فئات فرعية لتجنب التعارض في التسلسل الهرمي
                </div>
              </div>

              <!-- Show conversion warning for parent categories without children -->
              <div v-if="isParentCategoryWithoutChildren && form.ParentCategoryID" class="alert alert-warning d-flex align-items-center mb-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div>
                  <strong>تحذير:</strong> بتعيين فئة رئيسية لهذه الفئة، ستتحول من فئة رئيسية إلى فئة فرعية
                </div>
              </div>

              <!-- Show restriction message for subcategories -->
              <div v-if="isSubcategory" class="alert alert-warning d-flex align-items-center mb-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div>
                  <strong>تنبيه:</strong> يجب تعيين فئة رئيسية للفئات الفرعية. لا يمكن تحويل فئة فرعية إلى فئة رئيسية مباشرة
                </div>
              </div>
              
              <select
                id="parentCategory"
                v-model="form.ParentCategoryID"
                class="form-select form-select-lg"
                :class="{ 'is-invalid': errors.ParentCategoryID }"
                :disabled="isParentCategoryWithChildren"
                style="direction: rtl;"
              >
                <option value="" :disabled="isSubcategory">
                  {{ getParentCategoryPlaceholder() }}
                </option>
                <option 
                  v-for="category in availableParentCategories" 
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.Name }}
                </option>
              </select>
              
              <div v-if="errors.ParentCategoryID" class="invalid-feedback">
                {{ errors.ParentCategoryID }}
              </div>
              
              <div class="form-text text-muted">
                <i class="fas fa-info-circle me-1"></i>
                <span v-if="isParentCategoryWithChildren">
                  هذه فئة رئيسية تحتوي على {{ subcategoriesCount }} فئة فرعية
                </span>
                <span v-else-if="isParentCategoryWithoutChildren">
                  هذه فئة رئيسية بدون فئات فرعية - يمكن تحويلها إلى فئة فرعية
                </span>
                <span v-else-if="isSubcategory">
                  هذه فئة فرعية - يجب تعيين فئة رئيسية لها
                </span>
                <span v-else>
                  اتركها فارغة لجعلها فئة رئيسية
                </span>
              </div>
            </div>

            <!-- Category Preview -->
            <div v-if="form.Name" class="mb-3">
              <label class="form-label fw-semibold">
                <i class="fas fa-eye me-2 text-warning"></i>
                معاينة الفئة
              </label>
              <div class="category-preview p-3 border rounded bg-light">
                <div class="d-flex align-items-center">
                  <div>
                    <h6 class="mb-1 fw-bold">{{ form.Name }}</h6>
                    <p class="mb-1 text-muted small">{{ form.Description || 'لا يوجد وصف' }}</p>
                    <span 
                      class="badge"
                      :class="getPreviewBadgeClass()"
                    >
                      {{ getPreviewType() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Validation Summary -->
            <div v-if="Object.keys(errors).length > 0" class="alert alert-danger">
              <h6 class="alert-heading">
                <i class="fas fa-exclamation-triangle me-2"></i>
                يرجى تصحيح الأخطاء التالية:
              </h6>
              <ul class="mb-0">
                <li v-for="(error, field) in errors" :key="field">{{ error }}</li>
              </ul>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="closeModal"
            :disabled="isLoading"
          >
            <i class="fas fa-times me-2"></i>
            إلغاء
          </button>
          <button 
            type="button"
            class="btn btn-warning"
            @click="submitForm"
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="fas fa-save me-2"></i>
            تحديث الفئة
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'

export default {
  name: 'CategoryForm',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    category: {
      type: Object,
      required: true
    },
    categories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'category-updated'],
  setup(props, { emit }) {
    const categoryStore = useCategoryStore()
    
    // State
    const isLoading = ref(false)
    const form = ref({
      Name: '',
      Description: '',
      ParentCategoryID: ''
    })
    const errors = ref({})

    // Computed
    const isParentCategory = computed(() => {
      // Check if this category is a parent category (has no parent)
      return !props.category.ParentCategoryID
    })

    const isParentCategoryWithChildren = computed(() => {
      // Check if this category is a parent category with children
      return !props.category.ParentCategoryID && subcategoriesCount.value > 0
    })

    const isParentCategoryWithoutChildren = computed(() => {
      // Check if this category is a parent category without children
      return !props.category.ParentCategoryID && subcategoriesCount.value === 0
    })

    const isSubcategory = computed(() => {
      // Check if this category is a subcategory (has a parent)
      return !!props.category.ParentCategoryID
    })

    const subcategoriesCount = computed(() => {
      return props.categories.filter(cat => cat.ParentCategoryID === props.category.id).length
    })

    const availableParentCategories = computed(() => {
      // If editing a parent category with children, return empty array to disable selection
      if (isParentCategoryWithChildren.value) {
        return []
      }
      
      // Exclude current category and its descendants to prevent circular references
      return props.categories.filter(cat => {
        // Exclude the current category
        if (cat.id === props.category.id) return false
        
        // Exclude categories that have this category as parent (descendants)
        if (isDescendant(props.category.id, cat.id)) return false
        
        // Only show parent categories (categories without a parent)
        return !cat.ParentCategoryID
      })
    })

    const isFormValid = computed(() => {
      return form.value.Name.trim() !== '' && 
             Object.keys(errors.value).length === 0 &&
             validateParentCategoryRequirement()
    })

    // Methods
    const validateParentCategoryRequirement = () => {
      // If this is a subcategory, it must have a parent
      if (isSubcategory.value) {
        return form.value.ParentCategoryID !== ''
      }
      return true
    }

    const getParentCategoryPlaceholder = () => {
      if (isParentCategoryWithChildren.value) {
        return 'لا يمكن تعيين فئة رئيسية'
      } else if (isSubcategory.value) {
        return 'اختر الفئة الرئيسية (مطلوب)'
      } else {
        return 'اختر الفئة الرئيسية (اختياري)'
      }
    }

    const isDescendant = (parentId, childId) => {
      const children = props.categories.filter(cat => cat.ParentCategoryID === parentId)
      for (const child of children) {
        if (child.id === childId) return true
        if (isDescendant(child.id, childId)) return true
      }
      return false
    }

    const validateForm = () => {
      errors.value = {}

      // Validate name
      if (!form.value.Name.trim()) {
        errors.value.Name = 'اسم الفئة مطلوب'
      } else if (form.value.Name.trim().length < 2) {
        errors.value.Name = 'اسم الفئة يجب أن يكون أكثر من حرفين'
      } else if (form.value.Name.trim().length > 100) {
        errors.value.Name = 'اسم الفئة يجب أن يكون أقل من 100 حرف'
      }

      // Validate description
      if (form.value.Description && form.value.Description.length > 500) {
        errors.value.Description = 'وصف الفئة يجب أن يكون أقل من 500 حرف'
      }

      // Validate parent category
      if (isParentCategoryWithChildren.value && form.value.ParentCategoryID) {
        // Check if trying to set parent for a parent category with children
        errors.value.ParentCategoryID = 'لا يمكن تعيين فئة رئيسية للفئات التي تحتوي على فئات فرعية'
        return false
      }

      // Validate subcategory requirements
      if (isSubcategory.value && !form.value.ParentCategoryID) {
        errors.value.ParentCategoryID = 'يجب تعيين فئة رئيسية للفئات الفرعية'
        return false
      }

      if (form.value.ParentCategoryID) {
        const parentExists = props.categories.some(cat => cat.id === form.value.ParentCategoryID)
        if (!parentExists) {
          errors.value.ParentCategoryID = 'الفئة الرئيسية المحددة غير صحيحة'
        }
        
        // Validate hierarchy
        if (!categoryStore.validateCategoryHierarchy(props.category.id, form.value.ParentCategoryID)) {
          errors.value.ParentCategoryID = 'لا يمكن إنشاء مرجع دائري في التسلسل الهرمي'
        }
      }

      return Object.keys(errors.value).length === 0
    }

    const submitForm = async () => {
      if (!validateForm()) return

      isLoading.value = true

      try {
        const formData = {
          Name: form.value.Name.trim(),
          Description: form.value.Description.trim(),
          ParentCategoryID: form.value.ParentCategoryID || null
        }

        const result = await categoryStore.updateCategory(props.category.id, formData)
        
        if (result.success) {
          emit('category-updated', result.data)
        } else {
          // Handle server validation errors
          if (result.error.includes('موجود بالفعل')) {
            errors.value.Name = result.error
          } else {
            errors.value.general = result.error
          }
        }
      } catch (error) {
        console.error('Form submission error:', error)
        errors.value.general = 'حدث خطأ غير متوقع'
      } finally {
        isLoading.value = false
      }
    }

    const closeModal = () => {
      if (!isLoading.value) {
        emit('close')
      }
    }

    const initializeForm = () => {
      if (props.category) {
        form.value = {
          Name: props.category.Name || '',
          Description: props.category.Description || '',
          ParentCategoryID: props.category.ParentCategoryID || ''
        }
      }
      errors.value = {}
    }

    const getPreviewBadgeClass = () => {
      if (form.value.ParentCategoryID) {
        return 'bg-primary'
      }
      return 'bg-danger'
    }

    const getPreviewType = () => {
      if (form.value.ParentCategoryID) {
        const parent = props.categories.find(cat => cat.id === form.value.ParentCategoryID)
        return `فئة فرعية تحت: ${parent?.Name || 'غير محدد'}`
      }
      return 'فئة رئيسية'
    }

    // Watchers
    watch(() => props.show, (newVal) => {
      if (newVal) {
        initializeForm()
      }
    })

    watch(() => props.category, () => {
      if (props.show) {
        initializeForm()
      }
    })

    // Real-time validation
    watch(() => form.value.Name, () => {
      if (errors.value.Name) {
        validateForm()
      }
    })

    watch(() => form.value.Description, () => {
      if (errors.value.Description) {
        validateForm()
      }
    })

    watch(() => form.value.ParentCategoryID, () => {
      if (errors.value.ParentCategoryID) {
        validateForm()
      }
    })

    // Lifecycle
    onMounted(() => {
      if (props.show) {
        initializeForm()
      }
    })

    return {
      isLoading,
      form,
      errors,
      isParentCategory,
      isParentCategoryWithChildren,
      isParentCategoryWithoutChildren,
      isSubcategory,
      subcategoriesCount,
      availableParentCategories,
      isFormValid,
      validateForm,
      submitForm,
      closeModal,
      getPreviewBadgeClass,
      getPreviewType,
      getParentCategoryPlaceholder
    }
  }
}
</script>

<style scoped>
/* Custom color classes */
.bg-custom-child {
  background-color: #2883a7 !important;
}

.text-custom-child {
  color: #2883a7 !important;
}

.modal {
  z-index: 1060;
}

.category-preview {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  transition: all 0.3s ease;
}

.category-preview:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.category-icon {
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.category-preview:hover .category-icon {
  opacity: 1;
}

.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1);
}

.form-select:disabled {
  background-color: #f8f9fa;
  border-color: #e9ecef;
  color: #6c757d;
}

.btn-primary {
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0b5ed7, #0a58ca);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  transform: none;
}

.invalid-feedback {
  display: block;
}

.alert-info {
  background-color: #e7f3ff;
  border-color: #b8daff;
  color: #0c5460;
}

.alert-warning {
  background-color: #fff3cd;
  border-color: #ffda6a;
  color: #856404;
}

@media (max-width: 768px) {
  .modal-dialog {
    margin: 1rem;
  }
  
  .modal-lg {
    max-width: none;
  }
}
</style>
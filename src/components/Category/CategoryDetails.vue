<template>
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <!-- Modal Header -->
        <div class="modal-header bg-gradient text-white" :class="getHeaderClass()">
          <div class="d-flex align-items-center">
            <div>
              <h4 class="modal-title mb-0">{{ category.name }}</h4>
              <small class="opacity-75">{{ getCategoryTypeText() }}</small>
            </div>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="modal-body p-0">
          <!-- Category Info Card -->
          <div class="card border-0 rounded-0">
            <div class="card-body p-4">
              <!-- Basic Information -->
              <div class="row mb-4">
                <div class="col-md-12">
                  <h5 class="card-title mb-3" :class="getTitleColorClass()">
                    <i class="fas fa-info-circle me-2"></i>
                    معلومات الفئة
                  </h5>
                  
                  <div class="mb-3">
                    <label class="fw-semibold text-muted mb-1">اسم الفئة:</label>
                    <p class="mb-0 fs-5">{{ category.name }}</p>
                  </div>

                  <div class="mb-3">
                    <label class="fw-semibold text-muted mb-1">الوصف:</label>
                    <p class="mb-0" :class="{ 'text-muted fst-italic': !category.description }">
                      {{ category.description || 'لا يوجد وصف متاح' }}
                    </p>
                  </div>

                  <div class="mb-3">
                    <label class="fw-semibold text-muted mb-1">النوع:</label>
                    <span class="badge fs-6 px-3 py-2" :class="getTypeBadgeClass()">
                      {{ getCategoryTypeText() }}
                    </span>
                  </div>

                  <div v-if="parentCategory" class="mb-3">
                    <label class="fw-semibold text-muted mb-1">الفئة الرئيسية:</label>
                    <div class="d-flex align-items-center">
                      <span class="material-icons me-2" :class="getParentIconClass()">category</span>
                      <span class="fs-6">{{ parentCategory.name }}</span>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="fw-semibold text-muted mb-1">تاريخ الإنشاء:</label>
                    <p class="mb-0 text-muted">{{ formatDate(category.createdDate) }}</p>
                  </div>
                </div>
              </div>

              <!-- Subcategories Section -->
              <div v-if="subcategories.length > 0" class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h5 class="mb-0" :class="getTitleColorClass()">
                    <i class="fas fa-sitemap me-2"></i>
                    الفئات الفرعية ({{ subcategories.length }})
                  </h5>
                  <button 
                    class="btn btn-outline-secondary btn-sm"
                    @click="toggleSubcategoriesView"
                  >
                    <i class="fas" :class="showAllSubcategories ? 'fa-eye-slash' : 'fa-eye'"></i>
                    {{ showAllSubcategories ? 'إخفاء' : 'عرض الكل' }}
                  </button>
                </div>

                <div class="row">
                  <div 
                    v-for="(subcategory) in displayedSubcategories" 
                    :key="subcategory.id"
                    class="col-md-6 col-lg-4 mb-3"
                  >
                    <div class="card subcategory-card h-100 border-0 shadow-sm cursor-pointer"
                         @click="viewSubcategory(subcategory)">
                      <div class="card-body p-3">
                        <div class="d-flex align-items-start">
                          <i class="fas fa-folder-open me-3 mt-1" :class="getSubcategoryIconClass()"></i>
                          <div class="flex-grow-1">
                            <h6 class="card-title mb-1">{{ subcategory.name }}</h6>
                            <p class="card-text text-muted small mb-2">
                              {{ subcategory.description || 'لا يوجد وصف' }}
                            </p>
                            <small class="text-muted">
                              تاريخ الإنشاء: {{ formatDate(subcategory.createdDate) }}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State for Subcategories -->
              <div v-else-if="!category.parentCategoryID" class="text-center py-4">
                <div class="empty-state">
                  <i class="fas fa-folder-plus fa-3x text-muted mb-3"></i>
                  <h5 class="text-muted">لا توجد فئات فرعية</h5>
                  <p class="text-muted">هذه الفئة لا تحتوي على فئات فرعية حالياً</p>
                </div>
              </div>

              <!-- Category Actions -->
              <div class="border-top pt-4">
                <h5 class="mb-3" :class="getTitleColorClass()">
                  <i class="fas fa-cogs me-2"></i>
                  الإجراءات
                </h5>
                <div class="d-flex flex-wrap gap-2">
                  <button 
                    class="btn btn-warning"
                    @click="editCategory"
                  >
                    <i class="fas fa-edit me-2"></i>
                    تعديل الفئة
                  </button>
                  <!-- Delete button with proper conditions -->
                  <button 
                    v-if="canDeleteCategory"
                    class="btn btn-danger"
                    @click="deleteCategory"
                  >
                    <i class="fas fa-trash me-2"></i>
                    حذف الفئة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer bg-light">
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="closeModal"
          >
            <i class="fas fa-times me-2"></i>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'

export default {
  name: 'CategoryDetails',
  props: {
    category: {
      type: Object,
      required: true
    },
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'editCategory', 'category-updated'],
  setup(props, { emit }) {
    const categoryStore = useCategoryStore()
    
    // State
    const showAllSubcategories = ref(false)

    // Computed
    const allCategories = computed(() => categoryStore.getAllCategories)
    
    const parentCategory = computed(() => {
      if (!props.category.parentCategoryID) return null
      return categoryStore.getCategoryById(props.category.parentCategoryID)
    })

    const subcategories = computed(() => {
      return categoryStore.getSubcategoriesByParent(props.category.id)
    })

    const displayedSubcategories = computed(() => {
      if (showAllSubcategories.value) {
        return subcategories.value
      }
      return subcategories.value.slice(0, 6) // Show first 6 subcategories by default
    })

    const categoryPath = computed(() => {
      return categoryStore.getCategoryPath(props.category.id)
    })

    const canDeleteCategory = computed(() => {
      // Only allow deletion if it's a subcategory OR if it's a main category with no subcategories
      if (props.category.parentCategoryID) {
        return true // Can delete subcategories
      }
      return subcategories.value.length === 0 // Can only delete main categories with no subcategories
    })

    // Methods
    const getTitleColorClass = () => {
      return props.category.parentCategoryID ? 'text-custom-child' : 'text-danger'
    }

    const getSubcategoryIconClass = () => {
      return props.category.parentCategoryID ? 'text-custom-child' : 'text-danger'
    }

    const getParentIconClass = () => {
      return props.category.parentCategoryID ? 'text-custom-child' : 'text-danger'
    }

    const getCategoryTypeText = () => {
      return props.category.parentCategoryID ? 'فئة فرعية' : 'فئة رئيسية'
    }

    const getHeaderClass = () => {
      return props.category.parentCategoryID ? 'bg-custom-child' : 'bg-danger'
    }

    const getTypeBadgeClass = () => {
      return props.category.parentCategoryID ? 'bg-custom-child' : 'bg-danger'
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'غير محدد'
      const date = new Date(dateString)
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const toggleSubcategoriesView = () => {
      showAllSubcategories.value = !showAllSubcategories.value
    }

    const closeModal = () => {
      emit('close')
    }

    const editCategory = () => {
      emit('editCategory', props.category)
    }

    const viewSubcategory = (subcategory) => {
      // Close current modal and emit to parent to show subcategory details
      emit('close')
      // You might want to emit a specific event for viewing subcategory
      // or handle this in the parent component
    }

    const deleteCategory = async () => {
      const confirmMessage = props.category.parentCategoryID 
        ? 'هل أنت متأكد من حذف هذه الفئة الفرعية؟'
        : 'هل أنت متأكد من حذف هذه الفئة الرئيسية؟'
        
      if (confirm(confirmMessage)) {
        const result = await categoryStore.deleteCategory(props.category.id)
        if (result.success) {
          emit('category-updated')
          emit('close')
        } else {
          // Handle error - you might want to show a toast or alert
          alert(result.error || 'حدث خطأ أثناء حذف الفئة')
        }
      }
    }

    // Handle keyboard events
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    // Lifecycle
    onMounted(() => {
      document.addEventListener('keydown', handleKeydown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    })

    // Cleanup on unmount
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'auto'
    })

    return {
      showAllSubcategories,
      allCategories,
      parentCategory,
      subcategories,
      displayedSubcategories,
      categoryPath,
      canDeleteCategory,
      getTitleColorClass,
      getSubcategoryIconClass,
      getParentIconClass,
      getCategoryTypeText,
      getHeaderClass,
      getTypeBadgeClass,
      formatDate,
      toggleSubcategoriesView,
      closeModal,
      editCategory,
      viewSubcategory,
      deleteCategory
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
  z-index: 1055;
}

.modal-dialog {
  max-width: 1200px;
}

.breadcrumb-custom {
  background: none;
  padding: 0;
  margin: 0;
}

.breadcrumb-custom .breadcrumb-item {
  font-size: 0.9rem;
}

.breadcrumb-custom .breadcrumb-item + .breadcrumb-item::before {
  content: var(--bs-breadcrumb-divider, "/");
  margin: 0 0.5rem;
  color: var(--bs-breadcrumb-divider-color);
}

.breadcrumb-custom .breadcrumb-item.active {
  color: var(--bs-breadcrumb-active-color);
  font-weight: 600;
}

.subcategory-card {
  transition: all 0.3s ease;
}

.subcategory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.empty-state {
  padding: 2rem;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.8;
  transform: scale(1.05);
  transition: all 0.2s ease;
}

/* RTL Support */
[dir="rtl"] .breadcrumb-custom .breadcrumb-item + .breadcrumb-item::before {
  content: "\\";
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal-dialog {
    margin: 0.5rem;
    max-width: calc(100% - 1rem);
  }
  
  .modal-xl {
    max-width: calc(100% - 1rem);
  }
  
  .d-flex.flex-wrap.gap-2 {
    gap: 0.5rem !important;
  }
  
  .btn {
    font-size: 0.875rem;
  }
  
  .row .col-md-6,
  .row .col-lg-4 {
    margin-bottom: 1rem;
  }
}

/* Animation for modal */
.modal.show {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
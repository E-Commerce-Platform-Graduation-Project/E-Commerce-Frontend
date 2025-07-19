<template>
  <!-- النافذة المنبثقة الرئيسية لعرض تفاصيل الفئة -->
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <!-- رأس النافذة المنبثقة مع عنوان الفئة ونوعها -->
        <div class="modal-header bg-gradient text-white" :class="getHeaderClass()">
          <div class="d-flex align-items-center">
            <div>
              <h4 class="modal-title mb-0">{{ category.name }}</h4>
              <small class="opacity-75">{{ getCategoryTypeText() }}</small>
            </div>
          </div>
        </div>

        <!-- محتوى النافذة المنبثقة -->
        <div class="modal-body p-0">
          <div class="card border-0 rounded-0">
            <div class="card-body p-4">
              <!-- قسم معلومات الفئة الأساسية -->
              <div class="row mb-4">
                <div class="col-md-12">
                  <h5 class="card-title mb-3" :class="getTitleColorClass()">
                    <i class="fas fa-info-circle me-2"></i>
                    معلومات الفئة
                  </h5>
                  
                  <!-- عرض اسم الفئة -->
                  <div class="mb-3">
                    <label class="fw-semibold text-muted mb-1">اسم الفئة:</label>
                    <p class="mb-0 fs-5">{{ category.name }}</p>
                  </div>

                  <!-- عرض وصف الفئة مع التعامل مع الفئات التي بدون وصف -->
                  <div class="mb-3">
                    <label class="fw-semibold text-muted mb-1">الوصف:</label>
                    <p class="mb-0" :class="{ 'text-muted fst-italic': !category.description }">
                      {{ category.description || 'لا يوجد وصف متاح' }}
                    </p>
                  </div>

                  <!-- عرض نوع الفئة (رئيسية أو فرعية) -->
                  <div class="mb-3">
                    <label class="fw-semibold text-muted mb-1">النوع:</label>
                    <span class="badge fs-6 px-3 py-2" :class="getTypeBadgeClass()">
                      {{ getCategoryTypeText() }}
                    </span>
                  </div>

                  <!-- عرض الفئة الرئيسية إذا كانت هذه الفئة فرعية -->
                  <div v-if="parentCategory" class="mb-3">
                    <label class="fw-semibold text-muted mb-1">الفئة الرئيسية:</label>
                    <div class="d-flex align-items-center">
                      <span class="material-icons me-2" :class="getParentIconClass()">category</span>
                      <span class="fs-6">{{ parentCategory.name }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- قسم الفئات الفرعية - يظهر فقط إذا كانت هناك فئات فرعية -->
              <div v-if="subcategories.length > 0" class="mb-4">
                <!-- رأس قسم الفئات الفرعية مع عداد وزر التحكم في العرض -->
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

                <!-- عرض الفئات الفرعية في شكل بطاقات -->
                <div class="row">
                  <div 
                    v-for="(subcategory) in displayedSubcategories" 
                    :key="subcategory.id"
                    class="col-md-6 col-lg-4 mb-3"
                  >
                    <div class="card subcategory-card h-100 border-0 shadow-sm cursor-pointer">
                      <div class="card-body p-3">
                        <div class="d-flex align-items-start">
                          <i class="fas fa-folder-open me-3 mt-1" :class="getSubcategoryIconClass()"></i>
                          <div class="flex-grow-1">
                            <h6 class="card-title mb-1">{{ subcategory.name }}</h6>
                            <p class="card-text text-muted small mb-2">
                              {{ subcategory.description || 'لا يوجد وصف' }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- رسالة تظهر عند عدم وجود فئات فرعية للفئة الرئيسية -->
              <div v-else-if="!category.parentCategoryID" class="text-center py-4">
                <div class="empty-state">
                  <i class="fas fa-folder-plus fa-3x text-muted mb-3"></i>
                  <h5 class="text-muted">لا توجد فئات فرعية</h5>
                  <p class="text-muted">هذه الفئة لا تحتوي على فئات فرعية حالياً</p>
                </div>
              </div>

              <!-- قسم الإجراءات المتاحة على الفئة -->
              <div class="border-top pt-4">
                <h5 class="mb-3" :class="getTitleColorClass()">
                  <i class="fas fa-cogs me-2"></i>
                  الإجراءات
                </h5>
                <div class="d-flex flex-wrap gap-2">
                  <!-- زر تعديل الفئة -->
                  <button 
                    class="btn btn-warning"
                    @click="editCategory"
                  >تعديل الفئة
                    <i class="fas fa-edit me-1"></i>
                    
                  </button>
                  <!-- زر حذف الفئة -->
                  <button 
                    class="btn btn-danger"
                    @click="deleteCategory"
                  >حذف الفئة
                    <i class="fas fa-trash me-1"></i>
                    
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- تذييل النافذة المنبثقة مع زر الإغلاق -->
        <div class="modal-footer bg-light">
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="closeModal"
          >إغلاق
            <i class="fas fa-times me-1"></i>
            
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- النافذة المنبثقة المخصصة للتأكيد وعرض الأخطاء -->
  <div v-if="showModal" class="custom-modal-overlay">
    <div class="custom-modal">
      <!-- رأس النافذة المنبثقة المخصصة مع الأيقونة -->
      <div class="custom-modal-header">
        <div class="icon-container" :class="modalType === 'error' ? 'icon-error' : 'icon-confirm'">
          <i class="fas" :class="modalType === 'error' ? 'fa-times' : 'fa-trash-alt'"></i>
        </div>
      </div>
      <!-- محتوى النافذة المنبثقة المخصصة -->
      <div class="custom-modal-body">
        <h4 class="modal-title-custom">{{ modalTitle }}</h4>
        <p>{{ modalMessage }}</p>
      </div>
      <!-- أزرار النافذة المنبثقة المخصصة -->
      <div class="custom-modal-footer">
        <!-- أزرار التأكيد -->
        <button v-if="modalType === 'confirm'" @click="hideModal" class="btn btn-secondary">إلغاء</button>
        <button v-if="modalType === 'confirm'" @click="onConfirm" class="btn btn-danger">تأكيد</button>
        <!-- زر الإغلاق للأخطاء -->
        <button v-if="modalType === 'error'" @click="hideModal" class="btn btn-danger">إغلاق</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'

export default {
  name: 'CategoryDetails',
  
  // خصائص المكون التي يتم تمريرها من المكون الأب
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
  
  // الأحداث التي يمكن للمكون إرسالها للمكون الأب
  emits: ['close', 'editCategory', 'category-updated'],
  
  setup(props, { emit }) {
    // الحصول على حافظ حالات الفئات
    const categoryStore = useCategoryStore()
    
    // متغيرات الحالة المحلية
    const showAllSubcategories = ref(false) // تحكم في عرض جميع الفئات الفرعية
    const showModal = ref(false) // تحكم في عرض النافذة المنبثقة المخصصة
    const modalType = ref('confirm') // نوع النافذة المنبثقة: 'confirm' أو 'error'
    const modalTitle = ref('') // عنوان النافذة المنبثقة
    const modalMessage = ref('') // رسالة النافذة المنبثقة
    const onConfirm = ref(null) // دالة التأكيد

    // الخصائص المحسوبة
    
    // جميع الفئات المتاحة
    const allCategories = computed(() => categoryStore.getAllCategories)
    
    // الفئة الرئيسية للفئة الحالية (إذا كانت فرعية)
    const parentCategory = computed(() => {
      if (!props.category.parentCategoryID) return null
      return categoryStore.getCategoryById(props.category.parentCategoryID)
    })

    // الفئات الفرعية للفئة الحالية
    const subcategories = computed(() => {
      return categoryStore.getSubcategoriesByParent(props.category.id)
    })

    // الفئات الفرعية المعروضة (حسب حالة العرض)
    const displayedSubcategories = computed(() => {
      if (showAllSubcategories.value) {
        return subcategories.value
      }
      return subcategories.value.slice(0, 0) // عرض صفر افتراضياً
    })

    // مسار الفئة الهرمي
    // const categoryPath = computed(() => {
    //   return categoryStore.getCategoryPath(props.category.id)
    // })

    // الدوال والطرق
    
    // إخفاء النافذة المنبثقة المخصصة
    const hideModal = () => {
      showModal.value = false
    }
    
    // تحديد فئة لون العناوين بناءً على نوع الفئة
    const getTitleColorClass = () => {
      return props.category.parentCategoryID ? 'text-custom-child' : 'text-danger'
    }

    // تحديد فئة لون أيقونة الفئة الفرعية
    const getSubcategoryIconClass = () => {
      return props.category.parentCategoryID ? 'text-custom-child' : 'text-danger'
    }

    // تحديد فئة لون أيقونة الفئة الرئيسية
    const getParentIconClass = () => {
      return props.category.parentCategoryID ? 'text-custom-child' : 'text-danger'
    }

    // الحصول على نص نوع الفئة
    const getCategoryTypeText = () => {
      return props.category.parentCategoryID ? 'فئة فرعية' : 'فئة رئيسية'
    }

    // تحديد الفئة لمعرفة لون خلفية رأس النافذة
    const getHeaderClass = () => {
      return props.category.parentCategoryID ? 'bg-custom-child' : 'bg-danger'
    }

    // تحديد الفئة لمعرفة لون الشارة 
    const getTypeBadgeClass = () => {
      return props.category.parentCategoryID ? 'bg-custom-child' : 'bg-danger'
    }

    // تبديل عرض جميع الفئات الفرعية
    const toggleSubcategoriesView = () => {
      showAllSubcategories.value = !showAllSubcategories.value
    }

    // إغلاق النافذة الرئيسية
    const closeModal = () => {
      emit('close')
    }

    // تحرير الفئة - إرسال حدث للمكون الأب
    const editCategory = () => {
      emit('editCategory', props.category)
    }

    // عرض الفئة الفرعية - إغلاق النافذة الحالية
    const viewSubcategory = (subcategory) => {
      emit('close')
    }

    // حذف الفئة مع التحقق من الشروط
    const deleteCategory = async () => {
      // التحقق من وجود فئات فرعية للفئة الرئيسية
      if (!props.category.parentCategoryID && subcategories.value.length > 0) {
        modalType.value = 'error'
        modalTitle.value = 'حدث خطأ!'
        modalMessage.value = 'لا يمكنك حذف فئة رئيسية تحتوي على فئات فرعية.'
        onConfirm.value = null
        showModal.value = true
        return
      }
      
      // إعداد نافذة التأكيد
      modalType.value = 'confirm'
      modalTitle.value = 'تأكيد الحذف'
      modalMessage.value = `هل أنت متأكد من حذف فئة "${props.category.name}"؟`
      
      // دالة التأكيد
      onConfirm.value = async () => {
        hideModal()
        
        // تنفيذ عملية الحذف
        const result = await categoryStore.deleteCategory(props.category.id)
        
        if (result.success) {
          // نجح الحذف
          emit('category-updated')
          emit('close')
        } else {
          // فشل الحذف - عرض رسالة خطأ
          modalType.value = 'error'
          modalTitle.value = 'حدث خطأ!'
          modalMessage.value = result.error || 'حدث خطأ أثناء حذف الفئة.'
          onConfirm.value = null
          showModal.value = true
        }
      }

      showModal.value = true
    }

  

    // إرجاع جميع المتغيرات والدوال للاستخدام في القالب
    return {
      showAllSubcategories,
      allCategories,
      parentCategory,
      subcategories,
      displayedSubcategories,
      getTitleColorClass,
      getSubcategoryIconClass,
      getParentIconClass,
      getCategoryTypeText,
      getHeaderClass,
      getTypeBadgeClass,
      toggleSubcategoriesView,
      closeModal,
      editCategory,
      viewSubcategory,
      deleteCategory,
      showModal,
      modalType,
      modalTitle,
      modalMessage,
      onConfirm,
      hideModal
      //categoryPath,
    }
  }
}
</script>

<style scoped>
/* فئات الألوان المخصصة */
.bg-custom-child {
  background-color: #2883a7 !important;
}

.text-custom-child {
  color: #2883a7 !important;
}

/* إعدادات النافذة المنبثقة الرئيسية */
.modal {
  z-index: 1055;
}

.modal-dialog {
  max-width: 1200px;
}

/* تنسيق مسار التنقل المخصص */
/* .breadcrumb-custom {
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
} */

/* تأثيرات بطاقات الفئات الفرعية */
.subcategory-card {
  transition: all 0.3s ease;
}

.subcategory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* تنسيق حالة عدم وجود محتوى */
.empty-state {
  padding: 2rem;
}

/* مؤشر القابلية للنقر */
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.8;
  transform: scale(1.05);
  transition: all 0.2s ease;
}

/* تعديل مسار التنقل للغة العربية */
/* [dir="rtl"] .breadcrumb-custom .breadcrumb-item + .breadcrumb-item::before {
  content: "\\";
} */

/* تنسيق النافذة المنبثقة المخصصة */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1060;
  direction: rtl;
}

.custom-modal {
  background-color: white;
  padding: 2rem;
  border-radius: 15px;
  width: 90%;
  max-width: 450px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  opacity: 0;
  animation: modal-animation 0.3s ease-out forwards;
}

/* حركة ظهور النافذة المنبثقة */
@keyframes modal-animation {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* رأس النافذة المنبثقة المخصصة */
.custom-modal-header {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

/* حاوية الأيقونة */
.icon-container {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
  color: white;
  background-color: #dc3545; /* أحمر للأخطاء والتأكيد */
}

/* عنوان النافذة المنبثقة المخصصة */
.modal-title-custom {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #343a40;
}

/* محتوى النافذة المنبثقة المخصصة */
.custom-modal-body p {
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 2rem;
}

/* تذييل النافذة المنبثقة المخصصة */
.custom-modal-footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.custom-modal-footer .btn {
  padding: 0.7rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  min-width: 100px;
}

/* تنسيق الشاشات الصغيرة */
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
  
  .row .col-md-6, .row .col-lg-4 { 
    margin-bottom: 1rem; 
  }
}

/* حركة ظهور النافذة المنبثقة الرئيسية */
.modal.show {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* حركة صعود المحتوى */
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
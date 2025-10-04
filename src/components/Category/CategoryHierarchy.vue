<template>
  <!-- مكون التسلسل الهرمي للفئات -->
  <div class="category-hierarchy p-4">
    
    <!-- حلقة تكرار للفئات الرئيسية -->
    <div v-for="mainCategory in mainCategories" :key="mainCategory.id" class="main-category-group mb-4">
      
      <!-- بطاقة الفئة الرئيسية -->
      <div 
        class="main-category-card card border-0 shadow-sm mb-3 cursor-pointer"
        @click="$emit('view-category', mainCategory)"
      >
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            
            <!-- معلومات الفئة الرئيسية -->
            <div class="d-flex align-items-center">
              <!-- أيقونة الفئة -->
              <div class="category-icon me-3">
                <span class="material-icons text-dark fs-3">category</span>
              </div>
              
              <!-- تفاصيل الفئة الرئيسية -->
              <div>
                <h5 class="mb-1 fw-bold">{{ mainCategory.name }}</h5>
                <p class="text-muted mb-0 small">{{ mainCategory.description }}</p>
                <small class="text-muted">
                  {{ getSubcategoriesCount(mainCategory.id) }} فئة فرعية
                </small>
              </div>
            </div>
            
            <!-- منطقة الإجراءات (فارغة حالياً) -->
            <div class="category-actions">
            </div>
          </div>
        </div>
      </div>

      <!-- الفئات الفرعية التابعة للفئة الرئيسية -->
      <div v-if="getSubcategories(mainCategory.id).length > 0" class="subcategories ps-4">
        <div class="row">
          
          <!-- حلقة تكرار للفئات الفرعية -->
          <div 
            v-for="subCategory in getSubcategories(mainCategory.id)" 
            :key="subCategory.id" 
            class="col-md-6 col-lg-4 mb-3"
          >
            <!-- بطاقة الفئة الفرعية -->
            <div 
              class="subcategory-card card border-start border-4 border-success h-100 cursor-pointer"
              @click="$emit('view-category', subCategory)"
            >
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  
                  <!-- محتوى الفئة الفرعية -->
                  <div class="flex-grow-1">
                    <h6 class="mb-1 fw-semibold">{{ subCategory.name }}</h6>
                    <p class="text-muted small mb-0">{{ subCategory.description }}</p>
                  </div>
                  
                  <!-- مؤشر العرض -->
                  <div class="view-indicator">
                    <i class="fas fa-eye text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- حالة فارغة للفئة الرئيسية التي لا تحتوي على فئات فرعية -->
      <div v-else class="text-center py-3 text-muted">
        <i class="fas fa-folder-open fa-2x mb-2 opacity-50"></i>
        <p class="mb-0">لا توجد فئات فرعية لهذه الفئة</p>
      </div>
    </div>

    <!-- عرض الفئات الفرعية المنفصلة (التي لا تظهر فئاتها الرئيسية في القائمة المفلترة) -->
    <div v-if="orphanedSubcategories.length > 0" class="orphaned-subcategories">
      <hr class="my-4">
      
      <!-- عنوان قسم نتائج البحث -->
      <div class="mb-3">
        <h6 class="text-muted fw-semibold">
          <i class="fas fa-search me-2"></i>
          نتائج البحث في الفئات الفرعية
        </h6>
      </div>
      
      <!-- شبكة الفئات الفرعية المنفصلة -->
      <div class="row">
        <div 
          v-for="subCategory in orphanedSubcategories" 
          :key="subCategory.id" 
          class="col-md-6 col-lg-4 mb-3"
        >
          <!-- بطاقة الفئة الفرعية المنفصلة -->
          <div 
            class="subcategory-card card border-start border-4 border-success h-100 cursor-pointer orphaned-card"
            @click="$emit('view-category', subCategory)"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                
                <!-- محتوى الفئة الفرعية المنفصلة -->
                <div class="flex-grow-1">
                  <h6 class="mb-1 fw-semibold">{{ subCategory.name }}</h6>
                  <p class="text-muted small mb-1">{{ subCategory.description }}</p>
                  
                  <!-- عرض اسم الفئة الرئيسية -->
                  <small class="text-danger">
                    <i class="fas fa-arrow-up me-1"></i>
                    {{ getParentCategoryName(subCategory.parentCategoryID) }}
                  </small>
                </div>
                
                <!-- مؤشر العرض -->
                <div class="view-indicator">
                  <i class="fas fa-eye text-muted"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- حالة فارغة عامة عندما لا توجد فئات -->
    <div v-if="mainCategories.length === 0 && orphanedSubcategories.length === 0" class="text-center py-5 text-muted">
      <i class="fas fa-tags fa-3x mb-3 opacity-50"></i>
      <h5>لا توجد فئات</h5>
      <p>ابدأ بإضافة فئة جديدة</p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'CategoryHierarchy',
  
  // خصائص المكون
  props: {
    // قائمة الفئات المفلترة
    categories: {
      type: Array,
      default: () => []
    },
    // قائمة جميع الفئات (للبحث عن الفئات الرئيسية)
    allCategories: {
      type: Array,
      default: () => []
    }
  },
  
  // الأحداث التي يمكن إرسالها من المكون
  emits: ['edit-category', 'delete-category', 'view-category'],
  
  setup(props) {
    // حساب الفئات الرئيسية من القائمة المفلترة
    // (الفئات التي لا تحتوي على parentCategoryID)
    const mainCategories = computed(() => 
      props.categories.filter(category => !category.parentCategoryID)
    )

    // دالة للحصول على الفئات الفرعية لفئة رئيسية معينة
    const getSubcategories = (parentId) => {
      return props.categories.filter(category => category.parentCategoryID === parentId)
    }

    // حساب الفئات الفرعية المنفصلة
    // (الفئات الفرعية التي لا تظهر فئاتها الرئيسية في القائمة المفلترة)
    const orphanedSubcategories = computed(() => {
      // جميع الفئات الفرعية من القائمة المفلترة
      const subcategories = props.categories.filter(category => category.parentCategoryID)
      
      // معرفات الفئات الرئيسية الموجودة في القائمة المفلترة
      const mainCategoryIds = mainCategories.value.map(cat => cat.id)
      
      // إرجاع الفئات الفرعية التي لا تنتمي للفئات الرئيسية المعروضة
      return subcategories.filter(subcat => !mainCategoryIds.includes(subcat.parentCategoryID))
    })

    // دالة لحساب عدد الفئات الفرعية لفئة رئيسية معينة
    const getSubcategoriesCount = (parentId) => {
      return getSubcategories(parentId).length
    }

    // دالة للحصول على اسم الفئة الرئيسية من جميع الفئات (وليس فقط المفلترة)
    const getParentCategoryName = (parentId) => {
      const parent = props.allCategories.find(cat => cat.id === parentId)
      return parent ? parent.name : 'غير محدد'
    }

    // إرجاع البيانات والدوال المطلوبة في القالب
    return {
      mainCategories,
      orphanedSubcategories,
      getSubcategories,
      getSubcategoriesCount,
      getParentCategoryName
    }
  }
}
</script>

<style scoped>
/* تصميم الحاوية الرئيسية */
.category-hierarchy {
  background: #f8f9fa;
}

/* تصميم بطاقة الفئة الرئيسية */
.main-category-card {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-left: 4px solid #0f0f0f !important;
  transition: all 0.3s ease;
}

/* تأثير التحويم على بطاقة الفئة الرئيسية */
.main-category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

/* تصميم أيقونة الفئة */
.category-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 5, 5, 0.1);
  border-radius: 50%;
}

/* تصميم بطاقة الفئة الفرعية */
.subcategory-card {
  transition: all 0.3s ease;
  border-color: #0f0f0f !important;
}

/* تأثير التحويم على بطاقة الفئة الفرعية */
.subcategory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background-color: #f8f9fa;
}

/* تصميم بطاقة الفئة الفرعية المنفصلة */
.orphaned-card {
  border-color: #2883a7 !important;
}

/* تصميم مؤشر العرض */
.view-indicator {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

/* تأثير التحويم على مؤشر العرض */
.subcategory-card:hover .view-indicator {
  opacity: 1;
}

/* تصميم المؤشر على الروابط */
.cursor-pointer {
  cursor: pointer;
}

/* تصميم أزرار الإجراءات */
.category-actions button {
  transition: all 0.2s ease;
}

/* تأثير التحويم على أزرار الإجراءات */
.category-actions button:hover {
  transform: scale(1.1);
}

/* التصميم المتجاوب للشاشات الصغيرة */
@media (max-width: 768px) {
  /* ترتيب الإجراءات عمودياً */
  .category-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  /* تقليل المسافة الداخلية للفئات الفرعية */
  .subcategories {
    padding-left: 1rem !important;
  }
}
</style>
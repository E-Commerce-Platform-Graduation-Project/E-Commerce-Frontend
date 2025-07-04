<template>
  <div class="category-hierarchy p-4">
    <div v-for="mainCategory in mainCategories" :key="mainCategory.id" class="main-category-group mb-4">
      <!-- Main Category -->
      <div 
      class="main-category-card card border-0 shadow-sm mb-3 cursor-pointer"
      @click="$emit('view-category', mainCategory)"
      >
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <div class="category-icon me-3">
                <span class="material-icons text-danger fs-3">category</span>
              </div>
              <div>
                <h5 class="mb-1 fw-bold">{{ mainCategory.Name }}</h5>
                <p class="text-muted mb-0 small">{{ mainCategory.Description }}</p>
                <small class="text-muted">
                  {{ getSubcategoriesCount(mainCategory.id) }} فئة فرعية
                </small>
              </div>
            </div>
            <div class="category-actions">
            </div>
          </div>
        </div>
      </div>

      <!-- Subcategories -->
      <div v-if="getSubcategories(mainCategory.id).length > 0" class="subcategories ps-4">
        <div class="row">
          <div 
            v-for="subCategory in getSubcategories(mainCategory.id)" 
            :key="subCategory.id" 
            class="col-md-6 col-lg-4 mb-3"
          >
            <div 
              class="subcategory-card card border-start border-4 border-success h-100 cursor-pointer"
              @click="$emit('view-category', subCategory)"
            >
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div class="flex-grow-1">
                    <h6 class="mb-1 fw-semibold">{{ subCategory.Name }}</h6>
                    <p class="text-muted small mb-0">{{ subCategory.Description }}</p>
                  </div>
                  <div class="view-indicator">
                    <i class="fas fa-eye text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state for main category without subcategories -->
      <div v-else class="text-center py-3 text-muted">
        <i class="fas fa-folder-open fa-2x mb-2 opacity-50"></i>
        <p class="mb-0">لا توجد فئات فرعية لهذه الفئة</p>
      </div>
    </div>

    <!-- Show orphaned subcategories (subcategories whose parents are not in the filtered list) -->
    <div v-if="orphanedSubcategories.length > 0" class="orphaned-subcategories">
      <hr class="my-4">
      <div class="mb-3">
        <h6 class="text-muted fw-semibold">
          <i class="fas fa-search me-2"></i>
          نتائج البحث في الفئات الفرعية
        </h6>
      </div>
      <div class="row">
        <div 
          v-for="subCategory in orphanedSubcategories" 
          :key="subCategory.id" 
          class="col-md-6 col-lg-4 mb-3"
        >
          <div 
            class="subcategory-card card border-start border-4 border-success h-100 cursor-pointer orphaned-card"
            @click="$emit('view-category', subCategory)"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="flex-grow-1">
                  <h6 class="mb-1 fw-semibold">{{ subCategory.Name }}</h6>
                  <p class="text-muted small mb-1">{{ subCategory.Description }}</p>
                </div>
                <div class="view-indicator">
                  <i class="fas fa-eye text-muted"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
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
  props: {
    categories: {
      type: Array,
      default: () => []
    },
    allCategories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['edit-category', 'delete-category', 'view-category'],
  setup(props) {
    // Get main categories from filtered categories
    const mainCategories = computed(() => 
      props.categories.filter(category => !category.ParentCategoryID)
    )

    // Get subcategories for a specific parent from filtered categories
    const getSubcategories = (parentId) => {
      return props.categories.filter(category => category.ParentCategoryID === parentId)
    }

    // Get orphaned subcategories (subcategories whose parents are not in the filtered list)
    const orphanedSubcategories = computed(() => {
      const subcategories = props.categories.filter(category => category.ParentCategoryID)
      const mainCategoryIds = mainCategories.value.map(cat => cat.id)
      
      return subcategories.filter(subcat => !mainCategoryIds.includes(subcat.ParentCategoryID))
    })

    const getSubcategoriesCount = (parentId) => {
      return getSubcategories(parentId).length
    }

    // Get parent category name from all categories (not just filtered ones)
    const getParentCategoryName = (parentId) => {
      const parent = props.allCategories.find(cat => cat.id === parentId)
      return parent ? parent.Name : 'غير محدد'
    }

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
.category-hierarchy {
  background: #f8f9fa;
}

.main-category-card {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-left: 4px solid #fd0d0d !important;
  transition: all 0.3s ease;
}

.main-category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

.category-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(253, 13, 13, 0.1);
  border-radius: 50%;
}

.subcategory-card {
  transition: all 0.3s ease;
  border-color: #2883a7 !important;
}

.subcategory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background-color: #f8f9fa;
}

.orphaned-card {
  border-color: #2883a7 !important;
}

.view-indicator {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.subcategory-card:hover .view-indicator {
  opacity: 1;
}

.cursor-pointer {
  cursor: pointer;
}

.category-actions button {
  transition: all 0.2s ease;
}

.category-actions button:hover {
  transform: scale(1.1);
}

/* Responsive */
@media (max-width: 768px) {
  .category-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .subcategories {
    padding-left: 1rem !important;
  }
}
</style>
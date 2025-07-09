<template>
  <div class="container-fluid px-3 px-lg-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-2">
      <h3 class="h2 fw-bold text-dark mb-0">الفئات</h3>
      <router-link 
        to="/add-category" 
        class="btn btn-success d-flex align-items-center gap-2 px-3 py-2 fw-medium text-decoration-none add-btn-custom"
      >
        <i class="fas fa-plus"></i>
        إضافة فئة جديدة
      </router-link>

    </div>

    <!-- Search and Filter Bar -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="position-relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="البحث في الفئات..."
            class="form-control form-control-lg pe-5 search-input-custom"
            style="direction: rtl;"
          />
          <i class="fas fa-search position-absolute text-muted search-icon-custom"></i>
        </div>
      </div>
      <div class="col-md-3">
        <select 
          v-model="filterType" 
          class="form-select form-select-lg"
          style="direction: rtl;"
        >
          <option value="all">جميع الفئات</option>
          <option value="main">الفئات الرئيسية</option>
          <option value="sub">الفئات الفرعية</option>
        </select>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card bg-light">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="card-title mb-0">إجمالي الفئات</h5>
                <h2 class="mb-0">{{ categoryStats.totalCategories }}</h2>
              </div>
              <i class="fas fa-tags fa-2x opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card bg-light">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="card-title mb-0">الفئات الرئيسية</h5>
                <h2 class="mb-0">{{ categoryStats.mainCategories }}</h2>
              </div>
              <i class="fas fa-folder fa-2x opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card bg-light">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="card-title mb-0">الفئات الفرعية</h5>
                <h2 class="mb-0">{{ categoryStats.subcategories }}</h2>
              </div>
              <i class="fas fa-folder-open fa-2x opacity-75"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mb-0">جاري تحميل الفئات...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-5">
      <p class="text-danger fs-5 mb-3">{{ error }}</p>
      <button @click="fetchCategories" class="btn btn-primary">إعادة المحاولة</button>
    </div>

    <!-- Categories Display -->
    <div v-else class="bg-white rounded-3 shadow-sm overflow-hidden">
      <!-- Main Categories Only View -->
      <div v-if="filterType === 'main'" class="p-4">
        <div v-if="filteredMainCategories.length > 0">
          <div v-for="category in filteredMainCategories" :key="category.id" class="main-category-group mb-4">
            <div class="main-category-card card border-0 shadow-sm mb-3 cursor-pointer"
            @click="handleViewCategory(category)"
            >
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center">
                    <div class="category-icon me-3">
                      <span class="material-icons text-danger fs-3">category</span>
                    </div>
                    <div>
                      <h5 class="mb-1 fw-bold">{{ category.name }}</h5>
                      <p class="text-muted mb-0 small">{{ category.description }}</p>
                      <small class="text-muted">
                        {{ getSubcategoriesCount(category.id) }} فئة فرعية
                      </small>
                    </div>
                  </div>
                  <div class="category-actions">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-5 text-muted">
          <i class="fas fa-folder fa-3x mb-3 opacity-50"></i>
          <h5>لا توجد فئات رئيسية</h5>
        </div>
      </div>

      <!-- Subcategories Only View -->
      <div v-else-if="filterType === 'sub'" class="p-4">
        <div v-if="filteredSubcategories.length > 0">
          <div class="row">
            <div 
              v-for="subCategory in filteredSubcategories" 
              :key="subCategory.id" 
              class="col-md-6 col-lg-4 mb-3"
            >
              <div 
                class="subcategory-card card border-start border-4 border-success h-100 cursor-pointer"
                @click="handleViewCategory(subCategory)"
              >
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="flex-grow-1">
                      <h6 class="mb-1 fw-semibold">{{ subCategory.name }}</h6>
                      <p class="text-muted small mb-1">{{ subCategory.description }}</p>
                      <small class="text-danger">
                        <i class="fas fa-arrow-up me-1"></i>
                        {{ getParentCategoryName(subCategory.parentCategoryID) }}
                      </small>
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
        <div v-else class="text-center py-5 text-muted">
          <i class="fas fa-folder-open fa-3x mb-3 opacity-50"></i>
          <h5>لا توجد فئات فرعية</h5>
        </div>
      </div>

      <!-- Hierarchy View (All Categories) -->
      <CategoryHierarchy 
        v-else
        :categories="filteredCategories"
        @edit-category="handleEditCategory"
        @delete-category="handleDeleteCategory"
        @view-category="handleViewCategory"
      />
    </div>

    <!-- Edit Category Modal -->
    <CategoryForm
      v-if="showEditCategoryModal && selectedCategory"
      :show="showEditCategoryModal"
      :category="selectedCategory"
      :categories="allCategories"
      @close="showEditCategoryModal = false"
      @category-updated="handleCategoryUpdated"
    />

    <!-- Category Details Modal -->
    <CategoryDetails
      v-if="selectedCategory && showCategoryDetails"
      :category="selectedCategory"
      :show="showCategoryDetails"
      @close="closeCategoryDetails"
      @category-updated="handleCategoryUpdated"
      @editCategory="handleEditCategory"
    /><!-- @editCategory="handleEditCategory" -->
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import CategoryHierarchy from '@/components/Category/CategoryHierarchy.vue'
import CategoryForm from '@/components/Category/EditCategory.vue'
import CategoryDetails from '@/components/Category/CategoryDetails.vue'

export default {
  name: 'Categories',
  components: {
    CategoryHierarchy,
    CategoryForm,
    CategoryDetails
  },
  setup() {
    const categoryStore = useCategoryStore()
    
    // State
    const searchQuery = ref('')
    const filterType = ref('all')
    const viewMode = ref('hierarchy')
    const selectedCategory = ref(null)
    const showEditCategoryModal = ref(false)
    const showCategoryDetails = ref(false)

    // Computed
    const allCategories = computed(() => categoryStore.getAllCategories)
    const isLoading = computed(() => categoryStore.getIsLoading)
    const error = computed(() => categoryStore.getError)
    const categoryStats = computed(() => categoryStore.getCategoriesStats())

    // Filter categories based on search and filter type
    const filteredCategories = computed(() => {
      let categories = allCategories.value

      // Apply search first
      if (searchQuery.value) {
        categories = categoryStore.searchCategories(searchQuery.value)
        console.log(categories)
        console.log(searchQuery.value)
      }

      return categories
    })

    // Get filtered main categories
    const filteredMainCategories = computed(() => {
      let categories = categoryStore.getMainCategories

      // Apply search if exists
      if (searchQuery.value) {
        const searchTerm = searchQuery.value.toLowerCase()
        categories = categories.filter(category =>
          category.name.toLowerCase().includes(searchTerm)
        )
      }

      return categories
    })

    // Get filtered subcategories
    const filteredSubcategories = computed(() => {
      let categories = allCategories.value.filter(cat => cat.parentCategoryID)

      // Apply search if exists
      if (searchQuery.value) {
        const searchTerm = searchQuery.value.toLowerCase()
        categories = categories.filter(category =>
          category.name.toLowerCase().includes(searchTerm)
        )
      }

      return categories
    })

    // Methods
    const fetchCategories = async () => {
      await categoryStore.fetchCategories()
    }

    const getSubcategoriesCount = (parentId) => {
      return allCategories.value.filter(cat => cat.parentCategoryID === parentId).length
    }

    const getParentCategoryName = (parentId) => {
      const parent = allCategories.value.find(cat => cat.id === parentId)
      return parent ? parent.name : 'غير محدد'
    }

    const handleCategoryUpdated = (updatedCategory) => {
      showEditCategoryModal.value = false
      showCategoryDetails.value = false
      selectedCategory.value = null
    }

    const handleEditCategory = (category) => {
      selectedCategory.value = category
      showEditCategoryModal.value = true
    }

    const handleDeleteCategory = async (categoryId) => {
      if (confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
        await categoryStore.deleteCategory(categoryId)
      }
    }

    const handleViewCategory = (category) => {
      selectedCategory.value = category
      showCategoryDetails.value = true
    }

    const closeCategoryDetails = () => {
      showCategoryDetails.value = false
      selectedCategory.value = null
    }

    // Lifecycle
    onMounted(() => {
      fetchCategories()
    })

    return {
      searchQuery,
      filterType,
      viewMode,
      selectedCategory,
      showEditCategoryModal,
      showCategoryDetails,
      allCategories,
      isLoading,
      error,
      categoryStats,
      filteredCategories,
      filteredMainCategories,
      filteredSubcategories,
      fetchCategories,
      getSubcategoriesCount,
      getParentCategoryName,
      handleCategoryUpdated,
      handleEditCategory,
      handleDeleteCategory,
      handleViewCategory,
      closeCategoryDetails
    }
  }
}
</script>

<style scoped>
/* Custom enhancements for Bootstrap components */
.add-btn-custom {
  background: linear-gradient(135deg, #198754, #157347) !important;
  border: none !important;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.add-btn-custom:hover {
  background: linear-gradient(135deg, #157347, #0f5132) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.search-input-custom {
  border: 2px solid #e0e0e0 !important;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.search-input-custom:focus {
  border-color: #0d6efd !important;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.1) !important;
}

.search-icon-custom {
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .container-fluid {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
  
  .d-flex.justify-content-between {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 1rem;
  }
  
  .add-btn-custom {
    align-self: stretch;
    justify-content: center;
  }

  .row.mb-4 .col-md-6,
  .row.mb-4 .col-md-3 {
    margin-bottom: 1rem;
  }
}
</style>
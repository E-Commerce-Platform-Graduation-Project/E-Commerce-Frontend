<template>
  <div class="container-fluid px-3 px-lg-4">
    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-2">
      <h3 class="h2 fw-bold text-dark mb-0">الموظفين</h3>
      <router-link 
        to="/add-employee" 
        class="btn btn-success d-flex align-items-center gap-2 px-3 py-2 fw-medium text-decoration-none add-btn-custom"
      >
        <i class="fas fa-plus"></i>
        إضافة موظف جديد
      </router-link>
    </div>

    <div class="search-filter-container mb-4">
      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="البحث بالاسم أو رقم الهاتف..."
          class="form-control search-input"
          style="direction: rtl;"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
    </div>

    <div v-if="!isLoading && !error && totalEmployees > 0" class="row mb-3">
      <div class="col-12">
        <div class="pagination-info">
          <span class="info-text">
            عرض {{ totalEmployees > 0 ? startIndex + 1 : 0 }} - {{ endIndex }} من {{ totalEmployees }} موظف
          </span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
      <div class="spinner-border text-dark mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mb-0">جاري تحميل الموظفين...</p>
    </div>

    <div v-else-if="error" class="text-center py-5">
      <p class="text-danger fs-5 mb-3">{{ error }}</p>
      <button @click="fetchEmployees" class="btn btn-primary">إعادة المحاولة</button>
    </div>

    <div v-else>
      <div class="bg-white rounded-3 shadow-sm overflow-hidden">
        <EmployeesList 
          :employees="displayedEmployees"
          @employee-updated="handleEmployeeUpdated"
          @employee-deleted="handleEmployeeDeleted"
          @view-employee="handleViewEmployee"
        />
        <div v-if="displayedEmployees.length === 0" class="text-center py-5 text-muted">
            <i class="fas fa-user-friends fa-3x mb-3"></i>
            <p class="fs-5">
                {{ searchQuery ? 'لم يتم العثور على موظفين يطابقون البحث.' : 'لا يوجد موظفين لعرضهم.' }}
            </p>
        </div>
      </div>

      <div v-if="!isLoading && !error && totalEmployees > 0" class="pagination-wrapper">
        <div class="pagination-container mt-4">
          <button 
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="pagination-btn prev-btn"
          >
            <i class="fas fa-chevron-right"></i>
            السابق
          </button>
          
          <div class="page-numbers">
            <button
              v-for="(page, index) in visiblePages"
              :key="index"
              @click="goToPage(page)"
              :class="['page-number', { 'active': page === currentPage, 'disabled': typeof page !== 'number' }]"
              :disabled="typeof page !== 'number'"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="pagination-btn next-btn"
          >
            التالي
            <i class="fas fa-chevron-left"></i>
          </button>
        </div>

        <div class="page-jump-container">
          <span class="page-jump-label">الانتقال إلى الصفحة:</span>
          <input 
            v-model.number="pageJumpInput" 
            type="number" 
            :min="1" 
            :max="totalPages"
            @keyup.enter="jumpToPage"
            @input="handlePageInputChange"
            class="page-jump-input"
            placeholder="رقم"
          />
          <button @click="jumpToPage" class="page-jump-btn" :disabled="!pageJumpInput">
            <i class="fas fa-arrow-left"></i>
          </button>
          <span class="page-jump-info">من {{ totalPages }}</span>
        </div>
      </div>
    </div>

    <EmployeeDetails
      v-if="selectedEmployee"
      :employee="selectedEmployee"
      :show="showEmployeeDetails"
      @close="closeEmployeeDetails"
      @employee-updated="handleEmployeeUpdated"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import EmployeesList from '@/components/Employee/EmployeesList.vue'
import EmployeeDetails from '@/components/Employee/EmployeeDetails.vue'

export default {
  name: 'Employees',
  components: {
    EmployeesList,
    EmployeeDetails
  },
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const route = useRoute()
    
    // State
    const employeesData = ref({ count: 0, results: [] })
    const searchQuery = ref('')
    const isLoading = ref(false)
    const error = ref(null)
    const selectedEmployee = ref(null)
    const showEmployeeDetails = ref(false)

    // Pagination State
    const currentPage = ref(parseInt(route.query.page) || 1)
    const itemsPerPage = ref(10)
    const pageJumpInput = ref('')

    // Computed: Get total count from API response
    const totalEmployees = computed(() => employeesData.value.count || 0)

    // Computed: Filter out current user from results
    const displayedEmployees = computed(() => {
      if (!employeesData.value.results) return []
      return employeesData.value.results.filter(
        employee => employee.id !== authStore.user?.id
      )
    })

    // Pagination Computed Properties
    const totalPages = computed(() => {
      if (totalEmployees.value === 0) return 1
      return Math.ceil(totalEmployees.value / itemsPerPage.value)
    })

    const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
    
    const endIndex = computed(() => {
      const end = startIndex.value + itemsPerPage.value
      return Math.min(end, totalEmployees.value)
    })
    
    const visiblePages = computed(() => {
        const total = totalPages.value;
        const current = currentPage.value;
        const pageWindow = 5; // The number of pages to show in a sequence at the start/end
        const pages = [];

        // If there are 7 or fewer pages in total, show all of them.
        if (total <= 7) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
            return pages;
        }

        // Case 1: The current page is near the beginning.
        if (current <= pageWindow - 2) {
            for (let i = 1; i <= pageWindow; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(total);
        }
        // Case 2: The current page is near the end.
        else if (current > total - (pageWindow - 2)) {
            pages.push(1);
            pages.push('...');
            for (let i = total - pageWindow + 1; i <= total; i++) {
                pages.push(i);
            }
        }
        // Case 3: The current page is in the middle.
        else {
            pages.push(1);
            pages.push('...');
            pages.push(current - 1);
            pages.push(current);
            pages.push(current + 1);
            pages.push('...');
            pages.push(total);
        }
        
        return pages;
    });

    // Update URL query params without reloading
    const updateUrlParams = () => {
      const query = { ...route.query }
      
      if (currentPage.value > 1) {
        query.page = currentPage.value.toString()
      } else {
        delete query.page
      }
      
      router.replace({ query })
    }

    // Methods
    const fetchEmployees = async () => {
      isLoading.value = true
      error.value = null
      
      try {
        updateUrlParams()
        const response = await authStore.getAllUsers({
          page: currentPage.value,
          search: searchQuery.value
        })
        // Store the entire paginated response
        employeesData.value = response
      } catch (err) {
        error.value = 'حدث خطأ أثناء تحميل الموظفين'
        console.error('Error fetching employees:', err)
      } finally {
        isLoading.value = false
      }
    }

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value && typeof page === 'number') {
        currentPage.value = page
        fetchEmployees()
      }
    }

    const jumpToPage = () => {
      const page = parseInt(pageJumpInput.value)
      
      // Check if input is empty or not a number
      if (!pageJumpInput.value || isNaN(page)) {
        alert('الرجاء إدخال رقم صفحة صحيح')
        return
      }
      
      // Check if page is less than 1
      if (page < 1) {
        alert(`رقم الصفحة يجب أن يكون 1 أو أكثر`)
        pageJumpInput.value = ''
        return
      }
      
      // Check if page exceeds total pages
      if (page > totalPages.value) {
        alert(`رقم الصفحة يجب أن يكون ${totalPages.value} أو أقل`)
        pageJumpInput.value = ''
        return
      }
      
      // If page is valid, navigate to it
      goToPage(page)
      pageJumpInput.value = ''
    }

    const handlePageInputChange = () => {
      // Prevent negative numbers and zero
      if (pageJumpInput.value < 1) {
        pageJumpInput.value = ''
      }
      // Prevent exceeding total pages while typing
      if (pageJumpInput.value > totalPages.value) {
        pageJumpInput.value = totalPages.value
      }
    }

    // Watchers
    let debounceTimer = null
    watch(searchQuery, () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        currentPage.value = 1
        fetchEmployees()
      }, 500)
    })

    watch(totalPages, (newTotalPages) => {
      if (currentPage.value > newTotalPages && newTotalPages > 0) {
        currentPage.value = newTotalPages
      } else if (newTotalPages === 0) {
        currentPage.value = 1
      }
    })

    // Event Handlers
    const handleEmployeeUpdated = (updatedEmployee) => {
      const index = employeesData.value.results.findIndex(emp => emp.id === updatedEmployee.id)
      if (index !== -1) {
        employeesData.value.results[index] = { 
          ...employeesData.value.results[index], 
          ...updatedEmployee 
        }
      }
      if (selectedEmployee.value && selectedEmployee.value.id === updatedEmployee.id) {
        selectedEmployee.value = { ...selectedEmployee.value, ...updatedEmployee }
      }
    }

    const handleEmployeeDeleted = (deletedEmployeeId) => {
      employeesData.value.results = employeesData.value.results.filter(
        emp => emp.id !== deletedEmployeeId
      )
      employeesData.value.count = Math.max(0, employeesData.value.count - 1)
      
      if (selectedEmployee.value && selectedEmployee.value.id === deletedEmployeeId) {
        closeEmployeeDetails()
      }
    }

    const handleViewEmployee = (employee) => {
      selectedEmployee.value = employee
      showEmployeeDetails.value = true
    }

    const closeEmployeeDetails = () => {
      showEmployeeDetails.value = false
      selectedEmployee.value = null
    }

    // Lifecycle
    onMounted(() => {
      // Initialize from URL query params
      if (route.query.page) {
        currentPage.value = parseInt(route.query.page) || 1
      }
      
      fetchEmployees()
    })

    return {
      searchQuery,
      isLoading,
      error,
      selectedEmployee,
      showEmployeeDetails,
      displayedEmployees,
      totalEmployees,
      totalPages,
      currentPage,
      itemsPerPage,
      visiblePages,
      startIndex,
      endIndex,
      pageJumpInput,
      fetchEmployees,
      handleEmployeeUpdated,
      handleEmployeeDeleted,
      handleViewEmployee,
      closeEmployeeDetails,
      goToPage,
      jumpToPage,
      handlePageInputChange
    }
  }
}
</script>

<style scoped>
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

/* Unified Search Styles */
.search-filter-container {
  display: flex;
  gap: 20px;
  align-items: center;
}
.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}
.search-input {
  padding: 18px 50px 18px 20px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 18px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  text-align: right;
  direction: rtl;
  width: 100%;
}
.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 4px 20px rgba(0, 123, 255, 0.2);
}
.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 18px;
}

.pagination-info {
  text-align: center;
  margin-bottom: 15px;
}

.info-text {
  color: #6c757d;
  font-size: 14px;
  background-color: #f8f9fa;
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
}

/* PAGINATION STYLES */
.pagination-wrapper {
  margin-top: 30px;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 15px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #292929;
  color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(29, 29, 29, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.page-numbers {
  display: flex;
  flex-wrap: nowrap; 
  gap: 5px;
  margin: 0 15px; 
}

.page-number {
  min-width: 40px;
  height: 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover:not(.disabled) {
  border-color: #313131;
  color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(131, 131, 131, 0.2);
}

.page-number.active {
  border-color: #313131;
  background: #0f0f0f;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.page-number.active:hover {
  border-color: #b9b9b9;
  color: rgb(189, 189, 189);
  transform: translateY(-2px);
}

.page-number.disabled {
  cursor: default;
  background-color: #f8f9fa;
  border-color: #e9ecef;
}

.page-jump-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-jump-label {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.page-jump-input {
  width: 70px;
  height: 40px;
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  direction: ltr;
}

.page-jump-input:focus {
  outline: none;
  border-color: #313131;
  box-shadow: 0 0 0 3px rgba(49, 49, 49, 0.1);
}

.page-jump-input::-webkit-inner-spin-button,
.page-jump-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-jump-input[type=number] {
  -moz-appearance: textfield;
}

.page-jump-input:invalid {
  border-color: #dc3545;
}

.page-jump-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-jump-btn:hover:not(:disabled) {
  border-color: #313131;
  color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(29, 29, 29, 0.2);
}

.page-jump-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-jump-info {
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
}

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

  .pagination-container {
    flex-direction: column;
    gap: 20px;
  }

  .page-numbers {
    order: -1;
  }

  .page-jump-container {
    margin-top: 0;
  }
}

@media (max-width: 487px) {
  .pagination-container {
    padding: 15px 10px;
  }

  .pagination-btn {
    padding: 8px 12px;
    font-size: 12px;
    gap: 5px;
    min-width: 80px;
  }

  .page-numbers {
    gap: 3px;
    margin: 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-number {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
    padding: 0;
  }

  .page-jump-container {
    padding: 12px 15px;
  }

  .page-jump-label {
    font-size: 12px;
  }

  .page-jump-input {
    width: 60px;
    height: 32px;
    font-size: 12px;
    padding: 6px 8px;
  }

  .page-jump-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .page-jump-info {
    font-size: 12px;
  }
}
</style>
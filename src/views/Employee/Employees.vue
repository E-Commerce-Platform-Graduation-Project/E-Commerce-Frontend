<template>
  <div class="container-fluid px-3 px-lg-4">
    <!-- Header -->
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

    <!-- Search Bar -->
    <div class="mb-4">
      <div class="position-relative" style="max-width: 400px;">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="البحث بالاسم أو رقم الهاتف..."
          class="form-control form-control-lg pe-5 search-input-custom"
          style="direction: rtl;"
        />
        <i class="fas fa-search position-absolute text-muted search-icon-custom"></i>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mb-0">جاري تحميل الموظفين...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-5">
      <p class="text-danger fs-5 mb-3">{{ error }}</p>
      <button @click="fetchEmployees" class="btn btn-primary">إعادة المحاولة</button>
    </div>

    <!-- Employees List -->
    <div v-else class="bg-white rounded-3 shadow-sm overflow-hidden">
      <EmployeesList 
        :employees="filteredEmployees"
        @employee-updated="handleEmployeeUpdated"
        @employee-deleted="handleEmployeeDeleted"
        @view-employee="handleViewEmployee"
      />
    </div>

    <!-- Employee Details Modal -->
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
import { ref, computed, onMounted } from 'vue'
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
    
    // State
    const employees = ref([])
    const searchQuery = ref('')
    const isLoading = ref(false)
    const error = ref(null)
    const selectedEmployee = ref(null)
    const showEmployeeDetails = ref(false)

    // Computed - Filter out current user and apply search
    const filteredEmployees = computed(() => {
      // First filter out the current user
      const employeesExceptCurrent = employees.value.filter(employee => 
        employee.id !== authStore.user?.id
      )
      
      // Then apply search filter if there's a search query
      if (!searchQuery.value) {
        return employeesExceptCurrent
      }
      
      const query = searchQuery.value.toLowerCase()
      return employeesExceptCurrent.filter(employee => 
        employee.full_name?.toLowerCase().includes(query) ||
        employee.phone_number?.includes(query)
      )
    })

    // Methods
    const fetchEmployees = async () => {
      isLoading.value = true
      error.value = null
      
      try {
        const allUsers = await authStore.getAllUsers()
        employees.value = allUsers
      } catch (err) {
        error.value = 'حدث خطأ أثناء تحميل الموظفين'
        console.error('Error fetching employees:', err)
      } finally {
        isLoading.value = false
      }
    }

    const handleEmployeeUpdated = (updatedEmployee) => {
      const index = employees.value.findIndex(emp => emp.id === updatedEmployee.id)
      if (index !== -1) {
        employees.value[index] = updatedEmployee
      }
      
      // Update selected employee if it's the same one
      if (selectedEmployee.value && selectedEmployee.value.id === updatedEmployee.id) {
        selectedEmployee.value = updatedEmployee
      }
    }

    const handleEmployeeDeleted = (deletedEmployeeId) => {
      employees.value = employees.value.filter(emp => emp.id !== deletedEmployeeId)
      
      // Close details if deleted employee was selected
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
      fetchEmployees()
    })

    return {
      employees,
      searchQuery,
      isLoading,
      error,
      selectedEmployee,
      showEmployeeDetails,
      filteredEmployees,
      fetchEmployees,
      handleEmployeeUpdated,
      handleEmployeeDeleted,
      handleViewEmployee,
      closeEmployeeDetails
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
}
</style>
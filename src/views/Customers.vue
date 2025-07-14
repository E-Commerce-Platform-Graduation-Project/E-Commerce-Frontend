<template>
  <div class="container-fluid px-lg-1 pt-1">

    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-2">
      <h3 class="h2 fw-bold text-dark mb-0">العملاء</h3>
    </div>

    <!-- Header -->
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="stats-container">
          <div class="stat-card total-customers">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ customerStore.getCustomersCount }}</div>
              <div class="stat-label">إجمالي العملاء</div>
            </div>
          </div>
          
          <div class="stat-card active-customers">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ customerStore.getActiveCustomersCount }}</div>
              <div class="stat-label">العملاء النشطون</div>
            </div>
          </div>
          
          <div class="stat-card disabled-customers">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ customerStore.getDisabledCustomersCount }}</div>
              <div class="stat-label">العملاء المعطلون</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filter Bar -->
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="search-filter-container">
          <div class="search-container">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="البحث برقم الهاتف..."
              class="form-control search-input"
              @input="onSearchInput"
            />
            <i class="fas fa-search search-icon"></i>
          </div>
          <div class="filter-container">
            <select 
              v-model="statusFilter" 
              class="form-control status-filter"
              @change="onStatusFilterChange"
            >
              <option value="all">جميع العملاء</option>
              <option value="active">العملاء النشطين</option>
              <option value="inactive">العملاء المعطلين</option>
            </select>
            <i class="fas fa-chevron-down filter-icon"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="customerStore.getIsLoading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="sr-only">Loading...</span>
      </div>
      <p class="text-muted">جاري تحميل بيانات العملاء...</p>
    </div>

    <!-- Error State -->
    <div v-if="customerStore.getError" class="alert alert-danger" role="alert">
      <div class="d-flex align-items-center">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <div>
          <strong>خطأ!</strong> {{ customerStore.getError }}
        </div>
      </div>
      <button @click="loadCustomers" class="btn btn-danger btn-sm mt-2">
        <i class="fas fa-redo mr-1"></i>
        إعادة المحاولة
      </button>
    </div>

    <!-- Customers List -->
    <div v-if="!customerStore.getIsLoading && !customerStore.getError" class="customers-container">
      <!-- Header Row -->
      <div class="customer-header">
        <div class="header-item">الاسم</div>
        <div class="header-item">رقم الهاتف</div>
        <div class="header-item">البريد الإلكتروني</div>
        <div class="header-item">تاريخ التسجيل</div>
        <div class="header-item">الحالة</div>
      </div>

      <!-- Customer Rows -->
      <div 
        v-for="customer in filteredCustomers" 
        :key="customer.id"
        :class="['customer-row', { 'disabled-customer': !customer.is_active }]"
      >
        <!-- Customer Avatar and Name -->
        <div class="customer-info">
          <div class="customer-avatar">
            <i class="fas fa-user"></i>
            <div class="status-indicator" :class="{ 'online': customer.is_active }"></div>
          </div>
          <div class="customer-details">
            <div class="customer-name">{{ customer.full_name }}</div>
            <div class="customer-role">{{ customer.role === 'CUSTOMER' ? 'عميل' : customer.role }}</div>
          </div>
        </div>

        <!-- Phone Number -->
        <div class="customer-phone">
          <i class="fas fa-phone"></i>
          {{ customer.phone_number }}
        </div>

        <!-- Email -->
        <div class="customer-email">
          <i class="fas fa-envelope"></i>
          {{ customer.email }}
        </div>

        <!-- Registration Date -->
        <div class="registration-date">
          <i class="fas fa-calendar-alt"></i>
          {{ formatDate(customer.registration_date) }}
        </div>

        <!-- Status Toggle -->
        <div class="">
          <div class="status-toggle-container">
            <button 
              @click="showToggleModal(customer)"
              :class="['status-toggle', { 'active': customer.is_active }]"
              :disabled="isTogglingStatus"
            >
              <div class="toggle-slider"></div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredCustomers.length === 0" class="empty-state">
        <i class="fas fa-users"></i>
        <p>لا يوجد عملاء {{ getEmptyStateMessage() }}</p>
      </div>
    </div>

    <!-- Toggle Status Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
        </div>
        <div class="modal-body">
          <p class="modal-message">{{ modalMessage }}</p>
        </div>
        <div class="modal-footer">
          <button 
            @click="closeModal" 
            class="btn btn-cancel"
          >
            إلغاء
          </button>
          <button 
            @click="confirmToggleStatus" 
            class="btn btn-confirm"
            :disabled="isTogglingStatus"
          >
            {{ isTogglingStatus ? 'جاري التحديث...' : (selectedCustomer?.is_active ? 'تعطيل' : 'تفعيل') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useCustomerStore } from '@/stores/customerStore'

export default {
  name: 'Customers',
  setup() {
    const customerStore = useCustomerStore()
    const searchQuery = ref('')
    const statusFilter = ref('all')
    const isTogglingStatus = ref(false)
    
    // Modal state
    const showModal = ref(false)
    const selectedCustomer = ref(null)
    const modalTitle = ref('')
    const modalMessage = ref('')

    // Computed properties
    const filteredCustomers = computed(() => {
      let customers = customerStore.getAllCustomers

      // Apply search filter (phone, name, or email)
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.trim().toLowerCase()
        customers = customers.filter(customer => 
          customer.phone_number.includes(query)
        )
      }

      // Apply status filter
      if (statusFilter.value === 'active') {
        customers = customers.filter(customer => customer.is_active === true)
      } else if (statusFilter.value === 'inactive') {
        customers = customers.filter(customer => customer.is_active === false)
      }

      return customers
    })

    // Methods
    const loadCustomers = async () => {
      await customerStore.fetchCustomers()
    }

    const onSearchInput = () => {
      // The computed property will automatically react to searchQuery changes
      // This method can be used for additional logic if needed
    }

    const onStatusFilterChange = () => {
      // The computed property will automatically react to statusFilter changes
      // This method can be used for additional logic if needed
    }

    const showToggleModal = (customer) => {
      selectedCustomer.value = customer
      const action = customer.is_active ? 'تعطيل' : 'تفعيل'
      modalTitle.value = `${action} العميل`
      modalMessage.value = `هل أنت متأكد من ${action} العميل "${customer.full_name}"؟`
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      selectedCustomer.value = null
      modalTitle.value = ''
      modalMessage.value = ''
    }

    const confirmToggleStatus = async () => {
      if (!selectedCustomer.value || isTogglingStatus.value) return
      
      isTogglingStatus.value = true
      const customer = selectedCustomer.value
      const newStatus = !customer.is_active
      const action = newStatus ? 'تفعيل' : 'تعطيل'
      
      const result = await customerStore.toggleCustomerStatus(customer.id, newStatus)
      console.log(newStatus)
      
      if (result.success) {
        console.log(`تم ${action} العميل بنجاح`)
        closeModal()
      } else {
        alert(`حدث خطأ أثناء ${action} العميل`)
      }
      
      isTogglingStatus.value = false
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const getEmptyStateMessage = () => {
      if (searchQuery.value.trim() && statusFilter.value !== 'all') {
        const statusText = statusFilter.value === 'active' ? 'نشطين' : 'معطلين'
        return `${statusText} يطابقون البحث المحدد`
      }
      if (searchQuery.value.trim()) {
        return 'يطابقون البحث المحدد'
      }
      if (statusFilter.value !== 'all') {
        return statusFilter.value === 'active' ? 'نشطين' : 'معطلين'
      }
      return 'مسجلين في النظام'
    }

    // Lifecycle
    onMounted(() => {
      loadCustomers()
    })

    return {
      customerStore,
      searchQuery,
      statusFilter,
      isTogglingStatus,
      filteredCustomers,
      showModal,
      selectedCustomer,
      modalTitle,
      modalMessage,
      loadCustomers,
      onSearchInput,
      onStatusFilterChange,
      showToggleModal,
      closeModal,
      confirmToggleStatus,
      formatDate,
      getEmptyStateMessage
    }
  }
}
</script>

<style scoped>
/* Main container */
.container-fluid {
  padding: 30px;
  min-height: 100vh;
}

/* Stats Container */
.stats-container {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  min-width: 280px;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.total-customers .stat-icon {
  background: #007bff;
}

.active-customers .stat-icon {
  background: #3bad1e
}

.disabled-customers .stat-icon {
  background: #e03b3b
}

.stat-content {
  flex: 1;
  text-align: right;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 16px;
  color: #52565a;
  font-weight: 800;
}

/* Search and Filter Container */
.search-filter-container {
  display: flex;
  gap: 20px;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
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

.filter-container {
  position: relative;
  min-width: 200px;
}

.status-filter {
  padding: 18px 50px 18px 20px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 18px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  text-align: right;
  direction: rtl;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.status-filter:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 4px 20px rgba(0, 123, 255, 0.2);
}

.filter-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 14px;
  pointer-events: none;
}

/* Customers container */
.customers-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* Header */
.customer-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 0.5fr;
  gap: 20px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  color: #495057;
  text-align: right;
}

.header-item {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Customer rows */
.customer-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 0.5fr;
  gap: 20px;
  padding: 20px 25px;
  border-bottom: 1px solid #f1f3f4;
  align-items: center;
  transition: all 0.3s ease;
  text-align: right;
}

.customer-row:hover {
  background-color: #f8f9fc;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.customer-row:last-child {
  border-bottom: none;
}

/* Disabled customer styling */
.disabled-customer {
  opacity: 0.5;
  background-color: #f8f9fa;
}

.disabled-customer:hover {
  background-color: #f8f9fa;
  transform: none;
  box-shadow: none;
}

/* Customer info */
.customer-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.customer-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ea6666;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 15px rgba(230, 102, 234, 0.3);
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #dc3545;
  border: 2px solid white;
  transition: all 0.3s ease;
}

.status-indicator.online {
  background-color: #28a745;
}

.customer-details {
  flex: 1;
}

.customer-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.customer-role {
  font-size: 12px;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

/* Phone number */
.customer-phone {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  font-size: 17px;
}

.customer-phone i {
  color: #454a4b;
}

/* Email */
.customer-email {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  font-size: 14px;
}

.customer-email i {
  color: #fd7e14;
}

/* Registration date */
.registration-date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 14px;
}

.registration-date i {
  color: #212923;
}

/* Status toggle */
.customer-status {
  display: flex;
  justify-content: start;
}

.status-toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-toggle {
  position: relative;
  width: 50px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: #dc3545;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.status-toggle.active {
  background-color: #28a745;
}

.status-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.status-toggle.active .toggle-slider {
  transform: translateX(26px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  min-width: 400px;
  max-width: 500px;
  animation: slideIn 0.3s ease;
  overflow: hidden;
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
}

.modal-body {
  padding: 30px;
  text-align: center;
}

.modal-message {
  font-size: 16px;
  color: #495057;
  margin: 0;
  line-height: 1.5;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
}

.btn-confirm {
  background-color: #28a745;
  color: white;
}

.btn-confirm:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 18px;
  margin: 0;
}

/* Responsive design */
@media (max-width: 1200px) {
  .customer-header,
  .customer-row {
    grid-template-columns: 2fr 1fr 1.5fr 1fr;
  }
  
  .search-filter-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .filter-container {
    min-width: 100%;
  }
  
  .stats-container {
    flex-direction: column;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .customer-header,
  .customer-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .customer-header {
    display: none;
  }
  
  .customer-row {
    background: white;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .customer-info {
    justify-content: space-between;
  }
  
  .customer-phone,
  .customer-email,
  .registration-date {
    justify-content: center;
  }
  
  .customer-status {
    justify-content: center;
  }
  
  .row.mb-4 .col-md-6,
  .row.mb-4 .col-md-3 {
    margin-bottom: 15px;
  }
  
  .stats-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .stat-card {
    min-width: 100%;
  }
  
  .modal-container {
    min-width: 350px;
    margin: 20px;
  }
}

/* Loading and error states */
.spinner-border {
  width: 3rem;
  height: 3rem;
}

.alert {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 10px rgba(220, 53, 69, 0.2);
}
</style>
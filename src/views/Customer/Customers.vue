<template>
  <div class="container-fluid px-lg-1 pt-1">

    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-2">
      <h3 class="h2 fw-bold text-dark mb-0">العملاء</h3>
    </div>

    <div class="row mb-4">
      <div class="col-md-12">
        <div class="stats-container">
          <div class="stat-card total-customers">
            <div class="stat-icon ">
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

    <div class="row mb-4">
      <div class="col-md-8">
        <div class="search-filter-container">
          <div class="search-container">
            <input v-model="searchQuery" type="text" placeholder="البحث بالاسم او برقم الهاتف ..."
              class="form-control search-input" />
            <i class="fas fa-search search-icon"></i>
          </div>
          <div class="filter-container">
            <select v-model="statusFilter" class="form-control status-filter">
              <option value="all">جميع العملاء</option>
              <option value="active">العملاء النشطين</option>
              <option value="inactive">العملاء المعطلين</option>
            </select>
            <i class="fas fa-chevron-down filter-icon"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-12">
        <div class="pagination-info">
          <span class="info-text">
            عرض {{ totalCustomers > 0 ? startIndex + 1 : 0 }} - {{ endIndex }} من {{ totalCustomers }} عميل
          </span>
        </div>
      </div>
    </div>

    <div v-if="customerStore.getIsLoading" class="text-center py-5">
      <div class="spinner-border text-dark mb-3" role="status">
        <span class="sr-only">Loading...</span>
      </div>
      <p class="text-muted">جاري تحميل بيانات العملاء...</p>
    </div>

    <div v-if="customerStore.getError" class="alert alert-danger" role="alert">
      <div class="d-flex align-items-center">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <div>
          <strong>خطأ!</strong> {{ customerStore.getError }}
        </div>
      </div>
      <button @click="customerStore.fetchCustomers({ page: currentPage, search: searchQuery })" class="btn btn-danger btn-sm mt-2">
        <i class="fas fa-redo mr-1"></i>
        إعادة المحاولة
      </button>
    </div>

    <div v-if="!customerStore.getIsLoading && !customerStore.getError" class="customers-container">
      <div class="customer-header bg-dark text-white">
        <div class="header-item">الاسم</div>
        <div class="header-item">رقم الهاتف</div>
        <div class="header-item">البريد الإلكتروني</div>
        <div class="header-item">تاريخ التسجيل</div>
        <div class="header-item">الحالة</div>
      </div>

      <div v-for="customer in filteredCustomers" :key="customer.id"
        :class="['customer-row', { 'disabled-customer': !customer.is_active }]" @click="viewCustomerDetails(customer)">
        <div class="customer-info">
          <div class="customer-avatar bg-white text-dark">
            <i class="fas fa-user"></i>
            <div class="status-indicator" :class="{ 'online': customer.is_active }"></div>
          </div>
          <div class="customer-details">
            <div class="customer-name">{{ customer.full_name }}</div>
          </div>
        </div>

        <div class="customer-phone">
          <i class="fas fa-phone"></i>
          {{ customer.phone_number }}
        </div>

        <div class="customer-email">
          <i class="fas fa-envelope"></i>
          {{ customer.email }}
        </div>

        <div class="registration-date">
          <i class="fas fa-calendar-alt"></i>
          {{ formatDate(customer.last_login) }}
        </div>

        <div @click.stop>
          <div class="status-toggle-container">
            <button @click="showToggleModal(customer)" :class="['status-toggle', { 'active': customer.is_active }]"
              :disabled="isTogglingStatus">
              <div class="toggle-slider"></div>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredCustomers.length === 0" class="empty-state">
        <i class="fas fa-users"></i>
        <p>لا يوجد عملاء {{ getEmptyStateMessage() }}</p>
      </div>
    </div>

    <div v-if="!customerStore.getIsLoading && !customerStore.getError && totalCustomers > 0"
      class="pagination-wrapper">
      <div class="pagination-container">
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="pagination-btn prev-btn">
          <i class="fas fa-chevron-right"></i>
          السابق
        </button>
        
        <div class="page-numbers">
          <button v-for="(page, index) in visiblePages" :key="index" @click="goToPage(page)"
            :class="['page-number', { 'active': page === currentPage, 'disabled': typeof page !== 'number' }]"
            :disabled="typeof page !== 'number'">
            {{ page }}
          </button>
        </div>

        <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
          class="pagination-btn next-btn">
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
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
        </div>
        <div class="modal-body">
          <p class="modal-message">{{ modalMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-cancel">
            إلغاء
          </button>
          <button @click="confirmToggleStatus" class="btn btn-confirm" :disabled="isTogglingStatus">
            {{ isTogglingStatus ? 'جاري التحديث...' : (selectedCustomer?.is_active ? 'تعطيل' : 'تفعيل') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCustomerStore } from '@/stores/customerStore';

const router = useRouter();
const route = useRoute();
const customerStore = useCustomerStore();

const searchQuery = ref('');
const statusFilter = ref('all');
const isTogglingStatus = ref(false);
const currentPage = ref(parseInt(route.query.page) || 1);
const itemsPerPage = ref(10); 
const pageJumpInput = ref('');

// Modal state
const showModal = ref(false);
const selectedCustomer = ref(null);
const modalTitle = ref('');
const modalMessage = ref('');

// Computed properties
const filteredCustomers = computed(() => {
  let customers = customerStore.getAllCustomers;

  if (statusFilter.value === 'active') {
    customers = customers.filter(customer => customer.is_active === true);
  } else if (statusFilter.value === 'inactive') {
    customers = customers.filter(customer => customer.is_active === false);
  }

  return customers;
});

const totalCustomers = computed(() => customerStore.getCustomersCount);

const totalPages = computed(() => {
  if (totalCustomers.value === 0) return 1;
  return Math.ceil(totalCustomers.value / itemsPerPage.value);
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const endIndex = computed(() => {
  const end = startIndex.value + itemsPerPage.value;
  return Math.min(end, totalCustomers.value);
});

const visiblePages = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;
    const pageWindow = 5;
    const pages = [];

    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
        return pages;
    }

    if (current <= pageWindow - 2) {
        for (let i = 1; i <= pageWindow; i++) {
            pages.push(i);
        }
        pages.push('...');
        pages.push(total);
    }
    else if (current > total - (pageWindow - 2)) {
        pages.push(1);
        pages.push('...');
        for (let i = total - pageWindow + 1; i <= total; i++) {
            pages.push(i);
        }
    }
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
  const query = { ...route.query };
  
  if (currentPage.value > 1) {
    query.page = currentPage.value.toString();
  } else {
    delete query.page;
  }
  
  router.replace({ query });
};

// Fetch customers with filters
const fetchCustomersWithFilters = () => {
  updateUrlParams();
  customerStore.fetchCustomers({ page: currentPage.value, search: searchQuery.value });
};

// --- METHODS & WATCHERS ---

let debounceTimer = null;

watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchCustomersWithFilters();
  }, 500);
});

watch(totalPages, (newTotalPages) => {
  if (currentPage.value > newTotalPages && newTotalPages > 0) {
    currentPage.value = newTotalPages;
  } else if (newTotalPages === 0) {
    currentPage.value = 1;
  }
});

onMounted(() => {
  // Initialize from URL query params
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page) || 1;
  }
  
  fetchCustomersWithFilters();
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && typeof page === 'number') {
    currentPage.value = page;
    fetchCustomersWithFilters();
  }
};

const jumpToPage = () => {
  const page = parseInt(pageJumpInput.value);
  
  if (!pageJumpInput.value || isNaN(page)) {
    alert('الرجاء إدخال رقم صفحة صحيح');
    return;
  }
  
  if (page < 1) {
    alert(`رقم الصفحة يجب أن يكون 1 أو أكثر`);
    pageJumpInput.value = '';
    return;
  }
  
  if (page > totalPages.value) {
    alert(`رقم الصفحة يجب أن يكون ${totalPages.value} أو أقل`);
    pageJumpInput.value = '';
    return;
  }
  
  goToPage(page);
  pageJumpInput.value = '';
};

const handlePageInputChange = () => {
  if (pageJumpInput.value < 1) {
    pageJumpInput.value = '';
  }
  if (pageJumpInput.value > totalPages.value) {
    pageJumpInput.value = totalPages.value;
  }
};

const viewCustomerDetails = (customer) => {
  router.push({
    path: `/customers/${customer.id}`,
    query: { returnPage: currentPage.value }
  });
};
const showToggleModal = (customer) => {
  selectedCustomer.value = customer;
  const action = customer.is_active ? 'تعطيل' : 'تفعيل';
  modalTitle.value = `${action} العميل`;
  modalMessage.value = `هل أنت متأكد من ${action} العميل "${customer.full_name}"؟`;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedCustomer.value = null;
};

const confirmToggleStatus = async () => {
  if (!selectedCustomer.value) return;

  isTogglingStatus.value = true;
  const customer = selectedCustomer.value;
  const result = await customerStore.toggleCustomerStatus(customer.id, !customer.is_active);

  if (result.success) {
    await customerStore.fetchCustomers({ page: currentPage.value, search: searchQuery.value });
    closeModal();
  } else {
    alert(`حدث خطأ أثناء تحديث حالة العميل`);
  }

  isTogglingStatus.value = false;
};

const formatDate = (dateString) => {
  if (!dateString) return 'لم يسجل الدخول بعد';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-LY', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const getEmptyStateMessage = () => {
  if (searchQuery.value.trim() && statusFilter.value !== 'all') {
    const statusText = statusFilter.value === 'active' ? 'نشطين' : 'معطلين';
    return `${statusText} يطابقون البحث المحدد`;
  }
  if (searchQuery.value.trim()) return 'يطابقون البحث المحدد';
  if (statusFilter.value !== 'all') return statusFilter.value === 'active' ? 'نشطين' : 'معطلين';
  return 'مسجلين في النظام';
};
</script>

<style scoped>
/* Your existing styles... */
.container-fluid {
  padding: 30px;
  min-height: 100vh;
}

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
  background: #3bad1e;
}

.disabled-customers .stat-icon {
  background: #e03b3b;
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

.search-filter-container {
  display: flex;
  gap: 20px;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
}

.search-input,
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
  width: 100%;
}

.search-input:focus,
.status-filter:focus {
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
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
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

.customers-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 30px;
}

.customer-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 0.5fr;
  gap: 20px;
  padding: 20px 25px;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  text-align: right;
}

.header-item {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.customer-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 0.5fr;
  gap: 20px;
  padding: 20px 25px;
  border-bottom: 1px solid #f1f3f4;
  align-items: center;
  transition: all 0.3s ease;
  text-align: right;
  cursor: pointer;
}

.customer-row:hover {
  background-color: #f8f9fc;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.customer-row:last-child {
  border-bottom: none;
}

.disabled-customer {
  opacity: 0.5;
  background-color: #f8f9fa;
}

.disabled-customer:hover {
  background-color: #f8f9fa;
  transform: none;
  box-shadow: none;
}

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
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 15px rgba(26, 26, 26, 0.3);
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


.customer-phone,
.customer-email,
.registration-date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
}

.customer-phone {
  font-size: 17px;
}

.customer-email {
  font-size: 14px;
}

.registration-date {
  font-size: 14px;
  color: #6c757d;
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

@media (max-width: 1200px) {
  .search-filter-container {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .filter-container {
    min-width: 100%;
  }

  .stats-container {
    flex-wrap: wrap;
    gap: 20px;
  }

  .stat-card {
    min-width: calc(50% - 10px);
    flex-grow: 1;
  }
}

@media (max-width: 991px) {
  .customer-header {
    display: none;
  }

  .customer-row {
    grid-template-columns: 1fr;
    gap: 15px;
    margin-bottom: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
    border-bottom: none;
    padding: 20px;
  }

  .customer-row>div {
    text-align: right;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 0;
    border-bottom: 1px solid #f1f3f4;
  }

  .customer-row>div:last-child {
    border-bottom: none;
  }

  .customer-row::before {
    display: none;
  }

  .customer-info {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .stats-container {
    flex-direction: column;
    gap: 15px;
  }

  .stat-card {
    min-width: 100%;
  }

  .modal-container {
    min-width: 90%;
    margin: 20px;
  }

  /* Responsive Pagination */
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
  .container-fluid {
    padding: 15px;
  }

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

  .stat-card {
    padding: 20px 15px;
    gap: 15px;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .stat-number {
    font-size: 28px;
  }

  .stat-label {
    font-size: 14px;
  }

  .search-input,
  .status-filter {
    padding: 14px 40px 14px 15px;
    font-size: 16px;
  }

  .search-icon,
  .filter-icon {
    right: 15px;
    font-size: 14px;
  }

  .customer-row {
    padding: 15px;
  }

  .customer-avatar {
    width: 45px;
    height: 45px;
    font-size: 18px;
  }

  .modal-container {
    min-width: 95%;
    margin: 10px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 15px 20px;
  }
}

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
<template>
  <div class="container-fluid mobile-invoices-container px-4 py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
      <h1 class="h2 fw-bold text-dark mb-0">سجل فواتير الشراء</h1>
      <router-link to="/add-purchase-invoice" class="btn btn-success d-flex align-items-center gap-2 px-3 py-2 ms-3">
        <i class="fas fa-plus"></i>
        فاتورة شراء جديدة
      </router-link>
    </div>

    <div class="row mb-4 g-3">
      <div class="col-lg-12">
        <div class="search-filter-container">
          <div class="search-container">
            <input v-model="searchQuery" type="text" placeholder="البحث برقم الفاتورة أو اسم مصدرها..."
              class="form-control search-input" />
            <i class="fas fa-search search-icon"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-12">
        <div class="pagination-info">
          <span class="info-text">
            عرض {{ totalInvoices > 0 ? startIndex + 1 : 0 }} - {{ endIndex }} من {{ totalInvoices }} فاتورة
          </span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-dark" role="status"></div>
      <p class="mt-2 text-muted">جاري تحميل الفواتير...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="filteredInvoices.length > 0" class="invoices-wrapper">
      <div class="table-scroll-container">
        <div class="invoices-container">
          <div class="invoice-header bg-dark text-white">
            <div class="header-item">رقم الفاتورة</div>
            <div class="header-item">التاريخ</div>
            <div class="header-item">بواسطة</div>
            <div class="header-item">عدد الأصناف</div>
            <div class="header-item">السعر الإجمالي</div>
            <div class="header-item">الإجراءات</div>
          </div>
          <div v-for="invoice in filteredInvoices" :key="invoice.id" class="invoice-row">
            <div class="invoice-id">#{{ invoice.id }}</div>
            <div class="invoice-date">{{ formatDate(invoice.date) }}</div>
            <div class="invoice-user">{{ invoice.user }}</div>
            <div class="invoice-items-count">{{ invoice.items.length }} صنف</div>
            <div class="invoice-total">{{ formatCurrency(invoice.totalAmount) }}</div>
            <div class="invoice-actions">
              <router-link :to="{
                path: `/purchase-invoices/${invoice.id}`,
                query: { returnPage: currentPage }
              }" class="btn btn-outline-dark btn-sm">
                عرض التفاصيل
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-5">
      <i class="fas fa-file-invoice-dollar fa-4x text-muted mb-3"></i>
      <h4 class="text-muted">لا توجد فواتير تطابق البحث</h4>
      <p>حاول تغيير كلمات البحث المستخدمة.</p>
    </div>

    <div v-if="!isLoading && !error && totalInvoices > 0" class="pagination-wrapper">
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
        <input v-model.number="pageJumpInput" type="number" :min="1" :max="totalPages" @keyup.enter="jumpToPage"
          @input="handlePageInputChange" class="page-jump-input" placeholder="رقم" />
        <button @click="jumpToPage" class="page-jump-btn" :disabled="!pageJumpInput">
          <i class="fas fa-arrow-left"></i>
        </button>
        <span class="page-jump-info">من {{ totalPages }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useRouter, useRoute } from 'vue-router';

const productStore = useProductStore();
const router = useRouter();
const route = useRoute();

const searchQuery = ref('');
const currentPage = ref(parseInt(route.query.page) || 1);
const itemsPerPage = ref(10);
const pageJumpInput = ref('');

const isLoading = computed(() => productStore.isLoading);
const error = computed(() => productStore.error);

const filteredInvoices = computed(() => {
  return productStore.getAllInvoices;
});

const totalInvoices = computed(() => productStore.getInvoicesCount);

const totalPages = computed(() => {
  if (totalInvoices.value === 0) return 1;
  return Math.ceil(totalInvoices.value / itemsPerPage.value);
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const endIndex = computed(() => {
  const end = startIndex.value + itemsPerPage.value;
  return Math.min(end, totalInvoices.value);
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

// Fetch invoices with filters and update URL
const fetchInvoicesWithFilters = () => {
  updateUrlParams();
  productStore.fetchPurchaseInvoices({ page: currentPage.value, search: searchQuery.value });
};

// Watch for search query changes with debounce
let debounceTimer = null;
watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchInvoicesWithFilters();
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

  fetchInvoicesWithFilters();
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && typeof page === 'number') {
    currentPage.value = page;
    fetchInvoicesWithFilters();
  }
};

const jumpToPage = () => {
  const page = parseInt(pageJumpInput.value);

  // Check if input is empty or not a number
  if (!pageJumpInput.value || isNaN(page)) {
    alert('الرجاء إدخال رقم صفحة صحيح');
    return;
  }

  // Check if page is less than 1
  if (page < 1) {
    alert(`رقم الصفحة يجب أن يكون 1 أو أكثر`);
    pageJumpInput.value = '';
    return;
  }

  // Check if page exceeds total pages
  if (page > totalPages.value) {
    alert(`رقم الصفحة يجب أن يكون ${totalPages.value} أو أقل`);
    pageJumpInput.value = '';
    return;
  }

  // If page is valid, navigate to it
  goToPage(page);
  pageJumpInput.value = '';
};

const handlePageInputChange = () => {
  // Prevent negative numbers and zero
  if (pageJumpInput.value < 1) {
    pageJumpInput.value = '';
  }
  // Prevent exceeding total pages while typing
  if (pageJumpInput.value > totalPages.value) {
    pageJumpInput.value = totalPages.value;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(amount);
};
</script>

<style scoped>
/* IMPORTANT: Allow horizontal scroll on mobile */
:deep(.main-content) {
  overflow-x: visible !important;
}

@media (max-width: 1170px) {

  :deep(.main-content),
  :deep(.p-3),
  :deep(.p-md-4) {
    overflow-x: visible !important;
    overflow-y: visible !important;
  }
}

/* Container adjustments */
.mobile-invoices-container {
  overflow: visible;
}

@media (max-width: 1170px) {
  .mobile-invoices-container {
    overflow-x: hidden !important;
    overflow-y: visible !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
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

@media (max-width: 1170px) {
  .search-icon {
    right: 15px;
  }
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

/* Invoices wrapper and scroll container */
.invoices-wrapper {
  position: relative;
  width: 100%;
  overflow: visible;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
}

@media (max-width: 1170px) {
  .invoices-wrapper {
    overflow: visible !important;
    max-width: 100vw;
    width: calc(100% + 1rem);
  }
}

.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

@media (max-width: 1170px) {
  .table-scroll-container {
    overflow-x: scroll !important;
    overflow-y: visible !important;
    border-radius: 0 0 12px 12px;
    width: 100%;
    max-width: 100%;
  }
}

.table-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.invoices-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  width: 100%;
}

@media (max-width: 1170px) {
  .invoices-container {
    min-width: 950px;
    width: 950px;
  }
}

.invoice-header,
.invoice-row {
  display: grid;
  grid-template-columns: 1.2fr 2fr 2fr 1fr 1.5fr 1fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  align-items: center;
  text-align: right;
}

.invoice-header {
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  font-size: 0.875rem;
}

.invoice-row {
  border-bottom: 1px solid #f1f3f4;
}

.invoice-row:last-child {
  border-bottom: none;
}

.invoice-row:hover {
  background-color: #f8f9fa;
}

.invoice-id {
  font-weight: bold;
  color: #0f0f0f;
}

.invoice-user {
  font-weight: 500;
}

.invoice-items-count {
  color: #6c757d;
  font-size: 0.9rem;
}

.invoice-total {
  font-weight: bold;
  color: #198754;
}

.invoice-actions {
  text-align: left;
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
  max-width: 95%;
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
  max-width: 95%;
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

/* Responsive design */
@media (max-width: 1170px) {
  .invoices-wrapper {
    overflow: visible !important;
    max-width: 100vw;
    width: calc(100% + 1rem);
  }

  .table-scroll-container {
    overflow-x: scroll !important;
    overflow-y: visible !important;
  }

  .search-filter-container {
    flex-direction: column;
    gap: 15px;
  }

  .search-container {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .pagination-container {
    flex-direction: column;
    gap: 15px;
  }

  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }

  .row {
    margin-left: 0;
    margin-right: 0;
    max-width: 95%;
  }

  .col-lg-12 {
    padding-left: 0;
    padding-right: 0;
  }
}

@media (max-width: 768px) {

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

@media (max-width: 500px) {
  .search-input {
    padding: 14px 45px 14px 15px;
    font-size: 16px;
  }

  .search-icon {
    right: 15px;
    font-size: 16px;
  }

  .pagination-btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .page-number {
    min-width: 35px;
    height: 35px;
    font-size: 13px;
  }

  .search-filter-container {
    gap: 12px;
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
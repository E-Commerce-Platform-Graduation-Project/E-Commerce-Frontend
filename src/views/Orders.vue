<template>
  <div class="container-fluid px-4 py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
      <h1 class="h2 fw-bold text-dark mb-0">إدارة الطلبات</h1>
    </div>

    <!-- Filters -->
    <div class="row mb-4 g-3">
      <div class="col-lg-12">
        <div class="search-filter-container">
          <div class="search-container">
            <input v-model="searchQuery" type="text" placeholder="البحث برقم الطلب..."
              class="form-control search-input" />
            <i class="fas fa-search search-icon"></i>
          </div>
          <!-- Product Filters -->
          <div class="filter-container">
            <select v-model="statusFilter" class="form-control status-filter">
              <option value="all">كل الحالات</option>
              <option v-for="status in availableStatuses" :key="status" :value="status">{{ status }}</option>
            </select>
            <i class="fas fa-chevron-down filter-icon"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading & Error States -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">جاري تحميل الطلبات...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Orders List Component -->
    <OrdersList v-else-if="filteredOrders.length > 0" :orders="filteredOrders" @view-details="openOrderDetailsModal"
      @update-status="handleStatusUpdate" />

    <!-- Empty State -->
    <div v-else class="text-center py-5">
      <i class="fas fa-file-invoice fa-4x text-muted mb-3"></i>
      <h4 class="text-muted">لا توجد طلبات تطابق الفلتر</h4>
    </div>

    <!-- Order Details Modal -->
    <OrderDetails v-if="isOrderDetailsVisible" :order="selectedOrder" @close="closeOrderDetailsModal" />

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">تأكيد تغيير الحالة</h5>
          </div>
          <div class="modal-body text-center">
            <div class="status-change-info">
              <p class="mb-3">هل أنت متأكد من تغيير حالة الطلب رقم <strong class="order-id-highlight">#{{ selectedOrder.id }}</strong>؟</p>
              
              <div class="status-transition">
                <div class="status-from">
                  <span class="status-label">من:</span>
                  <span class="status-badge" :class="getStatusBadgeClass(selectedOrder.status)">
                    {{ selectedOrder.status }}
                  </span>
                </div>
                
                <div class="arrow-container">
                  <i class="fas fa-arrow-down"></i>
                </div>
                
                <div class="status-to">
                  <span class="status-label">إلى:</span>
                  <span class="status-badge" :class="getStatusBadgeClass(newStatus)">
                    {{ newStatus }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancelStatusUpdate">إلغاء</button>
            <button type="button" class="btn btn-primary" @click="confirmStatusUpdate" :disabled="updating">
              <span v-if="updating" class="loading-spinner"></span>
              {{ updating ? "جاري التحديث..." : "تأكيد التغيير" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-dialog error-modal" @click.stop>
        <div class="modal-icon error-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <h3>حدث خطأ!</h3>
        <p>{{ modalErrorMessage }}</p>
        <button @click="closeErrorModal" class="btn btn-danger">إغلاق</button>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-dialog success-modal" @click.stop>
        <div class="modal-icon success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>تم بنجاح!</h3>
        <p>تم تحديث حالة الطلب بنجاح</p>
        <button @click="closeSuccessModal" class="btn btn-success">إغلاق</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useOrderStore } from '@/stores/orderStore';
import { useCustomerStore } from '@/stores/customerStore';
import OrdersList from '@/components/Order/OrdersList.vue';
import OrderDetails from '@/components/Order/OrderDetails.vue';

const productStore = useProductStore();
const categoryStore = useCategoryStore();
const orderStore = useOrderStore();
const customerStore = useCustomerStore();

// State for filters and modals
const searchQuery = ref('');
const statusFilter = ref('all');
const availableStatuses = ['قيد الانتظار', 'قيد التجهيز', 'في الطريق الى الزبون', 'مكتمل', 'ملغي'];

const isOrderDetailsVisible = ref(false);
const selectedOrder = ref(null);

const showConfirmModal = ref(false);
const newStatus = ref('');
const updating = ref(false);

// Error modal state
const showErrorModal = ref(false);
const modalErrorMessage = ref('');

// Success modal state
const showSuccessModal = ref(false);

// Computed properties
const isLoading = computed(() => orderStore.isLoading || customerStore.isLoading);
const error = computed(() => orderStore.error || customerStore.error);

const filteredOrders = computed(() => {
  let orders = orderStore.getAllOrders;

  if (searchQuery.value) {
    orders = orders.filter(order => order.id.toString().includes(searchQuery.value));
  }
  if (statusFilter.value !== 'all') {
    orders = orders.filter(order => order.status === statusFilter.value);
  }

  return orders;
});

// Methods
const getStatusBadgeClass = (status) => {
    const statusClasses = {
        'مكتمل': 'status-completed',
        'قيد التجهيز': 'status-processing',
        'في الطريق الى الزبون': 'status-shipped',
        'ملغي': 'status-cancelled',
        'قيد الانتظار': 'status-pending',
    };
    return statusClasses[status] || 'status-default';
};

const displayErrorModal = (errorMessage) => {
  modalErrorMessage.value = errorMessage || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  showErrorModal.value = true;
};

const closeErrorModal = () => {
  showErrorModal.value = false;
  modalErrorMessage.value = '';
  
  // Ensure the confirmation modal is also closed when error modal is closed
  if (showConfirmModal.value) {
    cancelStatusUpdate();
  }
};

const displaySuccessModal = () => {
  showSuccessModal.value = true;
  // Auto close after 2 seconds
  setTimeout(() => {
    closeSuccessModal();
  }, 2000);
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
};

onMounted(async () => {
  try {
    await Promise.all([
      orderStore.fetchOrders(),
      customerStore.fetchCustomers(),
      productStore.fetchProducts()
    ]);
  } catch (error) {
    console.error('Error loading data:', error);
    displayErrorModal('فشل في تحميل البيانات. يرجى إعادة تحميل الصفحة.');
  }
});

const openOrderDetailsModal = (order) => {
  selectedOrder.value = order;
  isOrderDetailsVisible.value = true;
};

const closeOrderDetailsModal = () => {
  isOrderDetailsVisible.value = false;
  selectedOrder.value = null;
};

const handleStatusUpdate = (order, status) => {
  selectedOrder.value = order;
  newStatus.value = status;
  showConfirmModal.value = true;
};

const cancelStatusUpdate = () => {
  showConfirmModal.value = false;
  selectedOrder.value = null;
  newStatus.value = '';
  updating.value = false;
};

const confirmStatusUpdate = async () => {
  if (!selectedOrder.value || !newStatus.value) {
    displayErrorModal('بيانات الطلب غير صحيحة.');
    return;
  }

  updating.value = true;
  
  try {
    // Call the store action and handle the response like cityStore pattern
    const result = await orderStore.updateOrderStatus(selectedOrder.value.id, newStatus.value);
    
    // Handle the response based on the success property (like cityStore pattern)
    if (result.success) {
      // Success case - close the confirmation modal and show success
      cancelStatusUpdate();
      displaySuccessModal();
    } else {
      // Handle error case - close confirmation modal first, then show error
      cancelStatusUpdate(); // Close the confirmation modal
      
      // Handle error case using the error property from result
      const errorMessage = result.error || 'فشل في تحديث حالة الطلب.';
      displayErrorModal(errorMessage);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    
    // Close confirmation modal first, then show error
    cancelStatusUpdate();
    
    // Handle different types of errors (similar to cityStore pattern)
    let errorMessage = 'حدث خطأ أثناء تحديث حالة الطلب.';
    
    if (error.response) {
      // API error response
      if (error.response.data) {
        // Check for different error message formats
        if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.status) {
          errorMessage = error.response.data.status[0];
        }
      }
      
      // Handle specific HTTP status codes
      if (error.response.status === 404) {
        errorMessage = 'الطلب غير موجود.';
      } else if (error.response.status === 403) {
        errorMessage = 'ليس لديك صلاحية لتعديل هذا الطلب.';
      } else if (error.response.status >= 500) {
        errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    displayErrorModal(errorMessage);
  } finally {
    updating.value = false;
  }
};
</script>

<style scoped>
/* Search and Filter Styling */
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
  padding: 12px 45px 12px 20px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  background-color: white;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  text-align: right;
  direction: rtl;
  width: 100%;
}

.search-input:focus,
.status-filter:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 2px 10px rgba(0, 123, 255, 0.15);
}

.search-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filter-container {
  position: relative;
  flex-basis: 220px;
}

.status-filter {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.filter-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
}

/* Modal Status Styling */
.status-change-info {
  padding: 20px 0;
}

.order-id-highlight {
  color: #0d6efd;
  font-size: 1.1em;
}

.status-transition {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
}

.status-from,
.status-to {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-direction: row;
  justify-content: flex-end;
}

.status-label {
  font-weight: 600;
  color: #6c757d;
  min-width: 30px;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.9em;
  min-width: 140px;
  text-align: center;
}

.status-pending {
  background-color: #fff8e1;
  color: #f59e0b;
}

.status-processing {
  background-color: #e0f7fa;
  color: #06b6d4;
}

.status-shipped {
  background-color: #f3e5f5;
  color: #a855f7;
}

.status-completed {
  background-color: #e8f5e9;
  color: #22c55e;
}

.status-cancelled {
  background-color: #ffebee;
  color: #ef4444;
}

.status-default {
  background-color: #f1f3f4;
  color: #495057;
}

.arrow-container {
  font-size: 1.2em;
  color: #6c757d;
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
  60% {
    transform: translateY(-3px);
  }
}

.modal-content {
  border-radius: 12px;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid #dee2e6;
  border-radius: 12px 12px 0 0;
}

.modal-footer {
  border-top: 1px solid #f1f3f4;
  padding: 20px;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff, #0056b3);
  border: none;
  padding: 10px 25px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  border: none;
  padding: 10px 25px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* Loading spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal Overlay Base */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal Dialog Base */
.modal-dialog.error-modal,
.modal-dialog.success-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 450px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  direction: rtl;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.error-icon {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
}

.success-icon {
  background: linear-gradient(135deg, #27ae60, #219a52);
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
}

.modal-dialog h3 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-weight: 700;
}

.modal-dialog p {
  color: #7f8c8d;
  margin: 0 0 30px 0;
  font-size: 16px;
  line-height: 1.5;
  direction: rtl;
  text-align: center;
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c82333, #a71e2a);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #28a745, #1e7e34);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.btn-success:hover {
  background: linear-gradient(135deg, #1e7e34, #155724);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}
</style>
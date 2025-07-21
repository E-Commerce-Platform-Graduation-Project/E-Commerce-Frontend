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
          <div class="modal-body">
            <p>هل أنت متأكد من تغيير حالة الطلب رقم <strong>#{{ selectedOrder.id }}</strong> إلى <strong>"{{ newStatus
                }}"</strong>؟</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancelStatusUpdate">إلغاء</button>
            <button type="button" class="btn btn-primary" @click="confirmStatusUpdate">تأكيد</button>
          </div>
        </div>
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
onMounted(() => {
  orderStore.fetchOrders();
  customerStore.fetchCustomers(); // Needed for customer names in the list
  productStore.fetchProducts(); // Needed for product details in the modal
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
};

const confirmStatusUpdate = async () => {
  if (selectedOrder.value && newStatus.value) {
    await orderStore.updateOrderStatus(selectedOrder.value.id, newStatus.value);
  }
  cancelStatusUpdate(); // Reset state after confirmation
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
</style>
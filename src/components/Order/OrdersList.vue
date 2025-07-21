<template>
  <div class="orders-container">
    <!-- List Header -->
    <div class="order-header">
      <div class="header-item">معرف الطلب</div>
      <div class="header-item customer">العميل</div>
      <div class="header-item">المجموع</div>
      <div class="header-item status">الحالة</div>
    </div>

    <!-- Order Rows -->
    <div 
      v-for="order in orders" 
      :key="order.id"
      class="order-row"
      @click="$emit('view-details', order)"
    >
      <!-- Order ID -->
      <div class="order-id">#{{ order.id }}</div>

      <!-- Customer Name -->
      <div class="order-customer">{{ getCustomerName(order.customerId) }}</div>

      <!-- Total Amount -->
      <div class="order-total">{{ order.totalAmount }} دينار</div>

      <!-- Status -->
      <div class="order-status" @click.stop>
        <div class="dropdown">
          <button class="btn dropdown-toggle status-btn" :class="getStatusBadgeClass(order.status)" type="button" data-bs-toggle="dropdown">
            {{ order.status }}
          </button>
          <ul class="dropdown-menu">
            <li v-for="status in availableStatuses" :key="status">
              <a class="dropdown-item" href="#" @click.prevent="$emit('update-status', order, status)">{{ status }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCustomerStore } from '@/stores/customerStore';

defineProps({
  orders: {
    type: Array,
    required: true,
  },
});

defineEmits(['view-details', 'update-status']);

const customerStore = useCustomerStore();

const availableStatuses = ['قيد الانتظار', 'قيد التجهيز', 'في الطريق الى الزبون', 'مكتمل', 'ملغي'];

const getCustomerName = (customerId) => {
    const customer = customerStore.getCustomerById(customerId);
    return customer ? customer.full_name : 'عميل غير معروف';
};

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
</script>

<style scoped>
.orders-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.order-header, .order-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1.5fr 2fr;
  gap: 20px;
  padding: 15px 25px;
  align-items: center;
  text-align: right;
}

.order-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.order-row {
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.3s ease;
  cursor: pointer;
}
.order-row:hover {
  background-color: #f8f9fc;
}
.order-row:last-child { border-bottom: none; }

.order-id { font-weight: bold; color: #0d6efd; }
.order-total { font-weight: 500; }

/* New Status Button Styling */
.status-btn {
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: bold;
    border: none;
    min-width: 150px;
    transition: all 0.2s ease;
}

.status-btn:hover {
    opacity: 0.9;
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

.dropdown-menu {
    text-align: right;
}
</style>
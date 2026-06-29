<template>
  <div class="orders-container">
    <!-- Mobile Dropdown Backdrop -->
    <div 
      v-if="activeDropdown !== null" 
      class="dropdown-backdrop"
      @click="activeDropdown = null"
    ></div>

    <!-- List Header -->
    <div class="order-header bg-dark text-white">
      <div class="header-item">معرف الطلب</div>
      <div class="header-item customer">العميل</div>
      <div class="header-item">تكلفة المنتجات</div>
      <div class="header-item">تكلفة التوصيل</div>
      <div class="header-item">المجموع الكلي</div>
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
      <div class="order-customer">{{ order.customerName || 'عميل غير معروف' }}</div>

      <!-- Product Cost (Total Price before shipping) -->
      <div class="order-product-cost">{{ order.totalPrice }} دينار</div>

      <!-- Delivery Cost -->
      <div class="order-shipping">{{ order.shippingCost }} دينار</div>

      <!-- Total Amount (Grand Total) -->
      <div class="order-total">{{ order.totalAmount }} دينار</div>

      <!-- Status -->
      <div class="order-status" @click.stop>
        <div class="dropdown">
          <button 
            class="btn dropdown-toggle status-btn" 
            :class="getStatusBadgeClass(order.status)" 
            type="button" 
            :data-order-id="order.id"
            @click="toggleDropdown(order.id)"
          >
            {{ order.status }}
          </button>
          <ul 
            class="dropdown-menu" 
            :class="{ show: activeDropdown === order.id }"
          >
            <li v-for="status in availableStatuses" :key="status">
              <a 
                class="dropdown-item" 
                :class="[
                  getDropdownItemClass(status),
                  { 
                    'current-status': status === order.status,
                    'disabled': status === order.status 
                  }
                ]"
                href="#" 
                @click.prevent="updateStatus(order, status)"
              >
                {{ status }}
                <i v-if="status === order.status" class="fas fa-check current-status-icon"></i>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  orders: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['view-details', 'update-status']);

const activeDropdown = ref(null);

const availableStatuses = ['قيد الانتظار', 'قيد التجهيز', 'في الطريق الى الزبون', 'مكتمل', 'ملغي'];

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

const getDropdownItemClass = (status) => {
    const itemClasses = {
        'مكتمل': 'dropdown-item-completed',
        'ملغي': 'dropdown-item-cancelled',
        'قيد الانتظار': 'dropdown-item-pending',
        'قيد التجهيز': 'dropdown-item-processing',
        'في الطريق الى الزبون': 'dropdown-item-shipped',
    };
    return itemClasses[status] || '';
};

const toggleDropdown = (orderId) => {
    if (activeDropdown.value === orderId) {
        activeDropdown.value = null;
    } else {
        activeDropdown.value = orderId;
    }
};

const updateStatus = (order, status) => {
    if (status === order.status) {
        return;
    }
    
    emit('update-status', order, status);
    activeDropdown.value = null;
};

document.addEventListener('click', (event) => {
    if (!event.target.closest('.dropdown')) {
        activeDropdown.value = null;
    }
});
</script>

<style scoped>
.orders-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  width: 100%;
  display: block;
}

.order-header, .order-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1.2fr 1.2fr 1.2fr 2fr;
  gap: 20px;
  padding: 15px 25px;
  align-items: center;
  text-align: right;
  width: 100%;
}

.order-header {
  font-weight: 600;
  font-size: 14px;
  border-radius: 12px 12px 0 0;
}

.order-row {
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  width: 100%;
}

.order-row:hover {
  background-color: #f8f9fc;
}

.order-row:last-child { 
  border-bottom: none;
  border-radius: 0 0 12px 12px;
}

.order-id { 
  font-weight: bold; 
}

.order-product-cost { 
  font-weight: 500; 
  color: #6c757d;
}

.order-total { 
  font-weight: 600; 
  color: #28a745;
}

.order-shipping { 
  font-weight: 500; 
  color: #6c757d;
  font-size: 0.9rem;
}

.order-status {
    position: relative;
    z-index: 100;
}

.dropdown {
    position: relative;
}

/* Status Button Styling */
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
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 2000;
    display: none;
    min-width: 150px;
    padding: 0.5rem 0;
    margin: 0.125rem 0 0;
    font-size: 0.875rem;
    color: #212529;
    text-align: right;
    list-style: none;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid rgba(0,0,0,.15);
    border-radius: 0.375rem;
    box-shadow: 0 0.5rem 1rem rgba(0,0,0,.175);
    max-height: 300px;
    overflow-y: auto;
}

.dropdown-menu.show {
    display: block;
    z-index: 2000;
}

.order-row:has(.dropdown-menu.show) {
  z-index: 200;
}

@media (max-width: 768px) {
  .dropdown-menu {
    position: absolute !important;
    z-index: 9999;
    min-width: 160px;
  }
}

.dropdown-item {
    display: block;
    width: 100%;
    padding: 0.375rem 1rem;
    clear: both;
    font-weight: 400;
    color: #212529;
    text-align: inherit;
    text-decoration: none;
    white-space: nowrap;
    background-color: transparent;
    border: 0;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;
    position: relative;
}

.dropdown-item:hover,
.dropdown-item:focus {
    color: #1e2125;
    background-color: #e9ecef;
}

/* Current Status Styling */
.dropdown-item.current-status {
    background-color: #f8f9fa !important;
    color: #6c757d !important;
    cursor: not-allowed;
    opacity: 0.7;
    position: relative;
}

.dropdown-item.current-status:hover {
    background-color: #f8f9fa !important;
    color: #6c757d !important;
}

.dropdown-item.disabled {
    pointer-events: none;
}

.current-status-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #28a745;
    font-size: 12px;
}

.dropdown-item-completed {
    color: #22c55e !important;
    font-weight: 600;
}

.dropdown-item-completed:hover {
    background-color: #e8f5e9 !important;
    color: #16a34a !important;
}

.dropdown-item-cancelled {
    color: #ef4444 !important;
    font-weight: 600;
}

.dropdown-item-cancelled:hover {
    background-color: #ffebee !important;
    color: #dc2626 !important;
}

.dropdown-item-pending {
    color: #f59e0b !important;
    font-weight: 600;
}

.dropdown-item-pending:hover {
    background-color: #fff8e1 !important;
    color: #d97706 !important;
}

.dropdown-item-processing {
    color: #06b6d4 !important;
    font-weight: 600;
}

.dropdown-item-processing:hover {
    background-color: #e0f7fa !important;
    color: #0891b2 !important;
}

.dropdown-item-shipped {
    color: #a855f7 !important;
    font-weight: 600;
}

.dropdown-item-shipped:hover {
    background-color: #f3e5f5 !important;
    color: #9333ea !important;
}

/* Responsive design for smaller screens */
@media (max-width: 992px) {
  .order-header, .order-row {
    grid-template-columns: 0.8fr 1.5fr 1fr 1fr 1fr 1.5fr;
    gap: 15px;
    padding: 12px 20px;
    font-size: 13px;
  }
  
  .status-btn {
    min-width: 120px;
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .orders-container {
    overflow: visible;
    border-radius: 0 0 12px 12px;
    width: 100%;
    display: block;
  }
  
  .order-header, .order-row {
    min-width: 850px;
    width: 850px;
    grid-template-columns: 100px 180px 130px 130px 130px 180px;
    gap: 10px;
    padding: 12px 15px;
    font-size: 13px;
  }
  
  .order-header {
    position: sticky;
    left: 0;
    z-index: 10;
    background: #343a40 !important;
    border-radius: 0;
  }
  
  .order-row {
    background: white;
  }
  
  .order-row:last-child {
    border-radius: 0;
  }
  
  .status-btn {
    min-width: 140px;
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .order-status {
    position: relative;
    z-index: 100;
  }
  
  .dropdown {
    position: relative;
  }
  
  .dropdown-menu {
    position: absolute;
    z-index: 1000;
    min-width: 160px;
  }
}

@media (max-width: 500px) {
  .order-header {
    border-radius: 12px;
  }
  .order-header, .order-row {
    min-width: 800px;
    width: 800px;
    grid-template-columns: 90px 160px 120px 120px 120px 170px;
    gap: 8px;
    padding: 10px 12px;
    font-size: 12px;
  }
  
  .order-id {
    font-size: 12px;
  }
  
  .order-customer,
  .order-product-cost,
  .order-shipping,
  .order-total {
    font-size: 12px;
  }
  
  .status-btn {
    min-width: 130px;
    padding: 5px 8px;
    font-size: 11px;
  }
  
  .order-status {
    position: relative;
    z-index: 100;
  }
  
  .dropdown {
    position: relative;
  }
  
  .dropdown-menu {
    min-width: 150px;
    font-size: 11px;
    position: absolute;
    z-index: 1000;
  }
  
  .dropdown-item {
    padding: 0.3rem 0.8rem;
    font-size: 11px;
  }
}
</style>
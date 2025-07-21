<template>
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.6); z-index: 1060;" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content order-details-modal">
        <!-- Modal Header -->
        <div class="modal-header">
          <div>
            <h5 class="modal-title">تفاصيل الطلب <span class="text-primary">#{{ order.id }}</span></h5>
            <small class="text-muted">{{ formatDate(order.orderDate) }}</small>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="modal-body p-4">
          <!-- Customer Info Section -->
          <div class="customer-info-section mb-4">
            <h6 class="section-title">معلومات العميل</h6>
            <div class="info-grid">
              <div class="info-item">
                <i class="fas fa-user"></i>
                <span>{{ customer?.full_name || 'غير متوفر' }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-phone"></i>
                <span>{{ customer?.phone_number || 'غير متوفر' }}</span>
              </div>
            </div>
          </div>

          <!-- Order Items List -->
          <div class="items-list">
            <div class="item-header">
              <div class="item-product">المنتج</div>
              <div class="item-qty">الكمية</div>
              <div class="item-purchase-price">سعر الشراء</div>
              <div class="item-price">سعر البيع</div>
              <div class="item-total">المجموع</div>
            </div>
            <div v-for="item in order.items" :key="item.productId" class="item-row">
              <div class="item-product">
                <img :src="getProduct(item.productId)?.images[0]" class="item-image" alt="Product Image"
                  @error="onImageError">
                <span>{{ getProduct(item.productId)?.name || 'منتج غير معروف' }}</span>
              </div>
              <div class="item-qty">{{ item.quantity }}x</div>
              <div class="item-purchase-price">{{ item.purchasePrice }} دينار</div>
              <div class="item-price">{{ item.price }} دينار</div>
              <div class="item-total">{{ item.quantity * item.price }} دينار</div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="order-summary">
            <div class="summary-item">
              <span>الحالة</span>
              <span class="status-badge" :class="getStatusBadgeClass(order.status)">{{ order.status }}</span>
            </div>
            <div class="summary-item total">
              <span>المجموع الكلي</span>
              <span>{{ order.totalAmount }} دينار</span>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn-close-custom" @click="$emit('close')">
            <i class="fas fa-times me-2"></i> إغلاق
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCustomerStore } from '@/stores/customerStore';

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

defineEmits(['close']);

const productStore = useProductStore();
const customerStore = useCustomerStore();

const customer = computed(() => {
  return customerStore.getCustomerById(props.order.customerId);
});

const getProduct = (productId) => {
  return productStore.getProductById(productId);
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('ar-EG', options);
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

const onImageError = (event) => {
  event.target.src = 'https://placehold.co/60x60/CCCCCC/FFFFFF?text=N/A';
};
</script>

<style scoped>
.order-details-modal {
  animation: slideUp 0.3s ease-out;
  border-radius: 12px;
  border: none;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

/* Customer Info Section */
.section-title {
  font-weight: 600;
  color: #495057;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.customer-info-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 1rem;
  border-radius: 8px;
}

.info-grid {
  display: flex;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: #212529;
}

.info-item i {
  color: #0d6efd;
}

.items-list {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.item-header,
.item-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  align-items: center;
  text-align: right;
}

.item-header {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.item-row {
  border-top: 1px solid #e9ecef;
}

.item-product {
  display: flex;
  align-items: center;
  gap: 15px;
  font-weight: 500;
}

.item-image {
  width: 45px;
  height: 45px;
  border-radius: 6px;
  object-fit: cover;
}

.item-total {
  font-weight: bold;
}

.order-summary {
  border-top: 2px solid #dee2e6;
  padding-top: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 1.1rem;
}

.summary-item.total {
  font-weight: bold;
  font-size: 1.3rem;
  color: #0d6efd;
  margin-top: 0.5rem;
}

/* Status Badge Styling */
.status-badge {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: bold;
  border: none;
  font-size: 0.9rem;
  display: inline-block;
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

/* Footer and Close Button */
.modal-footer {
  background-color: #f8f9fa;
  padding: 1rem;
  text-align: left;
  border-top: 2px solid #dee2e6;
}

.btn-close-custom {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
}

.btn-close-custom:hover {
  background-color: #5a6268;
}
</style>
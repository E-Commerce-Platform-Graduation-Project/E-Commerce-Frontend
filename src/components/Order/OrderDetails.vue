<template>
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.6); z-index: 1060;" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content order-details-modal">
        <div class="modal-header">
          <div>
            <h5 class="modal-title">تفاصيل الطلب <span class="text-primary">#{{ order.id }}</span></h5>
            <small class="text-muted">{{ formatDate(order.orderDate) }}</small>
          </div>
        </div>

        <div class="modal-body p-4">
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

          <div class="items-list">
            <div class="item-header">
              <div class="item-product">المنتج</div>
              <div class="item-variant">اللون</div>
              <div class="item-variant">المقاس</div>
              <div class="item-qty">الكمية</div>
              <div class="item-price">سعر الوحدة</div>
              <div class="item-total">المجموع</div>
            </div>
            <div v-for="item in order.items" :key="`${item.productId}-${item.color}-${item.size}`" class="item-row">
              <div class="item-product">
                <img :src="getVariantImage(item.productId, item.color)" class="item-image" alt="Product Image"
                  @error="onImageError">
                <div class="product-name-wrapper">
                  <span>{{ getProduct(item.productId)?.name || 'منتج غير معروف' }}</span>
                </div>
              </div>
              <div class="item-variant">{{ item.color || 'N/A' }}</div>
              <div class="item-variant">{{ item.size || 'N/A' }}</div>
              <div class="item-qty">{{ item.quantity }}x</div>
              <div class="item-price">{{ item.price }} دينار</div>
              <div class="item-total">{{ (item.quantity * item.price).toFixed(2) }} دينار</div>
            </div>
          </div>

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

// NEW: Helper function to get the correct image based on the product's color variant
const getVariantImage = (productId, colorName) => {
  const product = productStore.getProductById(productId);
  // Assuming 'colorName' might be missing in older order data
  if (!product || !product.variants || !colorName) {
    // Fallback to the first image of the first variant if color is not specified
    return product?.variants?.[0]?.images?.[0] || 'https://placehold.co/60x60/eee/ccc?text=?';
  }

  const variant = product.variants.find(v => v.colorName === colorName);
  if (variant && variant.images && variant.images.length > 0) {
    return variant.images[0]; // Return the first image of the correct color
  }

  // Fallback if the specific color variant has no image
  return product.variants[0]?.images?.[0] || 'https://placehold.co/60x60/eee/ccc?text=?';
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
/* Main modal styles are retained */
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

.modal-header,
.modal-footer {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

/* Customer Info Section styles are retained */
.customer-info-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 1rem;
  border-radius: 8px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 1rem;
}

.info-grid {
  display: flex;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item i {
  color: #0d6efd;
}

/* MODIFIED: Item list styles for new layout */
.items-list {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  margin: 1.5rem 0;
}

.item-header,
.item-row {
  display: grid;
  /* Updated grid for 6 columns: Product, Color, Size, Qty, Price, Total */
  grid-template-columns: 2.5fr 1fr 1fr 0.5fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  align-items: center;
  text-align: right;
}

.item-header {
  background-color: #f8f9fa;
  font-weight: 600;
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

.item-variant {
  font-weight: 500;
  color: #495057;
}

.item-qty {
  text-align: center;
}

.item-total {
  font-weight: bold;
}

/* Order Summary and Badge styles are retained */
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

.status-badge {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: bold;
  font-size: 0.9rem;
}

.status-pending {
  background-color: #fff8e1;
  color: #f59e0b;
}

.status-completed {
  background-color: #e8f5e9;
  color: #22c55e;
}

.status-cancelled {
  background-color: #ffebee;
  color: #ef4444;
}

.btn-close-custom {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
}
</style>
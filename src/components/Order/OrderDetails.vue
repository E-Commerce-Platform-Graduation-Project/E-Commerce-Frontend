<template>
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.6); z-index: 1060;" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content order-details-modal">
        <div class="modal-header bg-dark text-white">
          <div>
            <h5 class="modal-title">تفاصيل الطلب <span >#{{ order.id }}</span></h5>
            <small>{{ formatDate(order.orderDate) }}</small>
          </div>
        </div>

        <div class="modal-body p-4">
          <div class="customer-info-section mb-4">
            <h6 class="section-title">معلومات العميل</h6>
            <div class="info-grid">
              <div class="info-item">
                <i class="fas fa-user"></i>
                <span>{{ order.customerName || 'غير متوفر' }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-phone"></i>
                <span>{{ order.customerPhone || 'غير متوفر' }}</span>
              </div>
              <div class="info-item full-width">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ order.address || 'غير متوفر' }}</span>
              </div>
            </div>
          </div>

          <!-- Payment and Delivery Info Section -->
          <div class="payment-delivery-section mb-4">
            <h6 class="section-title">معلومات الدفع والتوصيل</h6>
            <div class="info-grid">
              <div class="info-item">
                <i class="fas fa-credit-card"></i>
                <span>{{ getPaymentMethodText(order.paymentMethod) }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-truck"></i>
                <span>تكلفة التوصيل: {{ order.shippingCost }} دينار</span>
              </div>
            </div>
          </div>

          <div class="items-list">
            <div class="item-header">
              <div class="item-product">المنتج</div>
              <div class="item-properties">الخواص</div>
              <div class="item-qty">الكمية</div>
              <div class="item-price">سعر الوحدة</div>
              <div class="item-total">المجموع</div>
            </div>
            <div v-for="item in order.items" :key="`${item.productId}-${item.colorHex}-${item.size}`" class="item-row">
              <div class="item-product">
                <img :src="getItemImage(item)" class="item-image" alt="Product Image" @error="onImageError">
                <div class="product-name-wrapper">
                  <span>{{ item.productName || 'منتج غير معروف' }}</span>
                </div>
              </div>
              <div class="item-properties">
                  <span class="property-tag">
                      اللون:
                      <span class="color-swatch" :style="{ backgroundColor: item.colorHex }"></span>
                      <span class="prop-value">{{ item.colorHex }}</span>
                  </span>
                  <span class="property-tag">
                      المقاس:
                      <span class="prop-value">{{ item.size }}</span>
                  </span>
              </div>
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
            <div class="summary-item">
              <span>مجموع المنتجات</span>
              <span>{{ order.totalPrice }} دينار</span>
            </div>
            <div class="summary-item">
              <span>تكلفة التوصيل</span>
              <span>{{ order.shippingCost }} دينار</span>
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
const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

defineEmits(['close']);

/**
 * Get the image for an order item
 * Priority: variant images > product main image > placeholder
 */
const getItemImage = (item) => {
  // First, try to use variant images from the API
  if (item.images && item.images.length > 0) {
    return item.images[0];
  }
  
  // Then try the product main image
  if (item.productMainImage) {
    return item.productMainImage;
  }
  
  // Fallback to placeholder
  return 'https://placehold.co/60x60/eee/ccc?text=?';
};

/**
 * Convert payment method from English to Arabic
 */
const getPaymentMethodText = (paymentMethod) => {
    const paymentMethods = {
        'Cash on Delivery': 'الدفع عند الاستلام',
        'cash': 'الدفع عند الاستلام',
        'Credit Card': 'بطاقة ائتمان',
        'card': 'بطاقة ائتمان',
        'Bank Transfer': 'تحويل بنكي',
        'bank_transfer': 'تحويل بنكي',
        'Mobile Payment': 'الدفع عبر الجوال',
        'wallet': 'محفظة إلكترونية',
    };
    return paymentMethods[paymentMethod] || paymentMethod || 'غير محدد';
};

const formatDate = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleString('ar-EG-u-nu-latn', options);
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
/* Main modal styles */
.order-details-modal {
  animation: slideUp 0.3s ease-out;
  border-radius: 12px;
  border: none;
  overflow: hidden;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header{

  border-color: #dee2e6;
}
.modal-footer {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

/* Customer Info Section */
.customer-info-section,
.payment-delivery-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 1rem;
  border-radius: 8px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 1rem;
  color: #495057;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.info-item.full-width {
  flex-basis: 100%;
}

.info-item i {
  color: #0f0f0f;
  width: 16px;
  text-align: center;
}

/* Item list styles */
.items-list {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  margin: 1.5rem 0;
}

.item-header,
.item-row {
  display: grid;
  grid-template-columns: 2.5fr 2fr 0.5fr 1fr 1fr;
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

.item-qty {
  text-align: center;
}

.item-total {
  font-weight: bold;
}

/* Properties column */
.item-properties {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.property-tag {
  background-color: #eef2ff;
  border: 1px solid #e0e7ff;
  color: #0f0f0f;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.color-swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #c7d2fe;
  display: inline-block;
}

.prop-value {
    font-weight: 600;
}

/* Order Summary and Badge styles */
.order-summary {
  border-top: 2px solid #dee2e6;
  padding-top: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 1rem;
}

.summary-item.total {
  font-weight: bold;
  font-size: 1.2rem;
  color: #22c55e;
  margin-top: 0.5rem;
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
}

.status-badge {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: bold;
  font-size: 0.9rem;
}

.status-pending { background-color: #fff8e1; color: #f59e0b; }
.status-processing { background-color: #e0f2fe; color: #0ea5e9; }
.status-shipped { background-color: #f3e8ff; color: #9333ea; }
.status-completed { background-color: #e8f5e9; color: #22c55e; }
.status-cancelled { background-color: #ffebee; color: #ef4444; }

.btn-close-custom {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
}

.btn-close-custom:hover {
  transition: background-color 0.2s ease;
  background-color: #0f0f0f;
}
</style>
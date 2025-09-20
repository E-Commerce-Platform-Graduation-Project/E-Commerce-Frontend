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
                <span>{{ order.customerPhone || customer?.phone_number || 'غير متوفر' }}</span>
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
                <img :src="getVariantImage(item)" class="item-image" alt="Product Image" @error="onImageError">
                <div class="product-name-wrapper">
                  <span>{{ getProduct(item)?.name || 'منتج غير معروف' }}</span>
                </div>
              </div>
              <div class="item-properties">
                  <template v-for="prop in getFormattedProperties(item)" :key="prop.key">
                      <span class="property-tag">
                          {{ prop.key }}:
                          <template v-if="prop.isColor">
                              <span class="color-swatch" :style="{ backgroundColor: prop.value }"></span>
                              <span class="prop-value">{{ prop.value }}</span>
                          </template>
                          <template v-else>
                              <span class="prop-value">{{ prop.value }}</span>
                          </template>
                      </span>
                  </template>
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
              <span>{{ order.totalPrice || calculateSubtotal() }} دينار</span>
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

/**
 * NEW: Finds a product by searching for its variant's properties (color/size).
 * This is more robust than relying on a potentially incorrect productId.
 * @param {object} item - The order item containing colorHex and size.
 * @returns {object|null} The parent product object or null if not found.
 */
const findProductByVariantProps = (item) => {
  if (!item) return null;
  for (const product of productStore.getAllProducts) {
    if (product.variants) {
      const variantMatch = product.variants.some(variant => {
        const colorMatch = variant.colorHex === item.colorHex;
        // If the variant has a stock array, check for size match too
        const sizeMatch = variant.stock ? variant.stock.some(stockItem => stockItem.size === item.size) : true;
        return colorMatch && sizeMatch;
      });
      if (variantMatch) {
        return product; // Return the parent product
      }
    }
  }
  return null;
};

/**
 * MODIFIED: This function now takes the whole item and uses the robust lookup.
 * @param {object} item - The order item.
 * @returns {object|null} The parent product object.
 */
const getProduct = (item) => {
  if (!item) return null;
  // First, try the direct lookup in case the ID is correct
  const directHit = productStore.getProductById(item.productId);
  if (directHit) return directHit;

  // If direct lookup fails, use the more reliable search method
  return findProductByVariantProps(item);
};

const getVariantImage = (item) => {
  // Pass the whole item object to getProduct
  const product = getProduct(item);
  if (!product) return 'https://placehold.co/60x60/eee/ccc?text=?';

  // Find the variant by colorHex, which is now part of the order item
  const variant = product.variants.find(v => v.colorHex === item.colorHex);
  if (variant && variant.images && variant.images.length > 0) {
    return variant.images[0];
  }

  // Fallback to the product's main image if no specific variant image is found
  return product.mainImage || 'https://placehold.co/60x60/eee/ccc?text=?';
};

/**
 * Gathers and formats all relevant properties for an order item for display.
 * @param {object} item - The order item.
 * @returns {Array<object>} An array of property objects to be displayed.
 */
const getFormattedProperties = (item) => {
    // Pass the whole item object to getProduct
    const product = getProduct(item);
    const props = [];

    // Add color from the specific order item
    if (item.colorHex) {
        props.push({ key: 'اللون', value: item.colorHex, isColor: true });
    }
    // Add size from the specific order item
    if (item.size) {
        props.push({ key: 'المقاس', value: item.size });
    }
    // Add other properties from the main product definition (e.g., الخامة)
    if (product && product.properties) {
        Object.keys(product.properties).forEach(key => {
            if (key !== 'المقاس' && product.properties[key].legacy) {
                props.push({ key: key, value: product.properties[key].legacy.join(', ') });
            }
        });
    }
    return props;
};

/**
 * Convert payment method from English to Arabic
 * @param {string} paymentMethod - The payment method in English
 * @returns {string} The payment method in Arabic
 */
const getPaymentMethodText = (paymentMethod) => {
    const paymentMethods = {
        'Cash on Delivery': 'الدفع عند الاستلام',
        'Credit Card': 'بطاقة ائتمان',
        'Bank Transfer': 'تحويل بنكي',
        'Mobile Payment': 'الدفع عبر الجوال',
    };
    return paymentMethods[paymentMethod] || paymentMethod || 'غير محدد';
};

/**
 * Calculate subtotal if totalPrice is not available
 * @returns {number} The calculated subtotal
 */
const calculateSubtotal = () => {
    return props.order.items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
    }, 0).toFixed(2);
};

const formatDate = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',   // Added hour
    minute: '2-digit', // Added minute
  };
  // Use toLocaleString to include time
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

.modal-header,
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
  color: #0d6efd;
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

/* New styles for properties column */
.item-properties {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.property-tag {
  background-color: #eef2ff; /* Light indigo background */
  border: 1px solid #e0e7ff;
  color: #4338ca; /* Indigo text */
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
  color: #0d6efd;
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
  background-color: #5a6268;
}
</style>
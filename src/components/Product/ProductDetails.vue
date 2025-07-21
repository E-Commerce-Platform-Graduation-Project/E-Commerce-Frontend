<template>
  <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content product-details-modal">
        <!-- Modal Header -->
        <div class="modal-header bg-success text-white">
          <h4 class="modal-title mb-0">{{ product.name }}</h4>
        </div>

        <!-- Modal Body -->
        <div class="modal-body p-4">
          <!-- Image Carousel -->
          <div class="mb-4">
              <div v-if="product.images && product.images.length > 1" id="productImageCarousel" class="carousel slide" data-bs-ride="carousel">
                  <div class="carousel-inner rounded">
                      <div v-for="(image, index) in product.images" :key="index" class="carousel-item" :class="{ active: index === 0 }">
                          <img :src="image" class="d-block w-100 product-image" alt="Product image">
                      </div>
                  </div>
                  <button class="carousel-control-prev" type="button" data-bs-target="#productImageCarousel" data-bs-slide="prev">
                      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                  </button>
                  <button class="carousel-control-next" type="button" data-bs-target="#productImageCarousel" data-bs-slide="next">
                      <span class="carousel-control-next-icon" aria-hidden="true"></span>
                  </button>
              </div>
              <div v-else-if="product.images && product.images.length === 1">
                  <img :src="product.images[0]" class="d-block w-100 rounded product-image" alt="Product image">
              </div>
          </div>

          <!-- Product Info Section -->
          <h5 class="mb-3 text-success"><i class="fas fa-info-circle me-2"></i>تفاصيل المنتج</h5>
          <div class="row">
              <div class="col-md-6 mb-3">
                  <label class="fw-semibold text-muted">اسم المنتج</label>
                  <p class="fs-5">{{ product.name }}</p>
              </div>
              <div class="col-md-6 mb-3">
                  <label class="fw-semibold text-muted">الفئة</label>
                  <p class="fs-5">{{ getCategoryHierarchyDisplay(product.categoryId) }}</p>
              </div>
          </div>
          <div class="mb-3">
              <label class="fw-semibold text-muted">الوصف</label>
              <p>{{ product.description || 'لا يوجد وصف متاح.' }}</p>
          </div>
          
          <!-- Updated Price & Financial Info Section -->
          <div class="row border-top pt-3">
              <div class="col-sm-3 mb-3">
                  <label class="fw-semibold text-muted">سعر الشراء</label>
                  <p class="fs-5 fw-bold text-primary">
                    {{ product.purchasePrice > 0 ? product.purchasePrice + ' دينار' : 'غير محدد' }}
                  </p>
              </div>
              <div class="col-sm-3 mb-3">
                  <label class="fw-semibold text-muted">سعر البيع</label>
                  <p class="fs-5 fw-bold text-success">
                    {{ product.sellingPrice > 0 ? product.sellingPrice + ' دينار' : 'غير محدد' }}
                  </p>
              </div>
              <div class="col-sm-3 mb-3">
                  <label class="fw-semibold text-muted">هامش الربح</label>
                  <p class="fs-5 fw-bold text-warning">
                    {{ product.profitMargin ? product.profitMargin + '%' : 'غير محدد' }}
                  </p>
              </div>
              <div class="col-sm-3 mb-3">
                  <label class="fw-semibold text-muted">الربح المتوقع</label>
                  <p class="fs-5 fw-bold text-info">
                    {{ calculatedProfit > 0 ? calculatedProfit + ' دينار' : 'غير محدد' }}
                  </p>
              </div>
          </div>

          <!-- Stock & Status Section -->
          <div class="row border-top pt-3">
              <div class="col-sm-6 mb-3">
                  <label class="fw-semibold text-muted">الكمية المتاحة</label>
                  <p class="fs-5">{{ product.quantity }}</p>
              </div>
              <div class="col-sm-6 mb-3">
                  <label class="fw-semibold text-muted">الحالة</label>
                  <p>
                      <span class="badge fs-6" :class="product.is_active ? 'bg-success' : 'bg-danger'">
                          {{ product.is_active ? 'ظاهر' : 'مخفي' }}
                      </span>
                  </p>
              </div>
          </div>

          <!-- Purchase History Section -->
          <div class="border-top pt-4 mt-2">
              <h5 class="mb-3 text-success"><i class="fas fa-receipt me-2"></i>سجل فواتير الشراء</h5>
              <div v-if="purchaseHistory.length > 0" class="invoice-list">
                  <div class="invoice-item header">
                      <div class="invoice-date">التاريخ</div>
                      <div class="invoice-qty">الكمية المضافة</div>
                      <div class="invoice-price">سعر الشراء</div>
                      <div class="invoice-price">سعر البيع</div>
                  </div>
                  <div v-for="invoice in purchaseHistoryItems" :key="`${invoice.id}-${invoice.productId}`" class="invoice-item">
                      <div class="invoice-date">{{ formatDate(invoice.date) }}</div>
                      <div class="invoice-qty">+{{ invoice.quantityAdded }}</div>
                      <div class="invoice-price purchase">{{ invoice.purchasePrice }} دينار</div>
                      <div class="invoice-price selling">{{ invoice.sellingPrice }} دينار</div>
                  </div>
              </div>
              <div v-else class="text-center text-muted p-3 bg-light rounded">
                  <p class="mb-0">لا يوجد سجل فواتير شراء لهذا المنتج.</p>
              </div>
          </div>
          
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer bg-light">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            إغلاق<i class="fas fa-times me-2"></i>
          </button>
          <button type="button" class="btn btn-warning" @click="$emit('edit-product', product)">
            تعديل المنتج<i class="fas fa-edit me-2"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';
import { useProductStore } from '@/stores/productStore';

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

defineEmits(['close', 'edit-product']);

const categoryStore = useCategoryStore();
const productStore = useProductStore();

const purchaseHistory = computed(() => {
    return productStore.getInvoicesByProductId(props.product.id);
});

// Extract individual purchase history items for this product
const purchaseHistoryItems = computed(() => {
    const items = [];
    purchaseHistory.value.forEach(invoice => {
        const productItem = invoice.items.find(item => item.productId === props.product.id);
        if (productItem) {
            items.push({
                id: invoice.id,
                date: invoice.date,
                productId: productItem.productId,
                quantityAdded: productItem.quantityAdded,
                purchasePrice: productItem.purchasePrice,
                // Calculate selling price based on purchase price and current profit margin
                sellingPrice: props.product.profitMargin ? 
                    (productItem.purchasePrice * (1 + props.product.profitMargin / 100)).toFixed(2) : 
                    productItem.purchasePrice
            });
        }
    });
    return items;
});

// Calculate expected profit per unit
const calculatedProfit = computed(() => {
    if (props.product.sellingPrice > 0 && props.product.purchasePrice > 0) {
        return (props.product.sellingPrice - props.product.purchasePrice).toFixed(2);
    }
    return 0;
});

const getCategoryHierarchyDisplay = (categoryId) => {
    // Find the product's direct category using loose equality to handle number/string differences
    const category = categoryStore.getAllCategories.find(cat => cat.id == categoryId);

    // If no category is found, return a default text
    if (!category) {
        return 'فئة غير معروفة';
    }

    // Check if it's a sub-category by looking for a parent ID
    if (category.parentCategoryID) {
        // Find the parent category
        const parentCategory = categoryStore.getAllCategories.find(cat => cat.id == category.parentCategoryID);
        
        // If the parent is found, construct the display string: Parent -> Child
        if (parentCategory) {
            return `${parentCategory.name} -> ${category.name}`;
        }
    }

    // If it's a main category or the parent wasn't found, return its name
    return category.name;
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
};
</script>

<style scoped>
.product-details-modal {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.product-image {
    height: 400px;
    object-fit: cover;
}

label.fw-semibold { font-size: 0.9rem; }
p { font-size: 1.05rem; }

/* Invoice List Styling */
.invoice-list {
    border: 1px solid #dee2e6;
    border-radius: 8px;
    overflow: hidden;
}
.invoice-item {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e9ecef;
    text-align: right;
}
.invoice-item:last-child {
    border-bottom: none;
}
.invoice-item.header {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
    font-size: 0.9rem;
}
.invoice-qty {
    font-weight: bold;
    color: #198754;
}
.invoice-price.purchase {
    color: #6c757d;
}
.invoice-price.selling {
    font-weight: 500;
    color: #212529;
}

/* Additional styling for financial info */
.text-primary { color: #0d6efd !important; }
.text-warning { color: #ffc107 !important; }
.text-info { color: #0dcaf0 !important; }
</style>
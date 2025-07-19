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
                      <span class="visually-hidden">Previous</span>
                  </button>
                  <button class="carousel-control-next" type="button" data-bs-target="#productImageCarousel" data-bs-slide="next">
                      <span class="carousel-control-next-icon" aria-hidden="true"></span>
                      <span class="visually-hidden">Next</span>
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
                  <div class="category-display">
                      <!-- Display full category path -->
                      <p class="fs-5 mb-1">{{ getCategoryHierarchyDisplay(product.categoryId) }}</p>
                      
                      <!-- Display category badges for better visual representation
                      <div class="category-badges" v-if="getCategoryPath(product.categoryId).length > 0">
                          <span 
                              v-for="(category, index) in getCategoryPath(product.categoryId)" 
                              :key="category.id"
                              class="badge me-1 mb-1"
                              :class="index === 0 ? 'bg-primary' : 'bg-secondary'"
                          >
                              {{ category.name }}
                          </span>
                          <i v-if="getCategoryPath(product.categoryId).length > 1" 
                             class="fas fa-arrow-left text-muted ms-1" 
                             style="font-size: 0.8rem;"></i>
                      </div> -->
                  </div>
              </div>
          </div>

          <div class="mb-3">
              <label class="fw-semibold text-muted">الوصف</label>
              <p>{{ product.description || 'لا يوجد وصف متاح.' }}</p>
          </div>

          <div class="row border-top pt-3">
              <div class="col-sm-4 mb-3">
                  <label class="fw-semibold text-muted">سعر البيع</label>
                  <p class="fs-5 fw-bold text-success">{{ product.sellingPrice }} دينار</p>
              </div>
              <div class="col-sm-4 mb-3">
                  <label class="fw-semibold text-muted">الكمية المتاحة</label>
                  <p class="fs-5">{{ product.quantity }}</p>
              </div>
              <div class="col-sm-4 mb-3">
                  <label class="fw-semibold text-muted">الحالة</label>
                  <p>
                      <span class="badge fs-6" :class="product.is_active ? 'bg-success' : 'bg-danger'">
                          {{ product.is_active ? 'ظاهر' : 'مخفي' }}
                      </span>
                  </p>
              </div>
          </div>
          
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer bg-light">
          <button type="button" class="btn btn-secondary me-2" @click="$emit('close')">
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

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

defineEmits(['close', 'edit-product']);

const categoryStore = useCategoryStore();

// Original function (kept for backward compatibility)
const getCategoryName = (categoryId) => {
    const category = categoryStore.getAllCategories.find(cat => cat.id == categoryId);
    return category ? category.name : 'فئة غير معروفة';
};

// Enhanced function to get category path
const getCategoryPath = (categoryId) => {
    return categoryStore.getCategoryPath(categoryId);
};

// Function to display the full category hierarchy as text
const getCategoryHierarchyDisplay = (categoryId) => {
    const path = getCategoryPath(categoryId);
    
    if (path.length === 0) {
        return 'فئة غير معروفة';
    }
    
    if (path.length === 1) {
        return path[0].name;
    }
    
    // For Arabic text, we want to display: Parent → Child
    return path.map(cat => cat.name).join(' ← ');
};
</script>

<style scoped>
.product-details-modal {
  animation: slideUp 0.3s ease-out;
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

.product-image {
    height: 400px;
    object-fit: cover;
}

.modal-header {
    /* background: linear-gradient(135deg, #dddbd3, #b17213); */
}

label.fw-semibold {
    font-size: 0.9rem;
}

p {
    font-size: 1.05rem;
}

.modal-footer {
    justify-content: flex-end !important;
}

.category-display {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.category-badges {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.category-badges .badge {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
}

.category-badges .bg-primary {
    background-color: #0d6efd !important;
}

.category-badges .bg-secondary {
    background-color: #6c757d !important;
}
</style>
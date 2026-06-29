<template>
    <div class="container-fluid p-4">
        <div class="row mb-4">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <button 
                        @click="goBackToProductDetails" 
                        class="btn btn-outline-secondary"
                    >
                        <i class="fas fa-arrow-right me-2"></i>رجوع
                    </button>
                </div>
                
                <div class="product-header-card p-4 bg-light rounded shadow-sm">
                    <div class="d-flex align-items-center">
                        <div class="product-image-container me-4">
                            <img 
                                v-if="product?.mainImage" 
                                :src="product.mainImage" 
                                :alt="product.name"
                                class="product-header-image"
                            >
                            <div 
                                v-else 
                                class="product-header-image-placeholder d-flex align-items-center justify-content-center"
                            >
                                <i class="fas fa-image text-muted fs-2"></i>
                            </div>
                        </div>
                        
                        <div class="flex-grow-1">
                            <h2 class="mb-2 text-dark">
                                <i class="fas fa-star me-2 text-warning"></i>تقييمات المنتج
                            </h2>
                            <h4 class="mb-2 text-dark" v-if="product">{{ product.name }}</h4>
                            <div v-if="ratingsCount > 0" class="d-flex align-items-center">
                                <div class="rating-stars me-2">
                                    <i v-for="star in 5" :key="star" 
                                       class="fas fa-star" 
                                       :class="star <= globalAverageRating ? 'text-warning' : 'text-muted'">
                                    </i>
                                </div>
                                <span class="fw-bold text-warning me-2">{{ globalAverageRating.toFixed(1) }}</span>
                                <span class="text-muted">({{ ratingsCount }} تقييم)</span>
                            </div>
                            <p v-else class="text-muted mb-0">لا توجد تقييمات بعد</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-3" v-if="!isLoading && ratingsCount > 0">
          <div class="col-12">
            <div class="pagination-info">
              <span class="info-text">
                عرض {{ startIndex + 1 }} - {{ endIndex }} من {{ ratingsCount }} تقييم
              </span>
            </div>
          </div>
        </div>
        <div v-if="isLoading" class="text-center p-5">
            <div class="spinner-border text-success spinner-border-lg" role="status">
                <span class="visually-hidden">جاري التحميل...</span>
            </div>
            <p class="text-muted mt-3">جاري تحميل التقييمات...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ error }}
        </div>

        <div v-else>
            <div v-if="ratingsCount > 0" class="row mb-4">
                 <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-4">
                            <div class="row align-items-center">
                                <div class="col-md-6">
                                    <h5 class="card-title mb-3">
                                        <i class="fas fa-chart-bar me-2 text-dark"></i>
                                        ملخص التقييمات
                                    </h5>
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="rating-stars me-3">
                                            <i v-for="star in 5" :key="star" 
                                               class="fas fa-star fs-3" 
                                               :class="star <= globalAverageRating ? 'text-warning' : 'text-muted'">
                                            </i>
                                        </div>
                                        <div>
                                            <span class="fs-2 fw-bold text-warning">{{ globalAverageRating.toFixed(1) }}</span>
                                            <div class="text-muted">من أصل 5.0</div>
                                        </div>
                                    </div>
                                    <p class="text-muted mb-0">
                                        <i class="fas fa-users me-1"></i>
                                        {{ ratingsCount }} تقييم من العملاء
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="mb-3">توزيع التقييمات</h6>
                                    <div class="rating-distribution">
                                        <div v-for="rating in [5,4,3,2,1]" :key="rating" class="d-flex align-items-center mb-2">
                                            <span class="rating-label me-2">{{ rating }}</span>
                                            <i class="fas fa-star text-warning me-2"></i>
                                            <div class="progress flex-grow-1 me-3" style="height: 12px;">
                                                <div class="progress-bar bg-warning" 
                                                     :style="{ width: getRatingPercentage(rating) + '%' }">
                                                </div>
                                            </div>
                                            <span class="text-muted small fw-bold">
                                                {{ ratingDistribution[rating] }} ({{ getRatingPercentage(rating).toFixed(0) }}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div v-if="ratingsCount > 0" class="card border-0 shadow-sm">
                        <div class="card-header bg-light border-0 d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="fas fa-comments me-2 text-dark"></i>
                                جميع التقييمات ({{ ratingsCount }})
                            </h5>
                            <div class="dropdown">
                                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                                        type="button" 
                                        data-bs-toggle="dropdown">
                                    <i class="fas fa-sort me-1"></i>ترتيب حسب
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" @click.prevent="sortBy('newest')">الأحدث أولاً</a></li>
                                    <li><a class="dropdown-item" href="#" @click.prevent="sortBy('oldest')">الأقدم أولاً</a></li>
                                    <li><a class="dropdown-item" href="#" @click.prevent="sortBy('highest')">الأعلى تقييماً</a></li>
                                    <li><a class="dropdown-item" href="#" @click.prevent="sortBy('lowest')">الأقل تقييماً</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="ratings-list">
                                <div v-for="(rating, index) in sortedRatings" 
                                     :key="rating.id" 
                                     class="rating-item p-4 border-bottom"
                                     :class="{ 'border-bottom-0': index === sortedRatings.length - 1 }">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div class="user-info">
                                            <div class="d-flex align-items-center mb-2">
                                                <div class="user-avatar mx-3">
                                                    <div class="avatar-circle">
                                                        <i class="fas fa-user"></i>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h6 class="mb-1 fw-semibold">{{ rating.user_name }}</h6>
                                                    <div class="rating-stars">
                                                        <i v-for="star in 5" :key="star" 
                                                           class="fas fa-star" 
                                                           :class="star <= rating.rating ? 'text-warning' : 'text-muted'">
                                                        </i>
                                                        <span class="ms-2 fw-bold text-warning">{{ rating.rating }}.0</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="text-end">
                                            <small class="text-muted">
                                                <i class="fas fa-calendar me-1"></i>
                                                {{ formatDate(rating.created_at) }}
                                            </small>
                                        </div>
                                    </div>
                                    <div v-if="rating.comment" class="rating-comment">
                                        <div class="comment-bubble p-3 bg-light rounded">
                                            <i class="fas fa-quote-right text-muted me-2"></i>
                                            <span class="text-secondary">{{ rating.comment }}</span>
                                        </div>
                                    </div>
                                    <div v-else class="text-muted fst-italic small">
                                        <i class="fas fa-comment-slash me-1"></i>
                                        لم يترك المستخدم تعليقاً
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center py-5">
                        <div class="empty-state">
                            <i class="fas fa-star fs-1 text-muted mb-4"></i>
                            <h4 class="text-muted mb-3">لا توجد تقييمات بعد</h4>
                            <p class="text-muted mb-4">
                                لم يقم أي عميل بتقييم هذا المنتج حتى الآن.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="!isLoading && !error && ratingsCount > 0 && totalPages > 1"
              class="pagination-container">
              <div class="pagination-wrapper">
                <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="pagination-btn prev-btn">
                  <i class="fas fa-chevron-right"></i>
                  السابق
                </button>

                <div class="page-numbers">
                  <button v-for="page in visiblePages" :key="page" @click="goToPage(page)"
                    :class="['page-number', { 'active': page === currentPage, 'disabled': typeof page !== 'number' }]"
                    :disabled="typeof page !== 'number'">
                    {{ page }}
                  </button>
                </div>

                <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
                  class="pagination-btn next-btn">
                  التالي
                  <i class="fas fa-chevron-left"></i>
                </button>
              </div>

              <div class="page-size-selector">
                <label for="pageSize">عدد التقييمات في الصفحة:</label>
                <select id="pageSize" v-model="itemsPerPage" class="page-size-select" disabled>
                  <option value="10">10</option>
                </select>
              </div>
            </div>
            </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
    id: {
        type: [String, Number],
        required: true
    }
});

const productStore = useProductStore();
const route = useRoute();
const router = useRouter();

// Reactive data
const sortOption = ref('newest');
const isLoading = ref(false);
const error = ref(null);

// --- NEW: State for pagination ---
const currentPage = ref(1);
const itemsPerPage = ref(10); // API returns 10 per page
// --- END NEW ---

// Get product ID from props or route
const productId = computed(() => {
    return props.id || route.params.id;
});

// Product data
const product = computed(() => {
    return productStore.getProductById(parseInt(productId.value));
});

// Ratings computed properties
const productRatings = computed(() => {
    return productStore.getProductRatings(productId.value);
});

const ratingsCount = computed(() => {
    return productStore.getProductRatingsCount(productId.value);
});

// Renamed for clarity - this is a global average calculated on the server.
const globalAverageRating = computed(() => {
    return productStore.getProductAverageRating(productId.value);
});

const ratingDistribution = computed(() => {
    return productStore.getProductRatingDistribution(productId.value);
});


// --- NEW: Pagination computed properties ---
const totalPages = computed(() => {
  if (ratingsCount.value === 0) return 1;
  return Math.ceil(ratingsCount.value / itemsPerPage.value);
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const endIndex = computed(() => {
  const end = startIndex.value + itemsPerPage.value;
  return Math.min(end, ratingsCount.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 1) return [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 4) pages.push('...');
    const start = Math.max(2, current - 2);
    const end = Math.min(total - 1, current + 2);
    for (let i = start; i <= end; i++) {
      if (i > 1 && !pages.includes(i)) pages.push(i);
    }
    if (current < total - 3) pages.push('...');
    if (!pages.includes(total)) pages.push(total);
  }
  return pages;
});
// --- END NEW ---


// Sorted ratings based on selected option (sorts the current page's data)
const sortedRatings = computed(() => {
    const ratings = [...productRatings.value];
    
    switch (sortOption.value) {
        case 'newest':
            return ratings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'oldest':
            return ratings.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case 'highest':
            return ratings.sort((a, b) => b.rating - a.rating);
        case 'lowest':
            return ratings.sort((a, b) => a.rating - b.rating);
        default:
            return ratings;
    }
});

// Methods
const getRatingPercentage = (starRating) => {
    if (ratingsCount.value === 0) return 0;
    // The distribution is for all ratings, so this remains correct
    return (ratingDistribution.value[starRating] / ratingsCount.value) * 100;
};

const sortBy = (option) => {
    sortOption.value = option;
};

const goBackToProductDetails = () => {
    const returnPage = route.query.returnPage;
    
    const query = { 
        openProduct: productId.value 
    };
    
    // Preserve the return page if it exists
    if (returnPage) {
        query.page = returnPage;
    }
    
    router.push({
        name: 'Products',
        query: query
    });
};

const formatDate = (dateString) => {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
};

// --- NEW: Method to change pages ---
const goToPage = async (page) => {
  if (page >= 1 && page <= totalPages.value && typeof page === 'number') {
    currentPage.value = page;
    await fetchRatingsForCurrentPage();
  }
};
// --- END NEW ---

// --- NEW: Helper function to fetch data ---
const fetchRatingsForCurrentPage = async () => {
    isLoading.value = true;
    error.value = null;
    try {
        // Fetch product details if not already loaded (e.g., direct navigation)
        if (!product.value) {
            await productStore.fetchProductDetails(productId.value);
        }
        // Fetch the specific page of ratings
        const result = await productStore.fetchProductRatings({ 
            productId: productId.value, 
            page: currentPage.value 
        });
        if (!result.success) {
            error.value = result.error;
        }
    } catch (err) {
        error.value = 'حدث خطأ أثناء تحميل البيانات';
    } finally {
        isLoading.value = false;
    }
};
// --- END NEW ---


// Lifecycle hooks
onMounted(() => {
    if (productId.value) {
        // Reset to page 1 on mount
        currentPage.value = 1;
        fetchRatingsForCurrentPage();
    }
});

watch(productId, (newProductId) => {
    if (newProductId) {
        // Reset to page 1 if product ID changes
        currentPage.value = 1;
        fetchRatingsForCurrentPage();
    }
});
</script>

<style scoped>
/* --- NEW: Styles copied from Products.vue for consistency --- */
.pagination-info {
  text-align: center;
  margin-bottom: 15px;
}
.info-text {
  color: #6c757d;
  font-size: 14px;
  background-color: #f8f9fa;
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
}
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.pagination-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.pagination-btn:hover:not(:disabled) {
  border-color: #007bff;
  color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.page-numbers {
  display: flex;
  gap: 5px;
  margin: 0 15px;
}
.page-number {
  min-width: 40px;
  height: 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.page-number:hover:not(.disabled) {
  border-color: #007bff;
  color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
}
.page-number.active {
  border-color: #007bff;
  background: #007bff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}
.page-number.disabled {
  cursor: default;
}
.page-size-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #495057;
}
.page-size-select {
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.page-size-select:focus {
  outline: none;
  border-color: #007bff;
}
/* --- END NEW STYLES --- */

/* Existing styles for ProductRatings.vue */
.product-header-card {
    border: 1px solid #dee2e6;
}
.product-image-container {
    flex-shrink: 0;
}
.product-header-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 12px;
    border: 2px solid #dee2e6;
}
.product-header-image-placeholder {
    width: 80px;
    height: 80px;
    background-color: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 12px;
}
.spinner-border-lg {
    width: 3rem;
    height: 3rem;
}
.rating-stars {
    font-size: 1rem;
}
.rating-stars i {
    margin-right: 2px;
}
.rating-distribution {
    font-size: 0.875rem;
}
.rating-label {
    min-width: 20px;
    text-align: center;
    font-weight: 600;
}
.rating-item {
    transition: background-color 0.2s ease;
}
.rating-item:hover {
    background-color: #f8f9fa;
}
.user-info h6 {
    color: #495057;
    font-size: 1rem;
}
.user-avatar .avatar-circle {
    width: 45px;
    height: 45px;
    background: white;
    border-radius: 50%;
    border: 1px solid #eeeeee;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #070707;
    font-size: 1.2rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.278);
}
.comment-bubble {
    position: relative;
    border-left: 4px solid #070707;
}

.empty-state {
    max-width: 400px;
    margin: 0 auto;
}
.card {
    border-radius: 12px;
    overflow: hidden;
}
.card-header {
    border-bottom: 1px solid #dee2e6;
}
.text-warning { 
    color: #ffc107 !important; 
}
.bg-warning { 
    background-color: #ffc107 !important; 
}

@media (max-width: 768px) {
    .pagination-container {
        flex-direction: column;
        gap: 20px;
    }
    .rating-distribution {
        margin-top: 1rem;
    }
    .user-avatar {
        display: none;
    }
}
</style>
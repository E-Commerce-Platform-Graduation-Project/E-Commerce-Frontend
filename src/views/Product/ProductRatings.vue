<template>
    <div class="container-fluid p-4">
        <!-- Header with Back Button -->
        <div class="row mb-4">
            <div class="col-12">
                <!-- Back Button in Top Left Corner -->
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <button 
                        @click="goBackToProductDetails" 
                        class="btn btn-outline-secondary"
                    >
                        <i class="fas fa-arrow-right me-2"></i>رجوع
                    </button>
                </div>
                
                <!-- Product Header with Image -->
                <div class="product-header-card p-4 bg-light rounded shadow-sm">
                    <div class="d-flex align-items-center">
                        <!-- Product Image -->
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
                        
                        <!-- Product Info -->
                        <div class="flex-grow-1">
                            <h2 class="mb-2 text-success">
                                <i class="fas fa-star me-2"></i>تقييمات المنتج
                            </h2>
                            <h4 class="mb-2 text-dark" v-if="product">{{ product.name }}</h4>
                            <div v-if="ratingsCount > 0" class="d-flex align-items-center">
                                <div class="rating-stars me-2">
                                    <i v-for="star in 5" :key="star" 
                                       class="fas fa-star" 
                                       :class="star <= averageRating ? 'text-warning' : 'text-muted'">
                                    </i>
                                </div>
                                <span class="fw-bold text-warning me-2">{{ averageRating.toFixed(1) }}</span>
                                <span class="text-muted">({{ ratingsCount }} تقييم)</span>
                            </div>
                            <p v-else class="text-muted mb-0">لا توجد تقييمات بعد</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center p-5">
            <div class="spinner-border text-success spinner-border-lg" role="status">
                <span class="visually-hidden">جاري التحميل...</span>
            </div>
            <p class="text-muted mt-3">جاري تحميل التقييمات...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ error }}
        </div>

        <!-- Content -->
        <div v-else>
            <!-- Ratings Summary Card -->
            <div v-if="ratingsCount > 0" class="row mb-4">
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-4">
                            <div class="row align-items-center">
                                <div class="col-md-6">
                                    <h5 class="card-title mb-3">
                                        <i class="fas fa-chart-bar me-2 text-primary"></i>
                                        ملخص التقييمات
                                    </h5>
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="rating-stars me-3">
                                            <i v-for="star in 5" :key="star" 
                                               class="fas fa-star fs-3" 
                                               :class="star <= averageRating ? 'text-warning' : 'text-muted'">
                                            </i>
                                        </div>
                                        <div>
                                            <span class="fs-2 fw-bold text-warning">{{ averageRating.toFixed(1) }}</span>
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

            <!-- Individual Ratings List -->
            <div class="row">
                <div class="col-12">
                    <div v-if="ratingsCount > 0" class="card border-0 shadow-sm">
                        <div class="card-header bg-light border-0 d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">
                                <i class="fas fa-comments me-2 text-success"></i>
                                جميع التقييمات ({{ ratingsCount }})
                            </h5>
                            <!-- Sort Options -->
                            <div class="dropdown">
                                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                                        type="button" 
                                        data-bs-toggle="dropdown">
                                    <i class="fas fa-sort me-1"></i>ترتيب حسب
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" @click="sortBy('newest')">الأحدث أولاً</a></li>
                                    <li><a class="dropdown-item" href="#" @click="sortBy('oldest')">الأقدم أولاً</a></li>
                                    <li><a class="dropdown-item" href="#" @click="sortBy('highest')">الأعلى تقييماً</a></li>
                                    <li><a class="dropdown-item" href="#" @click="sortBy('lowest')">الأقل تقييماً</a></li>
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
                                                <div class="user-avatar me-3">
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

                    <!-- No Ratings State -->
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

const averageRating = computed(() => {
    return productStore.getProductAverageRating(productId.value);
});

const ratingDistribution = computed(() => {
    return productStore.getProductRatingDistribution(productId.value);
});

// Sorted ratings based on selected option
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
    return (ratingDistribution.value[starRating] / ratingsCount.value) * 100;
};

const sortBy = (option) => {
    sortOption.value = option;
};

const goBackToProductDetails = () => {
    // Navigate to products page with a query parameter to open the product details modal
    router.push({
        name: 'Products', // Assuming your products route is named 'Products'
        query: { 
            openProduct: productId.value 
        }
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

// Lifecycle hooks
onMounted(async () => {
    if (productId.value) {
        isLoading.value = true;
        error.value = null;
        
        try {
            // Fetch product details if not already loaded
            if (!product.value) {
                await productStore.fetchProductDetails(productId.value);
            }
            // Fetch ratings
            const result = await productStore.fetchProductRatings(productId.value);
            if (!result.success) {
                error.value = result.error;
            }
        } catch (err) {
            error.value = 'حدث خطأ أثناء تحميل البيانات';
        } finally {
            isLoading.value = false;
        }
    }
});

// Watch for product ID changes
watch(productId, async (newProductId) => {
    if (newProductId) {
        isLoading.value = true;
        error.value = null;
        
        try {
            if (!product.value) {
                await productStore.fetchProductDetails(newProductId);
            }
            const result = await productStore.fetchProductRatings(newProductId);
            if (!result.success) {
                error.value = result.error;
            }
        } catch (err) {
            error.value = 'حدث خطأ أثناء تحميل البيانات';
        } finally {
            isLoading.value = false;
        }
    }
});
</script>

<style scoped>
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
    background: #ea6666;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
    box-shadow: 0 4px 15px rgba(230, 102, 234, 0.3);
}

.comment-bubble {
    position: relative;
    border-left: 4px solid #198754;
}

.comment-bubble::before {
    content: '';
    position: absolute;
    top: 10px;
    left: -8px;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 6px solid #f8f9fa;
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
    .rating-distribution {
        margin-top: 1rem;
    }
    
    .user-avatar {
        display: none;
    }
}
</style>
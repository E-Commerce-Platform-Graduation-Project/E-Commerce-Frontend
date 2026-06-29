<template>
    <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content product-details-modal">
                <div class="modal-header bg-dark text-white">
                    <h4 class="modal-title mb-0">{{ product.name }}</h4>
                </div>

                <div class="modal-body p-4">
                    <!-- ... (image gallery and main product details are unchanged) ... -->
                    <div class="image-gallery-container mb-4">
                        <div class="main-image-wrapper mb-3">
                            <img v-if="activeImage" :src="activeImage" class="main-product-image"
                                alt="Main product view">
                            <div v-else
                                class="text-center bg-light p-5 rounded d-flex align-items-center justify-content-center"
                                style="height: 350px;">
                                <p class="text-muted mb-0">لا توجد صور لعرضها.</p>
                            </div>
                        </div>

                        <div v-if="allImages.length > 1" class="thumbnail-gallery">
                            <div v-for="(image, index) in allImages" :key="index" class="thumbnail-item"
                                :class="{ 'active': image === activeImage }" @click="setActiveImage(image)">
                                <img :src="image" class="thumbnail-image" alt="Product thumbnail">
                            </div>
                        </div>
                    </div>

                    <h5 class="mb-3 text-dark"><i class="fas fa-info-circle me-2"></i>تفاصيل المنتج</h5>
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
                    <div class="row border-top pt-3">
                        <div class="col-sm-3 mb-3">
                            <label class="fw-semibold text-muted">أحدث سعر شراء</label>
                            <p class="fs-5 fw-bold text-success">
                                {{ product.purchasePrice > 0 ? product.purchasePrice + ' دينار' : 'غير محدد' }}
                            </p>
                        </div>
                        <div class="col-sm-3 mb-3">
                            <label class="fw-semibold text-muted">سعر البيع الحالي</label>
                            <p class="fs-5 fw-bold text-success">
                                {{ product.sellingPrice > 0 ? product.sellingPrice + ' دينار' : 'غير محدد' }}
                            </p>
                        </div>
                        <div class="col-sm-3 mb-3">
                            <label class="fw-semibold text-muted">هامش الربح</label>
                            <p class="fs-5 fw-bold text-success">
                                {{ product.profitMargin ? product.profitMargin + '%' : 'غير محدد' }}
                            </p>
                        </div>
                        <div class="col-sm-3 mb-3">
                            <label class="fw-semibold text-muted">الربح المتوقع</label>
                            <p class="fs-5 fw-bold text-success">
                                {{ calculatedProfit > 0 ? calculatedProfit + ' دينار' : 'غير محدد' }}
                            </p>
                        </div>
                    </div>
                    <div class="row border-top pt-3">
                        <div class="col-sm-6 mb-3">
                            <label class="fw-semibold text-muted">إجمالي الكمية المتاحة</label>
                            <p class="fs-5">{{ productStore.getProductTotalQuantity(product.id) }} قطعة</p>
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

                    <!-- Simplified Ratings Section -->
                    <div class="border-top pt-4 mt-2">
                        <h5 class="mb-3">
                            <i class="fas fa-star me-2 text-warning"></i>تقييمات المنتج
                        </h5>

                        <!-- Simple link to ratings page -->
                        <router-link :to="{
                            name: 'ProductRatings',
                            params: { id: product.id },
                            query: { returnPage: $route.query.page }
                        }" class="rating-summary-card text-decoration-none" @click="handleClose">
                            <div class="p-4 bg-light rounded border rating-hover-effect">
                                <div class="row align-items-center">
                                    <div class="col-md-8">
                                        <h6 class="mb-2 text-dark">عرض تقييمات المنتج</h6>
                                        <p class="text-muted mb-0">
                                            <i class="fas fa-comments me-2"></i>
                                            اضغط لعرض جميع التقييمات والتعليقات
                                        </p>
                                    </div>
                                    <div class="col-md-4 text-end">
                                        <i class="fas fa-chevron-left fs-3 text-muted"></i>
                                        <div class="small text-muted mt-1">عرض التقييمات</div>
                                    </div>
                                </div>
                            </div>
                        </router-link>
                    </div>
                </div>

                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" @click="handleClose">
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
import { ref, computed, watch, onMounted } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';
import { useProductStore } from '@/stores/productStore';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({ product: { type: Object, required: true } });
const emit = defineEmits(['close', 'edit-product']);

const categoryStore = useCategoryStore();
const productStore = useProductStore();
const route = useRoute();
const router = useRouter();
const activeImage = ref('');

const allImages = computed(() => {
    if (!props.product) return [];
    const images = new Set();
    if (props.product.mainImage) images.add(props.product.mainImage);
    props.product.variants?.forEach(variant => {
        variant.images?.forEach(img => images.add(img));
    });
    return Array.from(images);
});

watch(allImages, (newImages) => {
    activeImage.value = newImages.length > 0 ? newImages[0] : '';
}, { immediate: true });

const setActiveImage = (image) => {
    activeImage.value = image;
};

// Helper to check if a string is a hex color code.
const isHexColor = (value) => {
    if (typeof value !== 'string') return false;
    return /^#[0-9A-F]{6}$/i.test(value);
};

const calculatedProfit = computed(() => {
    if (props.product.sellingPrice > 0 && props.product.purchasePrice > 0) {
        return (props.product.sellingPrice - props.product.purchasePrice).toFixed(2);
    }
    return 0;
});

const getCategoryHierarchyDisplay = (categoryId) => {
    const category = categoryStore.getCategoryById(categoryId);
    if (!category) return 'فئة غير معروفة';
    if (category.parentCategoryID) {
        const parentCategory = categoryStore.getCategoryById(category.parentCategoryID);
        if (parentCategory) {
            return `${parentCategory.name} -> ${category.name}`;
        }
    }
    return category.name;
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
};

// Handle closing modal and clean up URL parameters
const handleClose = () => {
    // Check if we came from ratings (has openProduct query parameter)
    if (route.query.openProduct) {
        // Remove the query parameter from URL without reloading
        const newQuery = { ...route.query };
        delete newQuery.openProduct;

        router.replace({
            name: route.name,
            params: route.params,
            query: newQuery
        });
    }

    // Emit the close event
    emit('close');
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

/* --- IMAGE GALLERY STYLES --- */
.main-image-wrapper {
    text-align: center;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
    padding: 1rem;
    border: 1px solid #dee2e6;
    height: 350px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.main-product-image {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    border-radius: 0.25rem;
}

.thumbnail-gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    padding-top: 0.5rem;
}

.thumbnail-item {
    width: 80px;
    height: 80px;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s ease;
    padding: 2px;
}

.thumbnail-item:hover {
    border-color: #adb5bd;
    transform: scale(1.05);
}

.thumbnail-item.active {
    border-color: #070707e0;
    box-shadow: 0 0 8px rgba(25, 135, 84, 0.5);
    transform: scale(1.1);
}

.thumbnail-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 0.35rem;
}

label.fw-semibold {
    font-size: 0.9rem;
}

p {
    font-size: 1.05rem;
}

/* --- RATINGS STYLES --- */
.rating-summary-card {
    display: block;
    cursor: pointer;
}

.rating-hover-effect {
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.rating-hover-effect:hover {
    border-color: #198754;
    box-shadow: 0 4px 12px rgba(25, 135, 84, 0.2);
    transform: translateY(-2px);
}

.rating-stars {
    font-size: 1.2rem;
}

.rating-stars i {
    margin-right: 2px;
}
</style>
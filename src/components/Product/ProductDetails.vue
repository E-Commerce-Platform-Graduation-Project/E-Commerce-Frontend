<template>
    <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content product-details-modal">
                <div class="modal-header bg-success text-white">
                    <h4 class="modal-title mb-0">{{ product.name }}</h4>
                </div>

                <div class="modal-body p-4">
                    <div class="mb-4">
                        <div v-if="allVariantImages.length > 0" id="productImageCarousel" class="carousel slide"
                            data-bs-ride="carousel">
                            <div class="carousel-inner rounded">
                                <div v-for="(image, index) in allVariantImages" :key="index" class="carousel-item"
                                    :class="{ active: index === 0 }">
                                    <img :src="image" class="d-block w-100 product-image" alt="Product image">
                                </div>
                            </div>
                            <button v-if="allVariantImages.length > 1" class="carousel-control-prev" type="button"
                                data-bs-target="#productImageCarousel" data-bs-slide="prev">
                                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            </button>
                            <button v-if="allVariantImages.length > 1" class="carousel-control-next" type="button"
                                data-bs-target="#productImageCarousel" data-bs-slide="next">
                                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            </button>
                        </div>
                        <div v-else class="text-center bg-light p-5 rounded">
                            <p class="text-muted">لا توجد صور لهذا المنتج.</p>
                        </div>
                    </div>

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

                    <div class="row border-top pt-3">
                        <div class="col-sm-3 mb-3">
                            <label class="fw-semibold text-muted">أحدث سعر شراء</label>
                            <p class="fs-5 fw-bold text-primary">
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

                    <div class="border-top pt-4 mt-2">
                        <h5 class="mb-3 text-success"><i class="fas fa-receipt me-2"></i>سجل فواتير الشراء</h5>
                        <div v-if="purchaseHistoryItems.length > 0" class="invoice-list">
                            <div class="invoice-item header">
                                <div class="invoice-date">التاريخ</div>
                                <div class="invoice-color">اللون</div>
                                <div class="invoice-size">المقاس</div>
                                <div class="invoice-qty">الكمية</div>
                                <div class="invoice-price">سعر الشراء</div>
                            </div>
                            <div v-for="item in purchaseHistoryItems"
                                :key="`${item.invoiceId}-${item.color}-${item.size}`" class="invoice-item">
                                <div class="invoice-date">{{ formatDate(item.date) }}</div>
                                <div class="invoice-color">{{ item.color }}</div>
                                <div class="invoice-size">{{ item.size }}</div>
                                <div class="invoice-qty">+{{ item.quantityAdded }}</div>
                                <div class="invoice-price purchase">{{ item.purchasePrice }} دينار</div>
                            </div>
                        </div>
                        <div v-else class="text-center text-muted p-3 bg-light rounded">
                            <p class="mb-0">لا يوجد سجل فواتير شراء لهذا المنتج.</p>
                        </div>
                    </div>

                </div>

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

// NEW: Gathers all images from all variants into a single array for the carousel
const allVariantImages = computed(() => {
    if (!props.product || !props.product.variants) return [];
    return props.product.variants.flatMap(variant => variant.images || []);
});

// MODIFIED: Flattens all purchased items for this product from all invoices
const purchaseHistoryItems = computed(() => {
    const invoices = productStore.getInvoicesByProductId(props.product.id);
    const allItems = [];
    invoices.forEach(invoice => {
        const productItems = invoice.items.filter(item => item.productId === props.product.id);
        productItems.forEach(item => {
            allItems.push({
                invoiceId: invoice.id,
                date: invoice.date,
                ...item
            });
        });
    });
    return allItems;
});

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

label.fw-semibold {
    font-size: 0.9rem;
}

p {
    font-size: 1.05rem;
}

/* MODIFIED: Invoice List Styling for new columns */
.invoice-list {
    border: 1px solid #dee2e6;
    border-radius: 8px;
    overflow: hidden;
}

.invoice-item {
    display: grid;
    /* Updated grid for 5 columns */
    grid-template-columns: 1.5fr 1fr 1fr 0.8fr 1fr;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e9ecef;
    text-align: right;
    align-items: center;
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

.invoice-color,
.invoice-size {
    font-weight: 500;
}

.invoice-qty {
    font-weight: bold;
    color: #198754;
}

.invoice-price.purchase {
    color: #6c757d;
}

.text-primary {
    color: #0d6efd !important;
}

.text-warning {
    color: #ffc107 !important;
}

.text-info {
    color: #0dcaf0 !important;
}
</style>
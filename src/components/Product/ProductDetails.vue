<template>
    <div class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content product-details-modal">
                <div class="modal-header bg-success text-white">
                    <h4 class="modal-title mb-0">{{ product.name }}</h4>
                </div>

                <div class="modal-body p-4">
                    <div class="image-gallery-container mb-4">
                        <div class="main-image-wrapper mb-3">
                            <img v-if="activeImage" :src="activeImage" class="main-product-image" alt="Main product view">
                            <div v-else class="text-center bg-light p-5 rounded d-flex align-items-center justify-content-center" style="height: 350px;">
                                <p class="text-muted mb-0">لا توجد صور لعرضها.</p>
                            </div>
                        </div>

                        <div v-if="allImages.length > 1" class="thumbnail-gallery">
                            <div
                                v-for="(image, index) in allImages"
                                :key="index"
                                class="thumbnail-item"
                                :class="{ 'active': image === activeImage }"
                                @click="setActiveImage(image)"
                            >
                                <img :src="image" class="thumbnail-image" alt="Product thumbnail">
                            </div>
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
                                <div class="invoice-properties">الخواص</div>
                                <div class="invoice-qty">الكمية</div>
                                <div class="invoice-price">سعر الشراء</div>
                            </div>
                            <div v-for="item in purchaseHistoryItems"
                                :key="`${item.invoiceId}-${JSON.stringify(item.properties)}`" class="invoice-item">
                                <div class="invoice-date">{{ formatDate(item.date) }}</div>
                                <div class="invoice-properties">
                                    <div class="props-display">
                                        <span v-for="(value, propName) in item.properties" :key="propName" class="prop-chip">
                                            <span v-if="propName === 'color'" class="prop-color-dot" :style="{ backgroundColor: value }"></span>
                                            <strong class="prop-name">{{ propName === 'color' ? 'اللون' : propName }}:</strong>
                                            {{ value }}
                                        </span>
                                    </div>
                                </div>
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
import { ref, computed, watch } from 'vue';
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

const activeImage = ref('');

const allImages = computed(() => {
    if (!props.product) return [];
    const images = [];
    if (props.product.mainImage) {
        images.push(props.product.mainImage);
    }
    if (props.product.variants) {
        const variantImages = props.product.variants.flatMap(variant => variant.images || []);
        images.push(...variantImages);
    }
    return images;
});

watch(allImages, (newImages) => {
    if (newImages.length > 0) {
        activeImage.value = newImages[0];
    } else {
        activeImage.value = '';
    }
}, { immediate: true });

const setActiveImage = (image) => {
    activeImage.value = image;
};

const purchaseHistoryItems = computed(() => {
    // This logic is now correct because invoice items in the store contain the full `properties` object.
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
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
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
  border-color: #198754;
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

.invoice-list {
    border: 1px solid #dee2e6;
    border-radius: 8px;
    overflow: hidden;
}

.invoice-item {
    display: grid;
    /* UPDATED: Changed from 5 to 4 columns */
    grid-template-columns: 1.5fr 2fr 0.8fr 1.2fr;
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

.invoice-qty {
    font-weight: bold;
    color: #198754;
}

.invoice-price.purchase {
    color: #6c757d;
}

.text-primary { color: #0d6efd !important; }
.text-warning { color: #ffc107 !important; }
.text-info { color: #0dcaf0 !important; }

/* --- NEW STYLES FOR PROPERTIES DISPLAY --- */
.props-display {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    justify-content: flex-start;
}

.prop-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #eef2ff;
    color: #4338ca;
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 500;
}

.prop-color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.prop-name {
    color: #64748b;
}
</style>
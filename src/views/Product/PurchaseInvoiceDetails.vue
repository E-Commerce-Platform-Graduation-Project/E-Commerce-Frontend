<template>
    <div class="container my-5">
        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border" role="status"></div>
            <p class="mt-2">جاري تحميل التفاصيل...</p>
        </div>
        <div v-else-if="!invoice" class="alert alert-danger">
            لم يتم العثور على الفاتورة بالرقم المطلوب.
        </div>

        <div v-else>
            <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div>
                    <h1 class="h3 mb-1">تفاصيل فاتورة الشراء <span class="text-primary">#{{ invoice.id }}</span></h1>
                    <p class="text-muted mb-0">
                        بتاريخ {{ formatDate(invoice.date) }} بواسطة <strong>{{ invoice.user }}</strong>
                    </p>
                </div>
                <router-link to="/purchase-invoices" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-right ms-2"></i> العودة إلى السجل
                </router-link>
            </div>

            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col" style="width: 35%;">المنتج</th>
                                    <th scope="col" class="text-center">اللون</th>
                                    <th scope="col" class="text-center">المقاس</th>
                                    <th scope="col" class="text-center">الكمية</th>
                                    <th scope="col" class="text-center">سعر الشراء للوحدة</th>
                                    <th scope="col" class="text-end">الإجمالي الفرعي</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in invoice.items" :key="index">
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <img :src="getVariantImage(item.productId, item.color)"
                                                class="product-img me-3" :alt="getProductInfo(item.productId).name">
                                            <div>
                                                <div class="fw-bold">{{ getProductInfo(item.productId).name }}</div>
                                                <small class="text-muted">#{{ item.productId }}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center fw-medium">{{ item.color }}</td>
                                    <td class="text-center fw-medium">{{ item.size }}</td>
                                    <td class="text-center">{{ item.quantityAdded }}</td>
                                    <td class="text-center">{{ formatCurrency(item.purchasePrice) }}</td>
                                    <td class="text-end fw-bold">{{ formatCurrency(item.purchasePrice *
                                        item.quantityAdded) }}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="table-light">
                                    <td colspan="5" class="text-start fw-bold h5">الإجمالي الكلي للفاتورة</td>
                                    <td class="text-end fw-bold h5 text-primary">{{ formatCurrency(invoice.totalAmount)
                                        }}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '@/stores/productStore';

const route = useRoute();
const productStore = useProductStore();

const isLoading = ref(true);
const invoiceId = computed(() => parseInt(route.params.id));
const invoice = computed(() => productStore.getInvoiceById(invoiceId.value));

onMounted(async () => {
    isLoading.value = true;
    await productStore.fetchAllData();
    isLoading.value = false;
});

// Renamed for clarity
const getProductInfo = (productId) => {
    return productStore.getProductById(productId) || { name: 'منتج غير معروف' };
};

// NEW: Helper function to get the correct image based on the product's color variant
const getVariantImage = (productId, colorName) => {
    const product = productStore.getProductById(productId);
    if (!product || !product.variants) {
        return 'https://placehold.co/60x60/eee/ccc?text=?'; // Placeholder
    }

    const variant = product.variants.find(v => v.colorName === colorName);
    if (variant && variant.images && variant.images.length > 0) {
        return variant.images[0]; // Return the first image of the correct color
    }

    return 'https://placehold.co/60x60/eee/ccc?text=N/A'; // Placeholder if color variant has no image
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(amount);
};
</script>

<style scoped>
/* Styles from your provided file are correct and retained */
.card {
    border-radius: 0.75rem;
}

.table {
    font-size: 0.95rem;
}

.product-img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
}

.table tfoot tr {
    border-top: 2px solid #dee2e6;
}

.fw-medium {
    font-weight: 500;
}
</style>
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
                    <h1 class="h3 mb-1">تفاصيل فاتورة الشراء <span class="text-dark">#{{ invoice.id }}</span></h1>
                    <p class="text-muted mb-0">
                        بتاريخ {{ formatDate(invoice.date) }} بواسطة <strong>{{ invoice.user }}</strong>
                    </p>
                </div>
                <router-link to="/purchase-invoices" class="btn btn-outline-secondary">
                   العودة إلى السجل <i class="fas fa-arrow-left ms-2"></i> 
                </router-link>
            </div>

            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th scope="col" style="width: 35%;">المنتج</th>
                                    <th scope="col" style="width: 25%;">رقم المتغير (SKU)</th>
                                    <th scope="col" style="width: 15%;">الخواص</th>
                                    <th scope="col" class="text-center" style="width: 10%;">الكمية</th>
                                    <th scope="col" class="text-center" style="width: 15%;">سعر الوحدة</th>
                                    <th scope="col" class="text-end">الإجمالي الفرعي</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in invoice.items" :key="index">
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <!-- Display actual product image from API -->
                                            <img v-if="getItemImage(item)" 
                                                :src="getItemImage(item)" 
                                                :alt="item.productName"
                                                class="product-img mx-3"
                                                @error="handleImageError">
                                            <div v-else class="product-placeholder me-3">
                                                <i class="fas fa-box"></i>
                                            </div>
                                            <div>
                                                <div class="fw-bold">{{ item.productName }}</div>
                                                <small class="text-muted">SKU: {{ item.variantSku }}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <code class="text-muted">{{ item.variantSku }}</code>
                                    </td>
                                    <td>
                                        <div class="props-display">
                                            <span class="prop-chip" v-if="extractColorFromSku(item.variantSku)">
                                                <span class="prop-color-dot"
                                                    :style="{ backgroundColor: extractColorFromSku(item.variantSku) }"></span>
                                                <strong class="prop-name">اللون:</strong>
                                                {{ extractColorFromSku(item.variantSku) }}
                                            </span>
                                            <span class="prop-chip" v-if="extractSizeFromSku(item.variantSku)">
                                                <strong class="prop-name">المقاس:</strong>
                                                {{ extractSizeFromSku(item.variantSku) }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="text-center">{{ item.quantity }}</td>
                                    <td class="text-center">{{ formatCurrency(item.costPerUnit) }}</td>
                                    <td class="text-end fw-bold">{{ formatCurrency(item.costPerUnit * item.quantity) }}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="table-light">
                                    <td colspan="5" class="text-start fw-bold h5">الإجمالي الكلي للفاتورة</td>
                                    <td class="text-end fw-bold h5 text-success">{{ formatCurrency(invoice.totalAmount) }}</td>
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
    // Only fetch the invoice details - images are included in the response
    await productStore.fetchPurchaseInvoiceDetails(invoiceId.value);
    isLoading.value = false;
});

// Get the first image from the item's images array
const getItemImage = (item) => {
    if (item.images && item.images.length > 0) {
        // Sort by display_order and return the first image
        const sortedImages = [...item.images].sort((a, b) => 
            (a.display_order || 0) - (b.display_order || 0)
        );
        return sortedImages[0].image;
    }
    return null;
};

const handleImageError = (event) => {
    // Replace broken image with placeholder
    event.target.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = 'product-placeholder me-3';
    placeholder.innerHTML = '<i class="fas fa-box"></i>';
    event.target.parentNode.insertBefore(placeholder, event.target);
};

const extractColorFromSku = (variantSku) => {
    // Extract color from SKU format: "SOPHNET.HOODED-#613F32-S"
    const parts = variantSku.split('-');
    for (const part of parts) {
        if (part.startsWith('#') && part.length === 7) {
            return part;
        }
    }
    return null;
};

const extractSizeFromSku = (variantSku) => {
    // Extract size from SKU - usually the last part
    const parts = variantSku.split('-');
    const lastPart = parts[parts.length - 1];
    
    // Skip if it's a color code
    if (lastPart.startsWith('#')) {
        return parts[parts.length - 2] || '';
    }
    
    return lastPart || '';
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-LY', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-LY', { 
        style: 'currency', 
        currency: 'LYD' 
    }).format(amount);
};
</script>

<style scoped>
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

.product-placeholder {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 0.5rem;
    font-size: 1.5rem;
}

.table tfoot tr {
    border-top: 2px solid #dee2e6;
}

.fw-medium {
    font-weight: 500;
}

.props-display {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}

.prop-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    background-color: #eef2ff;
    color: #0f0f0f;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
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
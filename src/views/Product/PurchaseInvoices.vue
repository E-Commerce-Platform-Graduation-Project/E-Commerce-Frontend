<template>
    <div class="container-fluid px-4 py-4">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <h1 class="h2 fw-bold text-dark mb-0">سجل فواتير الشراء</h1>
            <router-link to="/add-purchase-invoice" class="btn btn-success d-flex align-items-center gap-2 px-3 py-2">
                <i class="fas fa-plus"></i>
                فاتورة شراء جديدة
            </router-link>
        </div>

        <div class="row mb-4 g-3">
            <div class="col-lg-6">
                <div class="search-container">
                    <input v-model="searchQuery" type="text" placeholder="البحث برقم الفاتورة أو اسم المستخدم..."
                        class="form-control search-input" />
                    <i class="fas fa-search search-icon"></i>
                </div>
            </div>
        </div>

        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">جاري تحميل الفواتير...</p>
        </div>
        <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

        <div v-else-if="filteredInvoices.length > 0" class="invoices-container">
            <div class="invoice-header">
                <div class="header-item">رقم الفاتورة</div>
                <div class="header-item">التاريخ</div>
                <div class="header-item">بواسطة</div>
                <div class="header-item">السعر الإجمالي</div>
                <div class="header-item">الإجراءات</div>
            </div>
            <div v-for="invoice in filteredInvoices" :key="invoice.id" class="invoice-row">
                <div class="invoice-id">#{{ invoice.id }}</div>
                <div class="invoice-date">{{ formatDate(invoice.date) }}</div>
                <div class="invoice-user">{{ invoice.user }}</div>
                <div class="invoice-total">{{ formatCurrency(invoice.totalAmount) }}</div>
                <div class="invoice-actions">
                    <router-link :to="`/purchase-invoices/${invoice.id}`" class="btn btn-outline-primary btn-sm">
                        عرض التفاصيل
                    </router-link>
                </div>
            </div>
        </div>

        <div v-else class="text-center py-5">
            <i class="fas fa-file-invoice-dollar fa-4x text-muted mb-3"></i>
            <h4 class="text-muted">لا توجد فواتير تطابق البحث</h4>
            <p>حاول تغيير كلمات البحث المستخدمة.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

const searchQuery = ref('');

const isLoading = computed(() => productStore.isLoading);
const error = computed(() => productStore.error);

const filteredInvoices = computed(() => {
    let invoices = productStore.getAllInvoices;
    if (searchQuery.value) {
        const lowerCaseQuery = searchQuery.value.toLowerCase();
        invoices = invoices.filter(inv =>
            inv.id.toString().includes(lowerCaseQuery) ||
            inv.user.toLowerCase().includes(lowerCaseQuery)
        );
    }
    return invoices;
});

onMounted(() => {
    productStore.fetchPurchaseInvoices();
});

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(amount);
};
</script>

<style scoped>
.search-container {
    position: relative;
}

.search-input {
    padding: 10px 40px 10px 15px;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    font-size: 1rem;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease-in-out;
    text-align: right;
    direction: rtl;
    width: 100%;
}

.search-input:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
}

.search-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
}

.invoices-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.invoice-header,
.invoice-row {
    display: grid;
    grid-template-columns: 1.5fr 2fr 2fr 1.5fr 1fr;
    gap: 1.25rem;
    padding: 1rem 1.5rem;
    align-items: center;
    text-align: right;
}

.invoice-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    font-weight: 600;
    color: #495057;
    font-size: 0.875rem;
}

.invoice-row {
    border-bottom: 1px solid #f1f3f4;
}

.invoice-row:last-child {
    border-bottom: none;
}

.invoice-row:hover {
    background-color: #f8f9fa;
}

.invoice-id {
    font-weight: bold;
    color: #0d6efd;
}

.invoice-user {
    font-weight: 500;
}

.invoice-total {
    font-weight: bold;
    color: #198754;
}

.invoice-actions {
    text-align: left;
}
</style>
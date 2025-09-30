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
                    <input v-model="searchQuery" type="text" placeholder="البحث برقم الفاتورة أو اسم مُصدرها..."
                        class="form-control search-input" />
                    <i class="fas fa-search search-icon"></i>
                </div>
            </div>
        </div>

        <!-- Pagination Info Display -->
        <div class="row mb-3">
            <div class="col-12">
                <div class="pagination-info">
                    <span class="info-text">
                        عرض {{ totalInvoices > 0 ? startIndex + 1 : 0 }} - {{ endIndex }} من {{ totalInvoices }} فاتورة
                    </span>
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
                <div class="header-item">عدد الأصناف</div>
                <div class="header-item">السعر الإجمالي</div>
                <div class="header-item">الإجراءات</div>
            </div>
            <div v-for="invoice in filteredInvoices" :key="invoice.id" class="invoice-row">
                <div class="invoice-id">#{{ invoice.id }}</div>
                <div class="invoice-date">{{ formatDate(invoice.date) }}</div>
                <div class="invoice-user">{{ invoice.user }}</div>
                <div class="invoice-items-count">{{ invoice.items.length }} صنف</div>
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

        <!-- Pagination Controls -->
        <div v-if="!isLoading && !error && totalInvoices > 0" class="pagination-container">
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
                <label for="pageSize">عدد الفواتير في الصفحة:</label>
                <select id="pageSize" v-model="itemsPerPage" class="page-size-select" disabled>
                    <option value="10">10</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const isLoading = computed(() => productStore.isLoading);
const error = computed(() => productStore.error);

const filteredInvoices = computed(() => {
    return productStore.getAllInvoices;
});

const totalInvoices = computed(() => productStore.getInvoicesCount);

const totalPages = computed(() => {
    if (totalInvoices.value === 0) return 1;
    return Math.ceil(totalInvoices.value / itemsPerPage.value);
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const endIndex = computed(() => {
    const end = startIndex.value + itemsPerPage.value;
    return Math.min(end, totalInvoices.value);
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

// Watch for search query changes with debounce
let debounceTimer = null;
watch(searchQuery, (newQuery) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentPage.value = 1;
        productStore.fetchPurchaseInvoices({ page: 1, search: newQuery });
    }, 500);
});

onMounted(() => {
    productStore.fetchPurchaseInvoices();
});

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value && typeof page === 'number') {
        currentPage.value = page;
        productStore.fetchPurchaseInvoices({ page: page, search: searchQuery.value });
    }
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

.invoices-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.invoice-header,
.invoice-row {
    display: grid;
    grid-template-columns: 1.2fr 2fr 2fr 1fr 1.5fr 1fr;
    gap: 1rem;
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

.invoice-items-count {
    color: #6c757d;
    font-size: 0.9rem;
}

.invoice-total {
    font-weight: bold;
    color: #198754;
}

.invoice-actions {
    text-align: left;
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
</style>
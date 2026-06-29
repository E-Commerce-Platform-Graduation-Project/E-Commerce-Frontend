<template>
    <div class="container-fluid px-4 py-4">
        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-dark" style="width: 3rem; height: 3rem;" role="status"></div>
            <p class="mt-3 text-muted">جاري تحميل بيانات العميل...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

        <div v-else-if="customer" class="customer-details-page">
            <div class="details-header mb-4">
                <div class="d-flex align-items-center">
                    <div class="customer-avatar me-3 bg-white text-dark">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <h2 class="customer-name mb-0">{{ customer.full_name }}</h2>
                        <span class="badge fs-6" :class="customer.is_active ? 'bg-success' : 'bg-danger'">
                            {{ customer.is_active ? 'نشط' : 'معطل' }}
                        </span>
                    </div>
                </div>
                <div class="btn btn-outline-secondary" @click="goBack()">
                    <i class="fas fa-arrow-right me-2"></i>
                    العودة
                </div>
            </div>

            <div class="card shadow-sm mb-4">
                <div class="card-header bg-dark text-white">
                    <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>معلومات العميل</h5>
                </div>
                <div class="card-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <label><i class="fas fa-phone"></i> رقم الهاتف</label>
                            <p>{{ customer.phone_number }}</p>
                        </div>
                        <div class="info-item">
                            <label><i class="fas fa-envelope"></i> البريد الإلكتروني</label>
                            <p>{{ customer.email }}</p>
                        </div>
                        <div class="info-item">
                            <label><i class="fas fa-calendar-alt"></i> آخر تسجيل دخول</label>
                            <p>{{ formatDate(customer.last_login) }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-lg-7">
                    <div class="card shadow-sm">
                        <div class="card-header bg-dark text-white">
                            <h5 class="mb-0"><i class="fas fa-receipt me-2"></i>سجل الطلبات ({{ totalOrders }})</h5>
                        </div>
                        <div class="card-body p-0">
                            <div v-if="paginatedOrders.length > 0">
                                <div class="orders-container">
                                    <div class="order-item header">
                                        <div class="order-info">الطلب</div>
                                        <div class="order-total">المجموع</div>
                                        <div class="order-status">الحالة</div>
                                    </div>

                                    <div v-if="ordersLoading" class="orders-loading-overlay">
                                        <div class="spinner-border text-dark" role="status"></div>
                                        <p class="mt-2 text-muted mb-0">جاري التحميل...</p>
                                    </div>

                                    <div class="orders-list-fixed" :class="{ 'loading-blur': ordersLoading }">
                                        <div v-for="order in paginatedOrders" :key="order.id" class="order-item clickable"
                                            @click="!ordersLoading && openOrderDetailsModal(order)">
                                            <div class="order-info">
                                                <span class="order-id">#{{ order.id }}</span>
                                                <span class="order-date">{{ formatDate(order.order_date) }}</span>
                                            </div>
                                            <div class="order-total">{{ order.grand_total }} دينار</div>
                                            <div class="order-status">
                                                <span class="status-badge" :class="getStatusBadgeClass(order.status)">{{ order.status }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="totalOrderPages > 1" class="orders-pagination">
                                    <button @click="goToOrderPage(currentOrderPage - 1)"
                                        :disabled="currentOrderPage === 1 || ordersLoading" class="pagination-btn">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>

                                    <div class="page-numbers-small">
                                        <button v-for="page in visibleOrderPages" :key="page" @click="goToOrderPage(page)"
                                            :class="['page-number-small', { 'active': page === currentOrderPage, 'disabled': typeof page !== 'number' }]"
                                            :disabled="typeof page !== 'number' || ordersLoading">
                                            {{ page }}
                                        </button>
                                    </div>

                                    <button @click="goToOrderPage(currentOrderPage + 1)"
                                        :disabled="currentOrderPage === totalOrderPages || ordersLoading"
                                        class="pagination-btn">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                </div>
                            </div>
                            <div v-else class="text-center text-muted p-3">
                                <p class="mb-0">لا يوجد سجل طلبات لهذا العميل.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-5">
                    <div class="card shadow-sm">
                        <div class="card-header bg-dark text-white">
                            <h5 class="mb-0"><i class="fas fa-star me-2"></i>تقييمات المنتجات ({{ totalRatingsCount }})</h5>
                        </div>
                        <div class="card-body p-0">
                             <div v-if="paginatedRatings.length > 0">
                                <div class="ratings-container">
                                     <div v-if="ratingsLoading" class="ratings-loading-overlay">
                                        <div class="spinner-border text-dark" role="status"></div>
                                        <p class="mt-2 text-muted mb-0">جاري التحميل...</p>
                                    </div>
                                    <div class="ratings-list" :class="{ 'loading-blur': ratingsLoading }">
                                        <div v-for="rating in paginatedRatings" :key="rating.id" class="rating-item"
                                            :class="{ 'has-comment': rating.comment && rating.comment.trim() }"
                                            @click="!ratingsLoading && rating.comment && rating.comment.trim() ? openCommentModal(rating) : null">
                                            <div class="rating-main-info">
                                                <div class="product-info">
                                                    <div class="product-image-container">
                                                        <img :src="rating.product_main_image"
                                                            :alt="rating.product_name" class="product-image"
                                                            @error="handleImageError">
                                                    </div>
                                                    <span class="rating-product-name">{{ rating.product_name }}</span>
                                                </div>
                                                <div class="rating-details">
                                                    <div class="rating-stars">
                                                        <i v-for="i in 5" :key="i" class="fas fa-star"
                                                            :class="{ 'filled': i <= rating.rating }"></i>
                                                    </div>
                                                    <span class="rating-date">{{ formatDate(rating.created_at) }}</span>
                                                    <span v-if="rating.comment && rating.comment.trim()"
                                                        class="comment-status view-comment">
                                                        عرض التعليق
                                                    </span>
                                                    <span v-else class="comment-status no-comment">
                                                        بدون تعليق
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="totalRatingPages > 1" class="orders-pagination">
                                    <button @click="goToRatingPage(currentRatingPage - 1)"
                                        :disabled="currentRatingPage === 1 || ratingsLoading"
                                        class="pagination-btn">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>

                                    <div class="page-numbers-small">
                                        <button v-for="page in visibleRatingPages" :key="page"
                                            @click="goToRatingPage(page)"
                                            :class="['page-number-small', { 'active': page === currentRatingPage, 'disabled': typeof page !== 'number' }]"
                                            :disabled="typeof page !== 'number' || ratingsLoading">
                                            {{ page }}
                                        </button>
                                    </div>

                                    <button @click="goToRatingPage(currentRatingPage + 1)"
                                        :disabled="currentRatingPage === totalRatingPages || ratingsLoading"
                                        class="pagination-btn">
                                        <i class="fas fa-chevron-left"></i>
                                    </button>
                                </div>
                            </div>
                            <div v-else class="text-center text-muted p-3">
                                <p class="mb-0">لم يقم هذا العميل بتقييم أي منتجات.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <OrderDetails v-if="isOrderDetailsVisible" :order="selectedOrder" @close="closeOrderDetailsModal" />

        <div v-if="isCommentModalVisible" class="comment-modal-backdrop" @click="closeCommentModal">
            <div class="comment-modal-content" @click.stop>
                <div class="comment-modal-header">
                    <h5 class="mb-0">تعليق على المنتج: {{ selectedComment.product_name }}</h5>
                    <button type="button" class="btn-close" @click="closeCommentModal"></button>
                </div>
                <div class="comment-modal-body">
                    <div class="rating-info mb-3">
                        <div class="rating-stars">
                            <i v-for="i in 5" :key="i" class="fas fa-star"
                                :class="{ 'filled': i <= selectedComment.rating }"></i>
                        </div>
                        <span class="rating-value">{{ selectedComment.rating }}/5</span>
                    </div>
                    <textarea class="form-control" :value="selectedComment.comment" readonly rows="6"></textarea>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';
import OrderDetails from '@/components/Order/OrderDetails.vue';

const route = useRoute();
const router = useRouter();

const customer = ref(null);
const allOrders = ref([]);
const totalOrdersCount = ref(0);
const isLoading = ref(true);
const ordersLoading = ref(false);
const error = ref(null);
const isOrderDetailsVisible = ref(false);
const selectedOrder = ref(null);

// State for ratings
const customerRatings = ref([]);
const totalRatingsCount = ref(0);
const ratingsLoading = ref(false);

// State for the comment modal
const isCommentModalVisible = ref(false);
const selectedComment = ref(null);

// Pagination state for orders
const currentOrderPage = ref(1);
const ordersPerPage = 5;

// Pagination state for ratings
const currentRatingPage = ref(1);
const ratingsPerPage = 10;


onMounted(async () => {
    const customerId = parseInt(route.params.id);

    try {
        // Fetch customer data with first page of orders
        await fetchCustomerData(customerId);

        // Fetch first page of ratings for this customer
        await fetchCustomerRatings(customerId);

    } catch (err) {
        error.value = 'حدث خطأ أثناء تحميل بيانات العميل';
        console.error('Error loading customer details:', err);
    } finally {
        isLoading.value = false;
    }
});

const fetchCustomerData = async (customerId, ordersPage = 1) => {
    // If customer data is null, it's the initial page load.
    // Otherwise, it's a pagination request for orders.
    if (!customer.value) {
        isLoading.value = true;
    } else {
        ordersLoading.value = true;
    }

    try {
        const response = await api.get(`/users/customers/${customerId}/?orders_page=${ordersPage}`);

        // Only set customer info if it hasn't been set before (on initial load)
        if (!customer.value) {
            customer.value = {
                id: response.data.id,
                full_name: response.data.full_name,
                phone_number: response.data.phone_number,
                email: response.data.email,
                is_active: response.data.is_active,
                last_login: response.data.last_login
            };
        }

        // Always update orders and pagination info
        allOrders.value = response.data.orders.results || [];
        totalOrdersCount.value = response.data.orders.count || 0;

    } catch (err) {
        console.error('Error fetching customer data:', err);
        if (ordersPage === 1 && !customer.value) {
             error.value = 'Failed to load customer data.';
        }
    } finally {
        // Always turn off both loaders
        ordersLoading.value = false;
        isLoading.value = false;
    }
};

const fetchCustomerRatings = async (userId, page = 1) => {
    ratingsLoading.value = true;
    try {
        const response = await api.get(`/products/staff-ratings/?user=${userId}&page=${page}`);
        customerRatings.value = response.data.results || [];
        totalRatingsCount.value = response.data.count || 0;
    } catch (error) {
        console.error('Error fetching customer ratings:', error);
        customerRatings.value = [];
        totalRatingsCount.value = 0;
    } finally {
        ratingsLoading.value = false;
    }
};

// Orders pagination computed properties
const totalOrders = computed(() => totalOrdersCount.value);

const totalOrderPages = computed(() => {
    if (totalOrders.value === 0) return 1;
    return Math.ceil(totalOrders.value / ordersPerPage);
});

const paginatedOrders = computed(() => allOrders.value);

const visibleOrderPages = computed(() => {
    const pages = [];
    const total = totalOrderPages.value;
    const current = currentOrderPage.value;

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

const goToOrderPage = (page) => {
    if (page >= 1 && page <= totalOrderPages.value && typeof page === 'number' && page !== currentOrderPage.value) {
        currentOrderPage.value = page;
        const customerId = parseInt(route.params.id);
        fetchCustomerData(customerId, page);
    }
};


// Ratings pagination computed properties
const totalRatingPages = computed(() => {
    if (totalRatingsCount.value === 0) return 1;
    return Math.ceil(totalRatingsCount.value / ratingsPerPage);
});

const paginatedRatings = computed(() => customerRatings.value);

const visibleRatingPages = computed(() => {
    const pages = [];
    const total = totalRatingPages.value;
    const current = currentRatingPage.value;

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

const goToRatingPage = (page) => {
    if (page >= 1 && page <= totalRatingPages.value && typeof page === 'number' && page !== currentRatingPage.value) {
        currentRatingPage.value = page;
        const customerId = parseInt(route.params.id);
        fetchCustomerRatings(customerId, page);
    }
};

// Modal functions
const openCommentModal = (rating) => {
    selectedComment.value = rating;
    isCommentModalVisible.value = true;
};

const closeCommentModal = () => {
    isCommentModalVisible.value = false;
    selectedComment.value = null;
};

const openOrderDetailsModal = (order) => {
    // Transform order to match the expected format for OrderDetails component
    selectedOrder.value = {
        id: order.id,
        orderDate: order.order_date,
        status: order.status,
        totalAmount: order.grand_total,
        totalPrice: order.total_price,
        shippingCost: order.shipping_cost,
        customerName: order.user,
        customerPhone: order.customer_phone,
        address: order.address,
        paymentMethod: order.payment_method,
        items: order.items.map(item => ({
            productId: item.product_id,
            productName: item.product_name,
            productMainImage: item.product_main_image,
            quantity: item.quantity,
            price: item.price_per_unit,
            colorHex: item.variant?.attributes?.find(attr => attr.name === 'اللون')?.value || '#000000',
            size: item.variant?.attributes?.find(attr => attr.name === 'المقاس')?.value || 'N/A',
            images: item.images?.map(img => img.image) || []
        }))
    };
    isOrderDetailsVisible.value = true;
};

const closeOrderDetailsModal = () => {
    isOrderDetailsVisible.value = false;
    selectedOrder.value = null;
};

const getStatusBadgeClass = (status) => {
    const statusClasses = {
        'مكتمل': 'status-completed',
        'قيد التجهيز': 'status-processing',
        'في الطريق الى الزبون': 'status-shipped',
        'ملغي': 'status-cancelled',
        'قيد الانتظار': 'status-pending',
    };
    return statusClasses[status] || 'status-default';
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-LY', options);
};

const handleImageError = (event) => {
    event.target.src = '/placeholder-product.png';
    event.target.onerror = null;
};

const goBack = () => {
  const returnPage = route.query.returnPage;
  if (returnPage) {
    router.push({ path: '/customers', query: { page: returnPage } });
  } else {
    router.back();
  }
};
</script>

<style scoped>
.details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.customer-avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    box-shadow: 0 4px 15px rgba(26, 26, 26, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
}
.customer-name { font-weight: bold; }
.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}
.info-item label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #6c757d;
    font-size: 0.9rem;
    margin-bottom: 5px;
}
.info-item p {
    font-size: 1.1rem;
    color: #212529;
    margin: 0;
}
.orders-container { 
    position: relative;
}
.ratings-container {
    position: relative;
    padding: 0.75rem;
}
.orders-list-fixed {
    max-height: 400px;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: opacity 0.3s ease;
}

.orders-loading-overlay, .ratings-loading-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    text-align: center;
}

.loading-blur {
    opacity: 0.4;
    pointer-events: none;
}

.orders-list-fixed .order-item.clickable {
    cursor: pointer;
}

.orders-list-fixed.loading-blur .order-item.clickable {
    cursor: not-allowed;
}
.ratings-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 380px; /* Adjusted for pagination */
    overflow-y: auto;
    padding-right: 5px;
}
.order-item {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1.5fr;
    align-items: center;
    padding: 1rem;
    background-color: #fff;
    border-bottom: 1px solid #e9ecef;
}
.order-item.header {
    background-color: #f8f9fa;
    font-weight: bold;
}
.order-item.clickable {
    cursor: pointer;
    transition: background-color 0.2s ease;
}
.order-item.clickable:hover {
    background-color: #e3f2fd;
}
.order-info { display: flex; flex-direction: column; }
.order-id { font-weight: bold; }
.order-date { font-size: 0.9rem; color: #6c757d; }
.order-total { font-weight: bold; font-size: 1.1rem; }

/* Orders Pagination Styles */
.orders-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 15px;
    background-color: #f8f9fa;
    border-top: 2px solid #dee2e6;
}

.pagination-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid #c7c7c7;
    border-radius: 6px;
    background: white;
    color: #495057;
    cursor: pointer;
    transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
    border-color: #0f0f0f;
    color: #0f0f0f;
    background-color: #e7f1ff;
}

.pagination-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.page-numbers-small {
    display: flex;
    gap: 4px;
}

.page-number-small {
    min-width: 32px;
    height: 32px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: white;
    color: #495057;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.page-number-small:hover:not(.disabled) {
    border-color: #0f0f0f;
    color: #0f0f0f;
    background-color: #dfdfdf;
}

.page-number-small.active {
    border-color: #0f0f0f;
    background: #0f0f0f;
    color: white;
}
.page-number-small.active:hover {
    background: #3d3d3d;
    color: white;

}

.page-number-small.disabled {
    cursor: default;
    border: none;
    background: transparent;
}

/* Rating Item Styles */
.rating-item {
    padding: 1rem;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: box-shadow 0.2s ease;
}
.rating-item.has-comment {
    cursor: pointer;
}
.rating-item.has-comment:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border-color: #ced4da;
}
.rating-main-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}
.product-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
}
.product-image-container {
    flex-shrink: 0;
}
.product-image {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid #e9ecef;
}
.rating-product-name { 
    font-weight: 500; 
    flex: 1;
    font-size: 0.95rem;
}
.rating-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
}
.rating-stars { 
    color: #ffc107; 
    font-size: 0.9rem;
}
.rating-stars .fa-star:not(.filled) { color: #e0e0e0; }
.rating-date {
    font-size: 0.75rem;
    color: #6c757d;
}
.comment-status {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 12px;
    white-space: nowrap;
}
.view-comment {
    background-color: #e7f1ff;
    color: #0d6efd;
}
.no-comment {
    background-color: #f1f3f4;
    color: #6c757d;
}

/* Comment Modal Styles */
.comment-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
}
.comment-modal-content {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    width: 90%;
    max-width: 500px;
    animation: modal-fade-in 0.3s ease-out;
}
.comment-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
}
.comment-modal-body textarea {
    resize: vertical;
    font-family: inherit;
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
}
.rating-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.rating-info .rating-stars {
    font-size: 1.1rem;
}
.rating-value {
    font-weight: 600;
    color: #495057;
}
@keyframes modal-fade-in {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Status Badge Styling */
.status-badge {
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: bold;
    font-size: 0.9rem;
}
.status-pending { background-color: #fff8e1; color: #f59e0b; }
.status-processing { background-color: #e0f7fa; color: #06b6d4; }
.status-shipped { background-color: #f3e5f5; color: #a855f7; }
.status-completed { background-color: #e8f5e9; color: #22c55e; }
.status-cancelled { background-color: #ffebee; color: #ef4444; }

/* Responsive adjustments */
@media (max-width: 768px) {
    .rating-main-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    .rating-details {
        align-items: flex-start;
        flex-direction: row;
        gap: 0.75rem;
    }
    .product-info {
        width: 100%;
    }
    .orders-pagination{
        margin-top: 30px;
    }
}
</style>
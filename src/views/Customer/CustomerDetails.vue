<template>
    <div class="container-fluid px-4 py-4">
        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
            <p class="mt-3 text-muted">جاري تحميل بيانات العميل...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

        <div v-else-if="customer" class="customer-details-page">
            <div class="details-header mb-4">
                <div class="d-flex align-items-center">
                    <div class="customer-avatar me-3">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <h2 class="customer-name mb-0">{{ customer.full_name }}</h2>
                        <span class="badge fs-6" :class="customer.is_active ? 'bg-success' : 'bg-danger'">
                            {{ customer.is_active ? 'نشط' : 'معطل' }}
                        </span>
                    </div>
                </div>
                <router-link to="/customers" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-right me-2"></i>
                    العودة إلى العملاء
                </router-link>
            </div>

            <div class="card shadow-sm mb-4">
                <div class="card-header">
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
                            <label><i class="fas fa-calendar-alt"></i> تاريخ التسجيل</label>
                            <p>{{ formatDate(customer.registration_date) }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-lg-7">
                    <div class="card shadow-sm">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-receipt me-2"></i>سجل الطلبات</h5>
                        </div>
                        <div class="card-body p-0">
                            <div v-if="customerOrders.length > 0" class="orders-container">
                                <div class="order-item header sticky-header">
                                    <div class="order-info">الطلب</div>
                                    <div class="order-total">المجموع</div>
                                    <div class="order-status">الحالة</div>
                                </div>
                                <div class="scrollable-orders-body">
                                    <div class="orders-list">
                                        <div v-for="order in customerOrders" :key="order.id" class="order-item clickable"
                                             @click="openOrderDetailsModal(order)">
                                            <div class="order-info">
                                                <span class="order-id">#{{ order.id }}</span>
                                                <span class="order-date">{{ formatDate(order.orderDate) }}</span>
                                            </div>
                                            <div class="order-total">{{ order.totalAmount }} دينار</div>
                                            <div class="order-status">
                                                <span class="status-badge" :class="getStatusBadgeClass(order.status)">{{ order.status }}</span>
                                            </div>
                                        </div>
                                    </div>
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
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-star me-2"></i>تقييمات المنتجات</h5>
                        </div>
                        <div class="card-body scrollable-card-body">
                            <div v-if="customerRatings.length > 0" class="ratings-list">
                                <div v-for="rating in customerRatings" :key="rating.productId" 
                                     class="rating-item" 
                                     :class="{ 'has-comment': rating.comment }"
                                     @click="rating.comment ? openCommentModal(rating) : null">
                                    <div class="rating-main-info">
                                        <span class="rating-product-name">{{ rating.productName }}</span>
                                        <div class="rating-details">
                                            <div class="rating-stars">
                                                <i v-for="i in 5" :key="i" class="fas fa-star"
                                                    :class="{ 'filled': i <= rating.rating }"></i>
                                            </div>
                                            <span v-if="rating.comment" class="comment-status view-comment">
                                                عرض التعليق
                                            </span>
                                            <span v-else class="comment-status no-comment">
                                                بدون تعليق
                                            </span>
                                        </div>
                                    </div>
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
                    <h5 class="mb-0">تعليق على المنتج: {{ selectedComment.productName }}</h5>
                    <button type="button" class="btn-close" @click="closeCommentModal"></button>
                </div>
                <div class="comment-modal-body">
                    <textarea class="form-control" :value="selectedComment.comment" readonly rows="8"></textarea>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrderStore } from '@/stores/orderStore';
import OrderDetails from '@/components/Order/OrderDetails.vue';

const route = useRoute();
const customerStore = useCustomerStore();
const orderStore = useOrderStore();

const customer = ref(null);
const isLoading = ref(true);
const error = ref(null);
const isOrderDetailsVisible = ref(false);
const selectedOrder = ref(null);

// State for the new comment modal
const isCommentModalVisible = ref(false);
const selectedComment = ref(null);

onMounted(async () => {
    const customerId = parseInt(route.params.id);
    // Fetch all data concurrently
    await Promise.all([
        customerStore.fetchCustomers(),
        orderStore.fetchOrders(),
    ]);
    customer.value = customerStore.getCustomerById(customerId);
    if (!customer.value) {
        error.value = `لم يتم العثور على عميل بالمعرف ${customerId}`;
    }
    isLoading.value = false;
});

const customerOrders = computed(() => {
    if (!customer.value) return [];
    return orderStore.getOrdersByCustomerId(customer.value.id);
});

const customerRatings = computed(() => {
    if (!customer.value) return [];
    return orderStore.getCustomerProductRatings(customer.value.id);
});

// --- New Modal Functions ---
const openCommentModal = (rating) => {
    selectedComment.value = rating;
    isCommentModalVisible.value = true;
};

const closeCommentModal = () => {
    isCommentModalVisible.value = false;
    selectedComment.value = null;
};
// --- End New Modal Functions ---

const openOrderDetailsModal = (order) => {
    selectedOrder.value = order;
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
    return new Date(dateString).toLocaleDateString('ar-EG', options);
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
    background: #ea6666;
    color: white;
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
.scrollable-card-body {
    max-height: 500px;
    overflow-y: auto;
}
.orders-container { position: relative; }
.sticky-header {
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 2px solid #dee2e6;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.scrollable-orders-body {
    max-height: 400px;
    overflow-y: auto;
}
.orders-list {
    display: flex;
    flex-direction: column;
    padding: 0;
}
.ratings-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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

/* --- Updated Rating Item Styles --- */
.rating-item {
    padding: 1rem;
    background-color: #f8f9fa;
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
}
.rating-product-name { font-weight: 500; }
.rating-details {
    display: flex;
    align-items: center;
    gap: 1rem;
}
.rating-stars { color: #ffc107; }
.rating-stars .fa-star:not(.filled) { color: #e0e0e0; }
.comment-status {
    font-size: 0.8rem;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 20px;
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

/* --- New Comment Modal Styles --- */
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
</style>
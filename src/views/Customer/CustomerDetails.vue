<template>
    <div class="container-fluid px-4 py-4">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
            <p class="mt-3 text-muted">جاري تحميل بيانات العميل...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

        <!-- Main Content -->
        <div v-else-if="customer" class="customer-details-page">
            <!-- Header -->
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

            <!-- Customer Info Card -->
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

            <!-- Orders and Ratings -->
            <div class="row">
                <!-- Orders History Section -->
                <div class="col-lg-7">
                    <div class="card shadow-sm">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-receipt me-2"></i>سجل الطلبات</h5>
                        </div>
                        <div class="card-body p-0">
                            <div v-if="customerOrders.length > 0" class="orders-container">
                                <!-- Fixed Header -->
                                <div class="order-item header sticky-header">
                                    <div class="order-info">الطلب</div>
                                    <div class="order-total">المجموع</div>
                                    <div class="order-status">الحالة</div>
                                </div>
                                
                                <!-- Scrollable Orders List -->
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

                <!-- Ratings Section -->
                <div class="col-lg-5">
                    <div class="card shadow-sm">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-star me-2"></i>تقييمات المنتجات</h5>
                        </div>
                        <div class="card-body scrollable-card-body">
                            <div v-if="customerRatings.length > 0" class="ratings-list">
                                <div v-for="rating in customerRatings" :key="rating.productId" class="rating-item">
                                    <span class="rating-product-name">{{ rating.productName }}</span>
                                    <div class="rating-stars">
                                        <i v-for="i in 5" :key="i" class="fas fa-star"
                                            :class="{ 'filled': i <= rating.rating }"></i>
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

        <!-- Order Details Modal -->
        <OrderDetails v-if="isOrderDetailsVisible" :order="selectedOrder" @close="closeOrderDetailsModal" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import OrderDetails from '@/components/Order/OrderDetails.vue';

const route = useRoute();
const customerStore = useCustomerStore();
const orderStore = useOrderStore();
const productStore = useProductStore();

const customer = ref(null);
const isLoading = ref(true);
const error = ref(null);

const isOrderDetailsVisible = ref(false);
const selectedOrder = ref(null);

onMounted(async () => {
    const customerId = parseInt(route.params.id);
    await Promise.all([
        customerStore.fetchCustomers(),
        orderStore.fetchOrders(),
        productStore.fetchProducts()
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
    const ratings = [];
    customerOrders.value.forEach(order => {
        order.items.forEach(item => {
            if (item.rating) {
                const product = productStore.getProductById(item.productId);
                if (product) {
                    ratings.push({
                        productId: item.productId,
                        productName: product.name,
                        rating: item.rating,
                    });
                }
            }
        });
    });
    return ratings;
});

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

.customer-name {
    font-weight: bold;
}

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

/* New Orders Container Structure */
.orders-container {
    position: relative;
}

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

.orders-list,
.ratings-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
}

.order-item {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1.5fr;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
}

.order-item.header {
    background-color: #e9ecef;
    font-weight: bold;
    margin: 0;
    border-radius: 0;
}

.order-item.clickable {
    cursor: pointer;
    transition: all 0.2s ease;
}

.order-item.clickable:hover {
    background-color: #e3f2fd;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
    transform: translateY(-1px);
}

.order-info {
    display: flex;
    flex-direction: column;
}

.order-id {
    font-weight: bold;
}

.order-date {
    font-size: 0.9rem;
    color: #6c757d;
}

.order-total {
    font-weight: bold;
    font-size: 1.1rem;
}

.rating-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
}

.rating-product-name {
    font-weight: 500;
}

.rating-stars {
    color: #ffc107;
}

.rating-stars .fa-star:not(.filled) {
    color: #e0e0e0;
}

/* Status Badge Styling */
.status-badge {
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: bold;
    border: none;
    font-size: 0.9rem;
    display: inline-block;
}

.status-pending {
    background-color: #fff8e1;
    color: #f59e0b;
}

.status-processing {
    background-color: #e0f7fa;
    color: #06b6d4;
}

.status-shipped {
    background-color: #f3e5f5;
    color: #a855f7;
}

.status-completed {
    background-color: #e8f5e9;
    color: #22c55e;
}

.status-cancelled {
    background-color: #ffebee;
    color: #ef4444;
}

.status-default {
    background-color: #f1f3f4;
    color: #495057;
}
</style>
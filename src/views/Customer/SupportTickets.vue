<template>
  <div class="container-fluid px-4 py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
      <h1 class="h2 fw-bold text-dark mb-0">إدارة تذاكر الدعم</h1>
    </div>

    <div class="row mb-4 g-3">
      <div class="col-lg-12">
        <div class="search-filter-container">
          <div class="search-container">
            <input v-model="searchQuery" type="text" placeholder="البحث برقم الطلب او باسم العميل او بالعنوان..."
              class="form-control search-input" />
            <i class="fas fa-search search-icon"></i>
          </div>
          <div class="filter-container">
            <select v-model="statusFilter" class="form-control status-filter">
              <option value="all">كل الحالات</option>
              <option v-for="status in availableStatuses" :key="status" :value="status">{{ status }}</option>
            </select>
            <i class="fas fa-chevron-down filter-icon"></i>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isLoading && !error && totalTickets > 0" class="row mb-3">
      <div class="col-12">
        <div class="pagination-info">
          <span class="info-text">
            عرض {{ totalTickets > 0 ? startIndex + 1 : 0 }} - {{ endIndex }} من {{ totalTickets }} تذكرة
          </span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-dark" role="status"></div>
      <p class="mt-2 text-muted">جاري تحميل التذاكر...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="filteredTickets.length > 0" class="tickets-grid">
      <div 
        v-for="ticket in filteredTickets" 
        :key="ticket.id" 
        class="ticket-card"
        :class="{ 'has-new-reply': hasNewReply(ticket.id) }"
      >
        <div class="ticket-header">
          <!-- New Reply Badge -->
          <div v-if="hasNewReply(ticket.id)" class="new-reply-badge">
            <i class="fas fa-bell"></i>
            <span>رد جديد</span>
          </div>
          
          <div class="ticket-title-section">
            <h5 class="ticket-title" :title="ticket.title">{{ ticket.title }}</h5>
            <span class="ticket-id">#{{ ticket.id }}</span>
          </div>
          <div class="status-button-group">
            <button 
              v-for="status in availableStatuses" 
              :key="status"
              @click="handleStatusUpdate(ticket, status)"
              :class="['status-option', getStatusBadgeClass(status), { 'active': ticket.status === status }]"
              :disabled="ticket.status === status"
            >
              {{ status }}
            </button>
          </div>
        </div>
        
        <div class="ticket-body">
          <p class="ticket-description" :title="ticket.description">{{ ticket.description }}</p>
          
          <div class="ticket-info">
            <div class="info-item clickable" @click="navigateToCustomer(ticket.userId)">
              <i class="fas fa-user"></i>
              <span>{{ ticket.user }}</span>
            </div>
            <div class="info-item clickable" @click="openOrderDetails(ticket.order)">
              <i class="fas fa-shopping-bag"></i>
              <span>رقم الطلب: {{ ticket.order }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-calendar-alt"></i>
              <span>{{ formatDate(ticket.createdAt) }}</span>
            </div>
            <div class="info-item">
              <button @click="navigateToDetails(ticket)" class="btn-details-inline">
                <i class="fas fa-eye"></i>
                عرض التفاصيل
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-5">
      <i class="fas fa-ticket-alt fa-4x text-muted mb-3"></i>
      <h4 class="text-muted">لا توجد تذاكر تطابق الفلتر</h4>
    </div>

    <div v-if="!isLoading && !error && totalTickets > 0" class="pagination-wrapper">
      <div class="pagination-container">
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="pagination-btn prev-btn">
          <i class="fas fa-chevron-right"></i>
          السابق
        </button>
        
        <div class="page-numbers">
          <button v-for="(page, index) in visiblePages" :key="index" @click="goToPage(page)"
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
      
      <div class="page-jump-container">
        <span class="page-jump-label">الانتقال إلى الصفحة:</span>
        <input 
          v-model.number="pageJumpInput" 
          type="number" 
          :min="1" 
          :max="totalPages"
          @keyup.enter="jumpToPage"
          @input="handlePageInputChange"
          class="page-jump-input"
          placeholder="رقم"
        />
        <button @click="jumpToPage" class="page-jump-btn" :disabled="!pageJumpInput">
          <i class="fas fa-arrow-left"></i>
        </button>
        <span class="page-jump-info">من {{ totalPages }}</span>
      </div>
    </div>

    <div v-if="showConfirmModal" class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">تأكيد تغيير الحالة</h5>
          </div>
          <div class="modal-body text-center">
            <div class="status-change-info">
              <p class="mb-3">هل أنت متأكد من تغيير حالة التذكرة رقم <strong class="ticket-id-highlight">#{{ selectedTicket.id }}</strong>؟</p>
              
              <div class="status-transition">
                <div class="status-from">
                  <span class="status-label">من:</span>
                  <span class="status-badge" :class="getStatusBadgeClass(selectedTicket.status)">
                    {{ selectedTicket.status }}
                  </span>
                </div>
                
                <div class="arrow-container">
                  <i class="fas fa-arrow-down"></i>
                </div>
                
                <div class="status-to">
                  <span class="status-label">إلى:</span>
                  <span class="status-badge" :class="getStatusBadgeClass(newStatus)">
                    {{ newStatus }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancelStatusUpdate">إلغاء</button>
            <button type="button" class="btn btn-dark" @click="confirmStatusUpdate" :disabled="updating">
              <span v-if="updating" class="loading-spinner"></span>
              {{ updating ? "جاري التحديث..." : "تأكيد التغيير" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-dialog error-modal" @click.stop>
        <div class="modal-icon error-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <h3>حدث خطأ!</h3>
        <p>{{ modalErrorMessage }}</p>
        <button @click="closeErrorModal" class="btn btn-danger">إغلاق</button>
      </div>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-dialog success-modal" @click.stop>
        <div class="modal-icon success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>تم بنجاح!</h3>
        <p>تم تحديث حالة التذكرة بنجاح</p>
        <button @click="closeSuccessModal" class="btn btn-success">إغلاق</button>
      </div>
    </div>

    <OrderDetails 
      v-if="isOrderDetailsVisible && selectedOrder" 
      :order="selectedOrder" 
      @close="closeOrderDetailsModal" 
    />

    <div v-if="isOrderLoading" class="modal fade show d-block" style="background-color: rgba(0,0,0,0.6); z-index: 1070;">
      <div class="modal-dialog modal-dialog-centered border-0">
        <div class="modal-content text-center p-4 border-0" style="background: transparent;">
           <div class="spinner-border text-light mx-auto" role="status" style="width: 3.5rem; height: 3.5rem;"></div>
           <p class="mt-3 mb-0 text-light fw-bold fs-5">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useSupportTicketStore } from '@/stores/supportTicketStore';
import { useOrderStore } from '@/stores/orderStore';
import { useRouter, useRoute } from 'vue-router';
import OrderDetails from '@/components/Order/OrderDetails.vue';

import { useSupportTicketNotificationStore } from '@/stores/supportTicketNotificationStore';
import { db } from '@/firebase';
import { collection, query, where, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';

// Router and route
const router = useRouter();
const route = useRoute();

// Store instances
const ticketStore = useSupportTicketStore();
const orderStore = useOrderStore();
const ticketNotificationStore = useSupportTicketNotificationStore();

// State for filters and modals
const searchQuery = ref('');
const statusFilter = ref('all');
const availableStatuses = ['مفتوحة', 'قيد المعالجة', 'مغلقة'];

const selectedTicket = ref(null);

const showConfirmModal = ref(false);
const newStatus = ref('');
const updating = ref(false);

// Error modal state
const showErrorModal = ref(false);
const modalErrorMessage = ref('');

// Success modal state
const showSuccessModal = ref(false);

// Pagination state
const currentPage = ref(parseInt(route.query.page) || 1);
const itemsPerPage = ref(10);
const pageJumpInput = ref('');

// Order Details Modal State
const isOrderDetailsVisible = ref(false);
const selectedOrder = ref(null);
const isOrderLoading = ref(false);

// Firestore listener
let unsubscribeReplyNotifications = null;

// Function to mark all ticket notifications as read
const markTicketNotificationsAsRead = async () => {
  try {
    console.log("Marking all ticket notifications as read...");
    
    const ticketNotificationsQuery = query(
      collection(db, 'ticket_notifications'),
      where('is_read', '==', false)
    );
    
    const snapshot = await getDocs(ticketNotificationsQuery);
    
    if (snapshot.empty) {
      console.log("No unread ticket notifications found.");
      return;
    }
    
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { is_read: true });
    });
    
    await batch.commit();
    
    console.log(`Marked ${snapshot.size} ticket notifications as read.`);
    
    // Update the store count to 0
    ticketNotificationStore.setNewTicketCount(0);
    
  } catch (error) {
    console.error("Error marking ticket notifications as read:", error);
  }
};

// Computed properties
const isLoading = computed(() => ticketStore.isLoading);
const error = computed(() => ticketStore.error);
const totalTickets = computed(() => ticketStore.getTicketsCount);

const totalPages = computed(() => {
  if (totalTickets.value === 0) return 1;
  return Math.ceil(totalTickets.value / itemsPerPage.value);
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const endIndex = computed(() => {
  const end = startIndex.value + itemsPerPage.value;
  return Math.min(end, totalTickets.value);
});

const visiblePages = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;
    const pageWindow = 5;
    const pages = [];

    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
        return pages;
    }

    if (current <= pageWindow - 2) {
        for (let i = 1; i <= pageWindow; i++) {
            pages.push(i);
        }
        pages.push('...');
        pages.push(total);
    }
    else if (current > total - (pageWindow - 2)) {
        pages.push(1);
        pages.push('...');
        for (let i = total - pageWindow + 1; i <= total; i++) {
            pages.push(i);
        }
    }
    else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
    }
    
    return pages;
});

// Apply client-side filters to data
const filteredTickets = computed(() => {
  let tickets = ticketStore.getAllTickets;

  if (statusFilter.value !== 'all') {
    tickets = tickets.filter(ticket => ticket.status === statusFilter.value);
  }
  return tickets;
});

// Check if ticket has new reply
const hasNewReply = (ticketId) => {
  return ticketStore.hasNewReply(ticketId);
};

// Update URL query params without reloading
const updateUrlParams = () => {
  const query = { ...route.query };
  
  if (currentPage.value > 1) {
    query.page = currentPage.value.toString();
  } else {
    delete query.page;
  }
  
  router.replace({ query });
};

// Fetch tickets with filters
const fetchTicketsWithFilters = () => {
  updateUrlParams();
  ticketStore.fetchTickets({ page: currentPage.value, search: searchQuery.value });
};

// Listen to reply notifications from Firestore
const listenToReplyNotifications = () => {
  console.log("Listening for unread reply notifications...");
  
  const replyNotificationsQuery = query(
    collection(db, 'reply_notifications'),
    where('is_read', '==', false),
    where('type', '==', 'new_reply')
  );

  unsubscribeReplyNotifications = onSnapshot(replyNotificationsQuery, (snapshot) => {
    const ticketIdsWithReplies = new Set();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.ticket_id) {
        ticketIdsWithReplies.add(data.ticket_id);
      }
    });
    
    // Update the store with tickets that have new replies
    ticketStore.setTicketsWithNewReplies(Array.from(ticketIdsWithReplies));
    
    console.log(`Found ${ticketIdsWithReplies.size} tickets with new replies`);
  });
};

// Watcher for search query with debounce
let debounceTimer = null;
watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchTicketsWithFilters();
  }, 500);
});

watch(totalPages, (newTotalPages) => {
  if (currentPage.value > newTotalPages && newTotalPages > 0) {
    currentPage.value = newTotalPages;
  } else if (newTotalPages === 0) {
    currentPage.value = 1;
  }
});

// Methods
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadgeClass = (status) => {
  const statusClasses = {
    'مفتوحة': 'status-open',
    'قيد المعالجة': 'status-in-progress',
    'مغلقة': 'status-closed',
  };
  return statusClasses[status] || 'status-default';
};

const displayErrorModal = (errorMessage) => {
  modalErrorMessage.value = errorMessage || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  showErrorModal.value = true;
};

const closeErrorModal = () => {
  showErrorModal.value = false;
  modalErrorMessage.value = '';
  
  if (showConfirmModal.value) {
    cancelStatusUpdate();
  }
};

const displaySuccessModal = () => {
  showSuccessModal.value = true;
  setTimeout(() => {
    closeSuccessModal();
  }, 2000);
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && typeof page === 'number') {
    currentPage.value = page;
    fetchTicketsWithFilters();
  }
};

const jumpToPage = () => {
  const page = parseInt(pageJumpInput.value);
  
  if (!pageJumpInput.value || isNaN(page)) {
    alert('الرجاء إدخال رقم صفحة صحيح');
    return;
  }
  
  if (page < 1) {
    alert(`رقم الصفحة يجب أن يكون 1 أو أكثر`);
    pageJumpInput.value = '';
    return;
  }
  
  if (page > totalPages.value) {
    alert(`رقم الصفحة يجب أن يكون ${totalPages.value} أو أقل`);
    pageJumpInput.value = '';
    return;
  }
  
  goToPage(page);
  pageJumpInput.value = '';
};

const handlePageInputChange = () => {
  if (pageJumpInput.value < 1) {
    pageJumpInput.value = '';
  }
  if (pageJumpInput.value > totalPages.value) {
    pageJumpInput.value = totalPages.value;
  }
};

onMounted(async () => {
  // Initialize from URL query params
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page) || 1;
  }
  
  try {
    await fetchTicketsWithFilters();
    listenToReplyNotifications();
    
    // Mark ticket notifications as read when page opens
    await markTicketNotificationsAsRead();
  } catch (error) {
    console.error('Error loading data:', error);
    displayErrorModal('فشل في تحميل البيانات. يرجى إعادة تحميل الصفحة.');
  }
});

onUnmounted(() => {
  // Clean up Firestore listener
  if (unsubscribeReplyNotifications) {
    unsubscribeReplyNotifications();
  }
});

const navigateToDetails = (ticket) => {
  router.push({
    path: `/support-tickets/${ticket.id}`,
    query: { returnPage: currentPage.value }
  });
};

const handleStatusUpdate = (ticket, status) => {
  selectedTicket.value = ticket;
  newStatus.value = status;
  showConfirmModal.value = true;
};

const cancelStatusUpdate = () => {
  showConfirmModal.value = false;
  selectedTicket.value = null;
  newStatus.value = '';
  updating.value = false;
};

const confirmStatusUpdate = async () => {
  if (!selectedTicket.value || !newStatus.value) {
    displayErrorModal('بيانات التذكرة غير صحيحة.');
    return;
  }

  updating.value = true;
  
  try {
    const result = await ticketStore.updateTicketStatus(selectedTicket.value.id, newStatus.value);
    
    if (result.success) {
      cancelStatusUpdate();
      displaySuccessModal();
    } else {
      cancelStatusUpdate();
      const errorMessage = result.error || 'فشل في تحديث حالة التذكرة.';
      displayErrorModal(errorMessage);
    }
  } catch (error) {
    console.error('Error updating ticket status:', error);
    cancelStatusUpdate();
    displayErrorModal('حدث خطأ أثناء تحديث حالة التذكرة.');
  } finally {
    updating.value = false;
  }
};

const navigateToCustomer = (customerId) => {
  if (customerId) {
    router.push(`/customers/${customerId}`);
  } else {
    displayErrorModal('معرف العميل غير متوفر لهذه التذكرة.');
  }
};

const openOrderDetails = async (orderId) => {
  if (!orderId) {
    displayErrorModal('رقم الطلب غير متوفر لهذه التذكرة.');
    return;
  }
  isOrderLoading.value = true;
  isOrderDetailsVisible.value = false;
  selectedOrder.value = null;

  try {
    const orderData = await orderStore.fetchOrderById(orderId);
    if (orderData) {
      selectedOrder.value = orderData;
      isOrderDetailsVisible.value = true;
    } else {
      displayErrorModal(`#${orderId} لم يتم العثور على الطلب رقم`);
    }
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    displayErrorModal('فشل في تحميل تفاصيل الطلب.');
  } finally {
    isOrderLoading.value = false;
  }
};

const closeOrderDetailsModal = () => {
  isOrderDetailsVisible.value = false;
  selectedOrder.value = null;
};
</script>

<style scoped>
/* Search and Filter Styling */
.search-filter-container {
  display: flex;
  gap: 20px;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
}

.search-input,
.status-filter {
  padding: 18px 50px 18px 20px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 18px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  text-align: right;
  direction: rtl;
  width: 100%;
}

.search-input:focus,
.status-filter:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 4px 20px rgba(0, 123, 255, 0.2);
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 18px;
}

.filter-container {
  position: relative;
  min-width: 220px;
}

.status-filter {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.filter-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
}

/* Pagination Info */
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

/* Tickets Grid */
.tickets-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 30px;
  align-items: center;
}

.ticket-card {
  background: none;
  position: relative;
  overflow: visible;
  transition: all 0.3s ease;
  border-radius: 30px;
  display: grid;
  grid-template-columns: 350px 1fr;
  min-height: 200px;
  max-width: 1000px;
  z-index: 1;
}

.ticket-card:hover {
  transform: translateY(-4px);
}

.ticket-header {
  padding: 25px;
  background: var(--primary);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  border-radius: 30px;
  grid-column: 1;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.4);
}

.ticket-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 78%;
  background-image: linear-gradient(
    to bottom, 
    #dadada 70%,
    transparent 10%
  );
  background-size: 100% 20px;
}

.ticket-title-section {
  text-align: right;
  margin-bottom: 15px;
  background: #3a3a3a;
  padding: 10px;
  border-radius: 12px;
}

.ticket-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  direction: rtl;
  color: #f0f0f0;
  text-shadow: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ticket-id {
  font-size: 15px;
  color: #e9e9e9;
  font-weight: 600;
  background: #1a1a1a;
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
}

/* Status Button Group */
.status-button-group {
  display: flex;
  gap: 5px;
  background-color: rgba(255,255,255,0.05);
  padding: 5px;
  border-radius: 12px;
}

.status-option {
  padding: 8px 16px;
  border: 2px solid;
  background: transparent;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  text-align: center;
  position: relative;
  flex-grow: 1;
}

.status-option:hover:not(:disabled) {
  transform: translateY(-2px);
}

.status-option:disabled {
  opacity: 1;
  cursor: not-allowed;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
}

/* -- Open Status -- */
.status-option.status-open {
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.5);
}
.status-option.status-open:hover:not(:disabled),
.status-option.status-open:disabled {
  background-color: #f59e0b;
  border-color: #f59e0b;
  color: #fff;
}

/* -- In Progress Status -- */
.status-option.status-in-progress {
  color: #06b6d4;
  border-color: rgba(6, 182, 212, 0.5);
}
.status-option.status-in-progress:hover:not(:disabled),
.status-option.status-in-progress:disabled {
  background-color: #06b6d4;
  border-color: #06b6d4;
  color: #fff;
}

/* -- Closed Status -- */
.status-option.status-closed {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.5);
}
.status-option.status-closed:hover:not(:disabled),
.status-option.status-closed:disabled {
  background-color: #22c55e;
  border-color: #22c55e;
  color: #fff;
}

.ticket-body {
  padding: 25px 30px;
  direction: rtl;
  text-align: right;
  background: var(--primary);
  display: flex;
  flex-direction: column;
  grid-column: 2;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.4);
}

.ticket-description {
  line-height: 1.8;
  margin-bottom: 20px;
  font-size: 15px;
  padding: 15px;
  background: #3a3a3a;
  color: #c0c0c0;
  border-radius: 4px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ticket-info {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: auto;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #b0b0b0;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 12px;
  background: #3a3a3a;
  border-radius: 6px;
}

.info-item i {
  width: 18px;
  color: #d0d0d0;
  font-size: 15px;
  flex-shrink: 0;
}

.btn-details-inline {
  background: transparent;
  color: #d0d0d0;
  border: 1px solid #606060;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  width: 100%;
}

.btn-details-inline:hover {
  background: #606060;
  color: #fff;
  border-color: #606060;
  transform: translateY(-2px);
  box-shadow: none;
}

/* Status Badges - Only for Modal */
.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}

.status-badge.status-open {
  background-color: #f59e0b;
  color: #fff;
}

.status-badge.status-in-progress {
  background-color: #06b6d4;
  color: #fff;
}

.status-badge.status-closed {
  background-color: #22c55e;
  color: #fff;
}

.status-badge.status-default {
  background-color: #495057;
  color: #fff;
}

/* PAGINATION STYLES */
.pagination-wrapper {
  margin-top: 30px;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 15px;
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
  border-color: #292929;
  color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(29, 29, 29, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.page-numbers {
  display: flex;
  flex-wrap: nowrap; 
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
  border-color: #313131;
  color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(131, 131, 131, 0.2);
}

.page-number.active {
  border-color: #313131;
  background: #0f0f0f;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.page-number.active:hover {
  border-color: #b9b9b9;
  color: rgb(189, 189, 189);
  transform: translateY(-2px);
}

.page-number.disabled {
  cursor: default;
  background-color: #f8f9fa;
  border-color: #e9ecef;
}

.page-jump-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-jump-label {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.page-jump-input {
  width: 70px;
  height: 40px;
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  direction: ltr;
}

.page-jump-input:focus {
  outline: none;
  border-color: #313131;
  box-shadow: 0 0 0 3px rgba(49, 49, 49, 0.1);
}

.page-jump-input::-webkit-inner-spin-button,
.page-jump-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-jump-input[type=number] {
  -moz-appearance: textfield;
}

.page-jump-input:invalid {
  border-color: #dc3545;
}

.page-jump-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-jump-btn:hover:not(:disabled) {
  border-color: #313131;
  color: #0f0f0f;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(29, 29, 29, 0.2);
}

.page-jump-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-jump-info {
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
}

/* Modal Styling */
.modal-content {
  border-radius: 12px;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid #dee2e6;
  border-radius: 12px 12px 0 0;
  direction: rtl;
  text-align: right;
}

.modal-body {
  direction: rtl;
  text-align: right;
}

.btn-close {
  margin-left: auto;
}

/* Modal Status Styling */
.status-change-info {
  padding: 20px 0;
}

.ticket-id-highlight {
  color: #494949;
  font-size: 1.1em;
}

.status-transition {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
}

.status-from,
.status-to {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-direction: row;
  justify-content: flex-end;
}

.status-label {
  font-weight: 600;
  color: #6c757d;
  min-width: 30px;
}

.arrow-container {
  font-size: 1.2em;
  color: #6c757d;
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
  60% {
    transform: translateY(-3px);
  }
}

.modal-footer {
  border-top: 1px solid #f1f3f4;
  padding: 20px;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff, #0056b3);
  border: none;
  padding: 10px 25px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  border: none;
  padding: 10px 25px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* Loading spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal Overlay Base */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal Dialog Base */
.modal-dialog.error-modal,
.modal-dialog.success-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 450px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  direction: rtl;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.error-icon {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
}

.success-icon {
  background: linear-gradient(135deg, #27ae60, #219a52);
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
}

.modal-dialog h3 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-weight: 700;
}

.modal-dialog p {
  color: #7f8c8d;
  margin: 0 0 30px 0;
  font-size: 16px;
  line-height: 1.5;
  direction: rtl;
  text-align: center;
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c82333, #a71e2a);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #28a745, #1e7e34);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.btn-success:hover {
  background: linear-gradient(135deg, #1e7e34, #155724);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

/* Clickable Item Styling */
.info-item.clickable {
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.info-item.clickable:hover {
  background-color: #505050;
  transform: translateY(-2px);
}

.info-item.clickable span {
  text-decoration: underline;
  text-decoration-color: #a0a0a0;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

/* NEW REPLY NOTIFICATION STYLES */

/* Ticket card with new reply highlight */
.ticket-card.has-new-reply {
  animation: pulseGlow 2s ease-in-out infinite;
}

.ticket-card.has-new-reply .ticket-header {
  border: 3px solid #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.4), 0px 4px 15px rgba(0, 0, 0, 0.4);
  position: relative;
  animation: borderBlink 1.5s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.6));
  }
}

@keyframes borderBlink {
  0%, 100% {
    border-color: #fbbf24;
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0px 4px 15px rgba(0, 0, 0, 0.4);
  }
  50% {
    border-color: #f59e0b;
    box-shadow: 0 0 30px rgba(245, 158, 11, 0.8), 0px 4px 15px rgba(0, 0, 0, 0.4);
  }
}

/* New reply badge */
.new-reply-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
  animation: badgeBounce 1s ease-in-out infinite;
  z-index: 10;
}

.new-reply-badge i {
  animation: bellRing 1s ease-in-out infinite;
}

@keyframes badgeBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes bellRing {
  0%, 100% {
    transform: rotate(0deg);
  }
  10%, 30% {
    transform: rotate(-10deg);
  }
  20%, 40% {
    transform: rotate(10deg);
  }
  50% {
    transform: rotate(0deg);
  }
}

/* Enhance ticket card for better visibility of new reply */
.ticket-card.has-new-reply .ticket-body {
  border: 3px solid #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.4), 0px 4px 15px rgba(0, 0, 0, 0.4);
  animation: borderBlink 1.5s ease-in-out infinite;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .ticket-card {
    grid-template-columns: 300px 1fr;
  }

  .ticket-info {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .ticket-card {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }

  .ticket-header {
    grid-column: 1;
    grid-row: 1;
    border-right: none;
    border-bottom: 2px solid #606060;
    border-radius: 12px 12px 0 0;
  }

  .ticket-body {
    grid-column: 1;
    grid-row: 2;
    border-radius: 0 0 12px 12px;
  }

  .ticket-info {
    grid-template-columns: 1fr;
  }

  .search-filter-container {
    flex-direction: column;
  }

  .filter-container {
    width: 100%;
  }

  .pagination-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .page-numbers {
    order: -1; 
  }
  
  .page-jump-container {
    margin-top: 0;
  }

  .new-reply-badge {
    top: 5px;
    left: 5px;
    padding: 4px 8px;
    font-size: 11px;
  }
}

@media (max-width: 487px) {
  .container-fluid {
    padding: 15px;
  }

  .pagination-container {
    padding: 15px 10px;
  }

  .pagination-btn {
    padding: 8px 12px;
    font-size: 12px;
    gap: 5px;
    min-width: 80px;
  }

  .page-numbers {
    gap: 3px;
    margin: 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-number {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
    padding: 0;
  }

  .page-jump-container {
    padding: 12px 15px;
  }

  .page-jump-label {
    font-size: 12px;
  }

  .page-jump-input {
    width: 60px;
    height: 32px;
    font-size: 12px;
    padding: 6px 8px;
  }

  .page-jump-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .page-jump-info {
    font-size: 12px;
  }
}
</style>
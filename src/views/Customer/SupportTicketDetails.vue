<template>
    <div class="container-fluid px-4 py-4">
        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
            <p class="mt-3 text-muted">جاري تحميل تفاصيل التذكرة...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

        <div v-else-if="ticket" class="ticket-details-page">
            <div class="details-header mb-4">
                <div class="header-info">
                    <h2 class="ticket-title mb-1">
                        {{ ticket.title }}
                        <span class="ticket-id-badge">#{{ ticket.id }}</span>
                    </h2>
                    <div class="ticket-meta">
                        <span><i class="fas fa-user me-1"></i> {{ ticket.user }}</span>
                        <span><i class="fas fa-calendar-alt me-1"></i> {{ formatDate(ticket.created_at) }}</span>
                    </div>
                </div>
                <router-link to="/support-tickets" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-right me-2"></i>
                    العودة إلى التذاكر
                </router-link>
            </div>

            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="card shadow-sm chat-card">
                        <div class="card-body">
                            <div class="chat-container" ref="chatContainerRef">
                                <template v-for="item in chatItems" :key="item.key">
                                    <div v-if="item.type === 'divider'" class="day-divider">
                                        <span>{{ item.label }}</span>
                                    </div>
                                    
                                    <div v-else-if="item.type === 'message'"
                                         class="message-group"
                                         :class="isCustomerMessage(item) ? 'right-side' : 'left-side'">
                                        <div class="sender-name">{{ item.user }}</div>
                                        <div class="bubble"
                                             :class="isCustomerMessage(item) ? 'customer-bubble' : 'admin-bubble'">
                                            <p class="bubble-text">{{ item.message }}</p>
                                            <div class="time-stamp">{{ formatTime(item.created_at) }}</div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                            <form @submit.prevent="submitReply" class="reply-form mt-3">
                                <textarea v-model="newReply" class="form-control reply-input" placeholder="اكتب ردك هنا..." rows="1" :disabled="isSending" @keydown.enter.exact.prevent="submitReply"></textarea>
                                <button type="submit" class="btn reply-button" :disabled="isSending || !newReply.trim()">
                                    <span v-if="isSending" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    <span v-else class="material-icons">send</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card shadow-sm info-card">
                        <div class="card-header bg-dark text-white">
                            <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>معلومات التذكرة</h5>
                        </div>
                        <div class="card-body">
                            <div class="info-item">
                                <label>حالة التذكرة</label>
                                <div class="status-button-group details-page-buttons">
                                    <button v-for="status in availableStatuses" :key="status.value"
                                        @click="handleStatusUpdate(ticket, status.value)"
                                        :class="['status-option', getStatusButtonClass(status.value)]"
                                        :disabled="ticket.status === status.value">
                                        {{ status.text }}
                                    </button>
                                </div>
                            </div>
                             <div class="info-item">
                                <label><i class="fas fa-user"></i> اسم العميل</label>
                                <p>{{ ticket.user }}</p>
                            </div>
                            <div class="info-item">
                                <label><i class="fas fa-receipt"></i> رقم الطلب</label>
                                <p v-if="ticket.order">#{{ ticket.order }}</p>
                                <p v-else class="text-muted">لا يوجد</p>
                            </div>
                            <div class="info-item">
                                <label><i class="fas fa-calendar-plus"></i> تاريخ الإنشاء</label>
                                <p>{{ formatDate(ticket.created_at) }}</p>
                            </div>
                        </div>
                    </div>
                </div>
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
                            <p class="mb-3">هل أنت متأكد من تغيير حالة التذكرة رقم <strong class="ticket-id-highlight">#{{ ticket.id }}</strong>؟</p>
                            <div class="status-transition">
                                <div class="status-from">
                                    <span class="status-label">من:</span>
                                    <span class="status-badge" :class="getStatusButtonClass(ticket.status)">
                                        {{ ticket.status_display }}
                                    </span>
                                </div>
                                <div class="arrow-container"><i class="fas fa-arrow-down"></i></div>
                                <div class="status-to">
                                    <span class="status-label">إلى:</span>
                                    <span class="status-badge" :class="getStatusButtonClass(newStatus)">
                                        {{ availableStatuses.find(s => s.value === newStatus)?.text }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="cancelStatusUpdate">إلغاء</button>
                        <button type="button" class="btn btn-primary" @click="confirmStatusUpdate" :disabled="updating">
                            <span v-if="updating" class="loading-spinner"></span>
                            {{ updating ? "جاري التحديث..." : "تأكيد التغيير" }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
            <div class="modal-dialog error-modal" @click.stop>
                <div class="modal-icon error-icon"><i class="fas fa-times-circle"></i></div>
                <h3>حدث خطأ!</h3>
                <p>{{ modalErrorMessage }}</p>
                <button @click="closeErrorModal" class="btn btn-danger">إغلاق</button>
            </div>
        </div>

        <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
            <div class="modal-dialog success-modal" @click.stop>
                <div class="modal-icon success-icon"><i class="fas fa-check-circle"></i></div>
                <h3>تم بنجاح!</h3>
                <p>تم تحديث حالة التذكرة بنجاح</p>
                <button @click="closeSuccessModal" class="btn btn-success">إغلاق</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';

const route = useRoute();
const ticket = ref(null);
const isLoading = ref(true);
const error = ref(null);
const newReply = ref('');
const isSending = ref(false);
const chatContainerRef = ref(null);
const currentUserName = ref('موظف الدعم');

// ADDED: Status and Modal logic
const availableStatuses = ref([
  { text: 'مفتوحة', value: 'Open' },
  { text: 'قيد المعالجة', value: 'In Progress' },
  { text: 'مغلقة', value: 'Closed' }
]);
const showConfirmModal = ref(false);
const newStatus = ref('');
const updating = ref(false);
const showErrorModal = ref(false);
const modalErrorMessage = ref('');
const showSuccessModal = ref(false);


const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const formatDateForDivider = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    if (date > oneWeekAgo) {
        return date.toLocaleDateString('ar-LY', { weekday: 'long' });
    }
    return date.toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });
};

const chatItems = computed(() => {
    if (!ticket.value) return [];
    
    const initialMessage = {
        id: `initial-${ticket.value.id}`,
        user: ticket.value.user,
        message: ticket.value.description,
        created_at: ticket.value.created_at,
        role: 'CUSTOMER',
    };
    const allMessages = [initialMessage, ...(ticket.value.replies || [])];
    allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const processedItems = [];
    let lastDate = null;
    
    allMessages.forEach(message => {
        const messageDate = message.created_at;
        if (!lastDate || !isSameDay(lastDate, messageDate)) {
            processedItems.push({
                type: 'divider',
                key: `divider-${messageDate}`,
                label: formatDateForDivider(messageDate)
            });
        }
        
        processedItems.push({
            ...message,
            type: 'message',
            key: message.id
        });
        
        lastDate = messageDate;
    });

    return processedItems;
});

const fetchTicketDetails = async () => {
    const ticketId = route.params.id;
    isLoading.value = true;
    error.value = null;
    try {
        const response = await api.get(`/products/staff-ticket/${ticketId}/`);
        response.data.replies = response.data.replies || [];
        ticket.value = response.data;
    } catch (err) {
        console.error('Error fetching ticket details:', err);
        error.value = 'فشل في تحميل تفاصيل التذكرة. يرجى المحاولة مرة أخرى.';
    } finally {
        isLoading.value = false;
        await scrollToBottom();
    }
};

const fetchCurrentUser = async () => {
    try {
        const response = await api.get('/users/me/');
        if (response.data && response.data.full_name) {
            currentUserName.value = response.data.full_name;
        }
    } catch (err) {
        console.error('Error fetching current user:', err);
    }
};

const isCustomerMessage = (reply) => {
    if (reply.role) {
        const role = reply.role.toLowerCase();
        return role !== 'admin' && role !== 'staff';
    }
    return reply.user === ticket.value.user;
};

const submitReply = async () => {
    if (!newReply.value.trim()) return;

    isSending.value = true;
    const ticketId = route.params.id;
    const messageToSend = newReply.value;

    try {
        await api.post(`/products/staff-ticket/${ticketId}/reply/`, {
            message: messageToSend,
        });

        const newReplyObject = {
            id: Date.now(),
            user: currentUserName.value,
            message: messageToSend,
            created_at: new Date().toISOString(),
            role: 'ADMIN',
        };
        ticket.value.replies.push(newReplyObject);
        newReply.value = '';
        await scrollToBottom();

    } catch (err) {
        console.error('Error submitting reply:', err);
        alert('حدث خطأ أثناء إرسال الرد. يرجى المحاولة مرة أخرى.');
    } finally {
        isSending.value = false;
    }
};

const scrollToBottom = async () => {
    await nextTick();
    const container = chatContainerRef.value;
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
};

onMounted(() => {
    fetchTicketDetails();
    fetchCurrentUser();
});

const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ar-LY', options);
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// ADDED: Status update logic
const getStatusButtonClass = (status) => {
    const statusClasses = {
        'Open': 'status-open',
        'In Progress': 'status-in-progress',
        'Closed': 'status-closed',
    };
    return statusClasses[status] || 'status-default';
};

const handleStatusUpdate = (ticket, status) => {
  newStatus.value = status;
  showConfirmModal.value = true;
};

const cancelStatusUpdate = () => {
  showConfirmModal.value = false;
  newStatus.value = '';
  updating.value = false;
};

const confirmStatusUpdate = async () => {
  updating.value = true;
  try {
    const ticketId = route.params.id;
    const response = await api.patch(`/products/staff-ticket/${ticketId}/`, {
      status: newStatus.value,
    });
    // Update local ticket data for immediate UI feedback
    ticket.value.status = response.data.status;
    ticket.value.status_display = response.data.status_display;

    cancelStatusUpdate();
    displaySuccessModal();
  } catch (err) {
    console.error('Error updating status:', err);
    cancelStatusUpdate();
    displayErrorModal('فشل في تحديث الحالة.');
  } finally {
    updating.value = false;
  }
};

// ADDED: Modal helper functions
const displayErrorModal = (errorMessage) => {
  modalErrorMessage.value = errorMessage || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  showErrorModal.value = true;
};

const closeErrorModal = () => {
  showErrorModal.value = false;
  modalErrorMessage.value = '';
};

const displaySuccessModal = () => {
  showSuccessModal.value = true;
  setTimeout(() => closeSuccessModal(), 2000);
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
};
</script>

<style scoped>
/* NEW: Style for the date divider */
.day-divider {
    text-align: center;
    margin: 1rem 0;
}
.day-divider span {
    background-color: #e9eaeb; /* A neutral background color */
    color: #555;
    padding: 5px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
}


.details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.ticket-title {
    font-weight: bold;
    color: #2c3e50;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
}
.ticket-id-badge {
    font-size: 0.8rem;
    font-weight: 600;
    color: #6c757d;
    background-color: #f1f3f4;
    padding: 4px 10px;
    border-radius: 12px;
    vertical-align: middle;
    margin-right: 10px;
}
.ticket-meta {
    display: flex;
    gap: 1.5rem;
    color: #6c757d;
    font-size: 0.9rem;
}

/* Chat Card */
.chat-card .card-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    height: 70vh;
}

.chat-container {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Message Groups */
.message-group {
    display: flex;
    flex-direction: column;
    width: auto;
    max-width: 75%;
    margin-bottom: 0.5rem;
}

.left-side { align-self: flex-start; align-items: flex-start; }
.right-side { align-self: flex-end; align-items: flex-end; }

.sender-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6c757d;
    margin-bottom: 4px;
    padding: 0 8px;
}

.left-side .sender-name { align-self: flex-end; }
.right-side .sender-name { align-self: flex-start; }

.bubble {
    padding: 0.75rem 1rem;
    border-radius: 18px;
    width: auto;
    max-width: 100%;
    line-height: 1.5;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    display: inline-block;
}

.bubble-text {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
}

.time-stamp { font-size: 0.7rem; margin-top: 4px; padding: 0 8px; }
.left-side .time-stamp { align-self: flex-start; }
.right-side .time-stamp { align-self: flex-end; }

.customer-bubble { background-color: #f3f3f3; color: #212529; border-radius: 18px; border-bottom-left-radius: 4px; }
.admin-bubble { background-color: rgb(0, 0, 0); color: white; border-radius: 18px; border-bottom-right-radius: 4px; }

/* Reply Form */
.reply-form { display: flex; gap: 10px; align-items: flex-start; padding-top: 1rem; border-top: 1px solid #dee2e6; }
.reply-input { flex-grow: 1; resize: vertical; min-height: 50px; border-radius: 8px; }
.reply-button { flex-shrink: 0; width: 50px; height: 50px; border-radius: 50%; background-color: #000; border-color: #000; color: #fff; display: flex; align-items: center; justify-content: center; padding: 0; transition: background-color 0.3s ease, opacity 0.3s ease; }
.reply-button:hover:not(:disabled) { background-color: #333; border-color: #333; }
.reply-button:disabled { background-color: #6c757d; border-color: #6c757d; opacity: 0.5; cursor: not-allowed; }


/* Info Card */
.info-card .card-body { display: flex; flex-direction: column; gap: 1.25rem; }
.info-item label { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #6c757d; font-size: 0.9rem; margin-bottom: 5px; }
.info-item p { font-size: 1.1rem; color: #212529; margin: 0; padding-right: 22px; }

/* ADDED: Status Button Styles */
.status-button-group { display: flex; gap: 5px; background-color: rgba(255,255,255,0.05); padding: 5px; border-radius: 12px; }
.details-page-buttons { background-color: #f1f3f4;padding: 8px; }
.status-option { padding: 8px 16px; border: 2px solid; background: transparent; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.15s ease-in-out; text-align: center; position: relative; flex-grow: 1; }
.status-option:hover:not(:disabled) { transform: translateY(-2px); }
.status-option:disabled { opacity: 1; cursor: not-allowed; box-shadow: 0 2px 4px rgba(0,0,0,0.4); }

.status-option.status-open { color: #f59e0b; border-color: rgba(245, 158, 11, 0.5); }
.status-option.status-open:hover:not(:disabled), .status-option.status-open:disabled { background-color: #f59e0b; border-color: #f59e0b; color: #fff; }

.status-option.status-in-progress { color: #06b6d4; border-color: rgba(6, 182, 212, 0.5); }
.status-option.status-in-progress:hover:not(:disabled), .status-option.status-in-progress:disabled { background-color: #06b6d4; border-color: #06b6d4; color: #fff; }

.status-option.status-closed { color: #22c55e; border-color: rgba(34, 197, 94, 0.5); }
.status-option.status-closed:hover:not(:disabled), .status-option.status-closed:disabled { background-color: #22c55e; border-color: #22c55e; color: #fff; }


/* UPDATED: Status badge styles for consistency (used in modal) */
.status-badge { padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; color: #fff; }
.status-badge.status-open { background-color: #f59e0b; }
.status-badge.status-in-progress { background-color: #06b6d4; }
.status-badge.status-closed { background-color: #22c55e; }
.status-badge.status-default { background-color: #6c757d; }
.status-badge:not([class*='status-']) { color: #495057; }


/* ADDED: Modal Styles */
.modal-content { border-radius: 12px; border: none; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
.modal-header { background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-bottom: 2px solid #dee2e6; border-radius: 12px 12px 0 0; direction: rtl; text-align: right; }
.modal-body { direction: rtl; text-align: right; }
.status-change-info { padding: 20px 0; }
.ticket-id-highlight { color: #0d6efd; font-size: 1.1em; }
.status-transition { display: flex; flex-direction: column; align-items: center; gap: 15px; margin: 20px 0; }
.status-from, .status-to { display: flex; align-items: center; gap: 12px; }
.status-label { font-weight: 600; color: #6c757d; }
.arrow-container { font-size: 1.2em; color: #6c757d; animation: bounce 1.5s infinite; }
@keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } 60% { transform: translateY(-3px); } }
.modal-footer { border-top: 1px solid #f1f3f4; padding: 20px; }
.btn-primary { background: linear-gradient(135deg, #007bff, #0056b3); border: none; padding: 10px 25px; border-radius: 8px; font-weight: 600; transition: all 0.3s ease; }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-secondary { background: #6c757d; border: none; padding: 10px 25px; border-radius: 8px; font-weight: 600; transition: all 0.3s ease; }
.btn-secondary:hover { background: #5a6268; transform: translateY(-1px); }
.loading-spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; }
@keyframes spin { to { transform: rotate(360deg); } }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-dialog.error-modal, .modal-dialog.success-modal { background: white; border-radius: 20px; padding: 40px; text-align: center; max-width: 450px; width: 90%; animation: modalSlideIn 0.3s ease-out; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); direction: rtl; }
@keyframes modalSlideIn { from { opacity: 0; transform: translateY(-50px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
.modal-icon { width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; animation: iconPulse 2s ease-in-out infinite; }
@keyframes iconPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.error-icon { background: linear-gradient(135deg, #e74c3c, #c0392b); box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3); }
.success-icon { background: linear-gradient(135deg, #27ae60, #219a52); box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3); }
.modal-dialog h3 { font-size: 24px; color: #2c3e50; margin: 0 0 15px 0; font-weight: 700; }
.modal-dialog p { color: #7f8c8d; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5; }
.btn-danger { background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3); }
.btn-danger:hover { background: linear-gradient(135deg, #c82333, #a71e2a); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4); }
.btn-success { background: linear-gradient(135deg, #28a745, #1e7e34); color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); }
.btn-success:hover { background: linear-gradient(135deg, #1e7e34, #155724); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4); }

</style>
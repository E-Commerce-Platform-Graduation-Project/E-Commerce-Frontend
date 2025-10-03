import { defineStore } from 'pinia';
import api from '@/api';

export const useSupportTicketStore = defineStore('supportTicket', {
  state: () => ({
    tickets: [],
    ticketsCount: 0,
    isLoading: false,
    error: null,
  }),

  getters: {
    getAllTickets: (state) => {
      return [...state.tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    
    getTicketById: (state) => (ticketId) => {
      return state.tickets.find(ticket => ticket.id === ticketId);
    },
    
    getTicketsByUserId: (state) => (userId) => {
      return state.tickets
        .filter(ticket => ticket.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getTicketsCount: (state) => state.ticketsCount,
    getIsLoading: (state) => state.isLoading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchTickets({ page = 1, search = '' } = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = { page };
        if (search) params.search = search;

        const response = await api.get('products/staff-ticket/', { params });
        const apiTickets = Array.isArray(response.data) ? response.data : response.data.results || [];
        const count = response.data.count || apiTickets.length;

        const statusMap = {
          'Open': 'مفتوحة',
          'In Progress': 'قيد المعالجة',
          'Closed': 'مغلقة',
        };

        this.tickets = apiTickets.map(ticket => ({
          id: ticket.id,
          user: ticket.user,
          userId: ticket.user_id,
          title: ticket.title,
          description: ticket.description,
          order: ticket.order,
          status: statusMap[ticket.status] || ticket.status,
          statusDisplay: ticket.status_display,
          createdAt: ticket.created_at,
        }));
        
        this.ticketsCount = count;
        return { success: true };
      } catch (e) {
        this.error = 'فشل في جلب التذاكر.';
        console.error(e);
        return { success: false };
      } finally {
        this.isLoading = false;
      }
    },

    async updateTicketStatus(ticketId, newStatus) {
      this.isLoading = true;
      this.error = null;
      try {
        const statusMapReverse = {
          'مفتوحة': 'Open',
          'قيد المعالجة': 'In Progress',
          'مغلقة': 'Closed',
        };

        const englishStatus = statusMapReverse[newStatus] || newStatus;
        
        await api.patch(`products/staff-ticket/${ticketId}/`, { status: englishStatus });
        
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (ticket) {
          ticket.status = newStatus;
        } else {
          throw new Error("لم يتم العثور على التذكرة");
        }
        
        return { success: true, data: ticket };
      } catch (error) {
        console.error('Error updating ticket status:', error);
        
        let errorMessage = 'فشل في تحديث حالة التذكرة.';
        
        if (error.response) {
          if (error.response.data) {
            if (error.response.data.non_field_errors && Array.isArray(error.response.data.non_field_errors)) {
              errorMessage = error.response.data.non_field_errors[0];
            } else if (error.response.data.status && Array.isArray(error.response.data.status)) {
              errorMessage = error.response.data.status[0];
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
            } else if (error.response.data.error) {
              errorMessage = error.response.data.error;
            } else if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            }
          }
          
          if (error.response.status === 404) {
            errorMessage = 'التذكرة غير موجودة او حدث خطأ ما في التحديث.';
          } else if (error.response.status === 403) {
            errorMessage = 'ليس لديك صلاحية لتعديل هذه التذكرة.';
          } else if (error.response.status >= 500) {
            errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
          } else if (error.response.status === 400) {
            errorMessage = 'بيانات التذكرة غير صحيحة.';
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.error = errorMessage;
        return { success: false, error: errorMessage };
      } finally {
        this.isLoading = false;
      }
    }
  },
});
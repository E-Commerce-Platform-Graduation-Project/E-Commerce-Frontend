import { defineStore } from 'pinia';

export const useSupportTicketNotificationStore = defineStore('supportTicketNotification', {
  state: () => ({
    newTicketCount: 0,
  }),
  getters: {
    getNewTicketCount: (state) => state.newTicketCount,
  },
  actions: {
    setNewTicketCount(count) {
      this.newTicketCount = count;
    },
    resetNewTicketCount() {
      this.newTicketCount = 0;
    },
  },
});
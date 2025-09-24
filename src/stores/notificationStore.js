import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    newOrderCount: 0,
  }),
  getters: {
    getNewOrderCount: (state) => state.newOrderCount,
  },
  actions: {
    incrementNewOrderCount() {
      this.newOrderCount++;
    },
    resetNewOrderCount() {
      this.newOrderCount = 0;
    },
  },
});

import { defineStore } from 'pinia';
import api from '@/api';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    dashboardData: null,
    loading: false,
    error: null
  }),

  getters: {
    totalRevenue: (state) => state.dashboardData?.total_revenue || 0,
    totalOrders: (state) => state.dashboardData?.total_orders || 0,
    totalProfit: (state) => state.dashboardData?.total_profit || 0,
    ordersStatusSummary: (state) => state.dashboardData?.orders_status_summary || [],
    ticketsStatusSummary: (state) => state.dashboardData?.tickets_status_summary || [],
    bestSellingProducts: (state) => state.dashboardData?.best_selling_products || [],
    worstSellingProducts: (state) => state.dashboardData?.worst_selling_products || [],
    lowStockItems: (state) => state.dashboardData?.low_stock_items || [],
    topCustomers: (state) => state.dashboardData?.top_customers || [],
    ordersPerCity: (state) => state.dashboardData?.orders_per_city || []
  },

  actions: {
    async fetchDashboardData() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/products/dashboard/statistics/');
        this.dashboardData = response.data;
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching dashboard data:', error);
      } finally {
        this.loading = false;
      }
    }
  }
});
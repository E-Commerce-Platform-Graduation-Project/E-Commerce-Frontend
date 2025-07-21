import { defineStore } from 'pinia';

// --- Mock Data for Orders and Ratings ---
// Added purchasePrice to each item to calculate profit
const mockOrders = [
  { id: 201, customerId: 4, orderDate: '2025-07-18', status: 'مكتمل', totalAmount: 330, items: [{ productId: 3, quantity: 2, price: 180, purchasePrice: 110, rating: 5 }, { productId: 2, quantity: 1, price: 75, purchasePrice: 40, rating: 4 }] },
  { id: 202, customerId: 4, orderDate: '2025-06-25', status: 'قيد التجهيز', totalAmount: 105, items: [{ productId: 1, quantity: 3, price: 35, purchasePrice: 20, rating: null }] },
  { id: 203, customerId: 5, orderDate: '2025-07-15', status: 'مكتمل', totalAmount: 440, items: [{ productId: 4, quantity: 2, price: 220, purchasePrice: 150, rating: 5 }] },
  { id: 204, customerId: 18, orderDate: '2025-05-10', status: 'ملغي', totalAmount: 540, items: [{ productId: 3, quantity: 3, price: 180, purchasePrice: 110, rating: null }] },
  { id: 205, customerId: 18, orderDate: '2025-04-22', status: 'مكتمل', totalAmount: 220, items: [{ productId: 1, quantity: 2, price: 35, purchasePrice: 20, rating: 3 }, { productId: 2, quantity: 2, price: 75, purchasePrice: 40, rating: 4 }] },
  { id: 206, customerId: 22, orderDate: '2025-07-20', status: 'في الطريق الى الزبون', totalAmount: 270, items: [{ productId: 5, quantity: 3, price: 90, purchasePrice: 55, rating: null }] },
  { id: 207, customerId: 23, orderDate: '2025-07-21', status: 'قيد الانتظار', totalAmount: 225, items: [{ productId: 2, quantity: 3, price: 75, purchasePrice: 40, rating: null }] },
  { id: 208, customerId: 24, orderDate: '2025-07-19', status: 'قيد الانتظار', totalAmount: 430, items: [{ productId: 1, quantity: 5, price: 35, purchasePrice: 20, rating: null }, { productId: 3, quantity: 1, price: 180, purchasePrice: 110, rating: null }, { productId: 2, quantity: 1, price: 75, purchasePrice: 40, rating: null }] },
  { id: 209, customerId: 18, orderDate: '2025-07-16', status: 'مكتمل', totalAmount: 620, items: [{ productId: 4, quantity: 2, price: 220, purchasePrice: 150, rating: 4 }, { productId: 3, quantity: 1, price: 180, purchasePrice: 110, rating: 5 }] },
  { id: 210, customerId: 5, orderDate: '2025-07-14', status: 'قيد التجهيز', totalAmount: 360, items: [{ productId: 5, quantity: 4, price: 90, purchasePrice: 55, rating: null }] },
  { id: 211, customerId: 24, orderDate: '2025-07-13', status: 'في الطريق الى الزبون', totalAmount: 515, items: [{ productId: 1, quantity: 3, price: 35, purchasePrice: 20, rating: null }, { productId: 4, quantity: 2, price: 220, purchasePrice: 150, rating: null }] },
];

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    getAllOrders: (state) => state.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)),
    getOrderById: (state) => (orderId) => state.orders.find(order => order.id === orderId),
    getOrdersByCustomerId: (state) => (customerId) => {
      return state.orders
        .filter(order => order.customerId === customerId)
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    },
    getIsLoading: (state) => state.isLoading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchOrders() {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.orders = mockOrders;
        return { success: true };
      } catch (e) {
        this.error = 'فشل في جلب الطلبات.';
        return { success: false };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Updates the status of a specific order.
     * @param {number} orderId The ID of the order to update.
     * @param {string} newStatus The new status for the order.
     */
    async updateOrderStatus(orderId, newStatus) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = newStatus;
        } else {
          throw new Error("لم يتم العثور على الطلب");
        }
        return { success: true, data: order };
      } catch (e) {
        this.error = e.message || 'فشل في تحديث حالة الطلب.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    }
  },
});
import { defineStore } from 'pinia';
import { useProductStore } from './productStore';

// --- Mock Data for Orders ---
// Added `comment` field to some items.
// Ratings are now conceptually tied to the main product within an order.
const mockOrders = [
  {
    id: 201,
    customerId: 4,
    orderDate: '2025-07-18',
    status: 'مكتمل',
    totalAmount: 420,
    items: [
      { productId: 2, quantity: 2, price: 140, purchasePrice: 80, rating: 5, comment: 'جودة ممتازة ومريح جداً.', colorHex: '#000000', size: '42' },
      { productId: 2, quantity: 1, price: 140, purchasePrice: 80, rating: 5, comment: 'جودة ممتازة ومريح جداً.', colorHex: '#ffffff', size: '41' } // Note: Same rating and comment for the same product in one order
    ]
  },
  {
    id: 202,
    customerId: 4,
    orderDate: '2025-06-25',
    status: 'قيد التجهيز',
    totalAmount: 105,
    items: [
      { productId: 1, quantity: 3, price: 35, purchasePrice: 20, rating: 4, comment: 'قبعة جميلة لكن اللون مختلف قليلاً عن الصورة.', colorHex: '#dc2626', size: 'مقاس واحد' }
    ]
  },
  {
    id: 203,
    customerId: 5,
    orderDate: '2025-07-15',
    status: 'مكتمل',
    totalAmount: 440,
    items: [
        { productId: 4, quantity: 2, price: 220, purchasePrice: 150, rating: 5, comment: null, colorHex: '#2563eb', size: '32' }
    ]
  },
  {
    id: 204,
    customerId: 18,
    orderDate: '2025-05-10',
    status: 'ملغي',
    totalAmount: 540,
    items: [
        { productId: 3, quantity: 3, price: 180, purchasePrice: 110, rating: null, comment: null, colorHex: '#000000', size: 'L' }
    ]
  },
  {
    id: 205,
    customerId: 18,
    orderDate: '2025-04-22',
    status: 'مكتمل',
    totalAmount: 350,
    items: [
      { productId: 1, quantity: 2, price: 35, purchasePrice: 20, rating: 3, comment: 'وصلت في الوقت المحدد.', colorHex: '#2563eb', size: 'مقاس واحد' },
      { productId: 2, quantity: 2, price: 140, purchasePrice: 80, rating: 4, comment: null, colorHex: '#000000', size: '43' }
    ]
  },
];


export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    getAllOrders: (state) => {
        /* ... existing getter ... */
        const productStore = useProductStore();
        const sortedOrders = [...state.orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        return sortedOrders.map(order => ({
            ...order,
            items: order.items.map(item => {
            const product = productStore.getProductById(item.productId);
            return {
                ...item,
                productName: product ? product.name : 'منتج غير معروف',
                productImage: product ? product.mainImage : '/images-for-test/placeholder.jpg',
            };
            }),
        }));
    },
    getOrderById: (state) => (orderId) => {
        /* ... existing getter ... */
        const productStore = useProductStore();
        const order = state.orders.find(order => order.id === orderId);
        if (!order) return null;

        return {
            ...order,
            items: order.items.map(item => {
                const product = productStore.getProductById(item.productId);
                const variant = product?.variants.find(v => v.colorHex === item.colorHex);
                const variantImage = variant?.images?.[0];

                return {
                    ...item,
                    productName: product ? product.name : 'منتج غير معروف',
                    productImage: variantImage || (product ? product.mainImage : '/images-for-test/placeholder.jpg'),
                };
            }),
        };
    },
    getOrdersByCustomerId: (state) => (customerId) => {
      /* ... existing getter ... */
      const productStore = useProductStore();
      return state.orders
        .filter(order => order.customerId === customerId)
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .map(order => ({
          ...order,
          items: order.items.map(item => {
            const product = productStore.getProductById(item.productId);
            return {
              ...item,
              productName: product ? product.name : 'منتج غير معروف',
            };
          }),
        }));
    },
    
    /**
     * NEW GETTER: Aggregates all unique product ratings for a specific customer.
     * It ensures each product is listed only once with its most recent rating and comment.
     */
    getCustomerProductRatings: (state) => (customerId) => {
        const productStore = useProductStore();
        const customerOrders = state.orders
            .filter(o => o.customerId === customerId)
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)); // Sort by most recent order

        const ratingsMap = new Map();

        customerOrders.forEach(order => {
            order.items.forEach(item => {
                // Only consider items with a rating, and only add the most recent rating for each product
                if (item.rating && !ratingsMap.has(item.productId)) {
                    const product = productStore.getProductById(item.productId);
                    if (product) {
                        ratingsMap.set(item.productId, {
                            productId: item.productId,
                            productName: product.name,
                            rating: item.rating,
                            comment: item.comment || null, // Ensure comment is null if not present
                        });
                    }
                }
            });
        });
        return Array.from(ratingsMap.values());
    },

    getIsLoading: (state) => state.isLoading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchOrders() {
        this.isLoading = true;
        this.error = null;
        try {
            const productStore = useProductStore();
            await productStore.fetchProducts();
            await new Promise(resolve => setTimeout(resolve, 500));
            this.orders = mockOrders;
            return { success: true };
        } catch (e) {
            this.error = 'فشل في جلب الطلبات.';
            console.error(e);
            return { success: false };
        } finally {
            this.isLoading = false;
        }
    },

    async updateOrderStatus(orderId, newStatus) {
        /* ... existing action ... */
        this.isLoading = true;
        this.error = null;
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
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

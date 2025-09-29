import { defineStore } from 'pinia';
import { useProductStore } from './productStore';
import { useCustomerStore } from './customerStore';
import api from '@/api';

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [],
    ordersCount: 0, // Total count from API
    isLoading: false,
    error: null,
  }),

  getters: {
    getAllOrders: (state) => {
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
    
    getCustomerProductRatings: (state) => (customerId) => {
        const productStore = useProductStore();
        const customerOrders = state.orders
            .filter(o => o.customerId === customerId)
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)); 

        const ratingsMap = new Map();

        customerOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.rating && !ratingsMap.has(item.productId)) {
                    const product = productStore.getProductById(item.productId);
                    if (product) {
                        ratingsMap.set(item.productId, {
                            productId: item.productId,
                            productName: product.name,
                            rating: item.rating,
                            comment: item.comment || null,
                        });
                    }
                }
            });
        });
        return Array.from(ratingsMap.values());
    },

    getOrdersCount: (state) => state.ordersCount,
    getIsLoading: (state) => state.isLoading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchOrders({ page = 1, search = '' } = {}) {
        this.isLoading = true;
        this.error = null;
        try {
            const productStore = useProductStore();
            const customerStore = useCustomerStore();
            await Promise.all([
                productStore.fetchProducts(),
                customerStore.fetchCustomers()
            ]);

            // Build query parameters
            const params = { page };
            if (search) params.search = search;

            // Use the 'api' instance with pagination params
            const response = await api.get('products/staff-orders/', { params });
            const { results: apiOrders, count } = response.data;

            const statusMap = {
                'Pending': 'قيد الانتظار',
                'Processing': 'قيد التجهيز',
                'Shipped': 'في الطريق الى الزبون',
                'Completed': 'مكتمل',
                'Cancelled': 'ملغي',
            };

            this.orders = apiOrders.map(order => {
                const customer = customerStore.customers.find(c => c.full_name === order.user);
                return {
                    id: order.id,
                    customerId: customer ? customer.id : null,
                    customerPhone: order.customer_phone,
                    orderDate: order.order_date,
                    status: statusMap[order.status] || order.status,
                    address: order.address,
                    paymentMethod: order.payment_method,
                    totalPrice: parseFloat(order.total_price),
                    shippingCost: parseFloat(order.shipping_cost),
                    totalAmount: parseFloat(order.grand_total),
                    items: order.items.map(item => {
                        const colorAttr = item.variant.attributes.find(attr => attr.name === 'اللون');
                        const sizeAttr = item.variant.attributes.find(attr => attr.name === 'المقاس');

                        return {
                            productId: item.variant.product_variant_id, 
                            quantity: item.quantity,
                            price: parseFloat(item.price_per_unit),
                            purchasePrice: 0,
                            rating: null,
                            comment: null,
                            colorHex: colorAttr ? colorAttr.value : '#FFFFFF',
                            size: sizeAttr ? sizeAttr.value : 'غير محدد',
                        };
                    }),
                };
            });
            
            this.ordersCount = count;
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
        this.isLoading = true;
        this.error = null;
        try {
            const statusMapReverse = {
                'قيد الانتظار': 'Pending',
                'قيد التجهيز': 'Processing',
                'في الطريق الى الزبون': 'Shipped',
                'مكتمل': 'Completed',
                'ملغي': 'Cancelled',
            };

            const englishStatus = statusMapReverse[newStatus] || newStatus;
            
            await api.patch(`products/staff-orders/${orderId}/`, { status: englishStatus });
            
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
            } else {
                throw new Error("لم يتم العثور على الطلب");
            }
            
            return { success: true, data: order };
        } catch (error) {
            console.error('Error updating order status:', error);
            
            let errorMessage = 'فشل في تحديث حالة الطلب.';
            
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
                    errorMessage = 'الطلب غير موجود او حدث خطأ ما في التحديث.';
                } else if (error.response.status === 403) {
                    errorMessage = 'ليس لديك صلاحية لتعديل هذا الطلب.';
                } else if (error.response.status >= 500) {
                    errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
                } else if (error.response.status === 400) {
                    errorMessage = 'بيانات الطلب غير صحيحة.';
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
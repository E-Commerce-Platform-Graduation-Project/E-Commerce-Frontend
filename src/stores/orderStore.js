import { defineStore } from 'pinia';
import { useProductStore } from './productStore';
import { useCustomerStore } from './customerStore'; // Make sure this path is correct
import api from '@/api'; // IMPORT YOUR CENTRALIZED API INSTANCE

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    // No changes needed for the getters.
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

    getIsLoading: (state) => state.isLoading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchOrders() {
        this.isLoading = true;
        this.error = null;
        try {
            const productStore = useProductStore();
            const customerStore = useCustomerStore();
            await Promise.all([
                productStore.fetchProducts(),
                customerStore.fetchCustomers()
            ]);

            // **MODIFIED**: Use the 'api' instance and a relative URL
            const response = await api.get('products/staff-orders/');
            const apiOrders = response.data;

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
                    customerPhone: order.customer_phone, // Added customer phone
                    orderDate: order.order_date,
                    status: statusMap[order.status] || order.status,
                    address: order.address, // Added address
                    paymentMethod: order.payment_method, // Added payment method
                    totalPrice: parseFloat(order.total_price), // Added total price (before shipping)
                    shippingCost: parseFloat(order.shipping_cost), // Added shipping cost
                    totalAmount: parseFloat(order.grand_total), // This is the grand total
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
            // Map Arabic status back to English for API call
            const statusMapReverse = {
                'قيد الانتظار': 'Pending',
                'قيد التجهيز': 'Processing',
                'في الطريق الى الزبون': 'Shipped',
                'مكتمل': 'Completed',
                'ملغي': 'Cancelled',
            };

            const englishStatus = statusMapReverse[newStatus] || newStatus;
            
            // Make the actual API call to update the order status
            await api.patch(`products/staff-orders/${orderId}/`, { status: englishStatus });
            
            // Update local state only after successful API call
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
            } else {
                throw new Error("لم يتم العثور على الطلب");
            }
            
            return { success: true, data: order };
        } catch (error) {
            console.error('Error updating order status:', error);
            
            // Handle error messages consistently like cityStore
            let errorMessage = 'فشل في تحديث حالة الطلب.';
            
            if (error.response) {
                // Extract error message from different possible response formats
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
                
                // Handle specific HTTP status codes
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
            
            // Set the error in store state
            this.error = errorMessage;
            
            // Return consistent error format like cityStore
            return { success: false, error: errorMessage };
        } finally {
            this.isLoading = false;
        }
    }
  },
});
import { defineStore } from 'pinia';
import api from '@/api'; // Assuming you have a centralized api instance

// --- Mock Data for Frontend Development ---
const mockProducts = [
  {
    id: 1,
    name: 'قبعة بيسبول رياضية',
    description: 'قبعة رياضية كلاسيكية بشعار مطرز، مثالية للحماية من الشمس.',
    sellingPrice: 35,
    purchasePrice: 20,
    profitMargin: 75,
    quantity: 80,
    categoryId: 10, // قبعات
    is_active: true,
    images: ['/images-for-test/baseball-cap.jpg'],
  },
  {
    id: 2,
    name: 'نظارة شمسية عصرية',
    description: 'نظارة شمسية عصرية مع حماية كاملة من الأشعة فوق البنفسجية.',
    sellingPrice: 75,
    purchasePrice: 40,
    profitMargin: 87.5,
    quantity: 45,
    categoryId: 11, // نظارات
    is_active: true,
    images: ['/images-for-test/sunglasses.jpg'],
  },
  {
    id: 3,
    name: 'حذاء جري رياضي',
    description: 'حذاء رياضي خفيف الوزن ومريح، مصمم للجري والتمارين الرياضية.',
    sellingPrice: 180,
    purchasePrice: 110,
    profitMargin: 63.64,
    quantity: 30,
    categoryId: 13, // احذية رياضية
    is_active: true,
    images: ['/images-for-test/runnig-shoose.jpg'],
  },
  {
    id: 4,
    name: 'بدلة رياضية كاملة',
    description: 'بدلة رياضية مريحة وأنيقة، مكونة من قطعتين.',
    sellingPrice: 220,
    purchasePrice: 150,
    profitMargin: 46.67,
    quantity: 20,
    categoryId: 15, // بدل رياضية
    is_active: true,
    images: ['/images-for-test/SportSuit.jpg'],
  },
  {
    id: 5,
    name: 'بنطلون رياضي قطني',
    description: 'بنطلون رياضي مصنوع من القطن الناعم، مثالي للراحة والاسترخاء.',
    sellingPrice: 90,
    purchasePrice: 55,
    profitMargin: 63.64, // Adding profit margin for consistency
    quantity: 0, // Out of stock example
    categoryId: 16, // بناطيل رياضية
    is_active: false,
    images: ['/images-for-test/selk-sport-pants.jpeg'],
  },
];

// New structure for purchase invoices
const mockInvoices = [
  {
    id: 2024001,
    date: '2024-07-20',
    user: 'مدير النظام',
    totalAmount: 2350,
    items: [
      { productId: 1, quantityAdded: 50, purchasePrice: 20 },
      { productId: 3, quantityAdded: 5, purchasePrice: 110 },
      { productId: 2, quantityAdded: 20, purchasePrice: 40 },
    ],
  },
  {
    id: 2024002,
    date: '2024-07-18',
    user: 'أحمد علي',
    totalAmount: 4800,
    items: [
      { productId: 4, quantityAdded: 20, purchasePrice: 150 },
      { productId: 3, quantityAdded: 10, purchasePrice: 110 },
      { productId: 1, quantityAdded: 35, purchasePrice: 20 },
    ],
  },
  {
    id: 2024003,
    date: '2024-07-15',
    user: 'مدير النظام',
    totalAmount: 1600,
    items: [
      { productId: 2, quantityAdded: 40, purchasePrice: 40 },
    ],
  },
];

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    purchaseInvoices: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    getAllProducts: (state) => state.products,
    getProductById: (state) => (id) => state.products.find(p => p.id === id),
    getAllInvoices: (state) => state.purchaseInvoices,
    getInvoiceById: (state) => (id) => state.purchaseInvoices.find(inv => inv.id === id),
    getInvoicesByProductId: (state) => (productId) => {
      return state.purchaseInvoices.filter(inv => 
        inv.items.some(item => item.productId === productId)
      ).sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    getIsLoading: (state) => state.isLoading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchAllData() {
      if (this.products.length > 0) return { success: true }; // Avoid refetching
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.products = mockProducts;
        this.purchaseInvoices = mockInvoices;
        return { success: true };
      } catch (e) {
        this.error = 'فشل في جلب البيانات.';
        return { success: false };
      } finally {
        this.isLoading = false;
      }
    },

    // Legacy method for backward compatibility
    async fetchProducts() {
      return this.fetchAllData();
    },

    /**
     * Adds a new product definition to the system.
     * Prices and quantity are initialized to 0.
     * @param {object} productData - Contains name, description, categoryId, images.
     */
    async addProduct(productData) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        const newProduct = {
          id: Math.max(...this.products.map(p => p.id), 0) + 1,
          name: productData.name,
          description: productData.description,
          categoryId: productData.categoryId,
          // **FIX**: Correctly pass the profit margin from the form data
          profitMargin: productData.profitMargin, 
          images: productData.images.map(img => typeof img === 'string' ? img : (img.url || img)),
          purchasePrice: 0,
          sellingPrice: 0,
          quantity: 0,
          is_active: true,
        };

        this.products.push(newProduct);
        return { success: true, data: newProduct };
      } catch (e) {
        this.error = 'فشل في إضافة المنتج.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Processes a purchase invoice with multiple items.
     * @param {Array} invoiceItems - Array of items { productId, purchasePrice, quantityToAdd }
     */
    async processPurchaseInvoice(invoiceItems) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        // Handle both single item and array of items for backward compatibility
        const items = Array.isArray(invoiceItems) ? invoiceItems : [invoiceItems];
        
        let totalAmount = 0;

        // First, update product details for each item
        items.forEach(item => {
          const { productId, purchasePrice, quantityToAdd } = item;
          const product = this.products.find(p => p.id === productId);
          
          if (product) {
            // Calculate selling price based on stored profit margin
            const calculatedSellingPrice = purchasePrice * (1 + (product.profitMargin || 0) / 100);
            
            // Update the main product record
            product.purchasePrice = purchasePrice;
            product.sellingPrice = parseFloat(calculatedSellingPrice.toFixed(2));
            product.quantity += quantityToAdd;

            // Add to total amount for the invoice
            totalAmount += purchasePrice * quantityToAdd;
          } else {
            throw new Error(`لم يتم العثور على المنتج بالرقم: ${productId}`);
          }
        });

        // Then, create the new invoice record
        const newInvoice = {
          id: Math.max(...this.purchaseInvoices.map(i => i.id), 0) + 1,
          date: new Date().toISOString().split('T')[0],
          user: 'مدير النظام', // This should be dynamic in a real app
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          items: items.map(item => ({
            productId: item.productId,
            quantityAdded: item.quantityToAdd,
            purchasePrice: item.purchasePrice,
          })),
        };

        this.purchaseInvoices.unshift(newInvoice); // Add to the beginning of the list

        return { success: true, data: newInvoice };
      } catch (e) {
        this.error = e.message || 'فشل في معالجة فاتورة الشراء.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async updateProduct(productId, dataToUpdate) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
          const originalProduct = this.products[index];
          const updatedData = { ...dataToUpdate };

          // **FIX:** Recalculate selling price if profit margin is changed
          if (updatedData.profitMargin !== undefined && originalProduct.purchasePrice > 0) {
            const newSellingPrice = originalProduct.purchasePrice * (1 + updatedData.profitMargin / 100);
            updatedData.sellingPrice = parseFloat(newSellingPrice.toFixed(2));
          }
          
          // Merge the original product with the updated data
          this.products[index] = { ...originalProduct, ...updatedData };
          
          return { success: true, data: this.products[index] };
        } else {
          throw new Error('لم يتم العثور على المنتج');
        }
      } catch (e) {
        this.error = e.message || 'فشل في تحديث المنتج.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async toggleProductStatus(productId) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const product = this.products.find(p => p.id === productId);
        if (product) {
          product.is_active = !product.is_active;
          return { success: true, data: product };
        } else {
          throw new Error('لم يتم العثور على المنتج');
        }
      } catch (e) {
        this.error = e.message || 'فشل في تغيير حالة المنتج.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },
    
    clearError() {
      this.error = null;
    },
  },
});
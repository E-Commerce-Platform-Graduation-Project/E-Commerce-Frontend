import { defineStore } from 'pinia';
import api from '@/api'; // Assuming you have a centralized api instance

// --- Mock Data for Frontend Development ---
// This simulates what your backend will eventually provide, using your new category IDs.
const mockProducts = [
  {
    id: 1,
    name: 'قبعة بيسبول رياضية',
    description: 'قبعة رياضية كلاسيكية بشعار مطرز، مثالية للحماية من الشمس.',
    sellingPrice: 35,
    purchasePrice: 20,
    quantity: 80,
    categoryId: 10, // قبعات
    is_active: true,
    images: [
      '/images-for-test/baseball-cap.jpg',
    ],
  },
  {
    id: 2,
    name: 'نظارة شمسية عصرية',
    description: 'نظارة شمسية عصرية مع حماية كاملة من الأشعة فوق البنفسجية.',
    sellingPrice: 75,
    purchasePrice: 40,
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
    quantity: 0, // Out of stock example
    categoryId: 16, // بناطيل رياضية
    is_active: false,
    images: ['/images-for-test/selk-sport-pants.jpeg'],
  },
];


export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    getAllProducts: (state) => state.products,
    getProductById: (state) => (id) => state.products.find(p => p.id === id),
    getIsLoading: (state) => state.isLoading,
    getError: (state) => state.error,
  },

  actions: {
    /**
     * Fetches products. Currently uses mock data.
     */
    async fetchProducts() {
      this.isLoading = true;
      this.error = null;
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        this.products = mockProducts;
        return { success: true };
      } catch (e) {
        this.error = 'فشل في جلب المنتجات.';
        return { success: false };
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Adds a new product.
     * @param {FormData} productData
     */
    async addProduct(productData) {
      // This action is already defined from the previous step
    },

    /**
     * Updates an existing product.
     * @param {number} productId
     * @param {object} dataToUpdate
     */
    async updateProduct(productId, dataToUpdate) {
        this.isLoading = true;
        this.error = null;
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
            
            const index = this.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                // In a real app, the backend would return the updated product.
                // Here, we merge the new data into the existing product.
                this.products[index] = { ...this.products[index], ...dataToUpdate };
            }
            return { success: true, data: this.products[index] };
        } catch (e) {
            this.error = 'فشل في تحديث المنتج.';
            return { success: false };
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Toggles the active status of a product.
     * @param {number} productId
     */
    async toggleProductStatus(productId) {
        this.isLoading = true;
        try {
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
            const product = this.products.find(p => p.id === productId);
            if (product) {
                product.is_active = !product.is_active;
            }
            return { success: true };
        } catch (e) {
            this.error = 'فشل في تغيير حالة المنتج.';
            return { success: false };
        } finally {
            this.isLoading = false;
        }
    },
    
    clearError() {
      this.error = null;
    },
  },
});
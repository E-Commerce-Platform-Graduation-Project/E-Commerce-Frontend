import { defineStore } from 'pinia';
import api from '@/api'; // Assuming you have a centralized api instance

const mockProducts = [
  {
    id: 1,
    name: 'قبعة بيسبول رياضية',
    description: 'قبعة رياضية كلاسيكية بشعار مطرز، مثالية للحماية من الشمس.',
    // ADDED: Prices are now part of the main product object
    purchasePrice: 20,
    sellingPrice: 35,
    profitMargin: 75,
    productType: 'accessory', 
    categoryId: 10,
    is_active: true,
    variants: [
      { 
        colorName: 'أحمر', 
        colorHex: '#dc2626', 
        images: ['/images-for-test/baseball-cap-red.jpg'], 
        stock: [{ size: 'مقاس واحد', quantity: 30 }]
      },
      { 
        colorName: 'أزرق', 
        colorHex: '#2563eb', 
        images: ['/images-for-test/baseball-cap.jpg'], 
        stock: [{ size: 'مقاس واحد', quantity: 50 }]
      },
    ],
  },
  {
    id: 2,
    name: 'نظارة شمسية عصرية',
    description: 'نظارة شمسية عصرية مع حماية كاملة من الأشعة فوق البنفسجية.',
    purchasePrice: 40,
    sellingPrice: 75,
    profitMargin: 87.5,
    productType: 'accessory',
    categoryId: 11,
    is_active: true,
    variants: [
      { 
        colorName: 'أسود', 
        colorHex: '#000000', 
        images: ['/images-for-test/sunglasses.jpg'], 
        stock: [{ size: 'مقاس واحد', quantity: 45 }]
      },
    ],
  },
  {
    id: 3,
    name: 'حذاء جري رياضي',
    description: 'حذاء رياضي خفيف الوزن ومريح، مصمم للجري والتمارين الرياضية.',
    purchasePrice: 110,
    sellingPrice: 180,
    profitMargin: 63.64,
    productType: 'shoes',
    categoryId: 13,
    is_active: true,
    variants: [
      { 
        colorName: 'أبيض', 
        colorHex: '#ffffff', 
        images: ['/images-for-test/runnig-shoose-white.jpg'], 
        stock: [
          { size: '42', quantity: 15 },
          { size: '43', quantity: 10 }
        ]
      },
      { 
        colorName: 'أسود', 
        colorHex: '#000000', 
        images: ['/images-for-test/runnig-shoose.jpg'], 
        stock: [{ size: '43', quantity: 15 }]
      },
    ],
  },
  {
    id: 4,
    name: 'بدلة رياضية كاملة',
    description: 'بدلة رياضية مريحة وأنيقة، مكونة من قطعتين.',
    purchasePrice: 150,
    sellingPrice: 220,
    profitMargin: 46.67,
    productType: 'shirt',
    categoryId: 15,
    is_active: true,
    variants: [
      { 
        colorName: 'رمادي', 
        colorHex: '#6b7280', 
        images: ['/images-for-test/SportSuit.jpg'], 
        stock: [
          { size: 'L', quantity: 10 },
          { size: 'M', quantity: 10 }
        ]
      },
    ],
  },
  {
    id: 5,
    name: 'بنطلون رياضي قطني',
    description: 'بنطلون رياضي مصنوع من القطن الناعم، مثالي للراحة والاسترخاء.',
    purchasePrice: 55,
    sellingPrice: 90,
    profitMargin: 63.64,
    productType: 'pants',
    categoryId: 16,
    is_active: false,
    variants: [], // Product defined but no colors/stock yet
  },
];

const mockInvoices = [
  {
    id: 2024001,
    date: '2024-07-20',
    user: 'مدير النظام',
    totalAmount: 2350,
    items: [
      { productId: 1, quantityAdded: 50, purchasePrice: 20, color: 'أزرق', size: 'مقاس واحد' },
      { productId: 3, quantityAdded: 5, purchasePrice: 110, color: 'أبيض', size: '42' },
      { productId: 2, quantityAdded: 20, purchasePrice: 40, color: 'أسود', size: 'مقاس واحد' },
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
    // Calculates total quantity for a product across all its variants and sizes
    getProductTotalQuantity: (state) => (productId) => {
        const product = state.products.find(p => p.id === productId);
        if (!product || !product.variants) return 0;
        return product.variants.reduce((total, variant) => {
            const variantTotal = variant.stock.reduce((subTotal, stockItem) => subTotal + stockItem.quantity, 0);
            return total + variantTotal;
        }, 0);
    },
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
      if (this.products.length > 0) return { success: true };
      this.isLoading = true;
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

    async fetchProducts() {
      return this.fetchAllData();
    },

    /**
     * Adds a new product with its color variations.
     * @param {object} productData - Contains base product info and an array of `colorVariations`.
     */
    async addProduct(productData) {
      this.isLoading = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newProduct = {
          id: Math.max(...this.products.map(p => p.id), 0) + 1,
          name: productData.name,
          description: productData.description,
          categoryId: productData.categoryId,
          profitMargin: productData.profitMargin, 
          productType: productData.productType,
          // Initialize prices for the main product
          purchasePrice: 0,
          sellingPrice: 0,
          is_active: true,
          // Map the colorVariations from the form to the new variants structure
          variants: productData.colorVariations.map(variation => ({
            colorName: variation.colorName,
            colorHex: variation.colorHex,
            // In a real app, you'd upload images and get back URLs. Here we simulate it.
            images: variation.images.map(img => img.url),
            stock: [], // Initialize with empty stock
          })),
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
     * Processes a purchase invoice, adding quantities to specific product variants and sizes.
     */
    async processPurchaseInvoice(invoiceItems) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        let totalAmount = 0;

        invoiceItems.forEach(item => {
          const { productId, purchasePrice, quantityToAdd, color, size } = item;
          const product = this.products.find(p => p.id === productId);
          
          if (product) {
            // MODIFIED: Update the main product's prices
            product.purchasePrice = purchasePrice;
            product.sellingPrice = parseFloat((purchasePrice * (1 + (product.profitMargin || 0) / 100)).toFixed(2));
            
            // Find the correct color variant
            let variant = product.variants.find(v => v.colorName === color);
            if (!variant) {
                throw new Error(`لم يتم العثور على اللون "${color}" للمنتج "${product.name}"`);
            }
            
            // Find or create the stock entry for the size within that variant
            let stockItem = variant.stock.find(s => s.size === size);
            if (stockItem) {
              stockItem.quantity += quantityToAdd;
            } else {
              variant.stock.push({ size, quantity: quantityToAdd });
            }

            totalAmount += purchasePrice * quantityToAdd;
          } else {
            throw new Error(`لم يتم العثور على المنتج بالرقم: ${productId}`);
          }
        });

        const newInvoice = {
          id: Math.max(...this.purchaseInvoices.map(i => i.id), 0) + 1,
          date: new Date().toISOString().split('T')[0],
          user: 'مدير النظام',
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          items: invoiceItems.map(item => ({
            productId: item.productId,
            quantityAdded: item.quantityToAdd,
            purchasePrice: item.purchasePrice,
            color: item.color,
            size: item.size,
          })),
        };

        this.purchaseInvoices.unshift(newInvoice);
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
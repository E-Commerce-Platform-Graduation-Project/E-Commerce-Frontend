import { defineStore } from 'pinia';
import api from '@/api'; // Assuming you have a centralized api instance

const mockProducts = [
  {
    id: 1,
    name: 'قبعة بيسبول رياضية',
    description: 'قبعة رياضية كلاسيكية بشعار مطرز، مثالية للحماية من الشمس.',
    mainImage: '/images-for-test/baseball-cap.jpg',
    purchasePrice: 20,
    sellingPrice: 35,
    profitMargin: 75,
    // Properties are now a simple key-value object.
    properties: {
      'المقاس': { legacy: ['مقاس واحد'] },
      'الخامة': { legacy: ['قطن'] }
    },
    // detailedProperties has been removed.
    categoryId: 10,
    is_active: true,
    variants: [
      {
        colorHex: '#dc2626',
        images: ['/images-for-test/baseball-cap-red.jpg'],
        stock: [{ size: 'مقاس واحد', quantity: 30 }]
      },
      {
        colorHex: '#2563eb',
        images: ['/images-for-test/baseball-cap-blue.jpg'],
        stock: [{ size: 'مقاس واحد', quantity: 50 }]
      },
    ],
  },
  {
    id: 2,
    name: 'حذاء رياضي متعدد الاستخدامات',
    description: 'حذاء رياضي مريح للجري والتمارين اليومية.',
    mainImage: '/images-for-test/runnig-shoose.jpg',
    purchasePrice: 80,
    sellingPrice: 140,
    profitMargin: 75,
    // Subtitle prefixes like 'أحذية:' are removed.
    properties: {
      'المقاس': { legacy: ['40', '41', '42', '43'] },
      'الخامة': { legacy: ['جلد طبيعي'] }
    },
    categoryId: 13,
    is_active: true,
    variants: [
      {
        colorHex: '#000000',
        images: ['/images-for-test/shoe-black.jpg'],
        // Sizes are now simple values.
        stock: [
          { size: '40', quantity: 10 },
          { size: '41', quantity: 15 },
          { size: '42', quantity: 20 },
          { size: '43', quantity: 12 }
        ]
      },
      {
        colorHex: '#ffffff',
        images: ['/images-for-test/shoe-white.jpg'],
        stock: [
          { size: '40', quantity: 8 },
          { size: '41', quantity: 12 },
          { size: '42', quantity: 18 },
          { size: '43', quantity: 10 }
        ]
      },
    ],
  },
];


const mockInvoices = [];

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    purchaseInvoices: [],
    isLoading: false,
    error: null,
  }),

  getters: {
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
    getUsedColors: (state) => {
      const colorsSet = new Set();
      state.products.forEach(product => {
        if (product.variants) {
          product.variants.forEach(variant => {
            if (variant.colorHex) {
              colorsSet.add(variant.colorHex);
            }
          });
        }
      });
      return Array.from(colorsSet).sort();
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

    async addProduct(productData) {
      this.isLoading = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newProduct = {
          id: Math.max(...this.products.map(p => p.id), 0) + 1,
          name: productData.name,
          description: productData.description,
          mainImage: productData.mainImage ? productData.mainImage.url : null,
          categoryId: productData.categoryId,
          profitMargin: productData.profitMargin,
          properties: productData.selectedProperties || {},
          purchasePrice: 0,
          sellingPrice: 0,
          is_active: true,
          variants: productData.colorVariations.map(variation => ({
            colorHex: variation.colorHex,
            images: variation.images.map(img => img.url),
            stock: [],
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

    async processPurchaseInvoice(invoiceItems) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        let totalAmount = 0;

        invoiceItems.forEach(item => {
          // Destructure the whole properties object
          const { productId, purchasePrice, quantityToAdd, properties } = item;
          const product = this.products.find(p => p.id === productId);

          if (product) {
            product.purchasePrice = purchasePrice;
            product.sellingPrice = parseFloat((purchasePrice * (1 + (product.profitMargin || 0) / 100)).toFixed(2));

            // Use properties for logic, but note that the stock model is based on color and size
            const color = properties.color;
            const size = properties['المقاس']; // Assuming 'المقاس' is the key for size

            let variant = product.variants.find(v => v.colorHex === color);
            if (!variant) {
              throw new Error(`لم يتم العثور على اللون بالكود "${color}" للمنتج "${product.name}"`);
            }

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
          // Store the entire properties object for each item
          items: invoiceItems.map(item => ({
            productId: item.productId,
            quantityAdded: item.quantityToAdd,
            purchasePrice: item.purchasePrice,
            properties: item.properties,
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

          if (updatedData.selectedProperties) {
            updatedData.properties = updatedData.selectedProperties;
            delete updatedData.selectedProperties;
          }

          if (updatedData.profitMargin !== undefined && originalProduct.purchasePrice > 0) {
            const newSellingPrice = originalProduct.purchasePrice * (1 + updatedData.profitMargin / 100);
            updatedData.sellingPrice = parseFloat(newSellingPrice.toFixed(2));
          }

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

    getAvailableSizesForProduct(productId) {
      const product = this.products.find(p => p.id === productId);
      if (!product) return [];
      return product.properties?.['المقاس'] || [];
    },

    getAvailableColorsForProduct(productId) {
      const product = this.products.find(p => p.id === productId);
      if (!product || !product.variants) return [];
      return product.variants.map(variant => ({
        hex: variant.colorHex
      }));
    },

    clearError() {
      this.error = null;
    },
  },
});
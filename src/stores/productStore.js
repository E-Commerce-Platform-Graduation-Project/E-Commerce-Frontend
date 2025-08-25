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
       this.isLoading = true;
      this.error = null; // Clear previous errors
      try {
        const response = await api.get('products/products/');
        
        const productList = Array.isArray(response.data) ? response.data : response.data.results;

        if (!Array.isArray(productList)) {
          console.error('Invalid data structure for products received from API:', response.data);
          throw new Error('Received data is not in the expected format.');
        }
        
        this.products = productList.map(product => this.convertFromApiFormat(product));
        
        // ... (mockInvoices logic is unchanged)
        
        return { success: true };
      } catch (error) {
        console.error('Error fetching products:', error);
        
        // --- FIX STARTS HERE ---
        // Use 'error.response' to get details from the failed API call, not 'response'.
        const errorMessage = error.response?.data?.detail || 
                             error.response?.data?.error ||
                             'فشل في جلب البيانات.';
                             
        this.error = errorMessage;
        // --- FIX ENDS HERE ---

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
      this.error = null;
      try {
        // First, handle file uploads if needed
        let mainImageUrl = null;
        if (productData.mainImage && productData.mainImage.file) {
          // You'll need to implement file upload logic here
          // For now, we'll use a placeholder URL
          mainImageUrl = productData.mainImage.url;
        }

        // Handle variant image uploads
        const processedColorVariations = [];
        if (productData.colorVariations) {
          for (const variation of productData.colorVariations) {
            const processedImages = [];
            for (const image of variation.images) {
              if (image.file) {
                // You'll need to implement file upload logic here
                // For now, we'll use the URL as is
                processedImages.push(image.url);
              }
            }
            processedColorVariations.push({
              ...variation,
              images: processedImages.map(url => ({ url }))
            });
          }
        }

        // Create processed product data
        const processedProductData = {
          ...productData,
          mainImage: mainImageUrl ? { url: mainImageUrl } : null,
          colorVariations: processedColorVariations
        };

        // Convert the frontend data structure to match the API
        const apiPayload = this.convertToApiFormat(processedProductData);
        
        console.log('Sending product data to API:', apiPayload);
        
        const response = await api.post('products/products/', apiPayload);
        
        // Convert API response back to frontend format
        const newProduct = this.convertFromApiFormat(response.data);
        
        this.products.push(newProduct);
        return { success: true, data: newProduct };
      } catch (error) {
        console.error('Error adding product:', error);
        const errorMessage = error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.name?.[0] ||
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.response?.data?.detail ||
          'فشل في إضافة المنتج.';
        
        this.error = errorMessage;
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    // Helper method to convert frontend data to API format
    convertToApiFormat(productData) {
      const attributes = [];
      const variant_images = [];

      // Convert selectedProperties to attributes format
      if (productData.selectedProperties && Object.keys(productData.selectedProperties).length > 0) {
        Object.entries(productData.selectedProperties).forEach(([attrName, attrData]) => {
          const values = [];
          
          // Add legacy values
          if (attrData.legacy && Array.isArray(attrData.legacy) && attrData.legacy.length > 0) {
            values.push(...attrData.legacy);
          }
          
          // Add subtitle values
          if (attrData.subtitles && typeof attrData.subtitles === 'object') {
            Object.values(attrData.subtitles).forEach(subtitleValues => {
              if (Array.isArray(subtitleValues)) {
                values.push(...subtitleValues);
              }
            });
          }
          
          if (values.length > 0) {
            attributes.push({
              attribute: attrName.toString(),
              values: [...new Set(values.map(v => v.toString()))] // Remove duplicates and ensure strings
            });
          }
        });
      }

      // Convert colorVariations to variant_images format
      if (productData.colorVariations && Array.isArray(productData.colorVariations) && productData.colorVariations.length > 0) {
        let displayOrder = 1;
        
        productData.colorVariations.forEach(variation => {
          if (variation.images && Array.isArray(variation.images)) {
            variation.images.forEach(image => {
              variant_images.push({
                image_url: image.url || '/placeholder-image.jpg', // Provide fallback
                display_order: displayOrder++,
                values: {
                  'اللون': variation.colorHex.toString()
                }
              });
            });
          }
        });
      }

      // Ensure we have at least color attribute if we have colorVariations
      if (productData.colorVariations && productData.colorVariations.length > 0) {
        const colorValues = productData.colorVariations.map(v => v.colorHex.toString());
        const existingColorAttr = attributes.find(attr => attr.attribute === 'اللون');
        
        if (!existingColorAttr) {
          attributes.push({
            attribute: 'اللون',
            values: [...new Set(colorValues)]
          });
        } else {
          // Merge with existing color attribute
          const mergedValues = [...new Set([...existingColorAttr.values, ...colorValues])];
          existingColorAttr.values = mergedValues;
        }
      }

      const payload = {
        name: productData.name.toString(),
        description: productData.description ? productData.description.toString() : '',
        main_image_url: productData.mainImage ? productData.mainImage.url : 'http://example.com/placeholder.jpg',
        category: parseInt(productData.categoryId), // This should be the subcategory ID
        profit_margin: parseFloat(productData.profitMargin),
        is_active: true,
        attributes: attributes,
        variant_images: variant_images
      };

      console.log('Final API payload:', JSON.stringify(payload, null, 2));
      return payload;
    },

    // Helper method to convert API response to frontend format
    convertFromApiFormat(apiData) {
      const properties = {};
      const variants = [];
      
      // Convert attributes back to frontend format
      if (apiData.attributes) {
        apiData.attributes.forEach(attr => {
          properties[attr.attribute] = {
            legacy: attr.values || []
          };
        });
      }

      // Group variant_images by color to create variants
      if (apiData.variant_images) {
        const colorGroups = {};
        
        apiData.variant_images.forEach(img => {
          const color = img.values['اللون'];
          if (!colorGroups[color]) {
            colorGroups[color] = {
              colorHex: color,
              images: [],
              stock: []
            };
          }
          colorGroups[color].images.push(img.image_url);
        });

        variants.push(...Object.values(colorGroups));
      }

      return {
        id: apiData.id,
        name: apiData.name,
        description: apiData.description,
        mainImage: apiData.main_image_url,
        categoryId: apiData.category,
        profitMargin: apiData.profit_margin,
        properties: properties,
        purchasePrice: 0, // These will be set later when processing invoices
        sellingPrice: 0,
        is_active: apiData.is_active,
        variants: variants
      };
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
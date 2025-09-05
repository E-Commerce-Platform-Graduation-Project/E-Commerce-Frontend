import { defineStore } from 'pinia';
import api from '@/api';
import imageCompression from 'browser-image-compression';

async function compressImage(file) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    console.log(`Original image size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed image size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return new File([compressedFile], file.name, { type: compressedFile.type });
  } catch (error) {
    console.error("Image compression failed:", error);
    return file;
  }
}


export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    productsCount: 0,
    nextPageUrl: null,
    previousPageUrl: null,
    purchaseInvoices: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    getProductsCount: (state) => state.productsCount,
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
    // async fetchAllData() { //تجيب اول 10 منتجات بس
    //   this.isLoading = true;
    //   this.error = null;
    //   try {
    //     const response = await api.get('products/products/');
    //     const productList = Array.isArray(response.data) ? response.data : response.data.results;

    //     if (!Array.isArray(productList)) {
    //       console.error('Invalid data structure for products received from API:', response.data);
    //       throw new Error('Received data is not in the expected format.');
    //     }

    //     this.products = productList.map(product => this.convertFromApiFormat(product));
    //     return { success: true };
    //   } catch (error) {
    //     console.error('Error fetching products:', error);
    //     const errorMessage = error.response?.data?.detail ||
    //       error.response?.data?.error ||
    //       'فشل في جلب البيانات.';
    //     this.error = errorMessage;
    //     return { success: false };
    //   } finally {
    //     this.isLoading = false;
    //   }
    // },
    // Add this new function inside the `actions: { ... }` block in productStore.js

    async fetchAllProducts() { // تبحت بالصفحة
      this.isLoading = true;
      this.error = null;
      let allProducts = [];
      let nextUrl = 'products/products/'; // This is the starting API endpoint

      try {
        // This loop will continue as long as the API provides a "next" page URL
        while (nextUrl) {
          const response = await api.get(nextUrl);
          const data = response.data;

          // Add the products from the current page to our list
          const productList = data.results || [];
          allProducts.push(...productList);

          // Update nextUrl to the URL of the next page, or null if it's the last page
          nextUrl = data.next;
        }

        // Once all pages are fetched, update the state with the complete list
        this.products = allProducts.map(product => this.convertFromApiFormat(product));

        return { success: true };

      } catch (error) {
        console.error('Error fetching all products:', error);
        this.error = 'فشل في جلب كل المنتجات.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    // Add this new method for AddPurchaseInvoice.vue
    async fetchProductDetailsWithVariants(productId) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get(`products/products/${productId}/`);
        // Return the raw API response data for variant details (used by AddPurchaseInvoice)
        const productData = response.data;

        // Also update the products array with converted format for consistency
        const convertedProduct = this.convertFromApiFormat(productData);
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
          this.products[index] = convertedProduct;
        } else {
          this.products.push(convertedProduct);
        }

        return { success: true, data: productData };
      } catch (error) {
        console.error(`Error fetching product details with variants for ID ${productId}:`, error);
        const errorMessage = error.response?.data?.detail || 'فشل في جلب تفاصيل المنتج.';
        this.error = errorMessage;
        return { success: false, error: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },
    
    // Restore the original fetchProductDetails method for EditProduct.vue and others
    async fetchProductDetails(productId) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get(`products/products/${productId}/`);
        const detailedProduct = this.convertFromApiFormat(response.data);
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
          this.products[index] = detailedProduct;
        } else {
          this.products.push(detailedProduct);
        }
        return { success: true, data: detailedProduct };
      } catch (error) {
        console.error(`Error fetching product details for ID ${productId}:`, error);
        const errorMessage = error.response?.data?.detail || 'فشل في جلب تفاصيل المنتج.';
        this.error = errorMessage;
        return { success: false, error: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProducts({ page = 1, search = '' } = {}) {
      this.isLoading = true;
      this.error = null;

      // Construct the query parameters
      const params = new URLSearchParams();
      if (page > 1) {
        params.append('page', page);
      }
      if (search) {
        params.append('search', search);
      }

      const url = `products/products/?${params.toString()}`;

      try {
        const response = await api.get(url);
        const data = response.data;

        // Ensure we have a results array
        const productList = Array.isArray(data.results) ? data.results : [];

        // Update state with new data
        this.products = productList.map(product => this.convertFromApiFormat(product));
        this.productsCount = data.count || 0;
        this.nextPageUrl = data.next;
        this.previousPageUrl = data.previous;

        return { success: true };
      } catch (error) {
        console.error('Error fetching products:', error);
        const errorMessage = error.response?.data?.detail || 'فشل في جلب البيانات.';
        this.error = errorMessage;
        return { success: false };
      } finally {
        this.isLoading = false;
      }
    },

    async submitPurchaseInvoice(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        console.log('Submitting purchase invoice to API:', payload);

        const response = await api.post('products/purchase-invoices/', payload);

        console.log('Purchase invoice response:', response.data);

        // Instead of trying to create the local invoice object,
        // just refresh the invoices from the API to ensure consistency
        await this.fetchPurchaseInvoices();

        return { success: true, data: response.data };
      } catch (error) {
        console.error('Error submitting purchase invoice:', error.response?.data || error);
        const errorMessage = error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.message ||
          'فشل في حفظ فاتورة الشراء';
        this.error = errorMessage;
        return { success: false, error: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    async addProduct(productData) {
      this.isLoading = true;
      this.error = null;
      try {
        const hasMainImage = productData.mainImage && productData.mainImage.file;
        const hasVariantImages = productData.colorVariations &&
          productData.colorVariations.some(variation => variation.images && variation.images.length > 0);

        if (hasMainImage || hasVariantImages) {
          const formData = new FormData();
          formData.append('name', productData.name.toString());
          formData.append('description', productData.description ? productData.description.toString() : '');
          formData.append('category', parseInt(productData.categoryId));
          formData.append('profit_margin', parseFloat(productData.profitMargin));
          formData.append('is_active', productData.is_active !== undefined ? productData.is_active : true);

          if (hasMainImage) {
            const compressedMainImage = await compressImage(productData.mainImage.file);
            formData.append('main_image', compressedMainImage, compressedMainImage.name);
          }

          // FIXED: Use the exact same attributes logic as updateProduct
          const attributes = [];

          // Add non-color properties (copied from updateProduct)
          if (productData.selectedProperties && Object.keys(productData.selectedProperties).length > 0) {
            Object.entries(productData.selectedProperties).forEach(([attrName, attrData]) => {
              const values = [];
              if (attrData.legacy && Array.isArray(attrData.legacy)) {
                values.push(...attrData.legacy);
              }
              if (attrData.subtitles && typeof attrData.subtitles === 'object') {
                Object.values(attrData.subtitles).forEach(subtitleValues => {
                  if (Array.isArray(subtitleValues)) values.push(...subtitleValues);
                });
              }
              if (values.length > 0) {
                attributes.push({
                  attribute: attrName.toString(),
                  values: [...new Set(values.map(v => v.toString()))]
                });
              }
            });
          }

          // Add color attribute (copied from updateProduct)
          if (productData.colorVariations && productData.colorVariations.length > 0) {
            const colorValues = productData.colorVariations.map(v => v.colorHex.toString());
            const colorAttr = attributes.find(attr => attr.attribute === 'اللون');
            if (!colorAttr) {
              attributes.push({ attribute: 'اللون', values: [...new Set(colorValues)] });
            } else {
              colorAttr.values = [...new Set([...colorAttr.values, ...colorValues])];
            }
          }

          formData.append('attributes', JSON.stringify(attributes));

          if (hasVariantImages) {
            const variantImagesMetadata = [];

            for (const variation of productData.colorVariations) {
              if (variation.images && Array.isArray(variation.images)) {
                for (const [imageIndex, image] of variation.images.entries()) {
                  if (image.file) {
                    const compressedFile = await compressImage(image.file);
                    formData.append('variant_images', compressedFile, compressedFile.name);

                    variantImagesMetadata.push({
                      display_order: imageIndex + 1,
                      values: { "اللون": variation.colorHex }
                    });
                  }
                }
              }
            }

            if (variantImagesMetadata.length > 0) {
              formData.append('variant_images_meta', JSON.stringify(variantImagesMetadata));
            }
          }

          console.log('=== DEBUG: Final FormData ===');
          console.log('Attributes:', formData.get('attributes'));
          if (formData.get('variant_images_meta')) {
            console.log('Variant Images Meta:', formData.get('variant_images_meta'));
          }

          const response = await api.post('products/products/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const newProduct = this.convertFromApiFormat(response.data);
          this.products.push(newProduct);
          return { success: true, data: newProduct };
        } else {
          // Fallback for no files - use the same convertToApiFormat as before
          const apiPayload = this.convertToApiFormat(productData);
          const response = await api.post('products/products/', apiPayload);
          const newProduct = this.convertFromApiFormat(response.data);
          this.products.push(newProduct);
          return { success: true, data: newProduct };
        }
      } catch (error) {
        console.error('Error adding product:', error.response?.data || error);

        // Log the specific error details
        if (error.response?.data?.non_field_errors) {
          console.error('Non-field errors:', error.response.data.non_field_errors);
        }

        const errorMessage = error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.name?.[0] ||
          error.response?.data?.attributes?.[0] ||
          error.response?.data?.detail ||
          'فشل في إضافة المنتج.';
        this.error = errorMessage;
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },


    convertFromApiFormat(apiData) {
      const properties = {};
      const variants = [];

      // Process available_attributes to build properties structure
      if (apiData.available_attributes && Array.isArray(apiData.available_attributes)) {
        apiData.available_attributes.forEach(attr => {
          const attrName = attr.attribute_name;
          if (attrName !== 'اللون') { // Skip color as it's handled separately
            properties[attrName] = {
              legacy: attr.values || [],
              subtitles: {}
            };
          }
        });
      }

      // Build color variants using images_by_attribute
      if (apiData.images_by_attribute && typeof apiData.images_by_attribute === 'object') {
        Object.entries(apiData.images_by_attribute).forEach(([colorHex, imageData]) => {
          // Sort images by display_order
          const sortedImages = Array.isArray(imageData)
            ? imageData
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map(img => {
                // Handle both full URLs and relative paths
                const imageUrl = img.image;
                return imageUrl.startsWith('http') ? imageUrl : `http://13.48.136.207${imageUrl}`;
              })
            : [];

          // Find stock information for this color from variants
          const stockForColor = [];
          if (apiData.variants && Array.isArray(apiData.variants)) {
            apiData.variants
              .filter(variant => {
                // Find variants that match this color
                return variant.attribute_values?.some(attr =>
                  attr.attribute_name === 'اللون' && attr.value === colorHex
                );
              })
              .forEach(variant => {
                // Extract size and quantity
                const sizeAttr = variant.attribute_values?.find(attr => attr.attribute_name === 'المقاس');
                if (sizeAttr) {
                  stockForColor.push({
                    size: sizeAttr.value,
                    quantity: variant.quantity_in_stock || 0,
                    sku: variant.sku
                  });
                }
              });
          }

          variants.push({
            colorHex: colorHex,
            images: sortedImages,
            stock: stockForColor,
            showColorPicker: false,
            error: null
          });
        });
      }

      // If no images_by_attribute but we have color values, create variants without images
      if (variants.length === 0 && apiData.available_attributes) {
        const colorAttr = apiData.available_attributes.find(attr => attr.attribute_name === 'اللون');
        if (colorAttr && colorAttr.values) {
          colorAttr.values.forEach(colorHex => {
            // Find stock for this color
            const stockForColor = [];
            if (apiData.variants && Array.isArray(apiData.variants)) {
              apiData.variants
                .filter(variant => {
                  return variant.attribute_values?.some(attr =>
                    attr.attribute_name === 'اللون' && attr.value === colorHex
                  );
                })
                .forEach(variant => {
                  const sizeAttr = variant.attribute_values?.find(attr => attr.attribute_name === 'المقاس');
                  if (sizeAttr) {
                    stockForColor.push({
                      size: sizeAttr.value,
                      quantity: variant.quantity_in_stock || 0,
                      sku: variant.sku
                    });
                  }
                });
            }

            variants.push({
              colorHex: colorHex,
              images: [],
              stock: stockForColor,
              showColorPicker: false,
              error: null
            });
          });
        }
      }

      return {
        id: apiData.id,
        name: apiData.name || '',
        description: apiData.description || '',
        mainImage: apiData.main_image || null,
        categoryId: typeof apiData.category === 'object' && apiData.category !== null ? apiData.category.id : apiData.category,
        profitMargin: apiData.profit_margin || 0,
        is_active: apiData.is_active !== undefined ? apiData.is_active : true,
        properties: properties,
        variants: variants, // This is your custom formatted variants for UI
        rawVariants: apiData.variants || [], // <-- ADD THIS LINE to keep original variant data
        purchasePrice: parseFloat(apiData.purchase_cost || 0),
        sellingPrice: parseFloat(apiData.selling_price || 0),
      };
    },

    // Keep this method for backward compatibility, but deprecate it
    async processPurchaseInvoice(invoiceItems) {
      console.warn('processPurchaseInvoice is deprecated, use submitPurchaseInvoice instead');
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        let totalAmount = 0;
        invoiceItems.forEach(item => {
          const { productId, purchasePrice, quantityToAdd, properties } = item;
          const product = this.products.find(p => p.id === productId);
          if (product) {
            product.purchasePrice = purchasePrice;
            product.sellingPrice = parseFloat((purchasePrice * (1 + (product.profitMargin || 0) / 100)).toFixed(2));
            const color = properties.color;
            const size = properties['المقاس'];
            let variant = product.variants.find(v => v.colorHex === color);
            if (!variant) throw new Error(`لم يتم العثور على اللون بالكود "${color}"`);
            let stockItem = variant.stock.find(s => s.size === size);
            if (stockItem) {
              stockItem.quantity += quantityToAdd;
            } else {
              variant.stock.push({ size, quantity: quantityToAdd });
            }
            totalAmount += purchasePrice * quantityToAdd;
          }
        });
        const newInvoice = { id: Math.random(), date: new Date().toISOString(), totalAmount, items: invoiceItems };
        this.purchaseInvoices.unshift(newInvoice);
        return { success: true, data: newInvoice };
      } catch (e) {
        this.error = e.message;
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPurchaseInvoices() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('products/purchase-invoices/');
        // Map the API response to match the new format
        this.purchaseInvoices = response.data.map(invoice => ({
          id: invoice.id,
          user: invoice.user,
          date: invoice.invoice_date,
          totalAmount: parseFloat(invoice.total_cost),
          items: invoice.items.map(item => ({
            productName: item.product_name,
            variantSku: item.variant_sku,
            quantity: item.quantity,
            costPerUnit: parseFloat(item.cost_per_unit)
          }))
        }));
        return { success: true };
      } catch (error) {
        console.error('Error fetching purchase invoices:', error);
        this.error = 'فشل في جلب فواتير الشراء.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPurchaseInvoiceDetails(invoiceId) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get(`products/purchase-invoices/${invoiceId}/`);
        const data = response.data;

        // Map the detailed response using the new API format
        const detailedInvoice = {
          id: data.id,
          user: data.user,
          date: data.invoice_date,
          totalAmount: parseFloat(data.total_cost),
          items: data.items.map(item => ({
            productName: item.product_name,
            variantSku: item.variant_sku,
            quantity: item.quantity,
            costPerUnit: parseFloat(item.cost_per_unit)
          }))
        };

        console.log('Detailed invoice data:', detailedInvoice);

        // Update the invoice in the state with its full details
        const index = this.purchaseInvoices.findIndex(inv => inv.id === invoiceId);
        if (index !== -1) {
          this.purchaseInvoices[index] = detailedInvoice;
        } else {
          this.purchaseInvoices.push(detailedInvoice);
        }
        return { success: true, data: detailedInvoice };
      } catch (error) {
        console.error(`Error fetching details for invoice ${invoiceId}:`, error);
        this.error = 'فشل في جلب تفاصيل الفاتورة.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async updateProduct(productId, dataToUpdate, newMainImageFile = null, newVariantFiles = []) {
      this.isLoading = true;
      this.error = null;
      try {
        const hasMainImageFile = newMainImageFile !== null;
        const hasVariantImageFiles = newVariantFiles && newVariantFiles.length > 0;
        const hasFiles = hasMainImageFile || hasVariantImageFiles;

        if (hasFiles) {
          const formData = new FormData();
          formData.append('name', dataToUpdate.name.toString());
          formData.append('description', dataToUpdate.description ? dataToUpdate.description.toString() : '');
          formData.append('category', parseInt(dataToUpdate.categoryId));
          formData.append('profit_margin', parseFloat(dataToUpdate.profitMargin));
          formData.append('is_active', dataToUpdate.is_active !== undefined ? dataToUpdate.is_active : true);

          if (hasMainImageFile) {
            const compressedMainImage = await compressImage(newMainImageFile);
            formData.append('main_image', compressedMainImage, compressedMainImage.name);
          } else if (dataToUpdate.mainImage) {
            formData.append('main_image_url', dataToUpdate.mainImage);
          }

          const attributes = [];
          if (dataToUpdate.properties && Object.keys(dataToUpdate.properties).length > 0) {
            Object.entries(dataToUpdate.properties).forEach(([attrName, attrData]) => {
              const values = [];
              if (attrData.legacy && Array.isArray(attrData.legacy)) {
                values.push(...attrData.legacy);
              }
              if (attrData.subtitles && typeof attrData.subtitles === 'object') {
                Object.values(attrData.subtitles).forEach(subtitleValues => {
                  if (Array.isArray(subtitleValues)) values.push(...subtitleValues);
                });
              }
              if (values.length > 0) {
                attributes.push({
                  attribute: attrName.toString(),
                  values: [...new Set(values.map(v => v.toString()))]
                });
              }
            });
          }

          if (dataToUpdate.variants && dataToUpdate.variants.length > 0) {
            const colorValues = dataToUpdate.variants.map(v => v.colorHex.toString());
            const colorAttr = attributes.find(attr => attr.attribute === 'اللون');
            if (!colorAttr) {
              attributes.push({ attribute: 'اللون', values: [...new Set(colorValues)] });
            } else {
              colorAttr.values = [...new Set([...colorAttr.values, ...colorValues])];
            }
          }

          formData.append('attributes', JSON.stringify(attributes));

          if (hasVariantImageFiles) {
            const variantImagesMetadata = [];

            for (const [index, imgData] of newVariantFiles.entries()) {
              const compressedFile = await compressImage(imgData.file);
              formData.append('variant_images', compressedFile, compressedFile.name);

              const variant = dataToUpdate.variants.find(v => v.colorHex.toLowerCase() === imgData.colorHex.toLowerCase());
              const existingImageCount = (variant && variant.images && Array.isArray(variant.images)) ? variant.images.length : 0;

              const newImagesForSameColorBefore = newVariantFiles
                .slice(0, index)
                .filter(prevImgData => prevImgData.colorHex.toLowerCase() === imgData.colorHex.toLowerCase())
                .length;

              const displayOrder = existingImageCount + newImagesForSameColorBefore + 1;

              variantImagesMetadata.push({
                display_order: displayOrder,
                values: { "اللون": imgData.colorHex }
              });
            }

            if (variantImagesMetadata.length > 0) {
              formData.append('variant_images_meta', JSON.stringify(variantImagesMetadata));
            }
          }

          console.log('--- Submitting FormData to Backend ---');
          for (const [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
          }
          console.log('------------------------------------');

          await api.patch(`products/products/${productId}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          const apiPayload = this.convertToApiFormat({
            ...dataToUpdate,
            selectedProperties: dataToUpdate.properties,
          });

          console.log('--- Submitting JSON Object to Backend ---');
          console.log(JSON.stringify(apiPayload, null, 2));
          console.log('---------------------------------------');

          await api.patch(`products/products/${productId}/`, apiPayload);
        }

        const freshDataResponse = await api.get(`products/products/${productId}/`);
        const updatedProductInState = this.convertFromApiFormat(freshDataResponse.data);
        const index = this.products.findIndex(p => p.id === productId);

        if (index !== -1) {
          this.products[index] = updatedProductInState;
        }
        return { success: true, data: this.products[index] };
      } catch (e) {
        console.error("Failed to update product:", e.response?.data || e.message);
        const errorData = e.response?.data;
        this.error = errorData?.attributes?.[0] ||
          errorData?.variant_images_meta?.[0] ||
          errorData?.variant_images?.[0] ||
          errorData?.detail ||
          errorData?.non_field_errors?.[0] ||
          'فشل في تحديث المنتج.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    convertToApiFormat(productData) {
      const apiData = {
        name: productData.name,
        description: productData.description || '',
        category: productData.categoryId,
        profit_margin: productData.profitMargin,
        is_active: productData.is_active !== undefined ? productData.is_active : true,
      };

      if (productData.selectedProperties && Object.keys(productData.selectedProperties).length > 0) {
        const attributes = [];
        Object.entries(productData.selectedProperties).forEach(([attrName, attrData]) => {
          const values = [];
          if (attrData.legacy && Array.isArray(attrData.legacy)) {
            values.push(...attrData.legacy);
          }
          if (attrData.subtitles && typeof attrData.subtitles === 'object') {
            Object.values(attrData.subtitles).forEach(subtitleValues => {
              if (Array.isArray(subtitleValues)) values.push(...subtitleValues);
            });
          }
          if (values.length > 0) {
            attributes.push({
              attribute: attrName,
              values: [...new Set(values)]
            });
          }
        });

        if (productData.colorVariations && productData.colorVariations.length > 0) {
          const colorValues = productData.colorVariations.map(v => v.colorHex);
          const colorAttr = attributes.find(attr => attr.attribute === 'اللون');
          if (!colorAttr) {
            attributes.push({ attribute: 'اللون', values: [...new Set(colorValues)] });
          } else {
            colorAttr.values = [...new Set([...colorAttr.values, ...colorValues])];
          }
        }

        apiData.attributes = attributes;
      }

      return apiData;
    },

    async toggleProductStatus(productId) {
      const product = this.products.find(p => p.id === productId);
      if (!product) {
        this.error = 'لم يتم العثور على المنتج';
        return { success: false, error: this.error };
      }

      const originalStatus = product.is_active;
      const newStatus = !originalStatus;
      product.is_active = newStatus;

      try {
        await api.patch(`products/products/${productId}/`, { is_active: newStatus });
        return { success: true, data: product };
      } catch (e) {
        product.is_active = originalStatus;
        this.error = e.response?.data?.detail || 'فشل في تغيير حالة المنتج.';
        console.error("Failed to toggle status:", e.response?.data);
        return { success: false, error: this.error };
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
    // Helper method to extract color from variant SKU
    extractColorFromSku(variantSku) {
      // SKU format: "SPEDRO0-#21BA40-40" or "CAP0-جلد-#B20101-مقاس عام (STANDARD)"
      const parts = variantSku.split('-');
      for (const part of parts) {
        if (part.startsWith('#') && part.length === 7) {
          return part;
        }
      }
      return '#000000'; // Default color if not found
    },

    // Helper method to extract size from variant SKU
    extractSizeFromSku(variantSku) {
      // SKU format: "SPEDRO0-#21BA40-40" or "CAP0-جلد-#B20101-مقاس عام (STANDARD)"
      const parts = variantSku.split('-');
      // Return the last part as size
      return parts[parts.length - 1] || '';
    },

    // Helper method to get product by name (since API now returns product names)
    getProductByName(productName) {
      return this.products.find(p => p.name === productName);
    },
  },
});
// productStore.js - UPDATED VERSION WITH PURCHASE INVOICE API

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
    async fetchAllData() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('products/products/');
        const productList = Array.isArray(response.data) ? response.data : response.data.results;

        if (!Array.isArray(productList)) {
          console.error('Invalid data structure for products received from API:', response.data);
          throw new Error('Received data is not in the expected format.');
        }

        this.products = productList.map(product => this.convertFromApiFormat(product));
        return { success: true };
      } catch (error) {
        console.error('Error fetching products:', error);
        const errorMessage = error.response?.data?.detail ||
          error.response?.data?.error ||
          'فشل في جلب البيانات.';
        this.error = errorMessage;
        return { success: false };
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

        // Store the invoice in local state
        const newInvoice = {
          id: response.data.id || Date.now(),
          date: response.data.created_at || new Date().toISOString(),
          totalAmount: response.data.total_amount || 0,
          products: payload.products
        };

        this.purchaseInvoices.unshift(newInvoice);

        // Optionally refresh products to get updated stock quantities
        // Uncomment the line below if you want to refresh products after invoice creation
        // await this.fetchProducts();

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

          const attributes = [];
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

            console.log('Sending FormData with variant images metadata:', variantImagesMetadata);
          }

          const response = await api.post('products/products/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const newProduct = this.convertFromApiFormat(response.data);
          this.products.push(newProduct);
          return { success: true, data: newProduct };
        } else {
          // Fallback for no files
          const apiPayload = this.convertToApiFormat(productData);
          const response = await api.post('products/products/', apiPayload);
          const newProduct = this.convertFromApiFormat(response.data);
          this.products.push(newProduct);
          return { success: true, data: newProduct };
        }
      } catch (error) {
        console.error('Error adding product:', error.response?.data || error);
        const errorMessage = error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.name?.[0] ||
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

      if (apiData.variants && Array.isArray(apiData.variants)) {
        const colorGroups = {};

        apiData.variants.forEach(variant => {
          let color = '#000000';
          let size = null;

          if (variant.attribute_values && Array.isArray(variant.attribute_values)) {
            variant.attribute_values.forEach(attr => {
              if (attr.attribute_name === 'اللون') {
                color = attr.value;
              } else if (attr.attribute_name === 'المقاس') {
                size = attr.value;

                if (!properties['المقاس']) {
                  properties['المقاس'] = { legacy: [], subtitles: {} };
                }
                if (!properties['المقاس'].legacy.includes(size)) {
                  properties['المقاس'].legacy.push(size);
                }
              } else {
                const attrName = attr.attribute_name;
                const attrValue = attr.value;

                if (!properties[attrName]) {
                  properties[attrName] = { legacy: [], subtitles: {} };
                }
                if (!properties[attrName].legacy.includes(attrValue)) {
                  properties[attrName].legacy.push(attrValue);
                }
              }
            });
          }

          if (!colorGroups[color]) {
            colorGroups[color] = {
              colorHex: color,
              images: [],
              stock: [],
              showColorPicker: false,
              error: null
            };

            if (!properties['اللون']) {
              properties['اللون'] = { legacy: [], subtitles: {} };
            }
            if (!properties['اللون'].legacy.includes(color)) {
              properties['اللون'].legacy.push(color);
            }
          }

          if (variant.images && Array.isArray(variant.images)) {
            const sortedImages = [...variant.images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            sortedImages.forEach(img => {
              const imageUrl = img.image_url || img.image;
              if (imageUrl && !colorGroups[color].images.includes(imageUrl)) {
                colorGroups[color].images.push(imageUrl);
              }
            });
          }

          if (size && variant.quantity_in_stock !== undefined) {
            const existingStock = colorGroups[color].stock.find(s => s.size === size);
            if (existingStock) {
              existingStock.quantity += variant.quantity_in_stock;
            } else {
              colorGroups[color].stock.push({
                size: size,
                quantity: variant.quantity_in_stock
              });
            }
          }
        });

        variants.push(...Object.values(colorGroups));
      }

      if (apiData.attributes && Array.isArray(apiData.attributes)) {
        apiData.attributes.forEach(attr => {
          let attrName, attrValue;

          if (attr.attribute_name) {
            attrName = attr.attribute_name;
            attrValue = attr.value;
          } else if (attr.attribute && typeof attr.attribute === 'object') {
            attrName = attr.attribute.name;
            attrValue = attr.value;
          } else if (attr.attribute && typeof attr.attribute === 'string') {
            attrName = attr.attribute;
            if (attr.values && Array.isArray(attr.values)) {
              attr.values.forEach(value => {
                if (!properties[attrName]) properties[attrName] = { legacy: [], subtitles: {} };
                if (!properties[attrName].legacy.includes(value)) properties[attrName].legacy.push(value);
              });
              return;
            } else {
              attrValue = attr.value;
            }
          }

          if (attrName && attrValue) {
            if (!properties[attrName]) properties[attrName] = { legacy: [], subtitles: {} };
            if (!properties[attrName].legacy.includes(attrValue)) properties[attrName].legacy.push(attrValue);
          }
        });
      }

      if (apiData.variant_images && Array.isArray(apiData.variant_images) && variants.length === 0) {
        const colorGroups = {};
        const sortedImages = [...apiData.variant_images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        sortedImages.forEach(img => {
          const color = img.values?.['اللون'] || img.values?.['Color'] || img.color || '#000000';
          if (!colorGroups[color]) {
            colorGroups[color] = { colorHex: color, images: [], stock: [], showColorPicker: false, error: null };
          }
          const imageUrl = img.image_url || img.image;
          if (imageUrl) {
            colorGroups[color].images.push(imageUrl);
          }
        });

        variants.push(...Object.values(colorGroups));
      }

      const colorProperty = properties['اللون'];
      if (colorProperty && colorProperty.legacy && variants.length === 0) {
        colorProperty.legacy.forEach(color => {
          variants.push({ colorHex: color, images: [], stock: [], showColorPicker: false, error: null });
        });
      }

      return {
        id: apiData.id,
        name: apiData.name || '',
        description: apiData.description || '',
        mainImage: apiData.main_image || apiData.main_image_url || null,
        categoryId: typeof apiData.category === 'object' && apiData.category !== null ? apiData.category.id : apiData.category,
        profitMargin: apiData.profit_margin || 0,
        is_active: apiData.is_active !== undefined ? apiData.is_active : true,
        properties: properties,
        variants: variants,
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
        // Map the API response to the data structure your components expect
        this.purchaseInvoices = response.data.map(invoice => ({
          id: invoice.invoice_id,
          user: invoice.user,
          date: invoice.invoice_date,
          totalAmount: invoice.total_cost,
          items: [], // Items will be fetched separately for the details view
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
        // NOTE: We are assuming the detail endpoint is `purchase-invoices/${invoiceId}/`
        const response = await api.get(`products/purchase-invoices/${invoiceId}/`);
        const data = response.data;

        // Map the detailed response, including items
        const detailedInvoice = {
          id: data.invoice_id,
          user: data.user,
          date: data.invoice_date,
          totalAmount: data.total_cost,
          // Assuming the items are in an `invoice_items` array in the response
          items: (data.invoice_items || []).map(item => ({
            productId: item.product_id,
            quantityAdded: item.quantity_added,
            purchasePrice: item.purchase_price,
            properties: item.properties || {},
          })),
        };

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
  },
});
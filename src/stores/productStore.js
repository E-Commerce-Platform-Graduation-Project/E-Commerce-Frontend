import { defineStore } from 'pinia';
import api from '@/api';
import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file using browser-image-compression.
 * @param {File} file - The image file to compress.
 * @param {function(number): void} [onProgress] - An optional callback to track compression progress (0-100).
 * @returns {Promise<File>} The compressed file, or the original file if compression fails.
 */
export async function compressImage(file, onProgress) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    onProgress: onProgress, // Pass the callback to the library
  };

  try {
    console.log(`Original image size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed image size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return new File([compressedFile], file.name, { type: compressedFile.type });
  } catch (error) {
    console.error("Image compression failed:", error);
    return file; // Return original file on error
  }
}

// Helper to identify the color attribute name from API data based on hex values.
function findColorAttributeNameFromApi(availableAttributes) {
  const hexRegex = /^#[0-9A-F]{6}$/i;
  const defaultColorName = 'اللون'; // Fallback if not found

  if (!Array.isArray(availableAttributes)) {
    return defaultColorName;
  }

  const colorAttr = availableAttributes.find(attr =>
    Array.isArray(attr.values) &&
    attr.values.length > 0 &&
    hexRegex.test(attr.values[0]) // Efficiently check if the first value is a hex code
  );

  return colorAttr ? colorAttr.attribute_name : defaultColorName;
}

// Helper to find the "secondary" attribute (like size) from a variant's attributes.
function findSecondaryAttribute(variantAttributes, colorAttributeName) {
  if (!Array.isArray(variantAttributes)) return null;
  return variantAttributes.find(attr => attr.attribute_name !== colorAttributeName);
}

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    productsCount: 0,
    nextPageUrl: null,
    previousPageUrl: null,
    purchaseInvoices: [],
    purchaseInvoicesCount: 0,
    invoicesNextPageUrl: null,
    invoicesPreviousPageUrl: null,
    // --- MODIFIED: Restructured state for paginated ratings ---
    productRatings: {}, // Will now be { productId: { ratings: [], count: 0, ... } }
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
    getInvoicesCount: (state) => state.purchaseInvoicesCount,
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

    // --- MODIFIED: Getters now read from the new state structure ---
    getProductRatings: (state) => (productId) => state.productRatings[productId]?.ratings || [],
    getProductRatingsCount: (state) => (productId) => state.productRatings[productId]?.count || 0,
    getProductAverageRating: (state) => (productId) => {
      const ratings = state.productRatings[productId]?.ratings || [];
      if (ratings.length === 0) return 0;
      const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
      // NOTE: This now calculates average based on the fetched ratings, not all ratings.
      // For a more accurate average of ALL ratings, the API should provide it.
      return sum / ratings.length;
    },
    getProductRatingDistribution: (state) => (productId) => {
      const ratings = state.productRatings[productId]?.ratings || [];
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => {
        if (distribution.hasOwnProperty(rating.rating)) {
          distribution[rating.rating]++;
        }
      });
      return distribution;
    },
  },

  actions: {
    // ... other actions (fetchProducts, addProduct, etc.) remain unchanged ...

    async fetchAllProducts() {
      this.isLoading = true;
      this.error = null;
      let allProducts = [];
      let nextUrl = 'products/products/';

      try {
        while (nextUrl) {
          const response = await api.get(nextUrl);
          const data = response.data;
          const productList = data.results || [];
          allProducts.push(...productList);
          nextUrl = data.next;
        }
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

    async fetchProductDetailsWithVariants(productId) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get(`products/products/${productId}/`);
        const productData = response.data;

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

    async fetchProducts({ page = 1, search = '', category = null, is_active = null, availability = null, low_stock = null } = {}) {
      this.isLoading = true;
      this.error = null;
      const params = new URLSearchParams();

      // Add pagination
      if (page > 1) params.append('page', page);

      // Add search
      if (search) params.append('search', search);

      // Add category filter
      if (category) params.append('category', category);

      // Add is_active filter (active/inactive products)
      if (is_active !== null) params.append('is_active', is_active);

      // Add availability filter (available/out_of_stock)
      if (availability) params.append('availability', availability);

      // Add low_stock filter
      if (low_stock !== null) params.append('low_stock', low_stock);

      const url = `products/products/?${params.toString()}`;

      try {
        const response = await api.get(url);
        const data = response.data;
        const productList = Array.isArray(data.results) ? data.results : [];

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

    async addProduct(productData) {
      this.isLoading = true;
      this.error = null;
      try {
        const hasMainImage = productData.mainImage && productData.mainImage.file;
        const hasVariantImages = productData.colorVariations?.some(v => v.images?.some(img => img.file));

        if (hasMainImage || hasVariantImages) {
          const formData = new FormData();
          formData.append('name', productData.name);
          formData.append('description', productData.description || '');
          formData.append('category', parseInt(productData.categoryId));
          formData.append('profit_margin', parseFloat(productData.profitMargin));
          formData.append('is_active', productData.is_active ?? true);

          if (hasMainImage) {
            // The file received from the component is already compressed.
            formData.append('main_image', productData.mainImage.file, productData.mainImage.file.name);
          }

          const attributes = this.convertToApiFormat(productData).attributes || [];
          formData.append('attributes', JSON.stringify(attributes));

          const colorAttributeName = findColorAttributeNameFromApi({ available_attributes: attributes });

          if (hasVariantImages) {
            const variantImagesMetadata = [];
            for (const variation of productData.colorVariations) {
              if (Array.isArray(variation.images)) {
                for (const [imageIndex, image] of variation.images.entries()) {
                  if (image.file) {
                    // The file received from the component is already compressed.
                    formData.append('variant_images', image.file, image.file.name);

                    variantImagesMetadata.push({
                      display_order: imageIndex + 1,
                      values: { [colorAttributeName]: variation.colorHex }
                    });
                  }
                }
              }
            }
            if (variantImagesMetadata.length > 0) {
              formData.append('variant_images_meta', JSON.stringify(variantImagesMetadata));
            }
          }

          const response = await api.post('products/products/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const newProduct = this.convertFromApiFormat(response.data);
          this.products.push(newProduct);
          return { success: true, data: newProduct };
        } else {
          // This branch handles products without any images.
          const apiPayload = this.convertToApiFormat(productData);
          const response = await api.post('products/products/', apiPayload);
          const newProduct = this.convertFromApiFormat(response.data);
          this.products.push(newProduct);
          return { success: true, data: newProduct };
        }
      } catch (error) {
        console.error('Error adding product:', error.response?.data || error);
        const errorMessage = error.response?.data?.non_field_errors?.[0] || 'فشل في إضافة المنتج.';
        this.error = errorMessage;
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async updateProduct(productId, dataToUpdate, newMainImageFile = null, newVariantFiles = []) {
      this.isLoading = true;
      this.error = null;
      try {
        const hasFiles = newMainImageFile || newVariantFiles?.length > 0;

        if (hasFiles) {
          const formData = new FormData();
          formData.append('name', dataToUpdate.name);
          formData.append('description', dataToUpdate.description || '');
          formData.append('category', parseInt(dataToUpdate.categoryId));
          formData.append('profit_margin', parseFloat(dataToUpdate.profitMargin));
          formData.append('is_active', dataToUpdate.is_active ?? true);

          if (newMainImageFile) {
            // The file received from the component is already compressed.
            formData.append('main_image', newMainImageFile, newMainImageFile.name);
          } else if (dataToUpdate.mainImage) {
            formData.append('main_image_url', dataToUpdate.mainImage);
          }

          const apiPayloadForAttributes = this.convertToApiFormat({
            ...dataToUpdate,
            selectedProperties: dataToUpdate.properties,
          });
          const attributes = apiPayloadForAttributes.attributes || [];

          const colorAttributeName = findColorAttributeNameFromApi({ available_attributes: attributes });
          if (dataToUpdate.variants && dataToUpdate.variants.length > 0) {
            const allColorValues = dataToUpdate.variants.map(v => v.colorHex);
            let colorAttr = attributes.find(attr => attr.attribute === colorAttributeName);

            if (!colorAttr) {
              colorAttr = { attribute: colorAttributeName, values: [] };
              attributes.push(colorAttr);
            }
            colorAttr.values = [...new Set([...colorAttr.values, ...allColorValues])];
          }

          formData.append('attributes', JSON.stringify(attributes));

          if (newVariantFiles?.length > 0) {
            const variantImagesMetadata = [];
            for (const [index, imgData] of newVariantFiles.entries()) {
              // The file received from the component is already compressed.
              formData.append('variant_images', imgData.file, imgData.file.name);
              const variant = dataToUpdate.variants.find(v => v.colorHex.toLowerCase() === imgData.colorHex.toLowerCase());
              const existingImageCount = variant?.images?.length || 0;
              const newImagesForSameColorBefore = newVariantFiles.slice(0, index).filter(p => p.colorHex.toLowerCase() === imgData.colorHex.toLowerCase()).length;
              const displayOrder = existingImageCount + newImagesForSameColorBefore + 1;
              variantImagesMetadata.push({
                display_order: displayOrder,
                values: { [colorAttributeName]: imgData.colorHex }
              });
            }
            if (variantImagesMetadata.length > 0) {
              formData.append('variant_images_meta', JSON.stringify(variantImagesMetadata));
            }
          }

          await api.patch(`products/products/${productId}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          // This branch handles updates without any new images.
          const apiPayload = this.convertToApiFormat({
            ...dataToUpdate,
            selectedProperties: dataToUpdate.properties,
          });
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
        this.error = e.response?.data?.non_field_errors?.[0] || 'فشل في تحديث المنتج.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },


    // --- MODIFIED: fetchProductRatings now handles pagination ---
    async fetchProductRatings({ productId, page = 1 }) {
      if (!productId) return { success: false, error: 'معرف المنتج مطلوب' };

      const params = new URLSearchParams();
      params.append('product', productId);
      if (page > 1) {
        params.append('page', page);
      }

      try {
        const response = await api.get(`products/staff-ratings/?${params.toString()}`);
        const data = response.data;

        // Ensure the product ID entry exists with the correct structure
        if (!this.productRatings[productId]) {
          this.productRatings[productId] = {
            ratings: [],
            count: 0,
            nextPageUrl: null,
            previousPageUrl: null,
          };
        }

        // Update state with paginated data
        this.productRatings[productId].ratings = data.results;
        this.productRatings[productId].count = data.count;
        this.productRatings[productId].nextPageUrl = data.next;
        this.productRatings[productId].previousPageUrl = data.previous;

        return { success: true, data: data.results };
      } catch (error) {
        console.error(`Error fetching ratings for product ${productId}:`, error);
        const errorMessage = error.response?.data?.detail || 'فشل في جلب تقييمات المنتج.';
        this.error = errorMessage;
        if (this.productRatings[productId]) {
          this.productRatings[productId].ratings = [];
        }
        return { success: false, error: errorMessage };
      }
    },
    // ... other rating actions (submit, update, delete) and invoice actions remain unchanged ...

    async submitProductRating(productId, ratingData) {
      if (!productId || !ratingData) return { success: false, error: 'بيانات غير مكتملة' };
      this.isLoading = true;
      this.error = null;
      try {
        const payload = { product: productId, rating: ratingData.rating, comment: ratingData.comment || '' };
        const response = await api.post('products/staff-ratings/', payload);
        // Re-fetch the first page to see the new rating
        await this.fetchProductRatings({ productId, page: 1 });
        return { success: true, data: response.data };
      } catch (error) {
        console.error(`Error submitting rating for product ${productId}:`, error);
        const errorMessage = error.response?.data?.detail || 'فشل في إرسال التقييم.';
        this.error = errorMessage;
        return { success: false, error: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    async updateProductRating(ratingId, ratingData) {
      if (!ratingId || !ratingData) return { success: false, error: 'بيانات غير مكتملة' };
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.patch(`products/staff-ratings/${ratingId}/`, ratingData);
        Object.keys(this.productRatings).forEach(productId => {
          const productRatingData = this.productRatings[productId];
          if (productRatingData) {
            const index = productRatingData.ratings.findIndex(r => r.id === ratingId);
            if (index !== -1) {
              productRatingData.ratings[index] = response.data;
            }
          }
        });
        return { success: true, data: response.data };
      } catch (error) {
        console.error(`Error updating rating ${ratingId}:`, error);
        const errorMessage = error.response?.data?.detail || 'فشل في تحديث التقييم.';
        this.error = errorMessage;
        return { success: false, error: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    async deleteProductRating(ratingId) {
      if (!ratingId) return { success: false, error: 'معرف التقييم مطلوب' };
      this.isLoading = true;
      this.error = null;
      try {
        await api.delete(`products/staff-ratings/${ratingId}/`);
        // Re-fetch the current page for all affected products
        Object.keys(this.productRatings).forEach(productId => {
          const productRatingData = this.productRatings[productId];
          if (productRatingData && productRatingData.ratings.some(r => r.id === ratingId)) {
            // This is a simplification. A more robust solution would track current page per product.
            // For now, fetching page 1 is a safe default.
            this.fetchProductRatings({ productId, page: 1 });
          }
        });
        return { success: true };
      } catch (error) {
        console.error(`Error deleting rating ${ratingId}:`, error);
        const errorMessage = error.response?.data?.detail || 'فشل في حذف التقييم.';
        this.error = errorMessage;
        return { success: false, error: errorMessage };
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
        await this.fetchPurchaseInvoices();
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Error submitting purchase invoice:', error.response?.data || error);
        const errorMessage = error.response?.data?.detail || 'فشل في حفظ فاتورة الشراء';
        this.error = errorMessage;
        return { success: false, error: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPurchaseInvoices({ page = 1, search = '' } = {}) {
      this.isLoading = true;
      this.error = null;
      const params = new URLSearchParams();
      if (page > 1) params.append('page', page);
      if (search) params.append('search', search);
      const url = `products/purchase-invoices/?${params.toString()}`;

      try {
        const response = await api.get(url);
        const data = response.data;
        const invoiceList = Array.isArray(data.results) ? data.results : [];

        this.purchaseInvoices = invoiceList.map(invoice => ({
          id: invoice.id,
          user: invoice.user,
          date: invoice.invoice_date,
          totalAmount: parseFloat(invoice.total_cost),
          items: invoice.items.map(item => ({
            productName: item.product_name,
            variantSku: item.variant_sku,
            quantity: item.quantity,
            costPerUnit: parseFloat(item.cost_per_unit),
            images: item.images || []
          }))
        }));

        this.purchaseInvoicesCount = data.count || 0;
        this.invoicesNextPageUrl = data.next;
        this.invoicesPreviousPageUrl = data.previous;

        return { success: true };
      } catch (error) {
        console.error('Error fetching purchase invoices:', error);
        const errorMessage = error.response?.data?.detail || 'فشل في جلب فواتير الشراء.';
        this.error = errorMessage;
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

        const detailedInvoice = {
          id: data.id,
          user: data.user,
          date: data.invoice_date,
          totalAmount: parseFloat(data.total_cost),
          items: data.items.map(item => ({
            productName: item.product_name,
            variantSku: item.variant_sku,
            quantity: item.quantity,
            costPerUnit: parseFloat(item.cost_per_unit),
            images: item.images || []
          }))
        };

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

    async deleteProductImage(imageId) {
      try {
        await api.delete(`products/product-images/${imageId}/`);
        return { success: true };
      } catch (error) {
        console.error(`Failed to delete image ${imageId}:`, error);
        const errorMessage = error.response?.data?.detail || 'فشل في حذف الصورة.';
        return { success: false, error: errorMessage };
      }
    },

    async toggleProductStatus(productId) {
      const product = this.products.find(p => p.id === productId);
      if (!product) return { success: false, error: 'لم يتم العثور على المنتج' };
      const originalStatus = product.is_active;
      product.is_active = !originalStatus;
      try {
        await api.patch(`products/products/${productId}/`, { is_active: product.is_active });
        return { success: true, data: product };
      } catch (e) {
        product.is_active = originalStatus;
        this.error = e.response?.data?.detail || 'فشل في تغيير حالة المنتج.';
        return { success: false, error: this.error };
      }
    },

    // ... helper functions (convertFromApiFormat, etc.) remain unchanged ...
    convertFromApiFormat(apiData) {
      const properties = {};
      const variants = [];
      const colorAttributeName = findColorAttributeNameFromApi(apiData.available_attributes);

      if (Array.isArray(apiData.available_attributes)) {
        apiData.available_attributes.forEach(attr => {
          if (attr.attribute_name !== colorAttributeName) {
            properties[attr.attribute_name] = { legacy: attr.values || [], subtitles: {} };
          }
        });
      }

      const colorAttribute = apiData.available_attributes?.find(attr => attr.attribute_name === colorAttributeName);
      const colorHexValues = colorAttribute?.values || [];

      for (const colorHex of colorHexValues) {
        const imageData = apiData.images_by_attribute?.[colorHex] || [];
        const sortedImages = imageData
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map(img => img.image.startsWith('http') ? img.image : `http://13.48.136.207${img.image}`);

        const imagesWithIds = imageData
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map(img => ({
            id: img.id,
            url: img.image.startsWith('http') ? img.image : `http://13.48.136.207${img.image}`,
            display_order: img.display_order || 0
          }));

        const stockForColor = [];
        if (Array.isArray(apiData.variants)) {
          apiData.variants
            .filter(variant => variant.attribute_values?.some(attr =>
              attr.attribute_name === colorAttributeName && attr.value.toLowerCase() === colorHex.toLowerCase()
            ))
            .forEach(variant => {
              const secondaryAttr = findSecondaryAttribute(variant.attribute_values, colorAttributeName);
              if (secondaryAttr) {
                stockForColor.push({
                  size: secondaryAttr.value,
                  quantity: variant.quantity_in_stock || 0,
                  sku: variant.sku
                });
              }
            });
        }

        variants.push({
          colorHex,
          images: sortedImages,
          imagesWithIds: imagesWithIds,
          stock: stockForColor,
          showColorPicker: false,
          error: null
        });
      }

      return {
        id: apiData.id,
        name: apiData.name || '',
        description: apiData.description || '',
        mainImage: apiData.main_image || null,
        categoryId: apiData.category?.id ?? apiData.category,
        profitMargin: apiData.profit_margin || 0,
        is_active: apiData.is_active ?? true,
        properties: properties,
        variants: variants,
        rawVariants: apiData.variants || [],
        purchasePrice: parseFloat(apiData.purchase_cost || 0),
        sellingPrice: parseFloat(apiData.selling_price || 0),
      };
    },

    convertToApiFormat(productData) {
      const apiData = {
        name: productData.name,
        description: productData.description || '',
        category: productData.categoryId,
        profit_margin: productData.profitMargin,
        is_active: productData.is_active !== undefined ? productData.is_active : true,
      };

      const attributes = [];
      if (productData.selectedProperties && Object.keys(productData.selectedProperties).length > 0) {
        Object.entries(productData.selectedProperties).forEach(([attrName, attrData]) => {
          const values = new Set();
          if (Array.isArray(attrData.legacy)) {
            attrData.legacy.forEach(v => values.add(v));
          }
          if (typeof attrData.subtitles === 'object') {
            Object.values(attrData.subtitles).forEach(subValues => {
              if (Array.isArray(subValues)) subValues.forEach(v => values.add(v));
            });
          }
          if (values.size > 0) {
            attributes.push({ attribute: attrName, values: Array.from(values) });
          }
        });
      }

      if (productData.colorVariations && productData.colorVariations.length > 0) {
        const colorValues = productData.colorVariations.map(v => v.colorHex);
        const colorAttributeName = findColorAttributeNameFromApi({ available_attributes: attributes });
        const colorAttr = attributes.find(attr => attr.attribute === colorAttributeName);

        if (!colorAttr) {
          attributes.push({ attribute: colorAttributeName, values: [...new Set(colorValues)] });
        } else {
          colorAttr.values = [...new Set([...colorAttr.values, ...colorValues])];
        }
      }

      if (attributes.length > 0) {
        apiData.attributes = attributes;
      }

      return apiData;
    },

    getAvailableSizesForProduct(productId) {
      const product = this.products.find(p => p.id === productId);
      if (!product || !product.properties) return [];

      const propertyKeys = Object.keys(product.properties);
      if (propertyKeys.length > 0) {
        const sizeAttributeName = propertyKeys[0];
        return product.properties[sizeAttributeName]?.legacy || [];
      }
      return [];
    },

    getAvailableColorsForProduct(productId) {
      const product = this.products.find(p => p.id === productId);
      if (!product || !product.variants) return [];
      return product.variants.map(variant => ({ hex: variant.colorHex }));
    },

    clearError() {
      this.error = null;
    },

    extractColorFromSku(variantSku) {
      const parts = variantSku.split('-');
      for (const part of parts) {
        if (part.startsWith('#') && part.length === 7) return part;
      }
      return '#000000';
    },

    extractSizeFromSku(variantSku) {
      const parts = variantSku.split('-');
      return parts[parts.length - 1] || '';
    },

    getProductByName(productName) {
      return this.products.find(p => p.name === productName);
    },

  },
});
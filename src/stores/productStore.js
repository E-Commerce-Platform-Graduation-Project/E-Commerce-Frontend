// productStore.js

import { defineStore } from 'pinia';
import api from '@/api';
// ADDED: Import the image compression library
import imageCompression from 'browser-image-compression';

// ADDED: A helper function to compress an image file
async function compressImage(file) {
  // Compression options. You can adjust these values.
  const options = {
    maxSizeMB: 1,          // Target file size in MB (e.g., 1MB)
    maxWidthOrHeight: 1920, // Resize images to a max width or height of 1920px
    useWebWorker: true,    // Use a web worker for better performance
  };

  try {
    console.log(`Original image size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed image size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    // Return the compressed file (which is a Blob), so we convert it back to a File
    return new File([compressedFile], file.name, { type: compressedFile.type });
  } catch (error) {
    console.error("Image compression failed:", error);
    // If compression fails, return the original file
    return file;
  }
}


export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    purchaseInvoices: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    // ... your getters remain unchanged
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

    async fetchProductDetails(productId) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get(`products/products/${productId}/`);
        const detailedProduct = this.convertFromApiFormat(response.data);

        // Update the product in the main list for data consistency
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

    async fetchProducts() {
      return this.fetchAllData();
    },

    // --- MODIFIED addProduct ACTION ---
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

          // MODIFIED: Compress main image before appending
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
          
          const variantImagesMetadata = [];
          let fileCounter = 0;
          // MODIFIED: Use a for...of loop to handle async compression of variant images
          for (const variation of productData.colorVariations) {
            if (variation.images && Array.isArray(variation.images)) {
              for (const [imageIndex, image] of variation.images.entries()) {
                if (image.file) {
                  const compressedFile = await compressImage(image.file);
                  formData.append('variant_images', compressedFile, compressedFile.name);
                  variantImagesMetadata.push({
                    image_file_index: fileCounter,
                    display_order: imageIndex + 1,
                    values: { "اللون": variation.colorHex }
                  });
                  fileCounter++;
                }
              }
            }
          }

          if (variantImagesMetadata.length > 0) {
            formData.append('variant_images_data', JSON.stringify(variantImagesMetadata));
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
        console.error('Error adding product:', error);
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
    
    // ... your other methods like convertFromApiFormat and processPurchaseInvoice remain unchanged
    convertFromApiFormat(apiData) {
      const properties = {};
      const variants = [];

      // Handle variants from the new API structure
      if (apiData.variants && Array.isArray(apiData.variants)) {
        // Group variants by color to create our color variants
        const colorGroups = {};

        apiData.variants.forEach(variant => {
          let color = '#000000'; // default color
          let size = null;

          // Extract color and size from attribute_values
          if (variant.attribute_values && Array.isArray(variant.attribute_values)) {
            variant.attribute_values.forEach(attr => {
              if (attr.attribute_name === 'اللون') {
                color = attr.value;
              } else if (attr.attribute_name === 'المقاس') {
                size = attr.value;

                // Add size to properties
                if (!properties['المقاس']) {
                  properties['المقاس'] = { legacy: [], subtitles: {} };
                }
                if (!properties['المقاس'].legacy.includes(size)) {
                  properties['المقاس'].legacy.push(size);
                }
              } else {
                // Handle other attributes
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

          // Create or update color group
          if (!colorGroups[color]) {
            colorGroups[color] = {
              colorHex: color,
              images: [],
              stock: [],
              showColorPicker: false,
              error: null
            };

            // Add color to properties
            if (!properties['اللون']) {
              properties['اللون'] = { legacy: [], subtitles: {} };
            }
            if (!properties['اللون'].legacy.includes(color)) {
              properties['اللون'].legacy.push(color);
            }
          }

          // Add images from this variant to the color group
          if (variant.images && Array.isArray(variant.images)) {
            const sortedImages = [...variant.images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            sortedImages.forEach(img => {
              // FIXED: Check for both image_url and image fields
              const imageUrl = img.image_url || img.image;
              if (imageUrl && !colorGroups[color].images.includes(imageUrl)) {
                colorGroups[color].images.push(imageUrl);
              }
            });
          }

          // Add stock information
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

      // Fallback: Handle old attributes structure if it exists
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

      // Fallback: Handle old variant_images structure if it exists
      if (apiData.variant_images && Array.isArray(apiData.variant_images) && variants.length === 0) {
        const colorGroups = {};
        const sortedImages = [...apiData.variant_images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        sortedImages.forEach(img => {
          const color = img.values?.['اللون'] || img.color || '#000000';
          if (!colorGroups[color]) {
            colorGroups[color] = { colorHex: color, images: [], stock: [], showColorPicker: false, error: null };
          }
          // FIXED: Check for both image_url and image fields
          const imageUrl = img.image_url || img.image;
          if (imageUrl) {
            colorGroups[color].images.push(imageUrl);
          }
        });

        variants.push(...Object.values(colorGroups));
      }

      // If we have color properties but no variants, create empty variants for each color
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
        // FIXED: Check for both main_image and main_image_url fields
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

    async processPurchaseInvoice(invoiceItems) {
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
    
    // --- MODIFIED updateProduct ACTION ---
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
          
          // MODIFIED: Compress new main image before appending
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
          
          const variantImagesMetadata = [];
          // MODIFIED: Compress new variant images in parallel
          if (hasVariantImageFiles) {
            const compressedVariantFiles = await Promise.all(
              newVariantFiles.map(imgData => compressImage(imgData.file))
            );
            
            compressedVariantFiles.forEach((file, index) => {
              const originalImgData = newVariantFiles[index];
              formData.append('variant_images', file, file.name);
              variantImagesMetadata.push({
                image_file_index: index,
                display_order: index + 1,
                values: { "اللون": originalImgData.colorHex || '#000000' }
              });
            });
          }

          if (variantImagesMetadata.length > 0) {
            formData.append('variant_images_data', JSON.stringify(variantImagesMetadata));
          }

          await api.patch(`products/products/${productId}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          // Fallback for no file updates
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
        const errorData = e.response?.data;
        this.error = errorData?.attributes?.[0] ||
          errorData?.variant_images?.[0] ||
          errorData?.detail ||
          errorData?.non_field_errors?.[0] ||
          'فشل في تحديث المنتج.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
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
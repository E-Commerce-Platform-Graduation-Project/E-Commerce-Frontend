<template>
  <div class="add-purchase-invoice-container">
    <div class="header">
      <h1 class="title">فاتورة شراء جديدة</h1>
      <p class="subtitle">
        إضافة كميات وتحديث أسعار المنتجات عبر تحديد المتغيرات
      </p>
    </div>

    <div class="form-container">
      <div class="selection-section step-1">
        <h3 class="section-title">الخطوة 1: ابحث عن المنتج</h3>
        <div class="search-row">
          <div class="form-group search-group">
            <label class="form-label">البحث عن المنتج</label>
            <div class="search-wrapper">
              <input
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="اكتب اسم المنتج للبحث..."
                @input="handleSearchInput"
              />
              <div v-if="isSearching" class="search-loading">
                <div class="loading-spinner"></div>
              </div>
            </div>

            <div
              v-if="showSearchResults && searchResults.length > 0"
              class="search-results"
            >
              <div
                v-for="product in searchResults"
                :key="product.id"
                class="search-result-item"
                :class="{ selected: selectedProductId === product.id }"
                @click="selectProduct(product)"
              >
                <div class="product-result">
                  <img
                    v-if="product.mainImage"
                    :src="product.mainImage"
                    :alt="product.name"
                    class="product-thumb"
                  />
                  <div class="product-result-info">
                    <span class="product-result-name">{{ product.name }}</span>
                    <span class="product-result-desc">{{
                      product.description || "لا يوجد وصف"
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="
                showSearchResults &&
                searchResults.length === 0 &&
                searchQuery.length > 0
              "
              class="no-results"
            >
              لم يتم العثور على منتجات تطابق "{{ searchQuery }}"
            </div>
          </div>
        </div>

        <div v-if="loadingProductDetails" class="loading-state">
          <div class="loading-spinner"></div>
          <span>جاري تحميل تفاصيل المنتج...</span>
        </div>
      </div>

      <div
        v-if="selectedProductDetails && !loadingProductDetails"
        class="selection-section step-2"
      >
        <h3 class="section-title">الخطوة 2: اختر المتغير</h3>
        <div class="selected-product-info">
          <h4 class="selected-product-name">
            {{ selectedProductDetails.name }}
          </h4>
          <p class="selected-product-desc">
            {{ selectedProductDetails.description }}
          </p>
        </div>

        <div class="variants-grid">
          <div
            v-for="variant in selectedProductDetails.variants"
            :key="variant.id"
            class="variant-card"
            :class="{ selected: selectedVariant?.id === variant.id }"
            @click="selectVariant(variant)"
          >
            <div class="variant-header">
              <h4 class="variant-sku">{{ variant.sku }}</h4>
              <span
                class="stock-badge"
                :class="getStockBadgeClass(variant.quantity_in_stock)"
              >
                المخزون: {{ variant.quantity_in_stock }}
              </span>
            </div>

            <div
              v-if="getVariantImage(variant)"
              class="variant-image-container"
            >
              <img
                :src="getVariantImage(variant)"
                :alt="`صورة ${variant.sku}`"
                class="variant-main-image"
                @error="handleImageError"
              />
            </div>

            <div class="variant-attributes">
              <div
                v-for="attr in variant.attribute_values"
                :key="attr.attribute_name"
                class="attribute-item"
              >
                <span class="attribute-label">{{ attr.attribute_name }}:</span>
                <span
                  v-if="isColorAttribute(attr.value)"
                  class="attribute-value"
                >
                  <span
                    class="color-dot"
                    :style="{ backgroundColor: attr.value }"
                  ></span>
                  {{ attr.value }}
                </span>
                <span v-else class="attribute-value">{{ attr.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="add-item-row">
          <button
            id="add-to-invoice-btn"
            @click="addVariantToInvoice"
            type="button"
            class="btn btn-add"
            :disabled="!selectedVariant"
          >
            <span class="btn-icon">+</span>
            إضافة للفاتورة
          </button>
        </div>
      </div>

      <div v-if="invoiceItems.length > 0" class="invoice-table-container">
        <h3 class="section-title">الخطوة 3: مراجعة الفاتورة</h3>
        <div class="table-wrapper">
          <table class="invoice-table">
            <thead>
              <tr>
                <th class="col-product">المنتج</th>
                <th class="col-variant">المتغير</th>
                <th class="col-attributes">الخواص</th>
                <th class="col-price">سعر الشراء</th>
                <th class="col-quantity">الكمية</th>
                <th class="col-price">سعر البيع المقترح</th>
                <th class="col-total">الإجمالي</th>
                <th class="col-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in invoiceItems"
                :key="item.uniqueId"
                class="invoice-row"
                :id="`invoice-row-${item.uniqueId}`"
              >
                <td class="col-product">
                  <div class="product-info">
                    <span class="product-name">{{ item.productName }}</span>
                    <small class="product-margin"
                      >هامش ربح: {{ item.profitMargin }}%</small
                    >
                  </div>
                </td>
                <td class="col-variant">
                  <span class="variant-sku">{{ item.variantSku }}</span>
                </td>
                <td class="col-attributes">
                  <div class="props-display">
                    <span
                      v-for="attr in item.attributes"
                      :key="attr.attribute_name"
                      class="prop-chip"
                    >
                      <span
                        v-if="isColorAttribute(attr.value)"
                        class="prop-color-dot"
                        :style="{ backgroundColor: attr.value }"
                      ></span>
                      <strong class="prop-name"
                        >{{ attr.attribute_name }}:</strong
                      >
                      {{ attr.value }}
                    </span>
                  </div>
                </td>
                <td class="col-price">
                  <div class="input-wrapper">
                    <input
                      :value="item.purchasePrice || ''"
                      type="text"
                      class="table-input"
                      placeholder="0.00"
                      :class="{
                        'input-error':
                          errorItem === item.uniqueId && errorType === 'price',
                        'input-warning':
                          item.purchasePrice === 0 &&
                          item.purchasePrice !== null,
                      }"
                      @keydown="onNumericInputKeyDown"
                      @input="handlePurchasePriceInput(item, $event)"
                      @blur="validateSingleItem(item, 'price')"
                    />
                    <small
                      v-if="
                        item.purchasePrice === 0 && item.purchasePrice !== null
                      "
                      class="input-warning-message"
                    >
                      قيمة الشراء الحالية 0 دينار
                    </small>
                    <small
                      v-if="
                        errorItem === item.uniqueId && errorType === 'price'
                      "
                      class="input-error-message"
                    >
                      سعر شراء غير صالح
                    </small>
                  </div>
                </td>

                <td class="col-quantity">
                  <div class="input-wrapper">
                    <input
                      :value="item.quantity || ''"
                      type="text"
                      class="table-input"
                      placeholder="0"
                      :class="{
                        'input-error':
                          errorItem === item.uniqueId &&
                          errorType === 'quantity',
                      }"
                      @keydown="onIntegerInputKeyDown"
                      @input="handleQuantityInput(item, $event)"
                      @blur="validateSingleItem(item, 'quantity')"
                    />
                    <small
                      v-if="
                        errorItem === item.uniqueId &&
                        errorType === 'quantity' &&
                        item.quantity === 0
                      "
                      class="input-error-message"
                    >
                      لا يمكن ان تكون الكمية 0
                    </small>
                    <small
                      v-if="
                        errorItem === item.uniqueId &&
                        errorType === 'quantity' &&
                        (item.quantity === null || item.quantity < 0)
                      "
                      class="input-error-message"
                    >
                      كمية غير صالحة
                    </small>
                  </div>
                </td>
                <td class="col-price">
                  <span class="calculated-price">{{
                    formatCurrency(calculateSellingPrice(item), "")
                  }}</span>
                </td>
                <td class="col-total">
                  <span class="total-amount">{{
                    formatCurrency(
                      (item.purchasePrice || 0) * (item.quantity || 0)
                    )
                  }}</span>
                </td>
                <td class="col-actions">
                  <button
                    @click="removeItem(index)"
                    type="button"
                    class="btn-remove"
                    title="حذف المنتج"
                  >
                    <span>×</span>
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="7" class="total-label">إجمالي فاتورة الشراء:</td>
                <td class="total-amount-cell">
                  {{ formatCurrency(totalInvoiceAmount) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <h4>الفاتورة فارغة</h4>
        <p>ابدأ بالبحث عن منتج واختيار متغير من القوائم أعلاه.</p>
      </div>

      <div class="form-actions">
        <button
          @click="clearInvoice"
          type="button"
          class="btn btn-secondary"
          :disabled="invoiceItems.length === 0"
        >
          مسح الفاتورة
        </button>
        <button
          @click="handleSubmit"
          type="button"
          class="btn btn-primary"
          :disabled="invoiceItems.length === 0 || productStore.isLoading"
        >
          <span v-if="productStore.isLoading" class="loading-spinner"></span>
          انشاء الفاتورة
        </button>
      </div>
    </div>

    <div
      v-if="showSuccessModal"
      class="modal-overlay"
      @click="closeSuccessModal"
    >
      <div class="modal-dialog success-modal" @click.stop>
        <div class="modal-icon success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>تم بنجاح!</h3>
        <p>تم إنشاء فاتورة الشراء بنجاح!</p>
        <button @click="closeSuccessModal" class="btn btn-primary">
          موافق
        </button>
      </div>
    </div>

    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-dialog error-modal" @click.stop>
        <div class="modal-icon error-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <h3>حدث خطأ!</h3>
        <p>{{ modalErrorMessage }}</p>
        <button @click="closeErrorModal" class="btn btn-danger">إغلاق</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { useCategoryStore } from "@/stores/categoryStore";
import { useProductStore } from "@/stores/productStore";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

const categoryStore = useCategoryStore();
const productStore = useProductStore();
const { getAllProducts } = storeToRefs(productStore);
const router = useRouter();

// State for search functionality
const searchQuery = ref("");
const searchResults = ref([]);
const showSearchResults = ref(false);
const isSearching = ref(false);
const searchTimeout = ref(null);

// State for selection process
const selectedProductId = ref(null);
const selectedProductDetails = ref(null);
const selectedVariant = ref(null);
const loadingProductDetails = ref(false);

// State for the invoice itself
const invoiceItems = reactive([]);
const error = ref("");
const errorItem = ref(null);
const errorType = ref(null);
const successMessage = ref("");

// Modal state
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const modalErrorMessage = ref("");

// Computed properties for UI
const totalInvoiceAmount = computed(() => {
  return invoiceItems.reduce((total, item) => {
    const price = sanitizeNumericInput(item.purchasePrice) || 0;
    const quantity = sanitizeNumericInput(item.quantity) || 0;
    return total + price * quantity;
  }, 0);
});

// ✅ NEW: Function to check if an attribute value is a color (hex color starting with #)
const isColorAttribute = (value) => {
  if (!value || typeof value !== 'string') return false;
  
  // Check if value starts with # and has valid hex color format
  const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  return hexColorRegex.test(value);
};

// ✅ START: ADDED KEYDOWN HANDLERS TO PREVENT INVALID INPUT
/**
 * Prevents non-numeric characters from being entered.
 * Allows numbers, one decimal point, one leading sign (+/-), and control keys.
 */
const onNumericInputKeyDown = (event) => {
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
  ];

  // Allow control keys and shortcuts (Ctrl+A, Ctrl+C, etc.)
  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
    return;
  }

  const currentValue = event.target.value;

  // Allow one decimal point
  if (event.key === "." && !currentValue.includes(".")) {
    return;
  }

  // Allow one sign (+ or -) only at the beginning
  if ((event.key === "-" || event.key === "+") && currentValue.length === 0) {
    return;
  }

  // Allow numbers
  if (/[0-9]/.test(event.key)) {
    return;
  }

  // Prevent any other key
  event.preventDefault();
};

/**
 * Prevents non-integer characters from being entered.
 * Allows only whole numbers and control keys.
 */
const onIntegerInputKeyDown = (event) => {
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
  ];

  // Allow control keys and shortcuts
  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
    return;
  }

  // Allow numbers only
  if (/[0-9]/.test(event.key)) {
    return;
  }

  // Prevent any other key
  event.preventDefault();
};
// ✅ END: ADDED KEYDOWN HANDLERS

// ✅ UPDATED: Helper function to get the first image for a variant based on its color attribute VALUE
const getVariantImage = (variant) => {
  if (!selectedProductDetails.value?.images_by_attribute) return null;

  // Find the color attribute for this variant by checking the VALUE (not the name)
  const colorAttr = variant.attribute_values?.find(attr => 
    isColorAttribute(attr.value)
  );
  
  if (!colorAttr) return null;

  // Get images for this color using the color value as key
  const colorImages =
    selectedProductDetails.value.images_by_attribute[colorAttr.value];
  if (!colorImages || !Array.isArray(colorImages) || colorImages.length === 0)
    return null;

  // Return the first image (they're already sorted by display_order)
  const firstImage = colorImages[0];
  const imageUrl = firstImage.image;

  // Handle both full URLs and relative paths
  return imageUrl.startsWith("http")
    ? imageUrl
    : `http://13.48.136.207${imageUrl}`;
};

// Search functionality
const handleSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    performSearch();
  }, 300); // Debounce search by 300ms
};

const performSearch = async () => {
  if (searchQuery.value.length < 2) {
    showSearchResults.value = false;
    searchResults.value = [];
    return;
  }

  isSearching.value = true;

  try {
    // Use the existing fetchProducts method with search parameter
    const result = await productStore.fetchProducts({
      page: 1,
      search: searchQuery.value,
    });

    if (result.success) {
      searchResults.value = getAllProducts.value;
      showSearchResults.value = true;
    } else {
      searchResults.value = [];
      showSearchResults.value = true;
    }
  } catch (err) {
    console.error("Search error:", err);
    searchResults.value = [];
    showSearchResults.value = true;
  } finally {
    isSearching.value = false;
  }
};

const selectProduct = async (product) => {
  selectedProductId.value = product.id;
  searchQuery.value = product.name;
  showSearchResults.value = false;
  searchResults.value = [];

  await fetchProductDetails(product.id);
};

// Hide search results when clicking outside
const hideSearchResults = () => {
  setTimeout(() => {
    showSearchResults.value = false;
  }, 200);
};

// Fetch product details from API
const fetchProductDetails = async (productId) => {
  loadingProductDetails.value = true;
  error.value = "";

  try {
    // Use the new method that returns raw API data with variants
    const result = await productStore.fetchProductDetailsWithVariants(
      productId
    );

    if (result.success) {
      selectedProductDetails.value = result.data;
      console.log("Product details loaded:", result.data);
    } else {
      error.value = result.error || "فشل في تحميل تفاصيل المنتج";
    }
  } catch (err) {
    console.error("Error fetching product details:", err);
    error.value = "فشل في تحميل تفاصيل المنتج";
  } finally {
    loadingProductDetails.value = false;
  }
};

const selectVariant = async (variant) => {
  selectedVariant.value = variant;
  await nextTick();
  const addButton = document.getElementById("add-to-invoice-btn");
  if (addButton) {
    addButton.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const getStockBadgeClass = (quantity) => {
  if (quantity === 0) return "stock-zero";
  if (quantity < 16) return "stock-low";
  return "stock-good";
};

const handleImageError = (event) => {
  event.target.style.display = "none";
};

const calculateSellingPrice = (item) => {
  const price = sanitizeNumericInput(item.purchasePrice);
  const margin = sanitizeNumericInput(item.profitMargin);

  if (price > 0 && margin >= 0) {
    const calculatedPrice = price * (1 + margin / 100);
    return parseFloat(calculatedPrice.toFixed(2));
  }
  return 0;
};

onMounted(async () => {
  await categoryStore.fetchCategories();
  await productStore.fetchProducts();
});

// Core Logic Functions
const addVariantToInvoice = () => {
  if (!selectedVariant.value || !selectedProductDetails.value) return;

  const existingItemIndex = invoiceItems.findIndex(
    (item) => item.variantId === selectedVariant.value.id
  );

  if (existingItemIndex !== -1) {
    invoiceItems[existingItemIndex].quantity += 1;
    error.value = "";
    successMessage.value = "تم زيادة كمية المتغير الموجود";
    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
    return;
  }

  const existingProductItem = invoiceItems.find(
    (item) => item.productId === selectedProductDetails.value.id
  );
  const defaultPrice = existingProductItem
    ? existingProductItem.purchasePrice
    : parseFloat(selectedProductDetails.value.purchase_cost || 0);

  const profitMargin = selectedProductDetails.value.profit_margin
    ? parseFloat(selectedProductDetails.value.profit_margin)
    : 0;

  invoiceItems.push({
    uniqueId: Date.now(),
    productId: selectedProductDetails.value.id,
    productName: selectedProductDetails.value.name,
    variantId: selectedVariant.value.id,
    variantSku: selectedVariant.value.sku,
    attributes: selectedVariant.value.attribute_values,
    purchasePrice: defaultPrice,
    quantity: 1,
    profitMargin: profitMargin,
    currentStock: selectedVariant.value.quantity_in_stock,
  });

  selectedVariant.value = null;

  successMessage.value = "تم إضافة المتغير للفاتورة بنجاح";
  setTimeout(() => {
    successMessage.value = "";
  }, 3000);
};

const removeItem = (index) => {
  invoiceItems.splice(index, 1);
};

const clearInvoice = () => {
  invoiceItems.length = 0;
  selectedProductId.value = null;
  selectedProductDetails.value = null;
  selectedVariant.value = null;
  searchQuery.value = "";
  showSearchResults.value = false;
  searchResults.value = [];
  error.value = "";
  successMessage.value = "";
};

// Function to sync purchase prices across same product variants
const syncPurchasePrice = (changedItem, newPrice) => {
  // Only sync if the new price is a valid number
  if (newPrice !== null && newPrice !== undefined) {
    invoiceItems.forEach((item) => {
      if (
        item.productId === changedItem.productId &&
        item.uniqueId !== changedItem.uniqueId
      ) {
        item.purchasePrice = newPrice;
      }
    });
  }
};

// Change Start: Updated validation to show a specific message for quantity 0
const validateInvoice = () => {
  error.value = "";
  errorItem.value = null;
  errorType.value = null;

  for (const item of invoiceItems) {
    // Sanitize and validate purchase price
    const sanitizedPrice = sanitizeNumericInput(item.purchasePrice);

    // Update the item with sanitized value
    item.purchasePrice = sanitizedPrice;

    // Check if purchase price is null, undefined, or negative. Allow 0.
    if (
      sanitizedPrice === null ||
      sanitizedPrice === undefined ||
      sanitizedPrice < 0
    ) {
      error.value = `سعر الشراء للمتغير "${item.variantSku}" مطلوب ولا يمكن أن يكون قيمة سالبة أو غير صالحة.`;
      errorItem.value = item.uniqueId;
      errorType.value = "price";
      return { isValid: false, errorId: item.uniqueId };
    }

    // Sanitize and validate quantity
    const sanitizedQuantity = sanitizeNumericInput(item.quantity);

    // Update the item with sanitized value
    item.quantity = sanitizedQuantity;

    // Check for quantity
    if (sanitizedQuantity === 0) {
      error.value = `لا يمكن ان تكون الكمية 0 للمتغير "${item.variantSku}".`;
      errorItem.value = item.uniqueId;
      errorType.value = "quantity";
      return { isValid: false, errorId: item.uniqueId };
    }
    if (
      sanitizedQuantity === null ||
      sanitizedQuantity === undefined ||
      sanitizedQuantity < 0
    ) {
      error.value = `الكمية للمتغير "${item.variantSku}" مطلوبة ويجب أن تكون أكبر من صفر.`;
      errorItem.value = item.uniqueId;
      errorType.value = "quantity";
      return { isValid: false, errorId: item.uniqueId };
    }
  }
  return { isValid: true, errorId: null };
};
// Change End

const sanitizeNumericInput = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // Convert to string for processing
  let stringValue = String(value).trim();

  // Handle edge cases that cause parsing issues
  if (
    stringValue === "+" ||
    stringValue === "-" ||
    stringValue === "+." ||
    stringValue === "-."
  ) {
    return null;
  }

  // Remove invalid characters but keep numbers, decimal point, and valid signs
  stringValue = stringValue.replace(/[^\d.-]/g, "");

  // Handle multiple decimal points - keep only the first one
  const parts = stringValue.split(".");
  if (parts.length > 2) {
    stringValue = parts[0] + "." + parts.slice(1).join("");
  }

  // Handle multiple signs - keep only the first one if it's at the beginning
  if (stringValue.match(/[-+]/g)?.length > 1) {
    const firstChar = stringValue.charAt(0);
    const restOfString = stringValue.slice(1).replace(/[-+]/g, "");
    stringValue =
      firstChar === "-" || firstChar === "+"
        ? firstChar + restOfString
        : restOfString;
  }

  // Remove signs that are not at the beginning
  stringValue = stringValue.replace(/(?!^)[-+]/g, "");

  // Parse the cleaned value
  const parsed = parseFloat(stringValue);

  // Return null for invalid numbers
  if (isNaN(parsed) || !isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const handlePurchasePriceInput = (item, event) => {
  const rawValue = event.target.value;
  const sanitizedValue = sanitizeNumericInput(rawValue);

  // Update the item's purchase price
  item.purchasePrice = sanitizedValue;

  // Sync with other items of the same product
  syncPurchasePrice(item, sanitizedValue);

  // Clear any existing errors for this item if the value is now valid
  if (
    sanitizedValue !== null &&
    sanitizedValue >= 0 &&
    errorItem.value === item.uniqueId &&
    errorType.value === "price"
  ) {
    error.value = "";
    errorItem.value = null;
    errorType.value = null;
  }
};

// Enhanced input handler for quantity - add this method
const handleQuantityInput = (item, event) => {
  const rawValue = event.target.value;
  const sanitizedValue = sanitizeNumericInput(rawValue);

  // Update the item's quantity
  item.quantity = sanitizedValue;

  // Clear any existing errors for this item if the value is now valid
  if (
    sanitizedValue !== null &&
    sanitizedValue > 0 &&
    errorItem.value === item.uniqueId &&
    errorType.value === "quantity"
  ) {
    error.value = "";
    errorItem.value = null;
    errorType.value = null;
  }
};

const validateSingleItem = (item, fieldType) => {
  // Clear previous errors for this item and field type
  if (errorItem.value === item.uniqueId && errorType.value === fieldType) {
    error.value = "";
    errorItem.value = null;
    errorType.value = null;
  }

  if (fieldType === "price") {
    const sanitizedPrice = sanitizeNumericInput(item.purchasePrice);
    item.purchasePrice = sanitizedPrice;

    if (
      sanitizedPrice === null ||
      sanitizedPrice === undefined ||
      sanitizedPrice < 0
    ) {
      error.value = `سعر الشراء للمتغير "${item.variantSku}" غير صالح.`;
      errorItem.value = item.uniqueId;
      errorType.value = "price";
    } else {
      // Sync the valid price with other items of the same product
      syncPurchasePrice(item, sanitizedPrice);
    }
  } else if (fieldType === "quantity") {
    const sanitizedQuantity = sanitizeNumericInput(item.quantity);
    item.quantity = sanitizedQuantity;

    if (
      sanitizedQuantity === null ||
      sanitizedQuantity === undefined ||
      sanitizedQuantity <= 0
    ) {
      error.value = `الكمية للمتغير "${item.variantSku}" غير صالحة.`;
      errorItem.value = item.uniqueId;
      errorType.value = "quantity";
    }
  }
};

const scrollToFirstError = async (errorItemId) => {
  await nextTick();
  const errorRow = document.getElementById(`invoice-row-${errorItemId}`);
  if (errorRow) {
    errorRow.scrollIntoView({ behavior: "smooth", block: "center" });
    errorRow.classList.add("error-highlight");
    setTimeout(() => {
      errorRow.classList.remove("error-highlight");
    }, 2500);
  }
};

const handleSubmit = async () => {
  const validationResult = validateInvoice();
  if (!validationResult.isValid) {
    await scrollToFirstError(validationResult.errorId);
    return;
  }
  successMessage.value = "";
  error.value = "";

  const productsMap = new Map();

  invoiceItems.forEach((item) => {
    if (!productsMap.has(item.productId)) {
      productsMap.set(item.productId, {
        product_id: item.productId,
        purchase_price: item.purchasePrice.toFixed(2),
        selling_price: calculateSellingPrice(item).toFixed(2),
        items: [],
      });
    }

    const productData = productsMap.get(item.productId);
    productData.items.push({
      variant_id: item.variantId,
      quantity: item.quantity,
    });
  });

  const payload = {
    products: Array.from(productsMap.values()),
  };

  console.log("Submitting purchase invoice:", payload);

  try {
    const result = await productStore.submitPurchaseInvoice(payload);

    if (result.success) {
      showSuccessModal.value = true;
      clearInvoice();
    } else {
      modalErrorMessage.value = result.error || "فشل في حفظ فاتورة الشراء";
      showErrorModal.value = true;
    }
  } catch (err) {
    console.error("Error submitting invoice:", err);
    modalErrorMessage.value = "حدث خطأ غير متوقع أثناء الاتصال بالخادم.";
    showErrorModal.value = true;
  }
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
  router.push("/purchase-invoices");
};

const closeErrorModal = () => {
  showErrorModal.value = false;
};

const formatCurrency = (amount, currencySymbol = " د.ل") => {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${formatted}${currencySymbol ? ` ${currencySymbol}` : ""}`;
};
</script>

<style scoped>
/* General Layout */
.add-purchase-invoice-container {
  padding: 20px;
  direction: rtl;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.subtitle {
  color: #6b7280;
  font-size: 16px;
}

.form-container {
  background: white;
  max-width: 1400px;
  margin: 0 auto;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 30px;
  overflow: visible; /* Keep as visible */
  position: relative;
  z-index: 1; /* Low z-index to not interfere */
}

.selection-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  border: 1px solid #e2e8f0;
  position: relative;
  z-index: 2; /* Lower than search components */
}

.selection-section.step-1 {
  z-index: 10; /* Higher than other sections but lower than search dropdown */
}

.selection-section.step-2 {
  z-index: 2; /* Lower z-index */
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

/* Search Styles */
.search-row {
  display: flex;
  align-items: end;
  gap: 20px;
}

.search-group {
  flex: 1;
  position: relative;
  z-index: 100; /* High enough to contain the dropdown but lower than dropdown itself */
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  z-index: 101; /* Higher than parent */
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  padding-left: 40px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 16px;
  transition: border-color 0.2s ease;
  position: relative;
  z-index: 102;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-loading {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 103;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25); /* Enhanced shadow */
  z-index: 99999; /* Very high z-index to ensure it's always on top */
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
  position: relative;
  z-index: 100000; /* Even higher to ensure items are clickable */
}

.search-result-item:hover,
.search-result-item.selected {
  background-color: #f8fafc;
}

.search-result-item:last-child {
  border-bottom: none;
}

.product-result {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.product-result-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-result-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.product-result-desc {
  font-size: 12px;
  color: #64748b;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #6b7280;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Product Details Section */
.selected-product-info {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.selected-product-name {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.selected-product-desc {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

/* Variants Grid */
.variants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.variant-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.variant-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.variant-card.selected {
  border-color: #3b82f6;
  background: #f0f9ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.variant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.variant-sku {
  font-family: monospace;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.stock-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stock-badge.stock-good {
  background: #dcfce7;
  color: #166534;
}

.stock-badge.stock-low {
  background: #fef3c7;
  color: #92400e;
}

.stock-badge.stock-zero {
  background: #fee2e2;
  color: #991b1b;
}

.variant-image-container {
  margin-bottom: 12px;
  text-align: center;
}

.variant-main-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.variant-attributes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attribute-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.attribute-label {
  color: #64748b;
  font-weight: 500;
  min-width: fit-content;
}

.attribute-value {
  color: #1e293b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.add-item-row {
  text-align: center;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-add {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 16px;
  padding: 14px 28px;
}

.btn-add:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.btn-icon {
  font-size: 18px;
  font-weight: bold;
}

/* Invoice Table */
.invoice-table-container {
  margin-top: 30px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.table-wrapper {
  overflow-x: auto;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.invoice-table th,
.invoice-table td {
  padding: 12px 16px;
  text-align: right;
  border-bottom: 1px solid #e2e8f0;
}

.invoice-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.invoice-table tbody tr:hover {
  background: #f9fafb;
}

.col-product {
  min-width: 200px;
}

.col-variant {
  min-width: 120px;
}

.col-attributes {
  min-width: 180px;
}

.col-price {
  min-width: 120px;
}

.col-quantity {
  min-width: 100px;
}

.col-total {
  min-width: 120px;
}

.col-actions {
  width: 80px;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
}

.product-margin {
  font-size: 12px;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.props-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.prop-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #eef2ff;
  color: #4338ca;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.prop-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.prop-name {
  color: #64748b;
}

/*// Change Start: Added styles for input error message */
.input-wrapper {
  position: relative;
}

.input-warning-message {
  color: #b45309;
  font-weight: 500;
  font-size: 11px;
  display: block;
  margin-top: 4px;
  text-align: center;
}

.input-error-message {
  color: #b91c1c;
  font-weight: 500;
  font-size: 11px;
  display: block;
  margin-top: 4px;
  text-align: center;
}
/*// Change End */

.table-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-align: center;
  background-color: white;
  font-size: 14px;
  transition: all 0.2s ease;
}

.table-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.table-input.input-error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.table-input.input-warning {
  border-color: #f59e0b;
  background-color: #fffbeb;
}

.calculated-price,
.total-amount {
  font-weight: 600;
  color: #059669;
}

.btn-remove {
  background: transparent;
  color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background: #fef2f2;
  color: #dc2626;
  transform: scale(1.1);
}

.total-row {
  background-color: #f8fafc;
  font-weight: bold;
  border-top: 2px solid #e2e8f0;
}

.total-label {
  text-align: left;
  padding-left: 20px;
  color: #374151;
  font-size: 16px;
}

.total-amount-cell {
  font-weight: bold;
  color: #059669;
  font-size: 18px;
  text-align: right;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  background-color: #f8fafc;
  border-radius: 12px;
  margin: 30px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.empty-state h4 {
  font-size: 20px;
  color: #374151;
  margin-bottom: 8px;
}

.empty-state p {
  color: #6b7280;
  margin: 0;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-dialog {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.4s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.success-icon {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
}

.error-icon {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.success-modal h3 {
  font-size: 24px;
  color: #27ae60;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.error-modal h3 {
  font-size: 24px;
  color: #e74c3c;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.modal-dialog p {
  color: #64748b;
  margin: 0 0 30px 0;
  font-size: 16px;
  line-height: 1.5;
}

.modal-dialog .btn {
  min-width: 120px;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-dialog .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.modal-dialog .btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.modal-dialog .btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
}

.modal-dialog .btn-danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.modal-dialog .btn-danger:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

/* Error highlighting for validation */
.error-highlight {
  border-color: #e74c3c !important;
  background-color: #fef2f2;
  box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.2);
  animation: errorPulse 0.6s ease-in-out;
}

@keyframes errorPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.invoice-row.error-highlight {
  background-color: #fef2f2 !important;
}

/* Alert styles */
.alert {
  padding: 16px 20px;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Currency formatting helper */
.currency {
  font-family: "Monaco", "Menlo", monospace;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .variants-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .add-purchase-invoice-container {
    padding: 10px;
  }

  .title {
    font-size: 24px;
  }

  .form-container {
    padding: 20px;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .variants-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .table-wrapper {
    border-radius: 8px;
  }

  .invoice-table {
    font-size: 12px;
  }

  .invoice-table th,
  .invoice-table td {
    padding: 8px 12px;
  }

  .form-actions {
    flex-direction: column;
    gap: 12px;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .modal-dialog {
    margin: 20px;
    width: calc(100% - 40px);
    padding: 30px 20px;
  }
}

@media (max-width: 480px) {
  .invoice-table th,
  .invoice-table td {
    padding: 6px 8px;
    font-size: 11px;
  }

  .col-product,
  .col-variant,
  .col-attributes,
  .col-price,
  .col-quantity,
  .col-total {
    min-width: auto;
  }

  .prop-chip {
    font-size: 10px;
    padding: 2px 6px;
  }
}

/* Animation enhancements */
.selection-section,
.invoice-table-container,
.form-actions {
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.selection-section.step-1 {
  animation-delay: 0.1s;
}
.selection-section.step-2 {
  animation-delay: 0.2s;
}
.invoice-table-container {
  animation-delay: 0.3s;
}
.form-actions {
  animation-delay: 0.4s;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Utility classes */
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.text-left {
  text-align: left;
}
.font-bold {
  font-weight: bold;
}
.font-semibold {
  font-weight: 600;
}
.text-sm {
  font-size: 14px;
}
.text-xs {
  font-size: 12px;
}
.mt-2 {
  margin-top: 8px;
}
.mb-2 {
  margin-bottom: 8px;
}
.p-2 {
  padding: 8px;
}
</style>

<template>
  <div class="delivery-locations-container">
    <div
      v-if="showNotification"
      class="notification success-notification"
      :class="{ 'fade-out': fadeOut }"
    >
      <i class="fas fa-check-circle"></i>
      <span>{{ notificationMessage }}</span>
    </div>

    <div class="header">
      <h1 class="title">إدارة المدن والمناطق</h1>
      <p class="subtitle">إضافة وإدارة المدن ومناطق التوصيل وتكاليفها</p>
    </div>

    <div class="content-container">
      <div class="actions-section">
        <button
          @click="showAddCityForm = !showAddCityForm"
          class="btn btn-dark btn-add-city"
        >
          <i class="fas fa-plus"></i>
          {{ showAddCityForm ? "إلغاء" : "إضافة مدينة جديدة" }}
        </button>
      </div>

      <Transition name="slide-fade">
        <div v-if="showAddCityForm" class="add-form-card">
          <div class="form-header">
            <h3>إضافة مدينة جديدة</h3>
          </div>
          <form @submit.prevent="submitCity" class="form-body" novalidate>
            <div class="form-group">
              <label for="cityName">اسم المدينة</label>
              <input
                id="cityName"
                v-model="cityForm.name"
                type="text"
                class="form-control"
                :class="{ error: errors.name }"
                placeholder="أدخل اسم المدينة"
              />
              <span v-if="errors.name" class="error-message">{{
                errors.name
              }}</span>
            </div>
            <div class="form-group">
              <div class="checkbox-container">
                <label class="checkbox-label">
                  <input
                    v-model="cityForm.create_default_region"
                    type="checkbox"
                  />
                  <span class="checkmark"></span>
                  المدينة بدون مناطق
                </label>
              </div>
            </div>
            <div v-if="cityForm.create_default_region" class="form-group">
              <label for="defaultShippingCost">تكلفة التوصيل (د.ل)</label>
              <input
                id="defaultShippingCost"
                v-model="cityForm.default_shipping_cost"
                type="number"
                step="0.01"
                class="form-control"
                :class="{ error: errors.default_shipping_cost }"
                placeholder="0.00"
              />
              <span v-if="errors.default_shipping_cost" class="error-message">{{
                errors.default_shipping_cost
              }}</span>
            </div>
            <div class="form-group">
              <div class="checkbox-container">
                <label class="checkbox-label">
                  <input v-model="cityForm.is_active" type="checkbox" />
                  <span class="checkmark"></span>
                  مدينة نشطة
                </label>
              </div>
            </div>
            <div class="form-actions">
              <button
                type="button"
                @click="cancelAddCity"
                class="btn btn-secondary"
              >
                إلغاء
              </button>
              <button type="submit" class="btn btn-dark" :disabled="loading">
                <span v-if="loading" class="loading-spinner"></span>
                {{ loading ? "جاري الحفظ..." : "إضافة" }}
              </button>
            </div>
          </form>
        </div>
      </Transition>

      <div v-if="loading && cities.length === 0" class="loading-section">
        <div class="loading-spinner-large"></div>
        <p class="loading-text">جاري تحميل المدن والمناطق...</p>
      </div>

      <div v-else class="cities-container">
        <div
          v-for="city in sortedCities"
          :key="city.id"
          class="city-card"
          :class="{ 'inactive-item': !city.is_active }"
        >
          <div
            v-if="editingCity && editingCity.id === city.id"
            class="edit-form"
          >
            <div class="form-header">
              <h3>تعديل اسم المدينة</h3>
            </div>
            <form @submit.prevent="submitEditCity" class="form-body" novalidate>
              <div class="form-group">
                <label for="editCityName">اسم المدينة</label>
                <input
                  id="editCityName"
                  v-model="cityForm.name"
                  type="text"
                  class="form-control"
                  :class="{ error: errors.name }"
                  placeholder="أدخل اسم المدينة"
                />
                <span v-if="errors.name" class="error-message">{{
                  errors.name
                }}</span>
              </div>

              <div class="form-actions">
                <button
                  type="button"
                  @click="cancelEdit"
                  class="btn btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="loading"
                >
                  <span v-if="loading" class="loading-spinner"></span>
                  {{ loading ? "جاري الحفظ..." : "حفظ" }}
                </button>
              </div>
            </form>
          </div>

          <div v-else>
            <div class="city-header">
              <div class="city-info">
                <button
                  @click="toggleCityExpansion(city.id)"
                  class="toggle-arrow"
                  :class="{ expanded: isCityExpanded(city.id) }"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                <h3>{{ city.name }}</h3>
                <span v-if="!city.create_default_region" class="region-count">
                  {{ getRegionsByCity(city.id).length }}
                </span>
              </div>
              <div class="city-actions">
                <div class="status-toggle-container">
                  <button
                    @click="toggleCity(city.id, !city.is_active)"
                    :class="['status-toggle', { active: city.is_active }]"
                  >
                    <div class="toggle-slider"></div>
                  </button>
                </div>
                <button
                  @click="editCity(city)"
                  class="btn btn-sm btn-warning"
                  aria-label="تعديل"
                  :disabled="!city.is_active"
                >
                  <i class="fas fa-edit"></i>
                </button>
              </div>
            </div>

            <div
              class="collapsible-container"
              :class="{ expanded: isCityExpanded(city.id) }"
            >
              <div class="regions-section" v-if="!city.create_default_region">
                <div class="regions-header mt-2">
                  <h4>المناطق</h4>
                  <button
                    @click="toggleAddRegionForm(city)"
                    class="btn btn-sm btn-dark"
                    :disabled="!city.is_active"
                  >
                    <i class="fas fa-plus"></i>
                    {{
                      showAddRegionForm &&
                      selectedCity &&
                      selectedCity.id === city.id
                        ? "إلغاء"
                        : "إضافة منطقة"
                    }}
                  </button>
                </div>
                <div
                  v-if="
                    showAddRegionForm &&
                    selectedCity &&
                    selectedCity.id === city.id
                  "
                  class="add-region-form"
                >
                  <form
                    @submit.prevent="submitRegion"
                    class="region-form"
                    novalidate
                  >
                    <div class="form-row">
                      <div class="form-group">
                        <input
                          id="regionName"
                          v-model="regionForm.name"
                          type="text"
                          class="form-control"
                          :class="{ error: errors.regionName }"
                          placeholder="اسم المنطقة"
                        />
                        <span
                          v-if="errors.regionName"
                          class="error-message region-error"
                          >{{ errors.regionName }}</span
                        >
                      </div>
                      <div class="form-group">
                        <input
                          id="regionShippingCost"
                          v-model="regionForm.shipping_cost"
                          type="number"
                          step="0.01"
                          class="form-control"
                          :class="{ error: errors.regionShippingCost }"
                          placeholder="التكلفة"
                        />
                        <span
                          v-if="errors.regionShippingCost"
                          class="error-message region-error"
                          >{{ errors.regionShippingCost }}</span
                        >
                      </div>
                      <div class="form-group">
                        <label class="checkbox-label"
                          ><input
                            v-model="regionForm.is_active"
                            type="checkbox"
                          /><span class="checkmark"></span>نشط</label
                        >
                      </div>
                      <div class="form-actions-inline">
                        <button
                          type="submit"
                          class="btn btn-sm btn-dark"
                          :disabled="loading"
                        >
                          <span v-if="loading" class="loading-spinner"></span>
                          {{ loading ? "حفظ..." : "إضافة" }}
                        </button>
                        <button
                          type="button"
                          @click="cancelAddRegion"
                          class="btn btn-sm btn-secondary"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                <div class="regions-list">
                  <div
                    v-for="region in getRegionsByCity(city.id)"
                    :key="region.id"
                    class="region-item"
                    :class="{ 'inactive-item': !region.is_active }"
                  >
                    <div
                      v-if="editingRegion && editingRegion.id === region.id"
                      class="edit-region-form"
                    >
                      <form
                        @submit.prevent="submitEditRegion"
                        class="region-form"
                        novalidate
                      >
                        <div class="form-row">
                          <div class="form-group">
                            <input
                              id="editRegionName"
                              v-model="regionForm.name"
                              type="text"
                              class="form-control"
                              :class="{ error: errors.regionName }"
                              placeholder="اسم المنطقة"
                            />
                            <span
                              v-if="errors.regionName"
                              class="error-message region-error"
                              >{{ errors.regionName }}</span
                            >
                          </div>
                          <div class="form-group">
                            <input
                              id="editRegionShippingCost"
                              v-model="regionForm.shipping_cost"
                              type="number"
                              step="0.01"
                              class="form-control"
                              :class="{ error: errors.regionShippingCost }"
                              placeholder="التكلفة"
                            />
                            <span
                              v-if="errors.regionShippingCost"
                              class="error-message region-error"
                              >{{ errors.regionShippingCost }}</span
                            >
                          </div>
                          <div class="form-group">
                            <label class="checkbox-label"
                              ><input
                                v-model="regionForm.is_active"
                                type="checkbox"
                              /><span class="checkmark"></span>نشط</label
                            >
                          </div>
                          <div class="form-actions-inline">
                            <button
                              type="submit"
                              class="btn btn-sm btn-primary"
                              :disabled="loading"
                            >
                              <span
                                v-if="loading"
                                class="loading-spinner"
                              ></span>
                              {{ loading ? "حفظ..." : "حفظ" }}
                            </button>
                            <button
                              type="button"
                              @click="cancelEditRegion"
                              class="btn btn-sm btn-secondary"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                    <div v-else class="region-display">
                      <div class="region-info">
                        <span class="region-name">{{ region.name }}</span>
                        <span class="region-cost"
                          >{{ region.shipping_cost }} د.ل</span
                        >
                      </div>
                      <div class="region-actions">
                        <div class="status-toggle-container">
                          <button
                            @click="toggleRegion(region.id, !region.is_active)"
                            :class="[
                              'status-toggle',
                              'status-toggle-sm',
                              { active: region.is_active },
                            ]"
                          >
                            <div class="toggle-slider"></div>
                          </button>
                        </div>
                        <button
                          @click="editRegion(region)"
                          class="btn btn-xs btn-warning"
                          aria-label="تعديل"
                          :disabled="!region.is_active"
                        >
                          <i class="fas fa-edit"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

<script>
import { ref, onMounted, computed, reactive, nextTick } from "vue";
import { useCityStore } from "@/stores/cityStore";

export default {
  name: "CityManagement",
  setup() {
    const cityStore = useCityStore();
    const loading = ref(false);
    const showAddCityForm = ref(false);
    const showAddRegionForm = ref(false);
    const expandedCities = ref(new Set());
    const cityForm = ref({
      name: "",
      create_default_region: true,
      default_shipping_cost: "",
      is_active: true,
    });
    const regionForm = ref({
      name: "",
      shipping_cost: "",
      is_active: true,
      city: null,
    });
    const editingCity = ref(null);
    const editingRegion = ref(null);
    const selectedCity = ref(null);
    const showNotification = ref(false);
    const fadeOut = ref(false);
    const notificationMessage = ref("");
    const showErrorModal = ref(false);
    const modalErrorMessage = ref("");

    // Add reactive errors object
    const errors = reactive({});

    const cities = computed(() => cityStore.cities);
    const regions = computed(() => cityStore.regions);

    const getRegionsByCity = (cityId) => {
      return regions.value.filter((region) => region.city === cityId);
    };

    const sortedCities = computed(() => {
      return [...cities.value].sort((cityA, cityB) => {
        const countB = getRegionsByCity(cityB.id).length;
        const countA = getRegionsByCity(cityA.id).length;
        return countB - countA;
      });
    });

    const isCityExpanded = (cityId) => expandedCities.value.has(cityId);
    const toggleCityExpansion = (cityId) => {
      if (expandedCities.value.has(cityId)) {
        expandedCities.value.delete(cityId);
      } else {
        expandedCities.value.add(cityId);
      }
    };

    // Clear all errors
    const clearErrors = () => {
      Object.keys(errors).forEach((key) => delete errors[key]);
    };

    // Validate city form
    const validateCityForm = () => {
      clearErrors();
      let isValid = true;

      if (!cityForm.value.name.trim()) {
        errors.name = "اسم المدينة مطلوب";
        isValid = false;
      }

      if (cityForm.value.create_default_region) {
        if (
          cityForm.value.default_shipping_cost === "" ||
          cityForm.value.default_shipping_cost === null ||
          cityForm.value.default_shipping_cost === undefined
        ) {
          errors.default_shipping_cost = "تكلفة التوصيل مطلوبة";
          isValid = false;
        } else if (
          isNaN(cityForm.value.default_shipping_cost) ||
          Number(cityForm.value.default_shipping_cost) < 0
        ) {
          errors.default_shipping_cost = "تكلفة التوصيل يجب أن تكون رقم موجب";
          isValid = false;
        }
      }

      return isValid;
    };

    // Validate region form
    const validateRegionForm = () => {
      // Clear region-specific errors
      delete errors.regionName;
      delete errors.regionShippingCost;
      let isValid = true;

      if (!regionForm.value.name.trim()) {
        errors.regionName = "اسم المنطقة مطلوب";
        isValid = false;
      }

      if (
        regionForm.value.shipping_cost === "" ||
        regionForm.value.shipping_cost === null ||
        regionForm.value.shipping_cost === undefined
      ) {
        errors.regionShippingCost = "تكلفة التوصيل مطلوبة";
        isValid = false;
      } else if (
        isNaN(regionForm.value.shipping_cost) ||
        Number(regionForm.value.shipping_cost) < 0
      ) {
        errors.regionShippingCost = "تكلفة التوصيل يجب أن تكون رقم موجب";
        isValid = false;
      }

      return isValid;
    };

    // Get field ID for scrolling to errors
    const getFieldId = (fieldName) => {
      const fieldIdMap = {
        name: editingCity.value ? "editCityName" : "cityName",
        default_shipping_cost: "defaultShippingCost",
        regionName: editingRegion.value ? "editRegionName" : "regionName",
        regionShippingCost: editingRegion.value
          ? "editRegionShippingCost"
          : "regionShippingCost",
      };
      return fieldIdMap[fieldName] || fieldName;
    };

    // Scroll to first error
    const scrollToFirstError = async () => {
      await nextTick();
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const elementId = getFieldId(firstErrorKey);
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Add error highlight animation
          element.classList.add("error-highlight");
          setTimeout(() => {
            element.classList.remove("error-highlight");
          }, 2000);
        }
      }
    };

    const showSuccessNotification = (message) => {
      notificationMessage.value = message;
      showNotification.value = true;
      fadeOut.value = false;
      setTimeout(() => {
        fadeOut.value = true;
        setTimeout(() => {
          showNotification.value = false;
        }, 500);
      }, 4500);
    };

    const displayErrorModal = (errorMessage) => {
      modalErrorMessage.value = errorMessage;
      showErrorModal.value = true;
    };

    const closeErrorModal = () => {
      showErrorModal.value = false;
      modalErrorMessage.value = "";
    };

    const loadData = async () => {
      loading.value = true;
      try {
        await cityStore.fetchCities();
        await cityStore.fetchRegions();
      } finally {
        loading.value = false;
      }
    };

    const resetCityForm = () => {
      cityForm.value = {
        name: "",
        create_default_region: true,
        default_shipping_cost: "",
        is_active: true,
      };
      clearErrors();
    };

    const resetRegionForm = () => {
      regionForm.value = {
        name: "",
        shipping_cost: "",
        is_active: true,
        city: null,
      };
      // Clear region-specific errors
      delete errors.regionName;
      delete errors.regionShippingCost;
    };

    const cancelAddCity = () => {
      showAddCityForm.value = false;
      resetCityForm();
    };

    const cancelEdit = () => {
      editingCity.value = null;
      resetCityForm();
    };

    const cancelAddRegion = () => {
      showAddRegionForm.value = false;
      selectedCity.value = null;
      resetRegionForm();
    };

    const cancelEditRegion = () => {
      editingRegion.value = null;
      resetRegionForm();
    };

    const submitCity = async () => {
      if (!validateCityForm()) {
        await scrollToFirstError();
        return;
      }

      loading.value = true;
      try {
        const result = await cityStore.addCity(cityForm.value);
        if (result.success) {
          if (cityForm.value.create_default_region) {
            await cityStore.fetchRegions();
          }
          showAddCityForm.value = false;
          resetCityForm();
          showSuccessNotification("تمت إضافة المدينة بنجاح.");
        } else {
          displayErrorModal(result.error || "حدث خطأ غير متوقع.");
        }
      } finally {
        loading.value = false;
      }
    };

    const submitEditCity = async () => {
      if (!validateCityForm()) {
        await scrollToFirstError();
        return;
      }

      loading.value = true;
      try {
        const result = await cityStore.editCity(
          editingCity.value.id,
          cityForm.value
        );
        if (result.success) {
          if (cityForm.value.create_default_region) {
            await cityStore.fetchRegions();
          }
          editingCity.value = null;
          resetCityForm();
          showSuccessNotification("تم تعديل المدينة بنجاح.");
        } else {
          displayErrorModal(result.error || "حدث خطأ غير متوقع.");
        }
      } finally {
        loading.value = false;
      }
    };

    const editCity = (city) => {
      editingCity.value = city;
      cityForm.value = {
        name: city.name,
        create_default_region: city.create_default_region,
        default_shipping_cost: city.default_shipping_cost || "",
        is_active: city.is_active,
      };
      clearErrors();
    };

    const toggleCity = async (cityId, isActive) => {
      const result = await cityStore.toggleCityStatus(cityId, isActive);
      if (result.success) {
        showSuccessNotification(
          `تم ${
            isActive ? "تفعيل" : "إلغاء تفعيل"
          } المدينة والمناطق التابعة لها.`
        );
      } else {
        displayErrorModal(result.error || "حدث خطأ في تغيير الحالة.");
      }
    };

    const toggleAddRegionForm = (city) => {
      if (
        showAddRegionForm.value &&
        selectedCity.value &&
        selectedCity.value.id === city.id
      ) {
        showAddRegionForm.value = false;
        selectedCity.value = null;
        resetRegionForm();
      } else {
        selectedCity.value = city;
        regionForm.value.city = city.id;
        showAddRegionForm.value = true;
        resetRegionForm();
      }
    };

    const submitRegion = async () => {
      if (!validateRegionForm()) {
        await scrollToFirstError();
        return;
      }

      // Ensure city ID is properly set before submission
      if (!regionForm.value.city && selectedCity.value) {
        regionForm.value.city = selectedCity.value.id;
      }

      console.log("Region form before submission:", regionForm.value); // Debug line

      loading.value = true;
      try {
        const result = await cityStore.addRegion(regionForm.value);
        if (result.success) {
          showAddRegionForm.value = false;
          selectedCity.value = null;
          resetRegionForm();
          showSuccessNotification("تمت إضافة المنطقة بنجاح.");
        } else {
          displayErrorModal(result.error || "حدث خطأ غير متوقع.");
        }
      } finally {
        loading.value = false;
      }
    };

    const submitEditRegion = async () => {
      if (!validateRegionForm()) {
        await scrollToFirstError();
        return;
      }

      loading.value = true;
      try {
        const result = await cityStore.editRegion(
          editingRegion.value.id,
          regionForm.value
        );
        if (result.success) {
          editingRegion.value = null;
          resetRegionForm();
          showSuccessNotification("تم تعديل المنطقة بنجاح.");
        } else {
          displayErrorModal(result.error || "حدث خطأ غير متوقع.");
        }
      } finally {
        loading.value = false;
      }
    };

    const editRegion = (region) => {
      editingRegion.value = region;
      regionForm.value = {
        name: region.name,
        shipping_cost: region.shipping_cost || "",
        is_active: region.is_active,
        city: region.city,
      };
      delete errors.regionName;
      delete errors.regionShippingCost;
    };

    const toggleRegion = async (regionId, isActive) => {
      const result = await cityStore.toggleRegionStatus(regionId, isActive);
      if (result.success) {
        showSuccessNotification(
          `تم ${isActive ? "تفعيل" : "إلغاء تفعيل"} المنطقة.`
        );
      } else {
        displayErrorModal(result.error || "حدث خطأ في تغيير الحالة.");
      }
    };

    onMounted(loadData);

    return {
      loading,
      showAddCityForm,
      showAddRegionForm,
      cityForm,
      regionForm,
      editingCity,
      editingRegion,
      selectedCity,
      cities,
      regions,
      errors,
      getRegionsByCity,
      cancelAddCity,
      cancelEdit,
      cancelAddRegion,
      cancelEditRegion,
      submitCity,
      submitEditCity,
      editCity,
      toggleCity,
      toggleAddRegionForm,
      submitRegion,
      submitEditRegion,
      editRegion,
      toggleRegion,
      showNotification,
      fadeOut,
      notificationMessage,
      showErrorModal,
      modalErrorMessage,
      closeErrorModal,
      isCityExpanded,
      toggleCityExpansion,
      sortedCities,
    };
  },
};
</script>

<style scoped>
/* Main container with gradient background */
.delivery-locations-container {
  direction: rtl;
  padding: 40px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #cacacab5 100%);
  min-height: 100vh;
}

/* Header styling */
.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.subtitle {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

/* Content container */
.content-container {
  background: white;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px 40px;
  overflow: visible;
}

/* Actions section */
.actions-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 30px;
  animation: slideInUp 0.6s ease-out;
}

.btn-add-city {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 16px;
}

/* Loading section */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  animation: slideInUp 0.6s ease-out;
  animation-delay: 0.3s;
  animation-fill-mode: both;
}

.loading-spinner-large {
  width: 40px;
  height: 40px;
  border: 4px solid #e3f2fd;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

/* Add form card */
.add-form-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #0f0f0f;
  margin-bottom: 30px;
  overflow: hidden;
  animation: slideInUp 0.6s ease-out;
  animation-delay: 0.2s;
  animation-fill-mode: both;
}

.edit-form {
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #28a745;
  margin-bottom: 20px;
  overflow: hidden;
  padding: 1px;
  animation: slideInUp 0.4s ease-out;
}

.form-header {
  padding: 15px 25px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.form-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2em;
  font-weight: 600;
  font-family: "Cairo", sans-serif;
}

.form-body {
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 0.95em;
  font-family: "Cairo", sans-serif;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
  box-sizing: border-box;
  font-family: "Cairo", sans-serif;
  direction: rtl;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-control::placeholder {
  color: #999;
  font-family: "Cairo", sans-serif;
}

/* Error styling */
.form-control.error {
  border-color: #ef4444;
  background-color: #fef2f2;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: block;
  animation: errorSlideIn 0.3s ease-out;
  font-family: "Cairo", sans-serif;
}

.region-error {
  font-size: 11px;
  margin-top: 2px;
}

@keyframes errorSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Error highlight animation */
.error-highlight {
  border-color: #e74c3c !important;
  background-color: #fef2f2 !important;
  box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.2) !important;
  animation: errorPulse 0.5s ease-in-out;
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

/* Checkbox styling */
.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  gap: 10px;
  margin-bottom: 0;
  font-family: "Cairo", sans-serif;
  font-size: 0.95em;
  color: #555;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #007bff;
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  margin-top: 20px;
}

.form-actions-inline {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

/* Cities container */
.cities-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.cities-container .city-card:nth-child(1) {
  animation: slideInUp 0.6s ease-out;
  animation-delay: 0.4s;
  animation-fill-mode: both;
}

.cities-container .city-card:nth-child(2) {
  animation: slideInUp 0.6s ease-out;
  animation-delay: 0.5s;
  animation-fill-mode: both;
}

.cities-container .city-card:nth-child(3) {
  animation: slideInUp 0.6s ease-out;
  animation-delay: 0.6s;
  animation-fill-mode: both;
}

.cities-container .city-card:nth-child(n + 4) {
  animation: slideInUp 0.6s ease-out;
  animation-delay: 0.7s;
  animation-fill-mode: both;
}

/* City card styling */
.city-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 25px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.city-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
}

.city-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.city-info h3 {
  margin: 0;
  color: #333;
  font-size: 1.4em;
  font-weight: 700;
  font-family: "Cairo", sans-serif;
}

.region-count {
  background-color: #e9ecef;
  color: #495057;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
  font-family: "Cairo", sans-serif;
}

.toggle-arrow {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.toggle-arrow i {
  transition: transform 0.3s ease-in-out;
  font-size: 1.1em;
}

.toggle-arrow.expanded i {
  transform: rotate(-90deg);
}

.city-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

/* Status toggle */
.status-toggle-container {
  display: flex;
  align-items: center;
}

.status-toggle {
  position: relative;
  width: 50px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: #dc3545;
  cursor: pointer;
  transition: all 0.3s ease;
}

.status-toggle.active {
  background-color: #198754;
}

.status-toggle .toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  transition: all 0.3s ease;
}

.status-toggle.active .toggle-slider {
  transform: translateX(26px);
}

.status-toggle.status-toggle-sm {
  width: 44px;
  height: 22px;
}

.status-toggle.status-toggle-sm .toggle-slider {
  width: 18px;
  height: 18px;
}

.status-toggle.status-toggle-sm.active .toggle-slider {
  transform: translateX(22px);
}

/* Collapsible container */
.collapsible-container {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s ease-in-out;
}

.collapsible-container.expanded {
  grid-template-rows: 1fr;
}

.regions-section {
  overflow: hidden;
  min-height: 0;
  padding-top: 25px;
  border-top: 2px solid #f0f0f0;
  margin-top: 15px;
}

.regions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.regions-header h4 {
  margin: 0;
  color: #555;
  font-size: 1.2em;
  font-weight: 600;
  font-family: "Cairo", sans-serif;
}

/* Region forms */
.add-region-form,
.edit-region-form {
  background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.region-form .form-row {
  display: flex;
  align-items: end;
  gap: 15px;
  flex-wrap: wrap;
}

.form-row .form-group {
  flex: 1;
  min-width: 140px;
  margin-bottom: 0;
  position: relative;
}

/* Regions list */
.regions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.region-item {
  padding: 18px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.region-item:hover {
  transform: translateX(-3px);
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
}

.region-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.region-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.region-name {
  font-weight: 600;
  color: #333;
  font-size: 1.05em;
  font-family: "Cairo", sans-serif;
}

.region-cost {
  color: #28a745;
  font-weight: 700;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  border: 1px solid #b8dacd;
  font-family: "Cairo", sans-serif;
}

.region-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Button styling */
.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: "Cairo", sans-serif;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #545b62 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(108, 117, 125, 0.3);
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border: 2px solid #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
}

.btn-outline:hover {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(220, 53, 69, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-2px);
}

.btn-sm {
  padding: 8px 14px;
  font-size: 0.85em;
}

.btn-xs {
  padding: 6px 10px;
  font-size: 0.8em;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Loading spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Notification styling */
.notification {
  position: fixed;
  top: 80px;
  left: 20px;
  direction: ltr;
  text-align: right;
  z-index: 9999;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  animation: slideInLeft 0.4s ease-out;
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.success-notification {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.notification.fade-out {
  opacity: 0;
  transform: translateX(-100%);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification i {
  font-size: 18px;
}

.notification span {
  font-size: 14px;
}

/* Modal styling */
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
  z-index: 10000;
}

.modal-dialog {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
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
  font-size: 32px;
}

.error-icon {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.modal-dialog h3 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.modal-dialog p {
  color: #7f8c8d;
  margin: 0 0 30px 0;
  font-size: 16px;
}

/* Inactive items */
.inactive-item {
  opacity: 0.8;
  background-color: #f8f9fa !important;
  transition: opacity 0.3s ease, background-color 0.3s ease;
}

.inactive-item:hover {
  transform: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.inactive-item .status-toggle-container {
  opacity: 1;
}

/* Slide fade transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: max-height 0.4s ease-in-out, opacity 0.3s ease-out,
    transform 0.4s ease-in-out;
  overflow: hidden;
  transform-origin: top;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  transform: scaleY(0.95);
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 500px;
  opacity: 1;
  transform: scaleY(1);
}

/* Responsive design */
@media (max-width: 768px) {
  .delivery-locations-container {
    padding: 20px 10px;
  }

  .title {
    font-size: 24px;
  }

  .content-container {
    padding: 20px;
  }

  .city-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .city-actions {
    align-self: stretch;
    justify-content: space-between;
  }

  .form-row {
    flex-direction: column;
  }

  .form-row .form-group {
    min-width: auto;
    width: 100%;
  }

  .form-actions-inline {
    width: 100%;
    justify-content: stretch;
  }

  .form-actions-inline .btn {
    flex: 1;
  }
}
</style>
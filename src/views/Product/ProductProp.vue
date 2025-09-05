<template>
  <div class="props-container">
    <!-- Success Notification -->
    <div v-if="showNotification" class="notification success-notification" :class="{ 'fade-out': fadeOut }">
      <i class="fas fa-check-circle"></i>
      <span>تمت الإضافة بنجاح</span>
    </div>

    <div class="header">
      <h1 class="title">إدارة خواص المنتجات</h1>
      <p class="subtitle">أضف وعدّل الخواص التي يمكن إسنادها للمنتجات (مثل: المقاس، الخامة، إلخ).</p>
    </div>

    <div class="content-wrapper">
      <div class="card add-prop-card">
        <h2 class="card-title">إضافة خاصية جديدة</h2>
        <form @submit.prevent="submitNewProperty" class="add-prop-form" novalidate>
          <div class="form-group">
            <label for="newPropName" class="form-label">اسم الخاصية</label>
            <input 
              id="newPropName" 
              v-model="newPropertyName" 
              type="text" 
              class="form-input"
              :class="{ 'error': errors.newPropertyName }"
              placeholder="مثال: اللون"
            >
            <span v-if="errors.newPropertyName" class="error-message">{{ errors.newPropertyName }}</span>
          </div>
          <button type="submit" class="btn btn-primary">إضافة الخاصية</button>
        </form>
      </div>

      <div class="card props-list-card">
        <h2 class="card-title">قائمة الخواص</h2>
        
        <!-- Enhanced Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="spinner-border" role="status"></div>
          <p class="loading-text">جاري تحميل الخواص...</p>
        </div>
        
        <div v-else-if="store.properties.length === 0" class="empty-state">
          لا توجد خواص مضافة بعد
        </div>
        <div v-else class="properties-list">
          <div v-for="prop in store.properties" :key="prop.id" class="property-item">
            <div class="property-header">
              <div v-if="editingProperty === prop.id" class="edit-property-form">
                <input 
                  v-model="editPropertyName" 
                  type="text" 
                  class="form-input-sm edit-input"
                  :class="{ 'error': errors.editPropertyName }"
                  @keyup.enter="savePropertyEdit(prop.id)"
                  @keyup.esc="cancelPropertyEdit"
                >
                <button @click="savePropertyEdit(prop.id)" class="btn-icon btn-save">
                  <i class="fas fa-check"></i>
                </button>
                <button @click="cancelPropertyEdit" class="btn-icon btn-cancel">
                  <i class="fas fa-times"></i>
                </button>
                <span v-if="errors.editPropertyName" class="error-message edit-error">{{ errors.editPropertyName }}</span>
              </div>
              <div v-else class="property-name-wrapper">
                <span class="property-name">{{ prop.name }}</span>
                <button @click="startEditProperty(prop.id, prop.name)" class="btn-icon btn-edit">
                  <i class="fas fa-edit"></i>
                </button>
              </div>
            </div>
            <div class="values-section">
              <h3 class="values-title">القيم</h3>
              <ul v-if="prop.values && prop.values.length > 0" class="values-list">
                <li v-for="value in prop.values" :key="value.id" class="value-item">
                  <div v-if="editingValue === value.id" class="edit-value-form">
                    <input 
                      v-model="editValueText" 
                      type="text" 
                      class="form-input-xs"
                      :class="{ 'error': errors.editValueText }"
                      @keyup.enter="saveValueEdit(value.id, prop.id)"
                      @keyup.esc="cancelValueEdit"
                    >
                    <button @click="saveValueEdit(value.id, prop.id)" class="btn-icon-xs btn-save">
                      <i class="fas fa-check"></i>
                    </button>
                    <button @click="cancelValueEdit" class="btn-icon-xs btn-cancel">
                      <i class="fas fa-times"></i>
                    </button>
                    <span v-if="errors.editValueText" class="error-message edit-value-error">{{ errors.editValueText }}</span>
                  </div>
                  <div v-else class="value-content">
                    <span 
                      v-if="prop.name === 'اللون'" 
                      class="color-circle-preview" 
                      :style="{ backgroundColor: value.value }">
                    </span>
                    <span>{{ value.value }}</span>
                    <button @click="startEditValue(value.id, value.value)" class="btn-icon-xs btn-edit">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                </li>
              </ul>
              <p v-else class="no-values">لا توجد قيم مضافة</p>
              <form @submit.prevent="addNewValue(prop.id)" class="add-value-form" novalidate>
                <input 
                  type="text" 
                  v-model="prop.newValue" 
                  class="form-input-sm" 
                  :class="{ 'error': errors[`newValue_${prop.id}`] }"
                  placeholder="إضافة قيمة جديدة"
                >
                <button type="submit" class="btn btn-secondary-sm">
                  إضافة
                </button>
                <span v-if="errors[`newValue_${prop.id}`]" class="error-message add-value-error">{{ errors[`newValue_${prop.id}`] }}</span>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
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
import { ref, onMounted } from 'vue';
import { usePropStore } from '@/stores/propStore';

const store = usePropStore();
const newPropertyName = ref('');
const loading = ref(false);

// Edit property states
const editingProperty = ref(null);
const editPropertyName = ref('');

// Edit value states
const editingValue = ref(null);
const editValueText = ref('');

// Error handling
const errors = ref({});

// Notification state
const showNotification = ref(false);
const fadeOut = ref(false);

// Error modal state
const showErrorModal = ref(false);
const modalErrorMessage = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    await store.fetchAttributes();
  } catch (error) {
    console.error('Error loading properties:', error);
  } finally {
    loading.value = false;
  }
});

// Clear specific error
const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field];
  }
};

// Show success notification
const showSuccessNotification = () => {
  showNotification.value = true;
  fadeOut.value = false;
  
  setTimeout(() => {
    fadeOut.value = true;
    setTimeout(() => {
      showNotification.value = false;
    }, 500); // Wait for fade animation to complete
  }, 4500); // Show for 4.5 seconds, then fade for 0.5 seconds
};

// Show error modal
const displayErrorModal = (errorMessage) => {
  modalErrorMessage.value = errorMessage;
  showErrorModal.value = true;
};

// Close error modal
const closeErrorModal = () => {
  showErrorModal.value = false;
  modalErrorMessage.value = '';
};

// Validate new property name
const validateNewProperty = () => {
  clearError('newPropertyName');
  
  if (!newPropertyName.value || !newPropertyName.value.trim()) {
    errors.value.newPropertyName = 'اسم الخاصية مطلوب';
    return false;
  }
  
  return true;
};

// Validate edit property name
const validateEditProperty = () => {
  clearError('editPropertyName');
  
  if (!editPropertyName.value || !editPropertyName.value.trim()) {
    errors.value.editPropertyName = 'اسم الخاصية مطلوب';
    return false;
  }
  
  return true;
};

// Validate edit value
const validateEditValue = () => {
  clearError('editValueText');
  
  if (!editValueText.value || !editValueText.value.trim()) {
    errors.value.editValueText = 'قيمة الخاصية مطلوبة';
    return false;
  }
  
  return true;
};

// Validate new value for property
const validateNewValue = (propId) => {
  const prop = store.properties.find(p => p.id === propId);
  const fieldName = `newValue_${propId}`;
  
  clearError(fieldName);
  
  if (!prop || !prop.newValue || !prop.newValue.trim()) {
    errors.value[fieldName] = 'قيمة الخاصية مطلوبة';
    return false;
  }
  
  return true;
};

const submitNewProperty = async () => {
  if (!validateNewProperty()) {
    return;
  }
  
  const result = await store.addAttribute(newPropertyName.value.trim());
  
  if (result.success) {
    newPropertyName.value = '';
    clearError('newPropertyName');
    showSuccessNotification();
  } else {
    displayErrorModal(result.error);
  }
};

const addNewValue = async (propId) => {
  if (!validateNewValue(propId)) {
    return;
  }
  
  const prop = store.properties.find(p => p.id === propId);
  const result = await store.addAttributeValue(prop.id, prop.newValue.trim());
  
  if (result.success) {
    clearError(`newValue_${propId}`);
    showSuccessNotification();
  } else {
    displayErrorModal(result.error);
  }
};

// Property editing functions
const startEditProperty = (propId, propName) => {
  editingProperty.value = propId;
  editPropertyName.value = propName;
  clearError('editPropertyName');
};

const savePropertyEdit = async (propId) => {
  if (!validateEditProperty()) {
    return;
  }
  
  const result = await store.editAttribute(propId, editPropertyName.value.trim());
  
  if (result.success) {
    editingProperty.value = null;
    editPropertyName.value = '';
    clearError('editPropertyName');
    showSuccessNotification();
  } else {
    displayErrorModal(result.error);
  }
};

const cancelPropertyEdit = () => {
  editingProperty.value = null;
  editPropertyName.value = '';
  clearError('editPropertyName');
};

// Value editing functions
const startEditValue = (valueId, valueText) => {
  editingValue.value = valueId;
  editValueText.value = valueText;
  clearError('editValueText');
};

const saveValueEdit = async (valueId, propId) => {
  if (!validateEditValue()) {
    return;
  }
  
  const result = await store.editAttributeValue(valueId, propId, editValueText.value.trim());
  
  if (result.success) {
    editingValue.value = null;
    editValueText.value = '';
    clearError('editValueText');
    showSuccessNotification();
  } else {
    displayErrorModal(result.error);
  }
};

const cancelValueEdit = () => {
  editingValue.value = null;
  editValueText.value = '';
  clearError('editValueText');
};

const deleteValue = async (valueId, propId) => {
  if (confirm('هل أنت متأكد من حذف هذه القيمة؟')) {
    const result = await store.deleteAttributeValue(valueId, propId);
    
    if (!result.success) {
      displayErrorModal(result.error);
    }
  }
};
</script>

<style scoped>
/* Notification Styles */
.notification {
  position: fixed;
  top: 20px;
  left: 20px;
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

/* Error Styles */
.form-input.error,
.form-input-sm.error,
.form-input-xs.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: block;
  animation: errorSlideIn 0.3s ease-out;
}

.edit-error {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 2px;
  white-space: nowrap;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.edit-value-error {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 2px;
  white-space: nowrap;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  font-size: 10px;
}

.add-value-error {
  margin-top: 4px;
  font-size: 12px;
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

/* Position relative for forms with error messages */
.edit-property-form,
.edit-value-form,
.add-value-form {
  position: relative;
}

/* Loading Container Styles */
.loading-container {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border: 0.25em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
  color: #3b82f6;
  margin-bottom: 16px;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin: 0;
  font-size: 16px;
  color: #6b7280;
}

/* Color circle preview styles */
.color-circle-preview {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.value-content {
  gap: 8px;
}

.props-container {
  direction: rtl;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
.header {
  text-align: center;
  margin-bottom: 30px;
}
.title {
  font-size: 28px;
  font-weight: bold;
}
.subtitle {
  color: #6b7280;
}
.content-wrapper {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 25px;
}
.card-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}
.add-prop-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.add-prop-form .btn {
  align-self: flex-start;
}
.form-group {
  flex-grow: 1;
}
.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 5px;
  font-size: 14px;
}
.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  background-color: #3b82f6;
  color: white;
}
.btn-secondary {
  background-color: #6c757d;
  color: white;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}
.empty-state {
  text-align: center;
  padding: 30px;
  color: #6b7280;
}
.properties-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.property-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 15px;
}
.property-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.property-name-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.property-name {
  font-size: 18px;
  font-weight: 600;
}
.values-section {
  padding-top: 15px;
  border-top: 1px solid #f3f4f6;
}
.values-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 15px;
}
.values-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  list-style: none;
  padding: 0;
  margin-bottom: 15px;
}
.value-item {
  background-color: #eef2ff;
  color: #4f46e5;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
}
.value-content {
  display: flex;
  align-items: center;
  gap: 5px;
}
.no-values {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 15px;
}
.add-value-form {
  display: flex;
  gap: 10px;
}
.form-input-sm {
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}
.btn-secondary-sm {
  padding: 5px 10px;
  border-radius: 5px;
  border: none;
  background-color: #f3f4f6;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}
.btn-secondary-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.edit-property-form {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.edit-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
}
.edit-value-form {
  display: flex;
  align-items: center;
  gap: 4px;
}
.form-input-xs {
  padding: 2px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  min-width: 80px;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  width: 32px;
  height: 32px;
}
.btn-icon-xs {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  width: 24px;
  height: 24px;
}
.btn-edit {
  color: #6b7280;
}
.btn-edit:hover {
  background-color: #f3f4f6;
  color: #374151;
}
.btn-save {
  color: #059669;
}
.btn-save:hover {
  background-color: #ecfdf5;
}
.btn-cancel {
  color: #dc2626;
}
.btn-cancel:hover {
  background-color: #fef2f2;
}
.btn-delete {
  color: #dc2626;
}
.btn-delete:hover {
  background-color: #fef2f2;
}
.btn-icon i {
  font-size: 14px;
}
.btn-icon-xs i {
  font-size: 12px;
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
  from { opacity: 0; transform: translateY(-50px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
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

.btn-danger {
  background: #e74c3c;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover:not(:disabled) { 
  background: #c0392b; 
  transform: translateY(-2px);
}
</style>
<template>
  <div class="props-container">
    <div class="header">
      <h1 class="title">إدارة خواص المنتجات</h1>
      <p class="subtitle">أضف وعدّل الخواص التي يمكن إسنادها للمنتجات (مثل: المقاس، الخامة، إلخ).</p>
    </div>

    <div class="content-wrapper">
      <div class="card add-prop-card">
        <h2 class="card-title">إضافة خاصية جديدة</h2>
        <form @submit.prevent="submitNewProperty" class="add-prop-form">
          <div class="form-group">
            <label for="newPropName" class="form-label">اسم الخاصية</label>
            <input id="newPropName" v-model="newPropertyName" type="text" class="form-input" placeholder="مثال: اللون">
          </div>
          <button type="submit" :disabled="!newPropertyName.trim()" class="btn btn-primary">إضافة الخاصية</button>
        </form>
      </div>

      <div class="card props-list-card">
        <h2 class="card-title">قائمة الخواص</h2>
        <div v-if="loading" class="loading">Loading...</div>
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
                  @keyup.enter="savePropertyEdit(prop.id)"
                  @keyup.esc="cancelPropertyEdit"
                >
                <button @click="savePropertyEdit(prop.id)" class="btn-icon btn-save">
                  <i class="fas fa-check"></i>
                </button>
                <button @click="cancelPropertyEdit" class="btn-icon btn-cancel">
                  <i class="fas fa-times"></i>
                </button>
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
                      @keyup.enter="saveValueEdit(value.id, prop.id)"
                      @keyup.esc="cancelValueEdit"
                    >
                    <button @click="saveValueEdit(value.id, prop.id)" class="btn-icon-xs btn-save">
                      <i class="fas fa-check"></i>
                    </button>
                    <button @click="cancelValueEdit" class="btn-icon-xs btn-cancel">
                      <i class="fas fa-times"></i>
                    </button>
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
              <form @submit.prevent="addNewValue(prop.id)" class="add-value-form">
                <input 
                  type="text" 
                  v-model="prop.newValue" 
                  class="form-input-sm" 
                  placeholder="إضافة قيمة جديدة"
                >
                <button type="submit" :disabled="!prop.newValue || !prop.newValue.trim()" class="btn btn-secondary-sm">
                  إضافة
                </button>
              </form>
            </div>
          </div>
        </div>
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

const submitNewProperty = async () => {
  if (!newPropertyName.value.trim()) return;
  
  const result = await store.addAttribute(newPropertyName.value.trim());
  
  if (result.success) {
    newPropertyName.value = '';
  } else {
    alert(result.error);
  }
};

const addNewValue = async (propId) => {
  const prop = store.properties.find(p => p.id === propId);
  if (!prop || !prop.newValue || !prop.newValue.trim()) return;
  
  const result = await store.addAttributeValue(prop.id, prop.newValue.trim());
  
  if (!result.success) {
    alert(result.error);
  }
};

// Property editing functions
const startEditProperty = (propId, propName) => {
  editingProperty.value = propId;
  editPropertyName.value = propName;
};

const savePropertyEdit = async (propId) => {
  if (!editPropertyName.value.trim()) return;
  
  const result = await store.editAttribute(propId, editPropertyName.value.trim());
  
  if (result.success) {
    editingProperty.value = null;
    editPropertyName.value = '';
  } else {
    alert(result.error);
  }
};

const cancelPropertyEdit = () => {
  editingProperty.value = null;
  editPropertyName.value = '';
};

// Value editing functions
const startEditValue = (valueId, valueText) => {
  editingValue.value = valueId;
  editValueText.value = valueText;
};

const saveValueEdit = async (valueId, propId) => {
  if (!editValueText.value.trim()) return;
  
  const result = await store.editAttributeValue(valueId, propId, editValueText.value.trim());
  
  if (result.success) {
    editingValue.value = null;
    editValueText.value = '';
  } else {
    alert(result.error);
  }
};

const cancelValueEdit = () => {
  editingValue.value = null;
  editValueText.value = '';
};

const deleteValue = async (valueId, propId) => {
  if (confirm('هل أنت متأكد من حذف هذه القيمة؟')) {
    const result = await store.deleteAttributeValue(valueId, propId);
    
    if (!result.success) {
      alert(result.error);
    }
  }
};
</script>

<style scoped>
/* CHANGE START: Added styles for the color circle preview */
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
/* CHANGE END */

.props-container {
  direction: rtl;
  padding: 40px 20px;
  background-color: #f5f7fa;
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
.loading {
  text-align: center;
  padding: 20px;
  color: #6b7280;
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
</style>
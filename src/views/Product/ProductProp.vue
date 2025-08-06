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
          <div class="form-group">
            <label for="newPropValues" class="form-label">قيم الخاصية (افصل بينها بفاصلة)</label>
            <input id="newPropValues" v-model="newPropertyValues" type="text" class="form-input" placeholder="مثال: أحمر, أخضر, أزرق">
          </div>
          <button type="submit" class="btn btn-primary">إضافة الخاصية بقيمها</button>
        </form>
      </div>

      <div class="card props-list-card">
        <h2 class="card-title">قائمة الخواص</h2>
        <div v-if="properties.length === 0" class="empty-state">
          <p>لم تقم بإضافة أي خواص بعد.</p>
        </div>
        <div v-else class="properties-list">
          <div v-for="prop in properties" :key="prop.id" class="property-item">
            <div class="property-header">
              <h3 class="property-name">{{ prop.name }}</h3>
              <button @click="deleteProperty(prop.id)" class="btn-delete-prop" title="حذف الخاصية">&times;</button>
            </div>
            
            <div class="values-section">
              <h4 class="values-title">القيم</h4>
              <ul class="values-list">
                <li v-for="value in prop.values" :key="value" class="value-chip">
                  {{ value }}
                  <button @click="deleteValue(prop.id, value)" class="btn-delete-value">&times;</button>
                </li>
                 <li v-if="prop.values.length === 0" class="no-values">
                  لا توجد قيم لهذه الخاصية.
                </li>
              </ul>
              <form @submit.prevent="addValue(prop.id)" class="add-value-form">
                <input v-model="prop.newValue" type="text" class="form-input-sm" placeholder="إضافة قيمة جديدة...">
                <button type="submit" class="btn btn-secondary btn-sm">إضافة</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePropStore } from '@/stores/propStore';

const propStore = usePropStore();
const { properties } = storeToRefs(propStore);

// MODIFIED: Refs for the new combined form
const newPropertyName = ref('');
const newPropertyValues = ref('');

/**
 * MODIFIED: Handles the submission of the new property and its values.
 */
const submitNewProperty = () => {
  const name = newPropertyName.value.trim();
  if (!name) {
    alert('يرجى إدخال اسم الخاصية.');
    return;
  }

  // Split the values string by comma, trim whitespace from each value,
  // and filter out any empty values that might result from extra commas.
  const values = newPropertyValues.value
    .split(',')
    .map(value => value.trim())
    .filter(value => value.length > 0);

  // Call the modified store action
  propStore.addProperty(name, values);

  // Clear the input fields after submission
  newPropertyName.value = '';
  newPropertyValues.value = '';
};

const deleteProperty = (propId) => {
  if(confirm('هل أنت متأكد من رغبتك في حذف هذه الخاصية وكل قيمها؟')){
    propStore.deleteProperty(propId);
  }
};

const addValue = (propId) => {
  propStore.addValueToProperty(propId);
};

const deleteValue = (propId, value) => {
  propStore.deleteValueFromProperty(propId, value);
};
</script>

<style scoped>
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
/* MODIFIED: Adjusted form layout for stacked inputs */
.add-prop-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.add-prop-form .btn {
  align-self: flex-start; /* Align button to the start */
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
.property-name {
  font-size: 18px;
  font-weight: 600;
}
.btn-delete-prop {
  background: #fee2e2;
  color: #ef4444;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  border: none;
  cursor: pointer;
  font-size: 18px;
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
.value-chip {
  background-color: #eef2ff;
  color: #4f46e5;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.no-values {
  color: #6b7280;
  font-size: 14px;
}
.btn-delete-value {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  font-size: 16px;
}
.add-value-form {
  display: flex;
  gap: 10px;
}
.form-input-sm {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  flex-grow: 1;
}
.empty-state {
  text-align: center;
  padding: 30px;
  color: #6b7280;
}
</style>
<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">
          {{ isEditing ? 'تعديل بيانات الموظف' : 'تفاصيل الموظف' }}
        </h2>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="employee-header">
          <div class="employee-avatar-large">
            <div class="avatar-circle-large" :class="isEditing ? editForm.role : employee.role">
              <i class="fas fa-user"></i>
            </div>
            <div class="status-badge" :class="{ 'active': isEditing ? editForm.is_active : employee.is_active }">
              {{ (isEditing ? editForm.is_active : employee.is_active) ? 'نشط' : 'غير نشط' }}
            </div>
          </div>
          
          <div class="employee-basic-info">
            <h3 class="employee-name">{{ employee.full_name || 'غير محدد' }}</h3>
            
            <div v-if="isEditing && employee.role !== 'ADMIN'" class="employee-role-edit">
                <i class="fas fa-briefcase"></i>
                <select v-model="editForm.role" class="edit-select">
                    <option value="ADMIN">مدير</option>
                    <option value="EMPLOYEE">موظف</option>
                </select>
            </div>
            <div v-else class="employee-role">
              <i class="fas fa-briefcase"></i>
              {{ getRoleText(employee.role) }}
            </div>
          </div>
        </div>

        <div class="details-grid">
          <div class="detail-section">
            <h4 class="section-title">
              <i class="fas fa-user-circle"></i>
              المعلومات الشخصية
            </h4>
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">الاسم الكامل:</span>
                <span class="detail-value">{{ employee.full_name || 'غير محدد' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">رقم الهاتف:</span>
                <span class="detail-value">{{ employee.phone_number || 'غير محدد' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">البريد الإلكتروني:</span>
                <span class="detail-value">{{ employee.email || 'غير محدد' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="section-title">
              <i class="fas fa-briefcase"></i>
              معلومات العمل
            </h4>
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">المنصب:</span>
                <div v-if="isEditing && employee.role !== 'ADMIN'" class="edit-field">
                  <select v-model="editForm.role" class="edit-select">
                    <option value="ADMIN">مدير</option>
                    <option value="EMPLOYEE">موظف</option>
                  </select>
                </div>
                <span v-else class="detail-value role-badge" :class="employee.role">
                  {{ getRoleText(employee.role) }}
                </span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">الحالة:</span>
                <span v-if="!isEditing" class="detail-value status-badge" :class="{ 'active': employee.is_active }">
                  {{ employee.is_active ? 'نشط' : 'غير نشط' }}
                </span>
                <div v-else class="edit-field">
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      v-model="editForm.is_active"
                      class="checkbox-input"
                    />
                    <span class="checkbox-custom"></span>
                    <span class="checkbox-label">الحساب نشط</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="section-title">
              <i class="fas fa-clock"></i>
              معلومات النشاط
            </h4>
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">آخر تسجيل دخول:</span>
                <span class="detail-value">{{ formatDate(employee.last_login) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="section-title">
              <i class="fas fa-info-circle"></i>
              معلومات إضافية
            </h4>
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">المعرف الخاص (ID):</span>
                <span class="detail-value">{{ employee.id }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isUpdating" class="loading-overlay">
          <div class="spinner"></div>
          <p>جاري تحديث البيانات...</p>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary" :disabled="isUpdating">
          إغلاق
        </button>
        
        <button 
          v-if="!isEditing" 
          @click="startEditing" 
          class="btn btn-primary"
        >
          <i class="fas fa-edit"></i>
          تعديل
        </button>
        
        <template v-else>
          <button @click="cancelEditing" class="btn btn-secondary" :disabled="isUpdating">
            إلغاء
          </button>
          <button @click="saveChanges" class="btn btn-success" :disabled="isUpdating">
            <i class="fas fa-save"></i>
            حفظ التغييرات
          </button>
        </template>
        
        <button 
          v-if="!isEditing"
          @click="handleToggleStatus" 
          class="btn" 
          :class="employee.is_active ? 'btn-danger' : 'btn-success'"
          :disabled="isUpdating"
        >
          <i class="fas" :class="employee.is_active ? 'fa-user-slash' : 'fa-user-check'"></i>
          {{ employee.is_active ? 'إلغاء التفعيل' : 'تفعيل' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

export default {
  name: 'EmployeeDetails',
  props: {
    employee: {
      type: Object,
      required: true
    },
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'employee-updated'],
  setup(props, { emit }) {
    const authStore = useAuthStore()

    // State
    const isEditing = ref(false)
    const isUpdating = ref(false)
    const editForm = ref({})
    
    // Errors state is kept in case validation is added later
    const errors = ref({})

    // Initialize the form with only the editable fields
    const resetEditForm = () => {
      editForm.value = {
        role: props.employee.role || 'EMPLOYEE',
        is_active: props.employee.is_active || false
      }
      errors.value = {}
    }

    // Watch for employee changes to reset the form
    watch(() => props.employee, (newEmployee) => {
      if (newEmployee) {
        resetEditForm()
        if (isEditing.value) {
            isEditing.value = false;
        }
      }
    }, { immediate: true, deep: true })

    // Methods
    const getRoleText = (role) => {
      const roleMap = {
        ADMIN: 'مدير',
        EMPLOYEE: 'موظف'
      }
      return roleMap[role] || 'غير محدد'
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'غير محدد'
      
      const date = new Date(dateString)
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
      
      return date.toLocaleDateString('ar-LY', options)
    }

    const startEditing = () => {
      resetEditForm()
      isEditing.value = true
    }

    const cancelEditing = () => {
      isEditing.value = false
      resetEditForm()
    }

    const saveChanges = async () => {
      isUpdating.value = true

      try {
        // The editForm only contains role and is_active.
        // The role will be unchanged for admins due to the UI restriction.
        const updateData = {
          role: editForm.value.role,
          is_active: editForm.value.is_active,
        }

        const result = await authStore.updateUserById(props.employee.id, updateData)
        
        if (result.success) {
          const updatedEmployee = { ...props.employee, ...updateData }
          emit('employee-updated', updatedEmployee)
          isEditing.value = false
          
          alert('تم تحديث بيانات الموظف بنجاح')
        } else {
          throw new Error(result.error || 'حدث خطأ أثناء التحديث')
        }
      } catch (error) {
        console.error('Error updating employee:', error)
        alert('حدث خطأ أثناء تحديث بيانات الموظف: ' + error.message)
      } finally {
        isUpdating.value = false
      }
    }
    
    // Toggles only the user's active status
    const handleToggleStatus = async () => {
      isUpdating.value = true;
      try {
        const result = await authStore.toggleUserStatus(props.employee.id, !props.employee.is_active)
        if(result.success) {
            const updatedEmployee = {
              ...props.employee,
              is_active: !props.employee.is_active
            }
            emit('employee-updated', updatedEmployee)
            alert(`تم ${updatedEmployee.is_active ? 'تفعيل' : 'إلغاء تفعيل'} حساب الموظف بنجاح.`)
        } else {
            throw new Error(result.error || 'فشل تغيير حالة الموظف')
        }
      } catch (error) {
        console.error('Error toggling user status:', error)
        alert('حدث خطأ أثناء تغيير حالة الموظف: ' + error.message)
      } finally {
        isUpdating.value = false;
      }
    }

    const handleOverlayClick = () => {
      if (!isEditing.value) {
        emit('close')
      }
    }

    return {
      isEditing,
      isUpdating,
      editForm,
      errors,
      getRoleText,
      formatDate,
      startEditing,
      cancelEditing,
      saveChanges,
      handleOverlayClick,
      handleToggleStatus
    }
  }
}
</script>

<style scoped>
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
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 15px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  position: relative;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px 15px 0 0;
}

.modal-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 30px;
  position: relative;
}

.employee-header {
  display: flex;
  align-items: center;
  gap: 25px;
  margin-bottom: 30px;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 15px;
  border: 1px solid #e0e0e0;
}

.employee-avatar-large {
  position: relative;
  flex-shrink: 0;
}

.avatar-circle-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.avatar-circle-large.ADMIN {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.avatar-circle-large.EMPLOYEE {
  background: linear-gradient(135deg, #4834d4, #686de0);
}

.employee-basic-info {
  flex: 1;
}

.employee-name {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.employee-role {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: #666;
  font-weight: 500;
}

.employee-role-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: #666;
  font-weight: 500;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
}

.detail-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.detail-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #f8f9fa;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
  flex-shrink: 0;
  width: 40%;
}

.detail-value {
  font-weight: 500;
  color: #333;
  text-align: left;
  font-size: 14px;
}

.edit-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.edit-select {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.edit-select:focus {
  outline: none;
  border-color: #2196F3;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: #4CAF50;
  border-color: #4CAF50;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-weight: bold;
}

.checkbox-label {
  font-size: 14px;
  color: #333;
}

/* --- STYLE UPDATE START --- */

/* General status badge style for inline display */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  display: inline-block;
}

.status-badge.active {
  background: #4CAF50;
}

.status-badge:not(.active) {
  background: #f44336;
}

/* Scoped style for the header badge to position it over the avatar */
.employee-header .status-badge {
  position: absolute;
  top: -10px;
  right: -15px;
  border: 2px solid white;
}

/* --- STYLE UPDATE END --- */

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.role-badge.ADMIN {
  background: #ff6b6b;
}

.role-badge.EMPLOYEE {
  background: #4834d4;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 15px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-footer {
  padding: 25px 30px;
  border-top: 2px solid #f0f0f0;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  background: #f8f9fa;
  border-radius: 0 0 15px 15px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976D2;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-success {
  background: #4CAF50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #45a049;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-container {
    margin: 10px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-title {
    font-size: 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .employee-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .employee-header .status-badge {
      position: static;
      margin-top: 10px;
  }

  .employee-name {
    font-size: 24px;
  }

  .employee-role {
    justify-content: center;
    font-size: 16px;
  }
  
  .employee-role-edit {
    justify-content: center;
    font-size: 16px;
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .detail-label {
    width: 100%;
  }

  .detail-value {
    text-align: right;
    width: 100%;
  }

  .edit-field {
    width: 100%;
  }

  .modal-footer {
    padding: 20px;
    flex-direction: column;
  }

  .btn {
    justify-content: center;
  }
}
</style>
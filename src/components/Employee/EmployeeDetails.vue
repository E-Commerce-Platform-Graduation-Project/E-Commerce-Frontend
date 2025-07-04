<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          {{ isEditing ? 'تعديل بيانات الموظف' : 'تفاصيل الموظف' }}
        </h2>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <!-- Employee Avatar and Basic Info -->
        <div class="employee-header">
          <div class="employee-avatar-large">
            <div class="avatar-circle-large" :class="isEditing ? editForm.Role : employee.Role">
              <i class="fas fa-user"></i>
            </div>
            <div class="status-badge" :class="{ 'active': isEditing ? editForm.IsActive : employee.IsActive }">
              {{ (isEditing ? editForm.IsActive : employee.IsActive) ? 'نشط' : 'غير نشط' }}
            </div>
          </div>
          
          <div class="employee-basic-info">
            <h3 class="employee-name" v-if="!isEditing">{{ employee.FullName || 'غير محدد' }}</h3>
            <input 
              v-else
              v-model="editForm.FullName"
              class="edit-input employee-name-input"
              placeholder="الاسم الكامل"
              :class="{ 'error': errors.FullName }"
            />
            <div v-if="errors.FullName" class="error-text">{{ errors.FullName }}</div>
            
            <div class="employee-role" v-if="!isEditing">
              <i class="fas fa-briefcase"></i>
              {{ getRoleText(employee.Role) }}
            </div>
            <div v-else class="employee-role-edit">
              <i class="fas fa-briefcase"></i>
              <select v-model="editForm.Role" class="edit-select">
                <option value="admin">مدير</option>
                <!-- <option value="manager">مدير فرع</option> -->
                <option value="employee">موظف</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Employee Details Grid -->
        <div class="details-grid">
          <!-- Personal Information -->
          <div class="detail-section">
            <h4 class="section-title">
              <i class="fas fa-user-circle"></i>
              المعلومات الشخصية
            </h4>
            <div class="detail-items">
              <!-- Full Name -->
              <div class="detail-item">
                <span class="detail-label">الاسم الكامل:</span>
                <span v-if="!isEditing" class="detail-value">{{ employee.FullName || 'غير محدد' }}</span>
                <div v-else class="edit-field">
                  <input 
                    v-model="editForm.FullName"
                    class="edit-input"
                    placeholder="الاسم الكامل"
                    :class="{ 'error': errors.FullName }"
                  />
                  <div v-if="errors.FullName" class="error-text">{{ errors.FullName }}</div>
                </div>
              </div>

              <!-- UserName -->
              <div class="detail-item">
                <span class="detail-label">اسم المستخدم:</span>
                <span v-if="!isEditing" class="detail-value">{{ employee.UserName || 'غير محدد' }}</span>
                <div v-else class="edit-field">
                  <input 
                    v-model="editForm.UserName"
                    class="edit-input"
                    placeholder="اسم المستخدم"
                    :class="{ 'error': errors.UserName }"
                  />
                  <div v-if="errors.UserName" class="error-text">{{ errors.UserName }}</div>
                </div>
              </div>
              
              <!-- Phone Number -->
              <div class="detail-item">
                <span class="detail-label">رقم الهاتف:</span>
                <span v-if="!isEditing" class="detail-value">{{ employee.PhoneNumber || 'غير محدد' }}</span>
                <div v-else class="edit-field">
                  <input 
                    v-model="editForm.PhoneNumber"
                    class="edit-input"
                    placeholder="رقم الهاتف"
                    :class="{ 'error': errors.PhoneNumber }"
                  />
                  <div v-if="errors.PhoneNumber" class="error-text">{{ errors.PhoneNumber }}</div>
                </div>
              </div>
              
              <!-- Email -->
              <div class="detail-item">
                <span class="detail-label">البريد الإلكتروني:</span>
                <span v-if="!isEditing" class="detail-value">{{ employee.Email || 'غير محدد' }}</span>
                <div v-else class="edit-field">
                  <input 
                    v-model="editForm.Email"
                    type="email"
                    class="edit-input"
                    placeholder="البريد الإلكتروني"
                    :class="{ 'error': errors.Email }"
                  />
                  <div v-if="errors.Email" class="error-text">{{ errors.Email }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Work Information -->
          <div class="detail-section">
            <h4 class="section-title">
              <i class="fas fa-briefcase"></i>
              معلومات العمل
            </h4>
            <div class="detail-items">
              <!-- Role -->
              <div class="detail-item">
                <span class="detail-label">المنصب:</span>
                <span v-if="!isEditing" class="detail-value role-badge" :class="employee.Role">
                  {{ getRoleText(employee.Role) }}
                </span>
                <div v-else class="edit-field">
                  <select v-model="editForm.Role" class="edit-select">
                    <option value="admin">مدير</option>
                    <!-- <option value="manager">مدير فرع</option> -->
                    <option value="employee">موظف</option>
                  </select>
                </div>
              </div>
              
              <!-- Status -->
              <div class="detail-item">
                <span class="detail-label">الحالة:</span>
                <span v-if="!isEditing" class="detail-value status-badge" :class="{ 'active': employee.IsActive }">
                  {{ employee.IsActive ? 'نشط' : 'غير نشط' }}
                </span>
                <div v-else class="edit-field">
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      v-model="editForm.IsActive"
                      class="checkbox-input"
                    />
                    <span class="checkbox-custom"></span>
                    <span class="checkbox-label">الحساب نشط</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity Information -->
          <div class="detail-section">
            <h4 class="section-title">
              <i class="fas fa-clock"></i>
              معلومات النشاط
            </h4>
            <div class="detail-items">
              <div class="detail-item">
                <span class="detail-label">آخر تسجيل دخول:</span>
                <span class="detail-value">{{ formatDate(employee.LastLogin) }}</span>
              </div>
            </div>
          </div>

          <!-- Additional Information -->
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
              

              <!-- Password (only in edit mode) -->
              <div v-if="isEditing" class="detail-item">
                <span class="detail-label">كلمة المرور الجديدة:</span>
                <div class="edit-field">
                  <input 
                    v-model="editForm.Password"
                    type="password"
                    class="edit-input"
                    placeholder="اتركها فارغة للاحتفاظ بكلمة المرور الحالية"
                  />
                  <div v-if="errors.Password" class="error-text">{{ errors.Password }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="isUpdating" class="loading-overlay">
          <div class="spinner"></div>
          <p>جاري تحديث البيانات...</p>
        </div>
      </div>

      <!-- Modal Footer -->
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
          :class="employee.IsActive ? 'btn-danger' : 'btn-success'"
          :disabled="isUpdating"
        >
          <i class="fas" :class="employee.IsActive ? 'fa-user-slash' : 'fa-user-check'"></i>
          {{ employee.IsActive ? 'إلغاء التفعيل' : 'تفعيل' }}
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
    const errors = ref({})

    const resetEditForm = () => {
      editForm.value = {
        FullName: props.employee.FullName || '',
        UserName: props.employee.UserName || '',
        PhoneNumber: props.employee.PhoneNumber || '',
        Email: props.employee.Email || '',
        Role: props.employee.Role || 'employee',
        IsActive: props.employee.IsActive || false,
        Password: ''
      }
      errors.value = {}
    }

    // Watch for employee changes to reset form
    watch(() => props.employee, (newEmployee) => {
      if (newEmployee) {
        resetEditForm()
      }
    }, { immediate: true })

    // Methods
    const getRoleText = (role) => {
      const roleMap = {
        admin: 'مدير',
        employee: 'موظف',
        // manager: 'مدير فرع'
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
      
      return date.toLocaleDateString('en-US', options)
    }


    const startEditing = () => {
      resetEditForm()
      isEditing.value = true
    }

    const cancelEditing = () => {
      isEditing.value = false
      resetEditForm()
    }

    const validateForm = () => {
      errors.value = {}
      let isValid = true

      // Validate Full Name
      if (!editForm.value.FullName || editForm.value.FullName.trim().length < 2) {
        errors.value.FullName = 'الاسم الكامل مطلوب ويجب أن يكون أكثر من حرفين'
        isValid = false
      }

      // Validate UserName
      if (!editForm.value.UserName || editForm.value.UserName.trim().length < 3) {
        errors.value.UserName = 'اسم المستخدم مطلوب ويجب أن يكون أكثر من 3 أحرف'
        isValid = false
      }

      // Validate Phone Number
      if (!editForm.value.PhoneNumber || !/^[0-9]{9,10}$/.test(editForm.value.PhoneNumber)) {
        errors.value.PhoneNumber = 'رقم الهاتف مطلوب ويجب أن يكون 9-10 رقم'
        isValid = false
      }

      // Validate Email
      if (editForm.value.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.value.Email)) {
        errors.value.Email = 'البريد الإلكتروني غير صحيح'
        isValid = false
      }

      // Validate Password (if provided)
      if (editForm.value.Password && editForm.value.Password.length < 4) {
        errors.value.Password = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل'
        isValid = false
      }

      return isValid
    }

    const saveChanges = async () => {
      if (!validateForm()) {
        return
      }

      isUpdating.value = true

      try {
        // Prepare update data
        const updateData = {
          FullName: editForm.value.FullName.trim(),
          UserName: editForm.value.UserName.trim(),
          PhoneNumber: editForm.value.PhoneNumber.trim(),
          Email: editForm.value.Email.trim(),
          Role: editForm.value.Role,
          IsActive: editForm.value.IsActive,
        }

        // Add password only if it's provided
        if (editForm.value.Password && editForm.value.Password.trim()) {
          updateData.Password = editForm.value.Password.trim()
        }

        // Update employee using authStore
        const result = await authStore.updateUserById(props.employee.id, updateData)
        
        if (result.success) {
          // Emit updated employee
          const updatedEmployee = {
            ...props.employee,
            ...updateData
          }
          
          emit('employee-updated', updatedEmployee)
          isEditing.value = false
          
          // Show success message (you can replace this with a toast notification)
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

    const handleOverlayClick = () => {
      if (!isEditing.value) {
        emit('close')
      }
    }

    const handleToggleStatus = async () => {
      try {
        await authStore.toggleUserStatus(props.employee.id, !props.employee.IsActive)
        const updatedEmployee = {
          ...props.employee,
          IsActive: !props.employee.IsActive
        }
        emit('employee-updated', updatedEmployee)
      } catch (error) {
        console.error('Error toggling user status:', error)
        alert('حدث خطأ أثناء تغيير حالة الموظف')
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

.avatar-circle-large.admin {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.avatar-circle-large.employee {
  background: linear-gradient(135deg, #4834d4, #686de0);
}

/* .avatar-circle-large.manager {
  background: linear-gradient(135deg, #00d2d3, #01a3a4);
} */

.employee-basic-info {
  flex: 1;
}

.employee-name {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.employee-name-input {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  background: transparent;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 0 10px 0;
  width: 100%;
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
  /*flex: 1;*/
  
}

.edit-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.edit-input {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  direction: rtl;
  transition: border-color 0.3s ease;
}

.edit-input:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.edit-input.error {
  border-color: #f44336;
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

.error-text {
  color: #f44336;
  font-size: 12px;
  margin-top: 2px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.status-badge.active {
  background: #4CAF50;
}

.status-badge:not(.active) {
  background: #f44336;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.role-badge.admin {
  background: #ff6b6b;
}

.role-badge.employee {
  background: #4834d4;
}

/* .role-badge.manager {
  background: #00d2d3;
} */

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

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #f57c00;
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

  .employee-name {
    font-size: 24px;
  }

  .employee-name-input {
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
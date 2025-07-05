<template>
  <div class="add-employee-container">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">إضافة موظف</h1>
      <p class="page-subtitle">إضافة موظف جديد إلى النظام</p>
    </div>

    <!-- Form Container -->
    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="employee-form">

        <!-- Full Name -->
        <div class="form-group">
          <label for="fullName" class="form-label">الاسم الكامل</label>
          <input id="fullName" v-model="form.FullName" type="text" class="form-input"
            :class="{ 'error': errors.FullName }" placeholder="أدخل الاسم الكامل" required />
          <div v-if="errors.FullName" class="error-message">{{ errors.FullName }}</div>
        </div>

        <!-- UserName -->
        <div class="form-group">
          <label for="userName" class="form-label">اسم المستخدم</label>
          <input id="userName" v-model="form.UserName" type="text" class="form-input"
            :class="{ 'error': errors.UserName }" placeholder="أدخل اسم المستخدم" required />
          <div v-if="errors.UserName" class="error-message">{{ errors.UserName }}</div>
        </div>

        <!-- Phone Number -->
        <div class="form-group">
          <label for="phone" class="form-label">رقم الهاتف</label>
          <input id="phone" v-model="form.PhoneNumber" type="tel" class="form-input"
            :class="{ 'error': errors.PhoneNumber }" placeholder="ادخل رقم الهاتف" maxlength="15" required />
          <div v-if="errors.PhoneNumber" class="error-message">{{ errors.PhoneNumber }}</div>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email" class="form-label">البريد الإلكتروني</label>
          <input id="email" v-model="form.Email" type="email" class="form-input" :class="{ 'error': errors.Email }"
            placeholder="example@domain.com" />
          <div v-if="errors.Email" class="error-message">{{ errors.Email }}</div>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password" class="form-label">كلمة المرور</label>
          <div class="password-input-container">
            <input id="password" v-model="form.Password" :type="showPassword ? 'text' : 'password'"
              class="form-input password-input" :class="{ 'error': errors.Password }" placeholder="ادخل كلمة المرور"
              required />
            <button type="button" @click="togglePasswordVisibility" class="password-toggle">
              <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
          <div v-if="errors.Password" class="error-message">{{ errors.Password }}</div>
        </div>

        <!-- Role -->
        <div class="form-group">
          <label for="role" class="form-label">الصلاحيات</label>
          <div class="role-selection">
            <div class="role-option" :class="{ 'selected': form.Role === 'employee' }" @click="form.Role = 'employee'">
              <div class="role-icon employee">
                <i class="fas fa-user"></i>
              </div>
              <span class="role-text">موظف</span>
            </div>
            <div class="role-option" :class="{ 'selected': form.Role === 'admin' }" @click="form.Role = 'admin'">
              <div class="role-icon admin">
                <i class="fas fa-user"></i>
              </div>
              <span class="role-text">مدير</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button type="button" @click="handleCancel" class="btn btn-cancel" :disabled="isSubmitting">
            إلغاء
          </button>
          <button type="submit" class="btn btn-save" :disabled="isSubmitting">
            <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ isSubmitting ? 'جاري الحفظ...' : 'حفظ' }}
          </button>
        </div>

      </form>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="success-modal" @click.stop>
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>تم بنجاح!</h3>
        <p>تم إضافة الموظف بنجاح</p>
        <button @click="closeSuccessModal" class="btn btn-primary">موافق</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

export default {
  name: 'AddEmployee',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()

    // Form data
    const form = reactive({
      FullName: '',
      UserName: '',
      PhoneNumber: '',
      Email: '',
      Password: '',
      Role: 'employee'
    })

    // Form state
    const errors = ref({})
    const isSubmitting = ref(false)
    const showPassword = ref(false)
    const showSuccessModal = ref(false)

    // Methods
    const validateForm = () => {
      errors.value = {}
      let isValid = true

      // Validate Full Name
      if (!form.FullName || form.FullName.trim().length < 2) {
        errors.value.FullName = 'الاسم الكامل مطلوب ويجب أن يكون أكثر من حرفين'
        isValid = false
      }

      // Validate UserName
      if (!form.UserName || form.UserName.trim().length < 3) {
        errors.value.UserName = 'اسم المستخدم مطلوب ويجب أن يكون 3 أحرف على الأقل'
        isValid = false
      }

      // Validate Phone Number
      if (!form.PhoneNumber || !/^[0-9]{9,15}$/.test(form.PhoneNumber)) {
        errors.value.PhoneNumber = 'رقم الهاتف مطلوب ويجب أن يكون 9-15 رقم'
        isValid = false
      }

      // Validate Email (optional but must be valid if provided)
      if (form.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) {
        errors.value.Email = 'البريد الإلكتروني غير صحيح'
        isValid = false
      }

      // Validate Password
      if (!form.Password || form.Password.length < 4) {
        errors.value.Password = 'كلمة المرور مطلوبة ويجب أن تكون 4 أحرف على الأقل'
        isValid = false
      }

      return isValid
    }

    const scrollToFirstError = () => {
      // Find the first field with an error
      const firstErrorField = Object.keys(errors.value)[0]
      if (firstErrorField) {
        // Get the corresponding input element
        const fieldElement = document.getElementById(getFieldId(firstErrorField))
        if (fieldElement) {
          // Scroll to the field with smooth animation
          fieldElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
          // Focus the field
          fieldElement.focus()
          // Add a visual highlight effect
          fieldElement.classList.add('error-highlight')
          setTimeout(() => {
            fieldElement.classList.remove('error-highlight')
          }, 2000)
        }
      }
    }

    const getFieldId = (fieldName) => {
      // Map field names to their corresponding input IDs
      const fieldIdMap = {
        'FullName': 'fullName',
        'UserName': 'userName',
        'PhoneNumber': 'phone',
        'Email': 'email',
        'Password': 'password'
      }
      return fieldIdMap[fieldName] || fieldName.toLowerCase()
    }

    const handleSubmit = async () => {
      // Validate form first
      if (!validateForm()) {
        // Scroll to the first error field
        scrollToFirstError()
        return
      }

      isSubmitting.value = true

      try {
        // Prepare user data
        const userData = {
          FullName: form.FullName.trim(),
          UserName: form.UserName.trim(),
          PhoneNumber: form.PhoneNumber.trim(),
          Email: form.Email.trim() || null,
          Password: form.Password.trim(),
          Role: form.Role,
          IsActive: true
        }

        // Add employee using authStore (different from register)
        const result = await authStore.addEmployee(userData)

        if (result.success) {
          showSuccessModal.value = true
          // Reset form
          Object.keys(form).forEach(key => {
            if (key === 'Role') {
              form[key] = 'employee'
            } else {
              form[key] = ''
            }
          })
          errors.value = {}
        } else {
          // Handle add employee error and scroll to relevant field
          if (result.error.includes('اسم المستخدم مستخدم بالفعل')) {
            errors.value.UserName = result.error
          } else if (result.error.includes('رقم الهاتف مستخدم بالفعل')) {
            errors.value.PhoneNumber = result.error
          } else if (result.error.includes('البريد الالكتروني موجود بالفعل')) {
            errors.value.Email = result.error
          } else {
            alert('حدث خطأ أثناء إضافة الموظف: ' + result.error)
          }
          // Scroll to the field with error
          scrollToFirstError()
        }
      } catch (error) {
        console.error('Error adding employee:', error)
        alert('حدث خطأ غير متوقع أثناء إضافة الموظف')
      } finally {
        isSubmitting.value = false
      }
    }

    const handleCancel = () => {
      // Reset form
      Object.keys(form).forEach(key => {
        if (key === 'Role') {
          form[key] = 'employee'
        } else {
          form[key] = ''
        }
      })
      errors.value = {}

      // Navigate back to employees list or dashboard
      router.push('/dashboard/employees')
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    const closeSuccessModal = () => {
      showSuccessModal.value = false
    }

    return {
      form,
      errors,
      isSubmitting,
      showPassword,
      showSuccessModal,
      handleSubmit,
      handleCancel,
      togglePasswordVisibility,
      closeSuccessModal,
      scrollToFirstError
    }
  }
}
</script>

<style scoped>
.add-employee-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  direction: rtl;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.employee-form {
  padding: 40px;
}

.form-group {
  margin-bottom: 25px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 15px 18px;
  border: 2px solid #e0e6ed;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #f8f9fa;
  direction: rtl;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
  background: white;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
}

.form-input.error {
  border-color: #e74c3c;
  background: #fdf2f2;
}

.form-input.error-highlight {
  border-color: #e74c3c;
  background: #fdf2f2;
  animation: errorPulse 0.5s ease-in-out;
  box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.2);
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

.form-input::placeholder {
  color: #bdc3c7;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-left: 50px;
}

.password-toggle {
  position: absolute;
  left: 15px;
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 5px;
  font-size: 16px;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #3498db;
}

.role-selection {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.role-option {
  flex: 1;
  padding: 20px;
  border: 2px solid #e0e6ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: #f8f9fa;
}

.role-option:hover {
  border-color: #3498db;
  transform: translateY(-2px);
}

.role-option.selected {
  border-color: #3498db;
  background: #ebf3fd;
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.15);
}

.role-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.role-icon.employee {
  background: #2883a7;
}

.role-icon.admin {
  background: tomato;
}

.role-text {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 40px;
  justify-content: center;
}

.btn {
  padding: 15px 30px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  min-width: 120px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-2px);
}

.btn-save {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #229954, #27ae60);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

/* Success Modal */
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
}

.success-modal {
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

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
}

.success-modal h3 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.success-modal p {
  color: #7f8c8d;
  margin: 0 0 30px 0;
  font-size: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .add-employee-container {
    padding: 10px;
  }

  .page-title {
    font-size: 24px;
  }

  .employee-form {
    padding: 30px 20px;
  }

  .role-selection {
    flex-direction: column;
    gap: 15px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

/* Animation for form elements */
.form-group {
  animation: slideInUp 0.5s ease-out;
  animation-fill-mode: both;
}

.form-group:nth-child(1) {
  animation-delay: 0.1s;
}

.form-group:nth-child(2) {
  animation-delay: 0.2s;
}

.form-group:nth-child(3) {
  animation-delay: 0.3s;
}

.form-group:nth-child(4) {
  animation-delay: 0.4s;
}

.form-group:nth-child(5) {
  animation-delay: 0.5s;
}

.form-group:nth-child(6) {
  animation-delay: 0.6s;
}

.form-actions {
  animation: slideInUp 0.5s ease-out 0.7s;
  animation-fill-mode: both;
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
</style>
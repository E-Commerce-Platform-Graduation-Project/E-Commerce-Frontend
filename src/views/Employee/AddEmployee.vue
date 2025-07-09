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
          <input id="fullName" v-model="form.full_name" type="text" class="form-input"
            :class="{ 'error': errors.full_name }" placeholder="أدخل الاسم الكامل" required />
          <div v-if="errors.full_name" class="error-message">{{ errors.full_name }}</div>
        </div>

        <!-- Phone Number -->
        <div class="form-group">
          <label for="phone" class="form-label">رقم الهاتف</label>
          <input 
            id="phone" 
            v-model="form.phone_number" 
            type="tel" 
            class="form-input"
            :class="{ 'error': errors.phone_number }" 
            placeholder="0912345678" 
            maxlength="10"
            @input="formatPhoneInput"
            @keypress="validatePhoneKeypress"
            required 
          />
          <div v-if="errors.phone_number" class="error-message">{{ errors.phone_number }}</div>
          <div class="input-help">يجب أن يبدأ بـ 09 ويتكون من 10 أرقام</div>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email" class="form-label">البريد الإلكتروني</label>
          <input id="email" v-model="form.email" type="email" class="form-input" :class="{ 'error': errors.email }"
            placeholder="example@domain.com" />
          <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
        </div>

        <!-- Role -->
        <div class="form-group">
          <label for="role" class="form-label">الصلاحيات</label>
          <div class="role-selection">
            <div class="role-option" :class="{ 'selected': form.role === 'EMPLOYEE' }" @click="form.role = 'EMPLOYEE'">
              <div class="role-icon employee">
                <i class="fas fa-user"></i>
              </div>
              <span class="role-text">موظف</span>
            </div>
            <div class="role-option" :class="{ 'selected': form.role === 'ADMIN' }" @click="form.role = 'ADMIN'">
              <div class="role-icon admin">
                <i class="fas fa-user-shield"></i>
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
        <p>تم ارسال كلمة المرور الى رقم الهاتف الخاص بك</p>
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
      full_name: '',
      phone_number: '',
      email: '',
      role: 'EMPLOYEE'
    })

    // Form state
    const errors = ref({})
    const isSubmitting = ref(false)
    const showSuccessModal = ref(false)

    // Methods
    const validateForm = () => {
      errors.value = {}
      let isValid = true

      // Validate Full Name
      if (!form.full_name || form.full_name.trim().length < 2) {
        errors.value.full_name = 'الاسم الكامل مطلوب ويجب أن يكون أكثر من حرفين'
        isValid = false
      }

      // Enhanced Phone Number Validation
      const phoneNumber = form.phone_number.trim()
      
      // Check if phone number is empty
      if (!phoneNumber) {
        errors.value.phone_number = 'رقم الهاتف مطلوب'
        isValid = false
      }
      // Check if phone number matches the pattern: exactly 10 digits starting with 09
      else if (!/^09\d{8}$/.test(phoneNumber)) {
        errors.value.phone_number = 'يجب أن يكون رقم الهاتف 10 أرقام ويبدأ بـ 09'
        isValid = false
      }

      // Validate Email (optional but must be valid if provided)
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.value.email = 'البريد الإلكتروني غير صحيح'
        isValid = false
      }

      return isValid
    }

    const formatPhoneInput = (event) => {
      // Remove any non-digit characters
      let value = event.target.value.replace(/\D/g, '')
      
      // Limit to 10 digits
      if (value.length > 10) {
        value = value.slice(0, 10)
      }
      
      // Update the form value
      form.phone_number = value
      
      // Clear phone error when user starts typing correctly
      if (value.startsWith('09') && value.length <= 10) {
        if (errors.value.phone_number) {
          delete errors.value.phone_number
        }
      }
    }

    const validatePhoneKeypress = (event) => {
      // Allow only digits
      if (!/\d/.test(event.key) && 
          !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
      }
      
      // If this is the first character, ensure it's 0
      if (form.phone_number.length === 0 && event.key !== '0') {
        event.preventDefault()
      }
      
      // If this is the second character, ensure it's 9
      if (form.phone_number.length === 1 && event.key !== '9') {
        event.preventDefault()
      }
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
        'full_name': 'fullName',
        'phone_number': 'phone',
        'email': 'email'
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
          full_name: form.full_name.trim(),
          phone_number: form.phone_number.trim(),
          email: form.email.trim() || null,
          role: form.role,
          is_active: true
        }

        // Add employee using authStore
        const result = await authStore.addEmployee(userData)

        if (result.success) {
          showSuccessModal.value = true
          // Reset form
          Object.keys(form).forEach(key => {
            if (key === 'role') {
              form[key] = 'EMPLOYEE'
            } else {
              form[key] = ''
            }
          })
          errors.value = {}
        } else {
          // Handle add employee error and scroll to relevant field
          if (result.error.includes('رقم الهاتف مستخدم بالفعل')) {
            errors.value.phone_number = result.error
          } else if (result.error.includes('البريد الالكتروني موجود بالفعل')) {
            errors.value.email = result.error
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
        if (key === 'role') {
          form[key] = 'EMPLOYEE'
        } else {
          form[key] = ''
        }
      })
      errors.value = {}

      // Navigate back to employees list or dashboard
      router.push('/dashboard/employees')
    }

    const closeSuccessModal = () => {
      showSuccessModal.value = false
    }

    return {
      form,
      errors,
      isSubmitting,
      showSuccessModal,
      handleSubmit,
      handleCancel,
      closeSuccessModal,
      scrollToFirstError,
      formatPhoneInput,
      validatePhoneKeypress
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

.form-input[type="tel"] {
  letter-spacing: 1px;
  font-family: 'Courier New', monospace;
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

.input-help {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 5px;
  font-style: italic;
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

.form-actions {
  animation: slideInUp 0.5s ease-out 0.5s;
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
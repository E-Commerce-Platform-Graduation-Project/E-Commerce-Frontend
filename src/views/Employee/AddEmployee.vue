<template>
  <div class="add-employee-container">
    <div class="page-header">
      <h1 class="page-title">إضافة موظف</h1>
      <p class="page-subtitle">إضافة موظف جديد إلى النظام</p>
    </div>

    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="employee-form">

        <div class="form-group">
          <label for="fullName" class="form-label">الاسم الكامل</label>
          <input id="fullName" v-model="form.full_name" type="text" class="form-input"
            :class="{ 'error': errors.full_name }" placeholder="أدخل الاسم الكامل" />
          <div v-if="errors.full_name" class="error-message">{{ errors.full_name }}</div>
        </div>

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
          />
          <div v-if="errors.phone_number" class="error-message">{{ errors.phone_number }}</div>
          <div class="input-help">يجب أن يبدأ بـ 09 ويتكون من 10 أرقام</div>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">البريد الإلكتروني</label>
          <input id="email" v-model="form.email" type="email" class="form-input" :class="{ 'error': errors.email }"
            placeholder="example@domain.com" />
          <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
        </div>

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

    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-dialog success-modal" @click.stop>
        <div class="modal-icon success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>تم بنجاح!</h3>
        <p>تم إضافة الموظف بنجاح. سيتم إرسال كلمة المرور إلى رقم هاتف الموظف.</p>
        <button @click="closeSuccessModal" class="btn btn-primary">موافق</button>
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
import { ref, reactive, nextTick } from 'vue'
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
    const showErrorModal = ref(false)
    const modalErrorMessage = ref('')

    // Methods
    const validateForm = () => {
      errors.value = {}
      let isValid = true

      // Validate Full Name
      if (!form.full_name || form.full_name.trim().length === 0) {
        errors.value.full_name = 'الاسم الكامل مطلوب'
        isValid = false
      } else if (form.full_name.trim().length < 2) {
        errors.value.full_name = 'الاسم الكامل يجب أن يكون أكثر من حرفين'
        isValid = false
      }

      // Enhanced Phone Number Validation
      const phoneNumber = form.phone_number ? form.phone_number.trim() : ''
      
      if (!phoneNumber || phoneNumber.length === 0) {
        errors.value.phone_number = 'رقم الهاتف مطلوب'
        isValid = false
      }
      else if (!/^09\d{8}$/.test(phoneNumber)) {
        errors.value.phone_number = 'يجب أن يكون رقم الهاتف 10 أرقام ويبدأ بـ 09'
        isValid = false
      }

      // Validate Email (required and must be valid)
      const email = form.email ? form.email.trim() : ''
      
      if (!email || email.length === 0) {
        errors.value.email = 'البريد الإلكتروني مطلوب'
        isValid = false
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.value.email = 'البريد الإلكتروني غير صحيح'
        isValid = false
      }

      return isValid
    }

    const formatPhoneInput = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      if (value.length > 10) {
        value = value.slice(0, 10)
      }
      form.phone_number = value
      if (value.startsWith('09') && value.length <= 10) {
        if (errors.value.phone_number) {
          delete errors.value.phone_number
        }
      }
    }

    const validatePhoneKeypress = (event) => {
      if (!/\d/.test(event.key) && 
          !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
      }
      if (form.phone_number.length === 0 && event.key !== '0') {
        event.preventDefault()
      }
      if (form.phone_number.length === 1 && event.key !== '9') {
        event.preventDefault()
      }
    }

    const scrollToFirstError = async () => {
      // Wait for DOM to update with error messages
      await nextTick()
      
      const firstErrorField = Object.keys(errors.value)[0]
      if (firstErrorField) {
        const fieldElement = document.getElementById(getFieldId(firstErrorField))
        if (fieldElement) {
          fieldElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
          
          // Wait a bit for scroll to complete, then focus and highlight
          setTimeout(() => {
            fieldElement.focus()
            fieldElement.classList.add('error-highlight')
            setTimeout(() => {
              fieldElement.classList.remove('error-highlight')
            }, 2000)
          }, 300)
        }
      }
    }

    const getFieldId = (fieldName) => {
      const fieldIdMap = {
        'full_name': 'fullName',
        'phone_number': 'phone',
        'email': 'email'
      }
      return fieldIdMap[fieldName] || fieldName.toLowerCase()
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        await scrollToFirstError()
        return
      }

      isSubmitting.value = true

      try {
        const userData = {
          full_name: form.full_name.trim(),
          phone_number: form.phone_number.trim(),
          email: form.email.trim() || null,
          role: form.role,
          is_active: true
        }

        const result = await authStore.addEmployee(userData)

        if (result.success) {
          showSuccessModal.value = true
          Object.keys(form).forEach(key => {
            form[key] = key === 'role' ? 'EMPLOYEE' : ''
          })
          errors.value = {}
        } else {
          if (result.error && typeof result.error === 'string') {
                modalErrorMessage.value = result.error;
                showErrorModal.value = true;
          } else {
              modalErrorMessage.value = 'حدث خطأ غير معروف. يرجى المحاولة مرة أخرى.';
              showErrorModal.value = true;
          }
          await scrollToFirstError()
        }
      } catch (error) {
        console.error('Error adding employee:', error)
        modalErrorMessage.value = 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.';
        showErrorModal.value = true;
      } finally {
        isSubmitting.value = false
      }
    }

    const handleCancel = () => {
      Object.keys(form).forEach(key => {
        form[key] = key === 'role' ? 'EMPLOYEE' : ''
      })
      errors.value = {}
      router.push('/employees')
    }

    const closeSuccessModal = () => {
      showSuccessModal.value = false
    }

    const closeErrorModal = () => {
      showErrorModal.value = false
    }

    return {
      form,
      errors,
      isSubmitting,
      showSuccessModal,
      showErrorModal,
      modalErrorMessage,
      handleSubmit,
      handleCancel,
      closeSuccessModal,
      closeErrorModal,
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
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
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

.role-icon.employee { background: #2883a7; }
.role-icon.admin { background: tomato; }
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
  display: block;
  animation: errorSlideIn 0.3s ease-out;
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
.btn-primary:hover { background: #2980b9; }

.btn-danger {
    background: #e74c3c;
    color: white;
}
.btn-danger:hover { background: #c0392b; }


/* Modals */
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

.success-icon {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
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

@media (max-width: 768px) {
  .add-employee-container { padding: 10px; }
  .page-title { font-size: 24px; }
  .employee-form { padding: 30px 20px; }
  .role-selection { flex-direction: column; gap: 15px; }
  .form-actions { flex-direction: column; }
  .btn { width: 100%; }
}

.form-group {
  animation: slideInUp 0.5s ease-out;
  animation-fill-mode: both;
}
.form-group:nth-child(1) { animation-delay: 0.1s; }
.form-group:nth-child(2) { animation-delay: 0.2s; }
.form-group:nth-child(3) { animation-delay: 0.3s; }
.form-group:nth-child(4) { animation-delay: 0.4s; }
.form-actions {
  animation: slideInUp 0.5s ease-out 0.5s;
  animation-fill-mode: both;
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
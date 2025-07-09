<template>
  <div class="container-fluid py-4 bg-light">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <!-- Header -->
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-primary text-white">
            <h4 class="mb-0">
              <i class="fas fa-user-cog me-2"></i>
              إعدادات الحساب
            </h4>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
          <i class="fas fa-check-circle me-2"></i>
          {{ successMessage }}
          <button type="button" class="btn-close" @click="successMessage = ''"></button>
        </div>

        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="fas fa-exclamation-circle me-2"></i>
          {{ errorMessage }}
          <button type="button" class="btn-close" @click="errorMessage = ''"></button>
        </div>

        <!-- User Information Card -->
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-user me-2"></i>
              المعلومات الشخصية
            </h5>
            <button
              v-if="phoneChangeStep === 0"
              type="button"
              class="btn btn-outline-primary"
              @click="toggleEditMode"
            >
              <i :class="isEditMode ? 'fas fa-times' : 'fas fa-edit'"></i>
              <span class="ms-1">{{ isEditMode ? 'إلغاء' : 'تعديل' }}</span>
            </button>
          </div>
          <div class="card-body">
            <form @submit.prevent="updateProfile">
              <!-- Full Name -->
              <div class="mb-3">
                <label class="form-label">الاسم الكامل</label>
                <input
                  v-model="formData.full_name"
                  type="text"
                  class="form-control"
                  :readonly="!isEditMode"
                  required
                />
              </div>

              <!-- Email -->
              <div class="mb-3">
                <label class="form-label">البريد الإلكتروني</label>
                <input
                  v-model="formData.email"
                  type="email"
                  class="form-control"
                  :readonly="!isEditMode"
                  required
                />
              </div>

              <!-- Save Button for Profile -->
              <div v-if="isEditMode" class="mt-4">
                <button type="submit" class="btn btn-success" :disabled="isLoading">
                  <i class="fas fa-save me-1"></i>
                  <span v-if="isLoading">جاري الحفظ...</span>
                  <span v-else>حفظ التغييرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Phone Number Card -->
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-phone me-2"></i>
              رقم الهاتف
            </h5>
            <button
              v-if="phoneChangeStep === 0"
              type="button"
              class="btn btn-outline-primary"
              @click="phoneChangeStep = 1"
            >
              <i class="fas fa-edit"></i>
              <span class="ms-1">تعديل</span>
            </button>
          </div>
          <div class="card-body">
            <!-- Step 0: Display current phone number -->
            <div v-if="phoneChangeStep === 0">
              <div class="mb-3">
                <label class="form-label">رقم الهاتف</label>
                <input type="tel" class="form-control" :value="user?.phone_number" readonly />
              </div>
            </div>

            <!-- Step 1: Request new phone number and OTP -->
            <form v-if="phoneChangeStep === 1" @submit.prevent="handleRequestPhoneChange">
              <div class="mb-3">
                <label class="form-label">رقم الهاتف الجديد</label>
                <input 
                  v-model="newPhoneNumber" 
                  type="tel" 
                  class="form-control" 
                  :class="{ 'is-invalid': !isPhoneNumberValid && newPhoneNumber.length > 0 }"
                  placeholder="أدخل الرقم الجديد (مثال: 0912345678)" 
                  maxlength="10"
                  required 
                />
                <div v-if="!isPhoneNumberValid && newPhoneNumber.length > 0" class="invalid-feedback">
                  يجب أن يكون رقم الهاتف 10 أرقام ويبدأ بـ 09
                </div>
                <div class="form-text">
                  <i class="fas fa-info-circle me-1"></i>
                  يجب أن يكون الرقم 10 أرقام ويبدأ بـ 09
                </div>
              </div>
              <div class="mt-4">
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  :disabled="isLoading || !isPhoneNumberValid"
                >
                  <i class="fas fa-paper-plane me-1"></i>
                  <span v-if="isLoading">جاري الطلب...</span>
                  <span v-else>طلب رمز التحقق</span>
                </button>
                <button type="button" class="btn btn-secondary ms-2" @click="cancelPhoneChange">
                  <i class="fas fa-times me-1"></i>
                  إلغاء
                </button>
              </div>
            </form>
            
            <!-- Step 2: Confirm OTP -->
            <form v-if="phoneChangeStep === 2" @submit.prevent="handleConfirmPhoneChange">
              <p class="text-muted small mb-3">
                <i class="fas fa-info-circle me-1"></i>
                تم إرسال رمز تحقق إلى الرقم: {{ newPhoneNumber }}
              </p>
              <div class="mb-3">
                <label class="form-label">رمز التحقق (OTP)</label>
                <input v-model="otpCode" type="text" class="form-control" placeholder="أدخل الرمز" required />
              </div>
              <div class="mt-4">
                <button type="submit" class="btn btn-success" :disabled="isLoading">
                  <i class="fas fa-check me-1"></i>
                  <span v-if="isLoading">جاري التأكيد...</span>
                  <span v-else">تأكيد وتغيير الرقم</span>
                </button>
                <button type="button" class="btn btn-secondary ms-2" @click="cancelPhoneChange">
                  <i class="fas fa-times me-1"></i>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Permissions Card (Admin Only) -->
        <div v-if="isAdmin" class="card shadow-sm mb-4">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-user-shield me-2"></i>
              الصلاحيات
            </h5>
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="togglePermissionsEditMode"
            >
              <i :class="isPermissionsEditMode ? 'fas fa-times' : 'fas fa-edit'"></i>
              <span class="ms-1">{{ isPermissionsEditMode ? 'إلغاء' : 'تعديل' }}</span>
            </button>
          </div>
          <div class="card-body">
            <form @submit.prevent="updatePermissions">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">الصلاحية</label>
                  <input type="text" class="form-control" :value="userRoleText" readonly />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">حالة الحساب</label>
                  <select 
                    v-model="permissionsForm.is_active" 
                    class="form-select" 
                    :disabled="!isPermissionsEditMode"
                  >
                    <option :value="true">نشط</option>
                    <option :value="false">غير نشط</option>
                  </select>
                </div>
              </div>
              <div class="col-12 mb-3">
                <label class="form-label">آخر تسجيل دخول</label>
                <input type="text" class="form-control" :value="formatLastLogin(user?.last_login)" readonly />
              </div>
              
              <!-- Save Button for Permissions -->
              <div v-if="isPermissionsEditMode" class="mt-4">
                <button type="submit" class="btn btn-success" :disabled="isLoading">
                  <i class="fas fa-save me-1"></i>
                  <span v-if="isLoading">جاري الحفظ...</span>
                  <span v-else>حفظ التغييرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Read-only Information Card (Non-Admin) -->
        <div v-else class="card shadow-sm mb-4">
          <div class="card-header bg-light">
            <h5 class="mb-0">
              <i class="fas fa-info-circle me-2"></i>
              معلومات الحساب
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">الصلاحية</label>
                <input type="text" class="form-control" :value="userRoleText" readonly />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">حالة الحساب</label>
                <input type="text" class="form-control" :value="user?.is_active ? 'نشط' : 'غير نشط'" readonly />
              </div>
              <div class="col-12">
                <label class="form-label">آخر تسجيل دخول</label>
                <input type="text" class="form-control" :value="formatLastLogin(user?.last_login)" readonly />
              </div>
            </div>
          </div>
        </div>

        <!-- Change Password Card -->
        <div class="card shadow-sm">
          <div class="card-header bg-light">
            <h5 class="mb-0"><i class="fas fa-lock me-2"></i> تغيير كلمة المرور</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="changePassword">
              <!-- Current Password -->
              <div class="mb-3">
                <label class="form-label">كلمة المرور الحالية</label>
                <div class="input-group">
                  <input
                    v-model="passwordForm.old_password"
                    :type="showPasswords.current ? 'text' : 'password'"
                    class="form-control"
                    required
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="togglePasswordVisibility('current')"
                  >
                    <i :class="showPasswords.current ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- New Password -->
              <div class="mb-3">
                <label class="form-label">كلمة المرور الجديدة</label>
                <div class="input-group">
                  <input
                    v-model="passwordForm.new_password"
                    :type="showPasswords.new ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'is-invalid': !isNewPasswordValid && passwordForm.new_password.length > 0 }"
                    required
                    minlength="8"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="togglePasswordVisibility('new')"
                  >
                    <i :class="showPasswords.new ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <div v-if="!isNewPasswordValid && passwordForm.new_password.length > 0" class="invalid-feedback">
                  يجب أن تكون كلمة المرور 8 أحرف على الأقل
                </div>
                <div class="form-text">
                  <i class="fas fa-info-circle me-1"></i>
                  يجب أن تكون كلمة المرور 8 أحرف على الأقل
                </div>
              </div>

              <!-- Change Password Button -->
              <div class="mt-4">
                <button
                  type="submit"
                  class="btn btn-warning"
                  :disabled="isLoading || !isPasswordFormValid"
                >
                  <i class="fas fa-key me-1"></i>
                  <span v-if="isLoading">جاري التحديث...</span>
                  <span v-else>تغيير كلمة المرور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/authStore'
import { computed, reactive, ref, onMounted, watch } from 'vue'

export default {
  name: 'Settings',
  setup() {
    const authStore = useAuthStore()
    
    // State
    const isEditMode = ref(false)
    const isPermissionsEditMode = ref(false)
    const phoneChangeStep = ref(0) // 0: idle, 1: requesting, 2: confirming
    const newPhoneNumber = ref('')
    const otpCode = ref('')

    const formData = reactive({
      full_name: '',
      email: '',
    })

    const permissionsForm = reactive({
      is_active: true,
    })

    const passwordForm = reactive({
      old_password: '',
      new_password: '',
    })

    const showPasswords = reactive({
      current: false,
      new: false,
    })

    const successMessage = ref('')
    const errorMessage = ref('')

    // Computed
    const user = computed(() => authStore.getCurrentUser)
    const isLoading = computed(() => authStore.getIsLoading)
    const isAdmin = computed(() => authStore.isAdmin)

    const userRoleText = computed(() => {
      if (!user.value) return '';
      switch (user.value.role) {
        case 'ADMIN': return 'مدير';
        case 'EMPLOYEE': return 'موظف';
        case 'CUSTOMER': return 'عميل';
        default: return 'غير معروف';
      }
    });

    // Phone number validation: exactly 10 digits starting with 09
    const isPhoneNumberValid = computed(() => {
      const phoneRegex = /^09\d{8}$/;
      return phoneRegex.test(newPhoneNumber.value);
    });

    // New password validation: at least 8 characters
    const isNewPasswordValid = computed(() => {
      return passwordForm.new_password.length >= 8;
    });

    const isPasswordFormValid = computed(() => {
      return passwordForm.old_password && 
             passwordForm.new_password &&
             isNewPasswordValid.value;
    });

    // Methods
    const initializeFormData = () => {
      if (user.value) {
        formData.full_name = user.value.full_name
        formData.email = user.value.email
        
        // Initialize permissions form
        permissionsForm.is_active = user.value.is_active
      }
    }

    const toggleEditMode = () => {
      isEditMode.value = !isEditMode.value
      if (!isEditMode.value) {
        cancelEdits()
      }
    }

    const togglePermissionsEditMode = () => {
      isPermissionsEditMode.value = !isPermissionsEditMode.value
      if (!isPermissionsEditMode.value) {
        cancelPermissionsEdits()
      }
    }

    const cancelEdits = () => {
      isEditMode.value = false
      initializeFormData()
      errorMessage.value = ''
    }

    const cancelPermissionsEdits = () => {
      isPermissionsEditMode.value = false
      initializeFormData()
      errorMessage.value = ''
    }
    
    const cancelPhoneChange = () => {
      phoneChangeStep.value = 0
      newPhoneNumber.value = ''
      otpCode.value = ''
      errorMessage.value = ''
    }

    const clearMessages = () => {
      successMessage.value = ''
      errorMessage.value = ''
    }

    const updateProfile = async () => {
      clearMessages()
      const result = await authStore.updateProfile({
          full_name: formData.full_name,
          email: formData.email
      });
      if (result.success) {
        successMessage.value = 'تم تحديث المعلومات بنجاح';
        isEditMode.value = false;
      } else {
        errorMessage.value = result.error || 'حدث خطأ أثناء تحديث الملف الشخصي.';
      }
    }

    const updatePermissions = async () => {
      clearMessages()
      const result = await authStore.updateUserById(user.value.id, {
        is_active: permissionsForm.is_active
      });
      if (result.success) {
        successMessage.value = 'تم تحديث الصلاحيات بنجاح';
        isPermissionsEditMode.value = false;
        // Refresh user data
        await authStore.fetchUser();
      } else {
        errorMessage.value = result.error || 'حدث خطأ أثناء تحديث الصلاحيات.';
      }
    }

    const handleRequestPhoneChange = async () => {
      clearMessages()
      
      // Client-side validation
      if (!isPhoneNumberValid.value) {
        errorMessage.value = 'يجب أن يكون رقم الهاتف 10 أرقام ويبدأ بـ 09';
        return;
      }

      const result = await authStore.requestPhoneChange({ new_phone_number: newPhoneNumber.value });
      if (result.success) {
        successMessage.value = 'تم إرسال رمز التحقق إلى رقمك الجديد.';
        phoneChangeStep.value = 2;
      } else {
        errorMessage.value = result.error || 'حدث خطأ أثناء طلب تغيير الرقم.';
      }
    }

    const handleConfirmPhoneChange = async () => {
      clearMessages()
      const result = await authStore.confirmPhoneChange(
        otpCode.value,
        newPhoneNumber.value
      );
      if (result.success) {
        successMessage.value = 'تم تغيير رقم الهاتف بنجاح!';
        cancelPhoneChange();
      } else {
        errorMessage.value = result.error || 'رمز التحقق غير صحيح أو حدث خطأ ما.';
      }
    }

    const changePassword = async () => {
      clearMessages()
      
      // Client-side validation
      if (!isPasswordFormValid.value) {
        errorMessage.value = "يرجى التأكد من ملء جميع الحقول بشكل صحيح وأن تكون كلمة المرور الجديدة 8 أحرف على الأقل.";
        return;
      }

      const result = await authStore.changePassword(passwordForm);
      if (result.success) {
          successMessage.value = 'تم تغيير كلمة المرور بنجاح';
          passwordForm.old_password = '';
          passwordForm.new_password = '';
      } else {
          errorMessage.value = result.error || 'حدث خطأ أثناء تغيير كلمة المرور.';
      }
    }

    const togglePasswordVisibility = (field) => {
      showPasswords[field] = !showPasswords[field]
    }

    const formatLastLogin = (lastLogin) => {
      if (!lastLogin) return 'لم يسجل دخول من قبل'
      const date = new Date(lastLogin)
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Lifecycle
    onMounted(() => {
      initializeFormData()
    })

    watch(user, (newUser) => {
      if (newUser) {
        initializeFormData()
      }
    }, { immediate: true })

    return {
      isEditMode,
      isPermissionsEditMode,
      phoneChangeStep,
      newPhoneNumber,
      otpCode,
      formData,
      permissionsForm,
      passwordForm,
      showPasswords,
      successMessage,
      errorMessage,
      user,
      isLoading,
      isAdmin,
      userRoleText,
      isPhoneNumberValid,
      isNewPasswordValid,
      isPasswordFormValid,
      toggleEditMode,
      togglePermissionsEditMode,
      cancelEdits,
      cancelPermissionsEdits,
      cancelPhoneChange,
      updateProfile,
      updatePermissions,
      handleRequestPhoneChange,
      handleConfirmPhoneChange,
      changePassword,
      togglePasswordVisibility,
      formatLastLogin
    }
  }
}
</script>

<style scoped>
.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}
.form-label {
  font-weight: 600;
  color: #495057;
}
.input-group .btn {
  border-left: none;
}
.input-group .form-control:focus {
  box-shadow: none;
  border-color: #80bdff;
}
.input-group .form-control:focus + .btn {
  border-color: #80bdff;
}
.btn-outline-secondary {
  border-color: #ced4da;
}
.btn-outline-secondary:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}
.alert {
  border: none;
  border-radius: 0.375rem;
}
.form-select:disabled {
  background-color: #e9ecef;
  opacity: 1;
}
.form-control.is-invalid {
  border-color: #dc3545;
}
.invalid-feedback {
  display: block;
  color: #dc3545;
  font-size: 0.875em;
  margin-top: 0.25rem;
}
.form-text {
  color: #6c757d;
  font-size: 0.875em;
  margin-top: 0.25rem;
}
</style>
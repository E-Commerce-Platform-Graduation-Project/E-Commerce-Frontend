<template>
  <div class="container-fluid py-4 bg-light">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-primary text-white">
            <h4 class="mb-0">
              <i class="fas fa-user-cog me-2"></i>
              إعدادات الحساب
            </h4>
          </div>
        </div>

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
            <form @submit.prevent="updateProfile" novalidate>
              <div class="mb-3">
                <label for="fullName" class="form-label">الاسم الكامل</label>
                <input
                  id="fullName"
                  v-model="formData.full_name"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.full_name }"
                  :readonly="!isEditMode"
                />
                <div v-if="formErrors.full_name" class="invalid-feedback">
                  {{ formErrors.full_name }}
                </div>
              </div>

              <div class="mb-3">
                <label for="email" class="form-label">البريد الإلكتروني</label>
                <input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.email }"
                  :readonly="!isEditMode"
                />
                <div v-if="formErrors.email" class="invalid-feedback">
                  {{ formErrors.email }}
                </div>
              </div>

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
            <div v-if="phoneChangeStep === 0">
              <div class="mb-3">
                <label class="form-label">رقم الهاتف</label>
                <input type="tel" class="form-control" :value="user?.phone_number" readonly />
              </div>
            </div>

            <form v-if="phoneChangeStep === 1" @submit.prevent="handleRequestPhoneChange">
              <div class="mb-3">
                <label for="newPhoneNumber" class="form-label">رقم الهاتف الجديد</label>
                <input
                  id="newPhoneNumber"
                  v-model="newPhoneNumber"
                  type="tel"
                  class="form-control"
                  :class="{ 'is-invalid': phoneError }"
                  placeholder="أدخل الرقم الجديد (مثال: 0912345678)"
                  maxlength="10"
                />
                <div v-if="phoneError" class="invalid-feedback">
                  {{ phoneError }}
                </div>
                <div v-else class="form-text">
                  <i class="fas fa-info-circle me-1"></i>
                  يجب أن يكون الرقم 10 أرقام ويبدأ بـ 09
                </div>
              </div>
              <div class="mt-4">
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="isLoading"
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

            <form v-if="phoneChangeStep === 2" @submit.prevent="handleConfirmPhoneChange">
              <p class="text-muted small mb-3">
                <i class="fas fa-info-circle me-1"></i>
                تم إرسال رمز تحقق إلى الرقم: {{ newPhoneNumber }}
              </p>
              <div class="mb-3">
                <label class="form-label">رمز التحقق (OTP)</label>
                <div class="d-flex justify-content-center gap-2" dir="ltr">
                  <input
                    v-for="(digit, index) in otpDigits"
                    :key="index"
                    v-model="otpDigits[index]"
                    :ref="el => { if (el) otpInputs[index] = el }"
                    type="text"
                    class="form-control otp-input text-center"
                    maxlength="1"
                    @input="handleOtpInput($event, index)"
                    @keydown="handleOtpKeydown($event, index)"
                    @paste="handleOtpPaste"
                  />
                </div>
              </div>
              <div class="mt-4">
                <button type="submit" class="btn btn-success" :disabled="isLoading">
                  <i class="fas fa-check me-1"></i>
                  <span v-if="isLoading">جاري التأكيد...</span>
                  <span v-else>تأكيد وتغيير الرقم</span>
                </button>
                <button type="button" class="btn btn-secondary ms-2" @click="cancelPhoneChange">
                  <i class="fas fa-times me-1"></i>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>

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

        <div class="card shadow-sm">
          <div class="card-header bg-light">
            <h5 class="mb-0"><i class="fas fa-lock me-2"></i> تغيير كلمة المرور</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="changePassword" novalidate>
              <div class="mb-3">
                <label class="form-label">كلمة المرور الحالية</label>
                <div class="input-group">
                  <input
                    v-model="passwordForm.old_password"
                    :type="showPasswords.current ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'is-invalid': passwordErrors.old_password }"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="togglePasswordVisibility('current')"
                  >
                    <i :class="showPasswords.current ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                 <div v-if="passwordErrors.old_password" class="invalid-feedback">
                  {{ passwordErrors.old_password }}
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">كلمة المرور الجديدة</label>
                <div class="input-group">
                  <input
                    v-model="passwordForm.new_password"
                    :type="showPasswords.new ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'is-invalid': passwordErrors.new_password }"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="togglePasswordVisibility('new')"
                  >
                    <i :class="showPasswords.new ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <div v-if="passwordErrors.new_password" class="invalid-feedback">
                  {{ passwordErrors.new_password }}
                </div>
                <div class="form-text">
                  <i class="fas fa-info-circle me-1"></i>
                  يجب أن تكون كلمة المرور 8 أحرف على الأقل
                </div>
              </div>

              <div class="mt-4">
                <button
                  type="submit"
                  class="btn btn-warning"
                  :disabled="isLoading"
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

    <div v-if="modal.show" class="modal-overlay" @click="closeModal">
      <div class="modal-content text-center" @click.stop>
        <div class="modal-icon" :class="modal.type === 'error' ? 'icon-error' : 'icon-success'">
          <i class="fas" :class="modal.type === 'error' ? 'fa-times' : 'fa-check'"></i>
        </div>
        <h4 class="my-3">{{ modal.title }}</h4>
        <p class="text-muted">{{ modal.message }}</p>
        <button class="btn mt-3" :class="modal.type === 'error' ? 'btn-danger' : 'btn-success'" @click="closeModal">
          إغلاق
        </button>
      </div>
    </div>

  </div>
</template>

<script>
import { useAuthStore } from '@/stores/authStore'
import { computed, reactive, ref, onMounted, watch, nextTick } from 'vue'

export default {
  name: 'Settings',
  setup() {
    const authStore = useAuthStore()

    // State
    const isEditMode = ref(false)
    const isPermissionsEditMode = ref(false)
    const phoneChangeStep = ref(0) // 0: idle, 1: requesting, 2: confirming
    const newPhoneNumber = ref('')
    const phoneError = ref('')

    const otpDigits = reactive(['', '', '', '', '', ''])
    const otpInputs = ref([])

    const formData = reactive({
      full_name: '',
      email: '',
    })

    const formErrors = reactive({
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

    const passwordErrors = reactive({
      old_password: '',
      new_password: '',
    })

    const showPasswords = reactive({
      current: false,
      new: false,
    })

    const modal = reactive({
      show: false,
      type: 'success', // 'success' or 'error'
      title: '',
      message: ''
    });

    // Computed
    const user = computed(() => authStore.getCurrentUser)
    const isLoading = computed(() => authStore.getIsLoading)
    const isAdmin = computed(() => authStore.isAdmin)
    const otpCode = computed(() => otpDigits.join(''))


    const userRoleText = computed(() => {
      if (!user.value) return '';
      switch (user.value.role) {
        case 'ADMIN': return 'مدير';
        case 'EMPLOYEE': return 'موظف';
        case 'CUSTOMER': return 'عميل';
        default: return 'غير معروف';
      }
    });

    // Methods
    const showModal = (type, title, message) => {
      modal.type = type;
      modal.title = title;
      modal.message = message;
      modal.show = true;
    };

    const closeModal = () => {
      modal.show = false;
    };

    const initializeFormData = () => {
      if (user.value) {
        formData.full_name = user.value.full_name
        formData.email = user.value.email
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

    const clearFormErrors = () => {
      formErrors.full_name = '';
      formErrors.email = '';
    }

    const clearPasswordErrors = () => {
        passwordErrors.old_password = '';
        passwordErrors.new_password = '';
    }

    const cancelEdits = () => {
      isEditMode.value = false
      initializeFormData()
      clearFormErrors()
    }

    const cancelPermissionsEdits = () => {
      isPermissionsEditMode.value = false
      initializeFormData()
    }

    const cancelPhoneChange = () => {
      phoneChangeStep.value = 0
      newPhoneNumber.value = ''
      phoneError.value = ''
      otpDigits.fill('')
    }

    const validateProfile = () => {
      clearFormErrors();
      let isValid = true;

      if (!formData.full_name.trim()) {
        formErrors.full_name = 'الاسم الكامل مطلوب.';
        isValid = false;
      } else if (formData.full_name.trim().length <= 2) {
        formErrors.full_name = 'يجب أن يكون الاسم أطول من حرفين.';
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        formErrors.email = 'البريد الإلكتروني مطلوب.';
        isValid = false;
      } else if (!emailRegex.test(formData.email)) {
        formErrors.email = 'الرجاء إدخال بريد إلكتروني صالح.';
        isValid = false;
      }

      return isValid;
    }

    const updateProfile = async () => {
      if (!validateProfile()) {
        await nextTick();
        const firstErrorField = document.querySelector('.is-invalid');
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const result = await authStore.updateProfile({
          full_name: formData.full_name,
          email: formData.email
      });

      if (result.success) {
        showModal('success', 'نجاح!', 'تم تحديث المعلومات بنجاح.');
        isEditMode.value = false;
        clearFormErrors();
      } else {
        showModal('error', 'حدث خطأ!', result.error || 'حدث خطأ أثناء تحديث الملف الشخصي.');
      }
    }

    const updatePermissions = async () => {
      const result = await authStore.updateUserById(user.value.id, {
        is_active: permissionsForm.is_active
      });
      if (result.success) {
        showModal('success', 'نجاح!', 'تم تحديث الصلاحيات بنجاح.');
        isPermissionsEditMode.value = false;
        await authStore.fetchUser();
      } else {
        showModal('error', 'حدث خطأ!', result.error || 'حدث خطأ أثناء تحديث الصلاحيات.');
      }
    }

    const validatePhoneNumber = () => {
        const phoneRegex = /^09\d{8}$/;
        if (!newPhoneNumber.value) {
            phoneError.value = 'حقل رقم الهاتف مطلوب.';
            return false;
        }
        if (!phoneRegex.test(newPhoneNumber.value)) {
            phoneError.value = 'يجب أن يكون رقم الهاتف 10 أرقام ويبدأ بـ 09.';
            return false;
        }
        phoneError.value = '';
        return true;
    };

    const handleRequestPhoneChange = async () => {
      if (!validatePhoneNumber()) {
        return;
      }

      const result = await authStore.requestPhoneChange({ new_phone_number: newPhoneNumber.value });
      if (result.success) {
        showModal('success', 'نجاح!', 'تم إرسال رمز التحقق إلى رقمك الجديد.');
        phoneChangeStep.value = 2;
        await nextTick();
        otpInputs.value[0]?.focus();
      } else {
        showModal('error', 'حدث خطأ!', result.error || 'حدث خطأ أثناء طلب تغيير الرقم.');
      }
    }

    const handleConfirmPhoneChange = async () => {
      if (otpCode.value.length < 6) {
        showModal('error', 'خطأ في الإدخال', 'الرجاء إدخال رمز التحقق المكون من 6 أرقام.');
        return;
      }

      const result = await authStore.confirmPhoneChange(
        otpCode.value,
        newPhoneNumber.value
      );
      if (result.success) {
        showModal('success', 'نجاح!', 'تم تغيير رقم الهاتف بنجاح!');
        cancelPhoneChange();
        await authStore.fetchUser(); // Refresh user data to show new number
      } else {
        showModal('error', 'حدث خطأ!', result.error || 'رمز التحقق غير صحيح أو حدث خطأ ما.');
      }
    }

    const validatePasswordForm = () => {
        clearPasswordErrors();
        let isValid = true;

        if (!passwordForm.old_password) {
            passwordErrors.old_password = 'كلمة المرور الحالية مطلوبة.';
            isValid = false;
        }

        if (!passwordForm.new_password) {
            passwordErrors.new_password = 'كلمة المرور الجديدة مطلوبة.';
            isValid = false;
        } else if (passwordForm.new_password.length < 8) {
            passwordErrors.new_password = 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.';
            isValid = false;
        }
        return isValid;
    }

    const changePassword = async () => {
      if (!validatePasswordForm()) {
        return;
      }

      const result = await authStore.changePassword(passwordForm);
      if (result.success) {
          showModal('success', 'نجاح!', 'تم تغيير كلمة المرور بنجاح.');
          passwordForm.old_password = '';
          passwordForm.new_password = '';
          clearPasswordErrors();
      } else {
          showModal('error', 'حدث خطأ!', result.error || 'حدث خطأ أثناء تغيير كلمة المرور.');
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

    const handleOtpInput = (e, index) => {
      const input = e.target;
      const value = input.value;

      if (!/^\d*$/.test(value)) {
          otpDigits[index] = '';
          return;
      }

      otpDigits[index] = value;

      if (value && index < otpDigits.length - 1) {
        otpInputs.value[index + 1].focus();
      }
    };

    const handleOtpKeydown = (e, index) => {
      if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
        otpInputs.value[index - 1].focus();
      }
    };

    const handleOtpPaste = async (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            pastedData.split('').forEach((char, index) => {
                otpDigits[index] = char;
            });
            await nextTick();
            otpInputs.value[otpDigits.length - 1].focus();
        }
    };

    // Lifecycle
    onMounted(() => {
      initializeFormData()
    })

    watch(user, (newUser) => {
      if (newUser) {
        initializeFormData()
      }
    }, { immediate: true })

    watch(newPhoneNumber, () => {
        if (phoneError.value) {
            validatePhoneNumber();
        }
    });

    watch(() => passwordForm.old_password, () => {
        if(passwordErrors.old_password) clearPasswordErrors();
    });

    watch(() => passwordForm.new_password, () => {
        if(passwordErrors.new_password) clearPasswordErrors();
    });

    return {
      isEditMode,
      isPermissionsEditMode,
      phoneChangeStep,
      newPhoneNumber,
      phoneError,
      otpDigits,
      otpInputs,
      formData,
      formErrors,
      permissionsForm,
      passwordForm,
      passwordErrors,
      showPasswords,
      modal,
      user,
      isLoading,
      isAdmin,
      userRoleText,
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
      formatLastLogin,
      handleOtpInput,
      handleOtpKeydown,
      handleOtpPaste,
      closeModal
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
.otp-input {
  width: 45px;
  height: 45px;
  font-size: 1.5rem;
  text-align: center;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.otp-input:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  transition: opacity 0.3s ease;
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 15px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 5px 15px rgba(0,0,0,.3);
  transform: scale(0.9);
  animation: modal-pop 0.3s ease-out forwards;
}

.modal-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 40px;
}

.icon-error {
  background-color: #dc3545; /* Red */
}

.icon-success {
  background-color: #198754; /* Green */
}

.modal-content h4 {
  font-weight: bold;
}

.modal-content .btn {
  padding: 10px 30px;
  border-radius: 8px;
  font-weight: bold;
}

@keyframes modal-pop {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
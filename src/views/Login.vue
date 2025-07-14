<template>
  <div class="text-center d-flex align-items-center justify-content-center bg-light" style="height: 100vh">
    <div class="form-container w-100 m-auto" style="max-width: 400px">
      <div v-if="formMode === 'login'">
        <form @submit.prevent="handleLogin" id="loginForm" novalidate>
          <img class="mb-4" width="72" alt="Logo" src="../assets/icons/e-commerce-logo3.png" />
          <h1 id="psi" class="h3 mb-3 fw-normal">تسجيل الدخول</h1>

          <div v-if="authStore.getError" class="alert alert-danger mb-3" role="alert">
            {{ authStore.getError }}
          </div>

          <div class="mb-3">
            <label for="floatingInput">رقم الهاتف</label>
            <input type="text" class="form-control" :class="{ 'is-invalid': phoneError }" id="floatingInput" placeholder="أدخل رقم الهاتف" v-model="PhoneNumber" :disabled="authStore.getIsLoading" required />
            <div v-if="phoneError" class="invalid-feedback text-end d-block">
              {{ phoneError }}
            </div>
          </div>

          <div class="mb-3">
            <label for="floatingPassword">كلمة المرور</label>
            <div class="input-group password-input-group">
              <span class="input-group-text password-toggle" @click="togglePassword">
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </span>
              <input :type="showPassword ? 'text' : 'password'" class="form-control password-input" :class="{ 'is-invalid': passwordError }" id="floatingPassword" placeholder="أدخل كلمة المرور" v-model="password" :disabled="authStore.getIsLoading" required />
            </div>
            <div v-if="passwordError" class="invalid-feedback text-end d-block">
              {{ passwordError }}
            </div>
          </div>

          <div class="text-start mb-3 text-center">
            نسيت كلمة المرور؟
            <a href="#" @click.prevent="switchToResetMode" class="forgot-password-link">
              قم باعادة تعيينها الان
            </a>
          </div>

          <button class="btn btn-dark w-100 py-2 mt-3" type="submit" :disabled="authStore.getIsLoading">
            <span v-if="authStore.getIsLoading">
              <i class="fas fa-spinner fa-spin me-2"></i>
              جاري تسجيل الدخول...
            </span>
            <span v-else> تسجيل دخول </span>
          </button>

          <p class="mt-5 mb-3 text-muted text-center">© CCTT</p>
        </form>
      </div>

      <div v-else class="card p-4 shadow-sm">
        <div class="text-center mb-4">
           <img class="mb-3" width="72" alt="Logo" src="../assets/icons/e-commerce-logo3.png" />
           <h1 class="h3 mb-2 fw-normal">إعادة تعيين كلمة المرور</h1>
        </div>

        <div v-if="authStore.getError" class="alert alert-danger" role="alert">
          {{ authStore.getError }}
        </div>
        
        <div v-if="successMessage" class="alert alert-success" role="alert">
          {{ successMessage }}
        </div>

        <form v-if="formMode === 'reset-request'" @submit.prevent="handleRequestReset" novalidate>
          <p class="text-muted text-center mb-3">أدخل رقم هاتفك لإرسال رمز التحقق.</p>
          <div class="mb-3">
            <label for="phoneInput">رقم الهاتف</label>
            <input type="text" class="form-control" :class="{ 'is-invalid': resetPhoneError }" id="phoneInput" v-model="resetPhoneNumber" :disabled="authStore.getIsLoading" required placeholder="09xxxxxxxx" />
             <div v-if="resetPhoneError" class="invalid-feedback text-end d-block">
                {{ resetPhoneError }}
            </div>
          </div>
          <button class="btn btn-dark w-100 py-2" type="submit" :disabled="authStore.getIsLoading">
            <span v-if="authStore.getIsLoading"><i class="fas fa-spinner fa-spin"></i></span>
            <span v-else>إرسال الرمز</span>
          </button>
        </form>

        <form v-if="formMode === 'reset-verify'" @submit.prevent="handleVerifyOtp">
          <p class="text-muted text-center mb-3">تم إرسال رمز مكون من 6 أرقام إلى هاتفك.</p>
          <div class="mb-3">
            <label>رمز التحقق (OTP)</label>
            <div class="otp-container" dir="ltr">
              <input v-for="(digit, index) in otp" :key="index" type="text" class="form-control otp-input text-center" maxlength="1" v-model="otp[index]" @input="handleOtpInput(index, $event)" @keydown.delete="handleOtpBackspace(index, $event)" :ref="el => otpInputs[index] = el" :disabled="authStore.getIsLoading" />
            </div>
          </div>
          <button class="btn btn-dark w-100 py-2" type="submit" :disabled="authStore.getIsLoading || !isOtpComplete">
             <span v-if="authStore.getIsLoading"><i class="fas fa-spinner fa-spin"></i></span>
             <span v-else>التحقق من الرمز</span>
          </button>
        </form>

        <form v-if="formMode === 'reset-set-password'" @submit.prevent="handleSetNewPassword">
           <p class="text-muted text-center mb-3">أدخل كلمة المرور الجديدة.</p>
          <div class="mb-3">
            <label for="newPassword">كلمة المرور الجديدة</label>
            <input type="password" class="form-control" id="newPassword" v-model="newPassword" required :disabled="authStore.getIsLoading" />
          </div>
          <div class="mb-3">
            <label for="confirmPassword">تأكيد كلمة المرور الجديدة</label>
            <input type="password" class="form-control" id="confirmPassword" v-model="confirmPassword" required :disabled="authStore.getIsLoading" />
             <small v-if="newPassword && confirmPassword && newPassword !== confirmPassword" class="form-text text-danger">
                كلمتا المرور غير متطابقتين.
            </small>
          </div>
          <button class="btn btn-dark w-100 py-2" type="submit" :disabled="authStore.getIsLoading || !isPasswordFormValid">
            <span v-if="authStore.getIsLoading"><i class="fas fa-spinner fa-spin"></i></span>
            <span v-else>حفظ كلمة المرور</span>
          </button>
        </form>
        
        <div class="text-center mt-4">
            <a href="#" @click.prevent="switchToLoginMode" class="back-to-login">العودة إلى تسجيل الدخول</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";

export default {
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    // General state
    const formMode = ref('login'); // 'login', 'reset-request', 'reset-verify', 'reset-set-password'

    // Login form data
    const PhoneNumber = ref("");
    const password = ref("");
    const showPassword = ref(false);

    // Password reset form data
    const resetPhoneNumber = ref('');
    const otp = ref(new Array(6).fill(''));
    const otpInputs = ref([]);
    const resetToken = ref(null);
    const newPassword = ref('');
    const confirmPassword = ref('');
    const successMessage = ref('');

    // Validation Errors
    const phoneError = ref('');
    const passwordError = ref('');
    const resetPhoneError = ref('');


    // --- COMPUTED PROPERTIES ---
    const isOtpComplete = computed(() => otp.value.every(digit => digit !== '' && !isNaN(digit)));
    const isPasswordFormValid = computed(() => newPassword.value && newPassword.value === confirmPassword.value && newPassword.value.length >= 8);


    // --- METHODS ---
    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };
    
    const clearForms = () => {
        PhoneNumber.value = '';
        password.value = '';
        resetPhoneNumber.value = '';
        otp.value.fill('');
        newPassword.value = '';
        confirmPassword.value = '';
        successMessage.value = '';
        phoneError.value = '';
        passwordError.value = '';
        resetPhoneError.value = '';
        authStore.clearError();
    };

    const switchToResetMode = () => {
        clearForms();
        formMode.value = 'reset-request';
    };

    const switchToLoginMode = () => {
        clearForms();
        formMode.value = 'login';
    };

    // --- Validation Functions ---
    const validateLogin = () => {
        let isValid = true;
        phoneError.value = '';
        passwordError.value = '';

        if (!PhoneNumber.value) {
            phoneError.value = 'الرجاء إدخال رقم الهاتف.';
            isValid = false;
        } else if (!PhoneNumber.value.startsWith("09") || PhoneNumber.value.length !== 10) {
            phoneError.value = 'يجب أن يبدأ رقم الهاتف بـ 09 وأن يتكون من 10 أرقام.';
            isValid = false;
        }

        if (!password.value) {
            passwordError.value = 'الرجاء إدخال كلمة المرور.';
            isValid = false;
        } else if (password.value.length < 8) {
            passwordError.value = 'يجب أن لا تقل كلمة المرور عن 8 أحرف.';
            isValid = false;
        }
        return isValid;
    };

    const validateResetPhone = () => {
        let isValid = true;
        resetPhoneError.value = '';

        if (!resetPhoneNumber.value) {
            resetPhoneError.value = 'الرجاء إدخال رقم الهاتف.';
            isValid = false;
        } else if (!resetPhoneNumber.value.startsWith('09') || resetPhoneNumber.value.length !== 10) {
            resetPhoneError.value = 'يجب أن يبدأ رقم الهاتف بـ 09 وأن يتكون من 10 أرقام.';
            isValid = false;
        }
        return isValid;
    };


    // --- Handlers ---
    const handleLogin = async () => {
      authStore.clearError();
      if (!validateLogin()) return;
      
      try {
        const result = await authStore.login({
          phone_number: PhoneNumber.value.trim(),
          password: password.value,
        });
        if (result.success) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Login component error:", error);
      }
    };

    const handleRequestReset = async () => {
      authStore.clearError();
      if (!validateResetPhone()) return;

      const result = await authStore.requestPasswordReset({ phone_number: resetPhoneNumber.value });
      if (result.success) {
        formMode.value = 'reset-verify';
        await nextTick();
        otpInputs.value[0]?.focus();
      }
    };

    const handleVerifyOtp = async () => {
      authStore.clearError();
      const otpCode = otp.value.join('');
      const result = await authStore.verifyPasswordResetOTP({ phone_number: resetPhoneNumber.value, otp_code: otpCode });
      if (result.success) {
        resetToken.value = result.reset_token;
        formMode.value = 'reset-set-password';
      }
    };

    const handleSetNewPassword = async () => {
        if (!isPasswordFormValid.value) return;
        authStore.clearError();
        const result = await authStore.setNewPassword({
            reset_token: resetToken.value,
            new_password: newPassword.value,
        });
        if (result.success) {
            successMessage.value = 'تم تغيير كلمة المرور بنجاح! سيتم توجيهك لتسجيل الدخول.';
            setTimeout(() => {
                switchToLoginMode();
            }, 3000);
        }
    };

    const handleOtpInput = (index, event) => {
        const value = event.target.value;
        if (value && !isNaN(value)) {
            if (index < otpInputs.value.length - 1) {
                otpInputs.value[index + 1].focus();
            }
        }
    };

    const handleOtpBackspace = (index, event) => {
        if (event.target.value === '' && index > 0) {
            otpInputs.value[index - 1].focus();
        }
    };

    // --- LIFECYCLE HOOKS ---
    onMounted(async () => {
      await authStore.initAuth();
      if (authStore.getIsAuthenticated) {
        router.push("/dashboard");
      }
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get("message");
      if (message === "account_deactivated") {
        alert("تم إلغاء تفعيل حسابك من قبل الإدارة");
      } else if (message === "account_not_found") {
        alert("الحساب غير موجود");
      }
    });
    
    onBeforeUnmount(() => {
        authStore.clearError();
    });

    return {
      authStore,
      formMode,
      PhoneNumber,
      password,
      showPassword,
      resetPhoneNumber,
      otp,
      otpInputs,
      newPassword,
      confirmPassword,
      successMessage,
      isOtpComplete,
      isPasswordFormValid,
      phoneError,
      passwordError,
      resetPhoneError,
      togglePassword,
      handleLogin,
      switchToResetMode,
      switchToLoginMode,
      handleRequestReset,
      handleVerifyOtp,
      handleSetNewPassword,
      handleOtpInput,
      handleOtpBackspace,
    };
  },
};
</script>

<style scoped>
/* General Styles */
.form-container {
  padding: 2rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.form-container img {
  display: block;
  margin: 0 auto;
}

.mb-3 label {
  display: block;
  text-align: right;
  margin-bottom: 5px;
  font-weight: 500;
}

/* Make sure invalid feedback is visible and aligned */
.invalid-feedback {
    text-align: right;
    display: block;
}


.alert {
  direction: rtl;
  text-align: right;
}

.text-muted {
  color: #6c757d !important;
  display: block;
  text-align: right;
  width: 100%;
  margin-top: .25rem;
}

.btn-dark {
  background-color: #343a40;
  border-color: #343a40;
  transition: all 0.3s ease;
}

.btn-dark:hover:not(:disabled) {
  background-color: #23272b;
  border-color: #1d2124;
}

.btn-dark:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
  opacity: 0.65;
}

.fa-spin {
  animation: fa-spin 2s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Login Form Specific */
.input-group {
  direction: ltr;
}

.input-group .form-control {
  direction: rtl;
  text-align: right;
}

/* Handle invalid state on input groups */
.input-group .form-control.is-invalid {
    border-right-width: 1px;
    border-color: #dc3545;
}
.input-group .form-control.is-invalid:focus {
    box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
}


.password-toggle {
  cursor: pointer;
}

.forgot-password-link {
    color: #000000;
    text-decoration: none;
    font-size: 1.0rem;
    font-weight: 500;
}

.forgot-password-link:hover {
    text-decoration: underline;
}

/* Password Reset Specific */
.otp-container {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.otp-input {
  width: 45px;
  height: 50px;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center !important;
  direction: ltr !important;
}

.back-to-login {
    color: #6c757d;
    text-decoration: none;
}

.back-to-login:hover {
    text-decoration: underline;
}

</style>
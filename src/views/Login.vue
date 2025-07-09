<template>
  <div
    class="text-center d-flex align-items-center justify-content-center bg-light"
    style="height: 100vh"
  >
    <div class="form-signin w-100 m-auto" style="max-width: 350px">
      <form @submit.prevent="handleLogin" id="loginForm">
        <img
          class="mb-4"
          width="72"
          alt="Logo"
          src="../assets/icons/e-commerce-logo.png"
        />
        <h1 id="psi" class="h3 mb-3 fw-normal">تسجيل الدخول</h1>

        <div
          v-if="authStore.getError"
          class="alert alert-danger mb-3"
          role="alert"
        >
          {{ authStore.getError }}
        </div>

        <div class="mb-3">
          <label for="floatingInput">رقم الهاتف</label>
          <input
            type="text"
            class="form-control"
            id="floatingInput"
            placeholder="أدخل رقم الهاتف"
            v-model="PhoneNumber"
            :disabled="authStore.getIsLoading"
            required
          />
           <small class="form-text text-muted" v-if="PhoneNumber && (!PhoneNumber.startsWith('09') || PhoneNumber.length !== 10)">
            يجب أن يبدأ رقم الهاتف بـ 09 وأن يتكون من 10 أرقام.
          </small>
        </div>

        <div class="mb-3">
          <label for="floatingPassword">كلمة المرور</label>
          <div class="input-group password-input-group">
            <span
              class="input-group-text password-toggle"
              @click="togglePassword"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </span>
            <input
              :type="showPassword ? 'text' : 'password'"
              class="form-control password-input"
              id="floatingPassword"
              placeholder="أدخل كلمة المرور"
              v-model="password"
              :disabled="authStore.getIsLoading"
              required
            />
          </div>
           <small class="form-text text-muted" v-if="password && password.length < 8">
            يجب أن لا تقل كلمة المرور عن 8 أحرف.
          </small>
        </div>

        <button
          class="btn btn-dark w-100 py-2 mt-3"
          type="submit"
          :disabled="authStore.getIsLoading || !isFormValid"
        >
          <span v-if="authStore.getIsLoading">
            <i class="fas fa-spinner fa-spin me-2"></i>
            جاري تسجيل الدخول...
          </span>
          <span v-else> تسجيل دخول </span>
        </button>

        <p class="mt-5 mb-3 text-muted text-center">© CCTT</p>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore"; // Adjust path as needed

export default {
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    // Form data
    const PhoneNumber = ref("");
    const password = ref("");
    const showPassword = ref(false);

    // Computed property to check form validity
    const isFormValid = computed(() => {
      const isPhoneValid =
        PhoneNumber.value.startsWith("09") && PhoneNumber.value.length === 10;
      const isPasswordValid = password.value.length >= 8;
      return isPhoneValid && isPasswordValid;
    });

    // Methods
    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };

    const handleLogin = async () => {
      if (!isFormValid.value) {
        return; // Prevent submission if form is invalid
      }
      // Clear any previous errors
      authStore.clearError();

      try {
        const credentials = {
          phone_number: PhoneNumber.value.trim(),
          password: password.value,
        };
        const result = await authStore.login(credentials);

        if (result.success) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Login component error:", error);
      }
    };

    // Check if user is already authenticated
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

    return {
      authStore,
      PhoneNumber,
      password,
      showPassword,
      isFormValid,
      togglePassword,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.mb-3 label {
  display: block;
  text-align: right;
  margin-bottom: 5px;
  font-weight: 500;
}

/* Style the input group for RTL */
.input-group {
  direction: ltr; /* Keep the group LTR so icons stay on the left */
}

.input-group .form-control {
  direction: rtl; /* But keep the input RTL for Arabic text */
  text-align: right;
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #ced4da;
  cursor: pointer;
  transition: all 0.3s ease;
}

.input-group-text:hover {
  background-color: #e9ecef;
}

.password-toggle {
  user-select: none;
}

.password-toggle i {
  color: #6c757d;
  transition: color 0.3s ease;
}

.password-toggle:hover i {
  color: #495057;
}

.form-control {
  border-radius: 0.375rem;
  border: 1px solid #ced4da;
  padding: 0.75rem;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control:disabled {
  background-color: #e9ecef;
  opacity: 1;
}

.password-input-group .form-control {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.password-input-group .input-group-text {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
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

.form-signin {
  padding: 2rem 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.form-signin img {
  display: block;
  margin: 0 auto;
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

/* Responsive adjustments */
@media (max-width: 576px) {
  .form-signin {
    padding: 1.5rem 1rem;
    margin: 1rem;
  }
  
  .form-signin img {
    width: 60px;
  }
  
  .h3 {
    font-size: 1.5rem;
  }
}

/* RTL specific styles */
[dir="rtl"] .input-group-text {
  border-radius: 0.375rem 0 0 0.375rem;
}

[dir="rtl"] .password-input-group .form-control {
  border-radius: 0 0.375rem 0.375rem 0;
}

/* Loading spinner animation */
.fa-spin {
  animation: fa-spin 2s infinite linear;
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
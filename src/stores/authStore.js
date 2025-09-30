import { defineStore } from 'pinia';
import api from '@/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('auth_user')) || null,
    isLoading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('auth_token'),
    statusCheckInterval: null,
    // This flag tracks if the initial auth check has been performed.
    isInitialized: false,
  }),

  getters: {
    getCurrentUser: (state) => state.user,
    getIsAuthenticated: (state) => state.isAuthenticated,
    isAdmin: (state) => state.user?.role === 'ADMIN',
    getIsLoading: (state) => state.isLoading,
    getError: (state) => state.error,
  },

  actions: {
    // =================================================================
    // CORE AUTHENTICATION ACTIONS
    // =================================================================

    async login(credentials) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/users/login/', credentials);
        const { token } = response.data;

        localStorage.setItem('auth_token', token);
        api.defaults.headers.common['Authorization'] = `Token ${token}`;

        await this.fetchUser();

        if (this.user && !this.user.is_active) {
          this.logout();
          this.error = 'الحساب غير مفعل، يرجى الاتصال بالإدارة';
          return { success: false, error: this.error };
        }

        return { success: true };

      } catch (err) {
        if (err.response?.status === 404) {
          this.error = 'نقطة النهاية المطلوبة غير موجودة (404). يرجى التحقق من صحة عنوان API.';
        } else {
          this.error = err.response?.data?.error || 'رقم الهاتف أو كلمة المرور غير صحيحة';
        }
        console.error('Login error:', err);
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUser() {
      try {
        const response = await api.get('/users/me/');
        const freshUser = response.data;

        if (!freshUser.is_active) {
          this.user = freshUser;
          return;
        }

        this.user = freshUser;
        this.isAuthenticated = true;
        localStorage.setItem('auth_user', JSON.stringify(freshUser));
        this.startStatusCheck();

      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 404) {
          this.error = "المستخدم غير موجود، ربما تم حذفه. سيتم تسجيل خروجك الآن.";
        }
        this.logout();
      }
    },

    // OPTIMIZED: Fast initial auth check with visible loading
    async initAuth() {
      const token = localStorage.getItem('auth_token');
      const cachedUser = localStorage.getItem('auth_user');

      // Ensure loading screen is visible for at least 200ms for better UX
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 200));

      try {
        if (token && cachedUser) {
          // FAST: Use cached data immediately
          this.user = JSON.parse(cachedUser);
          this.isAuthenticated = true;
          api.defaults.headers.common['Authorization'] = `Token ${token}`;

          // Wait for minimum loading time before marking as initialized
          await minLoadingTime;
          this.isInitialized = true;

          // SLOW: Verify in background (don't await this)
          this.verifyTokenInBackground();

        } else {
          // No token or cached user - user is not authenticated
          this.user = null;
          this.isAuthenticated = false;
          await minLoadingTime;
          this.isInitialized = true;
        }
      } catch (error) {
        console.error('Error parsing cached user data:', error);
        this.logout();
        await minLoadingTime;
        this.isInitialized = true;
      }
    },

    // Background verification without blocking the UI
    async verifyTokenInBackground() {
      try {
        const response = await api.get('/users/me/');
        const freshUser = response.data;

        if (!freshUser.is_active) {
          // User became inactive - logout and redirect
          this.logout();
          window.location.href = '/login?message=account_deactivated';
          return;
        }

        // Update user data if it changed
        const currentUserString = JSON.stringify(this.user);
        const freshUserString = JSON.stringify(freshUser);

        if (currentUserString !== freshUserString) {
          this.user = freshUser;
          localStorage.setItem('auth_user', JSON.stringify(freshUser));
        }

        this.startStatusCheck();

      } catch (error) {
        console.error('Background token verification failed:', error);
        // Token is invalid - logout
        this.logout();
        window.location.href = '/login?message=session_expired';
      }
    },

    async logout() {
      try {
        await api.post('/users/logout/');
      } catch (error) {
        console.error('Logout error:', error);
        // A 404 on logout is not critical, as the client-side state is cleared anyway.
      } finally {
        this.user = null;
        this.isAuthenticated = false;
        this.error = null;
        this.stopStatusCheck();
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        delete api.defaults.headers.common['Authorization'];
      }
    },

    // =================================================================
    // PASSWORD RESET ACTIONS
    // =================================================================
    async requestPasswordReset(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        await api.post('/users/password-reset/request/', payload);
        return { success: true };
      } catch (err) {
        if (err.response?.status === 404) {
          this.error = 'رقم الهاتف غير مسجل في النظام.';
        } else {
          this.error = err.response?.data?.error || 'فشل إرسال طلب إعادة التعيين. تأكد من رقم الهاتف.';
        }
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async verifyPasswordResetOTP(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/users/password-reset/verify/', payload);
        const reset_token = response.data?.reset_token;
        if (!reset_token) {
          throw new Error("Reset token not found in API response.");
        }
        return { success: true, reset_token };
      } catch (err) {
        this.error = err.response?.data?.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async setNewPassword(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        await api.post('/users/password-reset/set-new/', payload);
        return { success: true };
      } catch (err) {
        this.error = err.response?.data?.error || 'فشل تعيين كلمة المرور الجديدة. قد يكون الرمز غير صالح.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    // =================================================================
    // USER PROFILE & SETTINGS ACTIONS (/users/me/)
    // =================================================================

    async updateProfile(profileData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.patch('/users/me/', profileData);
        await this.fetchUser(); // Refresh local user data
        return { success: true, data: response.data };
      } catch (err) {
        if (err.response?.status === 404) {
          this.error = 'المستخدم الحالي غير موجود. قد يتم تسجيل خروجك.';
        } else {
          this.error = err.response?.data?.error || 'حدث خطأ أثناء تحديث الملف الشخصي';
        }
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async changePassword(passwordData) {
      this.isLoading = true;
      this.error = null;
      try {
        await api.post('/users/me/change-password/', passwordData);
        return { success: true };
      } catch (err) {
        this.error = err.response?.data?.error || 'حدث خطأ أثناء تغيير كلمة المرور.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async requestPhoneChange(phoneData) {
      this.isLoading = true;
      this.error = null;
      try {
        await api.post('/users/me/request-phone-change/', phoneData);
        console.log(phoneData)
        return { success: true };
      } catch (err) {
        this.error = err.response?.data?.error || 'حدث خطأ أثناء طلب تغيير الرقم.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async confirmPhoneChange(otp, newPhoneNumber) {
      this.isLoading = true;
      this.error = null;
      try {
        const payload = {
          otp_code: otp,
          new_phone_number: newPhoneNumber
        };
        console.log(payload)
        await api.post('/users/me/confirm-phone-change/', payload);
        await this.fetchUser(); // Refresh user data to get new phone number
        return { success: true };
      } catch (err) {
        this.error = err.response?.data?.error || 'رمز التحقق غير صحيح أو حدث خطأ ما.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    // =================================================================
    // ADMIN-ONLY STAFF MANAGEMENT ACTIONS (/users/staff/)
    // =================================================================

    async getAllUsers(params = {}) {
      if (!this.isAdmin) throw new Error('Unauthorized: Admin access required');

      const { page = 1, search = '' } = params;

      let endpoint = '/users/staff/';
      const queryParams = [];

      if (page) {
        queryParams.push(`page=${page}`);
      }

      if (search && search.trim() !== '') {
        queryParams.push(`search=${encodeURIComponent(search.trim())}`);
      }

      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }

      const response = await api.get(endpoint);
      return response.data;
    },

    async addEmployee(userData) {
      if (!this.isAdmin) throw new Error('Unauthorized: Admin access required');
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/users/staff/', userData);
        return { success: true, user: response.data };
      } catch (err) {
        if (err.response?.status === 400) {
          this.error = 'رقم الهاتف او البريد المدخل مسجل مسبقا في النظام';
        } else {
          this.error = err.response?.data?.error || 'حدث خطأ أثناء إضافة الموظف';
        }
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async updateUserById(id, userData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.patch(`/users/staff/${id}/`, userData);
        return { success: true, data: response.data };
      } catch (err) {
        if (err.response?.status === 404) {
          this.error = 'الموظف المطلوب تحديثه غير موجود.';
        } else {
          this.error = err.response?.data?.error || 'حدث خطأ أثناء تحديث بيانات الموظف';
        }
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async toggleUserStatus(userId, isActive) {
      if (!this.isAdmin) throw new Error('Unauthorized: Admin access required');
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.patch(`/users/staff/${userId}/`, { is_active: isActive });
        return { success: true, data: response.data };
      } catch (err) {
        if (err.response?.status === 404) {
          this.error = 'الموظف المطلوب غير موجود.';
        } else {
          this.error = err.response?.data?.error || `حدث خطأ أثناء ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} الموظف`;
        }
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async deleteUser(id) {
      if (!this.isAdmin) throw new Error('Unauthorized: Admin access required');
      try {
        await api.delete(`/users/staff/${id}/`);
        return { success: true };
      } catch (err) {
        if (err.response?.status === 404) {
          // This can be treated as a success if the goal is to ensure the user is gone.
          console.warn(`User with ID ${id} not found for deletion. Already deleted.`);
          return { success: true }; // Or return a specific error if needed
        }
        this.error = 'حدث خطأ أثناء حذف الموظف.';
        return { success: false, error: this.error };
      }
    },

    // =================================================================
    // HELPER ACTIONS
    // =================================================================

    startStatusCheck() {
      if (this.statusCheckInterval) {
        this.stopStatusCheck();
      }
      this.statusCheckInterval = setInterval(() => {
        if (this.isAuthenticated) {
          this.checkUserStatus();
        }
      }, 60000);
    },

    stopStatusCheck() {
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval);
        this.statusCheckInterval = null;
      }
    },

    async checkUserStatus() {
      if (!this.user || !this.isAuthenticated) return;
      try {
        const response = await api.get('/users/me/');
        if (!response.data.is_active) {
          console.log('User status changed to inactive, logging out...');
          this.logout();
          window.location.href = '/login?message=account_deactivated';
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        if (error.response?.status === 404) {
          console.log('User not found during status check, logging out...');
          this.logout();
          window.location.href = '/login?message=user_not_found';
        }
      }
    },

    clearError() {
      this.error = null;
    }
  },
});
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
        this.error = err.response?.data?.detail || 'رقم الهاتف أو كلمة المرور غير صحيحة';
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
            this.logout();
        }
    },

    async initAuth() {
      const token = localStorage.getItem('auth_token');
      try {
        if (token) {
          api.defaults.headers.common['Authorization'] = `Token ${token}`;
          await this.fetchUser();
          
          if (this.user && !this.user.is_active) {
            this.logout();
            window.location.href = '/login?message=account_deactivated';
          }
        }
      } catch (error) {
        this.logout();
      } finally {
        this.isInitialized = true;
      }
    },

    async logout() {
      try {
        await api.post('/users/logout/');
      } catch (error) {
        console.error('Logout error:', error);
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
        this.error = err.response?.data?.detail || 'حدث خطأ أثناء تحديث الملف الشخصي.';
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
        this.error = err.response?.data?.detail || 'حدث خطأ أثناء تغيير كلمة المرور.';
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
        this.error = err.response?.data?.detail || 'حدث خطأ أثناء طلب تغيير الرقم.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

   async confirmPhoneChange(otp ,newPhoneNumber) {
      this.isLoading = true;
      this.error = null;
      try {
        // Construct the payload object required by the API
        const payload = {
          otp_code: otp,
          new_phone_number: newPhoneNumber
        };
        console.log(payload)
        await api.post('/users/me/confirm-phone-change/', payload);
        await this.fetchUser(); // Refresh user data to get new phone number
        return { success: true };
      } catch (err) {
        this.error = err.response?.data?.detail || 'رمز التحقق غير صحيح أو حدث خطأ ما.';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    // =================================================================
    // ADMIN-ONLY STAFF MANAGEMENT ACTIONS (/users/staff/)
    // =================================================================
    
    async getAllUsers() {
      if (!this.isAdmin) throw new Error('Unauthorized: Admin access required');
      const response = await api.get('/users/staff/');
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
        this.error = err.response?.data?.detail || 'حدث خطأ أثناء إضافة الموظف';
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
        this.error = err.response?.data?.detail || 'حدث خطأ أثناء تحديث بيانات الموظف';
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
        this.error = err.response?.data?.detail || `حدث خطأ أثناء ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} الموظف`;
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },
    
    async deleteUser(id) {
        if (!this.isAdmin) throw new Error('Unauthorized: Admin access required');
        await api.delete(`/users/staff/${id}/`);
        return { success: true };
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
            this.logout();
        }
      }
    },
    
    clearError() {
      this.error = null;
    }
  },
});

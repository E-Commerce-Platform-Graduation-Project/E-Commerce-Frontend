import { defineStore } from 'pinia'
import axios from 'axios'
import { useRouter } from 'vue-router'

// Configure axios base URL for json-server
const API_BASE_URL = 'http://localhost:3000/' // Change this to your json-server URL
const api = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear auth data
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
      window.location.href = '/login' // Redirect to login
    }
    return Promise.reject(error)
  }
)

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    statusCheckInterval: null // Add interval reference
  }),

  getters: {
    // Get current user info
    getCurrentUser: (state) => state.user,

    // Check if user is authenticated
    getIsAuthenticated: (state) => state.isAuthenticated,

    // Check if user is admin
    isAdmin: (state) => state.user?.Role === 'admin',

    // Get user role
    getUserRole: (state) => state.user?.Role || 'guest',

    // Get loading state
    getIsLoading: (state) => state.isLoading,

    // Get error message
    getError: (state) => state.error
  },

  actions: {
    // Start checking user status periodically
    startStatusCheck() {
      // Clear existing interval if any
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval)
      }

      // Check user status every 30 seconds
      this.statusCheckInterval = setInterval(async () => {
        await this.checkUserStatus()
      }, 30000) // 30 seconds
    },

    // Stop checking user status
    stopStatusCheck() {
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval)
        this.statusCheckInterval = null
      }
    },

    // Check current user status
    async checkUserStatus() {
      if (!this.user || !this.isAuthenticated) {
        return
      }

      try {
        const response = await api.get(`/users/${this.user.id}`)
        const userData = response.data

        // Check if user is no longer active
        if (!userData.IsActive) {
          console.log('User status changed to inactive, logging out...')
          this.logout()
          // Redirect to login with a message
          window.location.href = '/login?message=account_deactivated'
        }
      } catch (error) {
        console.error('Error checking user status:', error)
        // If user doesn't exist anymore, logout
        if (error.response?.status === 404) {
          this.logout()
          window.location.href = '/login?message=account_not_found'
        }
      }
    },

    // Login action with json-server
    async login(username, password) {
      this.isLoading = true
      this.error = null

      try {
        // Fetch all users from json-server
        const response = await api.get('/users')
        const users = response.data

        // Find user with matching credentials (now using UserName instead of PhoneNumber)
        const user = users.find(u =>
          u.UserName === username && u.Password === password
        )

        if (user) {
          // Check if user is active
          if (!user.IsActive) {
            this.error = 'الحساب غير مفعل، يرجى الاتصال بالإدارة'
            return {
              success: false,
              error: this.error
            }
          }

          // Update LastLogin
          await api.patch(`/users/${user.id}`, {
            LastLogin: new Date().toISOString()
          })

          // Remove password from user object for security
          const { Password: _, ...userWithoutPassword } = {
            ...user,
            LastLogin: new Date().toISOString()
          }

          this.user = userWithoutPassword
          this.isAuthenticated = true

          // Generate a simple token (in production, this should come from your backend)
          const token = `token_${user.id}_${Date.now()}`

          // Store in localStorage
          localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword))
          localStorage.setItem('auth_token', token)

          // Start checking user status periodically
          this.startStatusCheck()

          return {
            success: true,
            user: userWithoutPassword
          }
        } else {
          this.error = 'اسم المستخدم أو كلمة المرور غير صحيحة'
          return {
            success: false,
            error: this.error
          }
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء تسجيل الدخول'
        console.error('Login error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Register new user (for user self-registration)
    async register(userData) {
      this.isLoading = true
      this.error = null

      try {
        // Check if user already exists
        const existingUsers = await api.get('/users')
        const usernameExists = existingUsers.data.find(u =>
          u.UserName === userData.UserName
        )
        const phoneExists = existingUsers.data.find(u =>
          u.PhoneNumber === userData.PhoneNumber
        )
        const emailExists = existingUsers.data.find(u =>
          u.Email === userData.Email
        )

        if (usernameExists) {
          this.error = 'اسم المستخدم مستخدم بالفعل'
          return {
            success: false,
            error: this.error
          }
        }

        if (phoneExists) {
          this.error = 'رقم الهاتف مستخدم بالفعل'
          return {
            success: false,
            error: this.error
          }
        }

        if (emailExists) {
          this.error = 'البريد الالكتروني موجود بالفعل'
          return {
            success: false,
            error: this.error
          }
        }

        // Create new user
        const newUser = {
          ...userData,
          Role: userData.Role || 'employee',
          IsActive: userData.IsActive !== undefined ? userData.IsActive : true,
          LastLogin: null
        }

        const response = await api.post('/users', newUser)
        const createdUser = response.data

        // Remove password from response
        const { Password: _, ...userWithoutPassword } = createdUser

        this.user = userWithoutPassword
        this.isAuthenticated = true

        // Generate token
        const token = `token_${createdUser.id}_${Date.now()}`

        // Store in localStorage
        localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword))
        localStorage.setItem('auth_token', token)

        // Start checking user status periodically
        this.startStatusCheck()

        return {
          success: true,
          user: userWithoutPassword
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء إنشاء الحساب'
        console.error('Register error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Add employee (admin only - does not affect current user session)
    async addEmployee(userData) {
      if (!this.isAdmin) {
        return {
          success: false,
          error: 'غير مسموح: يتطلب صلاحيات الإدارة'
        }
      }

      this.isLoading = true
      this.error = null

      try {
        // Check if user already exists
        const existingUsers = await api.get('/users')
        const usernameExists = existingUsers.data.find(u =>
          u.UserName === userData.UserName
        )
        const phoneExists = existingUsers.data.find(u =>
          u.PhoneNumber === userData.PhoneNumber
        )
        const emailExists = existingUsers.data.find(u =>
          u.Email === userData.Email
        )

        if (usernameExists) {
          this.error = 'اسم المستخدم مستخدم بالفعل'
          return {
            success: false,
            error: this.error
          }
        }

        if (phoneExists) {
          this.error = 'رقم الهاتف مستخدم بالفعل'
          return {
            success: false,
            error: this.error
          }
        }

        if (emailExists) {
          this.error = 'البريد الالكتروني موجود بالفعل'
          return {
            success: false,
            error: this.error
          }
        }

        // Create new user
        const newUser = {
          ...userData,
          Role: userData.Role || 'employee',
          IsActive: userData.IsActive !== undefined ? userData.IsActive : true,
          LastLogin: null
        }

        const response = await api.post('/users', newUser)
        const createdUser = response.data

        // Remove password from response
        const { Password: _, ...userWithoutPassword } = createdUser

        // DO NOT set this user as current user - this is the key difference
        return {
          success: true,
          user: userWithoutPassword
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء إضافة الموظف'
        console.error('Add employee error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Get user by ID
    async getUserById(id) {
      try {
        const response = await api.get(`/users/${id}`)
        const { Password: _, ...userWithoutPassword } = response.data
        return userWithoutPassword
      } catch (error) {
        console.error('Get user error:', error)
        throw error
      }
    },

    // Update user profile
    async updateProfile(userData) {
      if (!this.user) {
        throw new Error('No authenticated user')
      }

      this.isLoading = true
      this.error = null

      try {
        const updatedData = {
          ...userData
        }

        const response = await api.patch(`/users/${this.user.id}`, updatedData)
        const { Password: _, ...userWithoutPassword } = response.data

        this.user = userWithoutPassword
        localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword))

        // Check if user deactivated themselves
        if (userData.IsActive === false) {
          setTimeout(() => {
            this.logout()
            window.location.href = '/login?message=account_deactivated'
          }, 1000) // Give 1 second delay for user to see the update
        }

        return {
          success: true,
          user: userWithoutPassword
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء تحديث الملف الشخصي'
        console.error('Update profile error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    async updateUserById(id, userData) {
      this.isLoading = true
      this.error = null

      try {
        const updatedData = {
          ...userData
        }

        const response = await api.patch(`/users/${id}`, updatedData)
        const { Password: _, ...userWithoutPassword } = response.data

        // Check if the updated user is the current user and was deactivated
        if (this.user && this.user.id === id && userData.IsActive === false) {
          setTimeout(() => {
            this.logout()
            window.location.href = '/login?message=account_deactivated'
          }, 1000)
        }

        return {
          success: true,
          data: userWithoutPassword
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء تحديث بيانات الموظف'
        console.error('Update employee error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Change password
    async changePassword(currentPassword, newPassword) {
      if (!this.user) {
        throw new Error('No authenticated user')
      }

      this.isLoading = true
      this.error = null

      try {
        // First verify current password
        const response = await api.get(`/users/${this.user.id}`)
        const user = response.data

        if (user.Password !== currentPassword) {
          this.error = 'كلمة المرور الحالية غير صحيحة'
          return {
            success: false,
            error: this.error
          }
        }

        // Update password
        await api.patch(`/users/${this.user.id}`, {
          Password: newPassword
        })

        return { success: true }
      } catch (error) {
        this.error = 'حدث خطأ أثناء تغيير كلمة المرور'
        console.error('Change password error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Logout action
    logout() {
      this.user = null
      this.isAuthenticated = false
      this.error = null

      // Stop status checking
      this.stopStatusCheck()

      // Clear localStorage
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
    },

    // Initialize auth from localStorage
    async initAuth() {
      const storedUser = localStorage.getItem('auth_user')
      const storedToken = localStorage.getItem('auth_token')

      if (storedUser && storedToken) {
        try {
          const user = JSON.parse(storedUser)

          // Verify user still exists in database
          const response = await api.get(`/users/${user.id}`)
          if (response.data) {
            const { Password: _, ...userWithoutPassword } = response.data
            
            // Check if user is still active
            if (!userWithoutPassword.IsActive) {
              this.clearStoredAuth()
              window.location.href = '/login?message=account_deactivated'
              return
            }

            this.user = userWithoutPassword
            this.isAuthenticated = true
            
            // Start checking user status periodically
            this.startStatusCheck()
          } else {
            this.clearStoredAuth()
          }
        } catch (error) {
          console.error('Error initializing auth:', error)
          this.clearStoredAuth()
        }
      }
    },

    // Clear stored authentication data
    clearStoredAuth() {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
      this.user = null
      this.isAuthenticated = false
      this.stopStatusCheck()
    },

    // Clear error
    clearError() {
      this.error = null
    },

    // Check if user has specific role
    hasRole(role) {
      return this.user?.Role === role
    },

    // Check if user has any of the specified roles
    hasAnyRole(roles) {
      return roles.includes(this.user?.Role)
    },

    // Get all users (admin only)
    async getAllUsers() {
      if (!this.isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      try {
        const response = await api.get('/users')
        // Remove passwords from all users
        return response.data.map(({ Password: _, ...user }) => user)
      } catch (error) {
        console.error('Get all users error:', error)
        throw error
      }
    },

    // Delete user (admin only)
    async deleteUser(id) {
      if (!this.isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      try {
        await api.delete(`/users/${id}`)
        return { success: true }
      } catch (error) {
        console.error('Delete user error:', error)
        throw error
      }
    },

    // Toggle user active status (admin only)
    async toggleUserStatus(id, isActive) {
      if (!this.isAdmin) {
        throw new Error('Unauthorized: Admin access required')
      }

      try {
        await api.patch(`/users/${id}`, {
          IsActive: isActive
        })

        // Check if the deactivated user is currently logged in
        if (!isActive && this.user && this.user.id === id) {
          setTimeout(() => {
            this.logout()
            window.location.href = '/login?message=account_deactivated'
          }, 1000)
        }

        return { success: true }
      } catch (error) {
        console.error('Toggle user status error:', error)
        throw error
      }
    },

    // Get active users only
    async getActiveUsers() {
      try {
        const response = await api.get('/users')
        // Filter active users and remove passwords
        return response.data
          .filter(user => user.IsActive)
          .map(({ Password: _, ...user }) => user)
      } catch (error) {
        console.error('Get active users error:', error)
        throw error
      }
    },

    // Get users by role
    async getUsersByRole(role) {
      try {
        const response = await api.get('/users')
        // Filter by role and remove passwords
        return response.data
          .filter(user => user.Role === role)
          .map(({ Password: _, ...user }) => user)
      } catch (error) {
        console.error('Get users by role error:', error)
        throw error
      }
    }
  }
})
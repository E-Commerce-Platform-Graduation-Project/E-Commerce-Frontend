import { defineStore } from 'pinia'
import axios from 'axios'

// Configure axios base URL for json-server
const API_BASE_URL = 'http://localhost:3001/' // Change this to your json-server URL
const api = axios.create({
  baseURL: API_BASE_URL,
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

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    isLoading: false,
    error: null
  }),

  getters: {
    // Get all categories
    getAllCategories: (state) => state.categories,

    // Get main categories (no parent)
    getMainCategories: (state) => 
      state.categories.filter(category => !category.ParentCategoryID),

    // Get subcategories by parent ID
    getSubcategoriesByParent: (state) => (parentId) =>
      state.categories.filter(category => category.ParentCategoryID === parentId),

    // Get category by ID
    getCategoryById: (state) => (id) =>
      state.categories.find(category => category.id === id),

    // Get category hierarchy (with children)
    getCategoryHierarchy: (state) => {
      const mainCategories = state.categories.filter(cat => !cat.ParentCategoryID)
      return mainCategories.map(mainCat => ({
        ...mainCat,
        children: state.categories.filter(cat => cat.ParentCategoryID === mainCat.id)
      }))
    },

    // Get category path (breadcrumb)
    getCategoryPath: (state) => (categoryId) => {
      const path = []
      let currentCategory = state.categories.find(cat => cat.id === categoryId)
      
      while (currentCategory) {
        path.unshift(currentCategory)
        if (currentCategory.ParentCategoryID) {
          currentCategory = state.categories.find(cat => cat.id === currentCategory.ParentCategoryID)
        } else {
          currentCategory = null
        }
      }
      
      return path
    },

    // Get loading state
    getIsLoading: (state) => state.isLoading,

    // Get error message
    getError: (state) => state.error
  },

  actions: {
    // Fetch all categories
    async fetchCategories() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/categories')
        this.categories = response.data
        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء جلب الفئات'
        console.error('Fetch categories error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Get category by ID
    async fetchCategoryById(id) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get(`/categories/${id}`)
        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء جلب الفئة'
        console.error('Fetch category error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Create new category
    async createCategory(categoryData) {
      this.isLoading = true
      this.error = null

      try {
        // Check if category name already exists
        const existingCategories = await api.get('/categories')
        const nameExists = existingCategories.data.find(cat =>
          cat.Name.toLowerCase() === categoryData.Name.toLowerCase()
        )

        if (nameExists) {
          this.error = 'اسم الفئة موجود بالفعل'
          return {
            success: false,
            error: this.error
          }
        }

        // Generate unique ID
        const newId = Math.random().toString(36).substr(2, 4)

        // Create new category
        const newCategory = {
          id: newId,
          Name: categoryData.Name,
          Description: categoryData.Description || '',
          ParentCategoryID: categoryData.ParentCategoryID || null,
          CreatedDate: new Date().toISOString()
        }

        const response = await api.post('/categories', newCategory)
        
        // Add to local state
        this.categories.push(response.data)

        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء إنشاء الفئة'
        console.error('Create category error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Update category
    async updateCategory(id, categoryData) {
      this.isLoading = true
      this.error = null

      try {
        // Check if name already exists (excluding current category)
        const existingCategories = await api.get('/categories')
        const nameExists = existingCategories.data.find(cat =>
          cat.Name.toLowerCase() === categoryData.Name.toLowerCase() && cat.id !== id
        )

        if (nameExists) {
          this.error = 'اسم الفئة موجود بالفعل'
          return {
            success: false,
            error: this.error
          }
        }

        const updatedData = {
          Name: categoryData.Name,
          Description: categoryData.Description,
          ParentCategoryID: categoryData.ParentCategoryID
        }

        const response = await api.patch(`/categories/${id}`, updatedData)
        
        // Update local state
        const index = this.categories.findIndex(cat => cat.id === id)
        if (index !== -1) {
          this.categories[index] = response.data
        }

        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء تحديث الفئة'
        console.error('Update category error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Delete category
    async deleteCategory(id) {
      this.isLoading = true
      this.error = null

      try {
        // Check if category has subcategories
        const hasSubcategories = this.categories.some(cat => cat.ParentCategoryID === id)
        
        if (hasSubcategories) {
          this.error = 'لا يمكن حذف الفئة التي تحتوي على فئات فرعية'
          return {
            success: false,
            error: this.error
          }
        }

        await api.delete(`/categories/${id}`)
        
        // Remove from local state
        this.categories = this.categories.filter(cat => cat.id !== id)

        return {
          success: true
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء حذف الفئة'
        console.error('Delete category error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Search categories by name
    searchCategories(searchTerm) {
      if (!searchTerm) return this.categories
      
      const term = searchTerm.toLowerCase()
      return this.categories.filter(category =>
        category.Name.toLowerCase().includes(term)
      )
    },

    // Get categories statistics
    getCategoriesStats() {
      const totalCategories = this.categories.length
      const mainCategories = this.categories.filter(cat => !cat.ParentCategoryID).length
      const subcategories = totalCategories - mainCategories

      return {
        totalCategories,
        mainCategories,
        subcategories
      }
    },

    // Validate category hierarchy (prevent circular references)
    validateCategoryHierarchy(categoryId, parentId) {
      if (!parentId) return true
      
      // Can't be parent of itself
      if (categoryId === parentId) return false
      
      // Check if parent is a descendant of current category
      const isDescendant = (currentId, targetId) => {
        const children = this.categories.filter(cat => cat.ParentCategoryID === currentId)
        for (const child of children) {
          if (child.id === targetId) return true
          if (isDescendant(child.id, targetId)) return true
        }
        return false
      }
      
      return !isDescendant(categoryId, parentId)
    },

    // Clear error
    clearError() {
      this.error = null
    },

    // Clear categories
    clearCategories() {
      this.categories = []
    }
  }
})
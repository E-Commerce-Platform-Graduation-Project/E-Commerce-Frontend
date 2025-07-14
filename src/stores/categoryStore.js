import { defineStore } from 'pinia'
import api from '@/api' // Import the new centralized API client

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
      state.categories.filter(category => !category.parentCategoryID),

    // Get subcategories by parent ID
    getSubcategoriesByParent: (state) => (parentId) =>
      state.categories.filter(category => category.parentCategoryID === parentId),

    // Get category by ID
    getCategoryById: (state) => (id) =>
      state.categories.find(category => category.id === id),

    // Get category hierarchy (with children)
    getCategoryHierarchy: (state) => {
      const mainCategories = state.categories.filter(cat => !cat.parentCategoryID)
      return mainCategories.map(mainCat => ({
        ...mainCat,
        children: state.categories.filter(cat => cat.parentCategoryID === mainCat.id)
      }))
    },

    // Get category path (breadcrumb)
    getCategoryPath: (state) => (categoryId) => {
      const path = []
      let currentCategory = state.categories.find(cat => cat.id === categoryId)
      
      while (currentCategory) {
        path.unshift(currentCategory)
        if (currentCategory.parentCategoryID) {
          currentCategory = state.categories.find(cat => cat.id === currentCategory.parentCategoryID)
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
    // Fetch all categories from the backend
    async fetchCategories() {
      this.isLoading = true
      this.error = null

      try {
        // Use the new API endpoint
        const response = await api.get('/products/categories/')
        this.categories = response.data
        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        this.error = error.response?.data?.detail || 'حدث خطأ أثناء جلب الفئات'
        console.error('Fetch categories error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Get a single category by ID from the backend
    async fetchCategoryById(id) {
      this.isLoading = true
      this.error = null

      try {
        // Use the new API endpoint
        const response = await api.get(`/products/categories/${id}/`)
        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        this.error = error.response?.data?.detail || 'حدث خطأ أثناء جلب الفئة'
        console.error('Fetch category error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Create a new category using the backend
    async createCategory(categoryData) {
      this.isLoading = true
      this.error = null

      try {
        // The backend will handle name validation and ID generation.
        const response = await api.post('/products/categories/', categoryData)
        
        // Add the new category returned by the API to the local state
        this.categories.push(response.data)

        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        this.error = error.response?.data?.name?.[0] || 'حدث خطأ أثناء إنشاء الفئة'
        console.error('Create category error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Update an existing category
    async updateCategory(id, categoryData) {
      this.isLoading = true
      this.error = null

      try {
        // The backend handles name validation.
        // Using PATCH to send only updated fields.
        const response = await api.patch(`/products/categories/${id}/`, categoryData)
        
        // Update local state with the returned data
        const index = this.categories.findIndex(cat => cat.id === id)
        if (index !== -1) {
          this.categories[index] = response.data
        }

        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        this.error = error.response?.data?.name?.[0] || 'حدث خطأ أثناء تحديث الفئة'
        console.error('Update category error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Delete a category
    async deleteCategory(id) {
      this.isLoading = true
      this.error = null

      try {
        // Optional: Client-side check to prevent deleting a category with children
        const hasSubcategories = this.categories.some(cat => cat.parentCategoryID === id)
        if (hasSubcategories) {
          this.error = 'لا يمكن حذف الفئة التي تحتوي على فئات فرعية'
          return {
            success: false,
            error: this.error
          }
        }

        // Use the new API endpoint for deletion
        await api.delete(`/products/categories/${id}/`)
        
        // Remove from local state on successful deletion
        this.categories = this.categories.filter(cat => cat.id !== id)

        return {
          success: true
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'حدث خطأ أثناء حذف الفئة'
        console.error('Delete category error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Search categories by name (client-side)
    searchCategories(searchTerm) {
      if (!searchTerm) return this.categories
      
      const term = searchTerm.toLowerCase()
      return this.categories.filter(category =>
        category.name.toLowerCase().includes(term)
      )
    },

    // Get categories statistics (client-side)
    getCategoriesStats() {
      const totalCategories = this.categories.length
      const mainCategories = this.categories.filter(cat => !cat.parentCategoryID).length
      const subcategories = totalCategories - mainCategories

      return {
        totalCategories,
        mainCategories,
        subcategories
      }
    },

    // Validate category hierarchy (client-side)
    validateCategoryHierarchy(categoryId, parentId) {
      if (!parentId) return true
      
      if (categoryId === parentId) return false
      
      const isDescendant = (currentId, targetId) => {
        const children = this.categories.filter(cat => cat.parentCategoryID === currentId)
        for (const child of children) {
          if (child.id === targetId) return true
          if (isDescendant(child.id, targetId)) return true
        }
        return false
      }
      
      return !isDescendant(categoryId, parentId)
    },

    // Clear error message from state
    clearError() {
      this.error = null
    },

    // Clear all categories from state
    clearCategories() {
      this.categories = []
    }
  }
})
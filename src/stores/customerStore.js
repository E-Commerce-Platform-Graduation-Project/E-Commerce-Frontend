import { defineStore } from 'pinia'
import api from '@/api'

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    nextPage: null,
    previousPage: null,
  }),

  getters: {
    getAllCustomers: (state) => state.customers,
    
    getActiveCustomers: (state) => state.customers.filter(customer => customer.is_active === true),
    
    getDisabledCustomers: (state) => state.customers.filter(customer => customer.is_active === false),
    
    getCustomerById: (state) => (id) => state.customers.find(customer => customer.id === id),
    
    getIsLoading: (state) => state.isLoading,
    
    getError: (state) => state.error,
    
    getCustomersCount: (state) => state.totalCount,
    
    getActiveCustomersCount: (state) => state.customers.filter(customer => customer.is_active === true).length,
    
    getDisabledCustomersCount: (state) => state.customers.filter(customer => customer.is_active === false).length,
  },

  actions: {
    /**
     * Fetch customers from the API with pagination support
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {string} params.search - Search query
     */
    async fetchCustomers({ page = 1, search = '' } = {}) {
      this.isLoading = true
      this.error = null

      const params = new URLSearchParams()
      if (page) params.append('page', page)
      if (search && search.trim() !== '') params.append('search', search.trim())

      const endpoint = `/users/customers/?${params.toString()}`

      try {
        const response = await api.get(endpoint)
        
        // Extract paginated data
        this.customers = response.data.results || []
        this.totalCount = response.data.count || 0
        this.nextPage = response.data.next
        this.previousPage = response.data.previous
        
        return {
          success: true,
          data: this.customers,
          count: this.totalCount
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء تحميل بيانات العملاء'
        this.customers = []
        this.totalCount = 0
        console.error('Fetch customers error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    async toggleCustomerStatus(customerId, newStatus) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.patch(`/users/customers/${customerId}/`, {
          is_active: newStatus
        })

        const customerIndex = this.customers.findIndex(c => c.id === customerId)
        if (customerIndex !== -1) {
          this.customers[customerIndex] = response.data
        }

        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء تحديث حالة العميل'
        console.error('Toggle customer status error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.error = null
    },
  }
})
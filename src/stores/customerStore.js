import { defineStore } from 'pinia'
import api from '@/api' // Import the centralized api

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    // Get all customers (this list is now the result of the last API fetch/search)
    getAllCustomers: (state) => state.customers,

    // Get active customers only
    getActiveCustomers: (state) => state.customers.filter(customer => customer.is_active === true),

    // Get disabled customers only
    getDisabledCustomers: (state) => state.customers.filter(customer => customer.is_active === false),

    // Get customer by ID
    getCustomerById: (state) => (id) => state.customers.find(customer => customer.id === id),

    // Get loading state
    getIsLoading: (state) => state.isLoading,

    // Get error message
    getError: (state) => state.error,
    
    // Get customers count
    getCustomersCount: (state) => state.customers.length,

    // Get active customers count
    getActiveCustomersCount: (state) => state.customers.filter(customer => customer.is_active === true).length,

    // Get disabled customers count
    getDisabledCustomersCount: (state) => state.customers.filter(customer => customer.is_active === false).length,
  },

  actions: {
    /**
     * Fetch customers from the API.
     * Can be used for both fetching all customers and searching.
     * @param {string} searchQuery - The search term to filter customers by on the backend.
     */
    async fetchCustomers(searchQuery = '') {
      this.isLoading = true
      this.error = null

      // Use the search API endpoint if a query is provided
      let endpoint = '/users/customers/';
      if (searchQuery && searchQuery.trim() !== '') {
        endpoint += `?search=${encodeURIComponent(searchQuery.trim())}`;
      }

      try {
        const response = await api.get(endpoint)
        this.customers = response.data
        
        return {
          success: true,
          data: this.customers,
          count: this.customers.length
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء تحميل بيانات العملاء'
        this.customers = [] // Clear data on error
        console.error('Fetch customers error:', error)
        return {
          success: false,
          error: this.error
        }
      } finally {
        this.isLoading = false
      }
    },

    // Toggle customer active status
    async toggleCustomerStatus(customerId, newStatus) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.patch(`/users/customers/${customerId}/`, {
          is_active: newStatus
        })

        // Update customer in local state
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

    // Clear error
    clearError() {
      this.error = null
    },
  }
})
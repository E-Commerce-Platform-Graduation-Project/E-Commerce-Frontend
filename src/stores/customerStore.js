import { defineStore } from 'pinia'
import api from '@/api' // Import the centralized api

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    filteredCustomers: []
  }),

  getters: {
    // Get all customers
    getAllCustomers: (state) => state.customers,

    // Get active customers only
    getActiveCustomers: (state) => state.customers.filter(customer => customer.is_active === true),

    // Get disabled customers only
    getDisabledCustomers: (state) => state.customers.filter(customer => customer.is_active === false),

    // Get customer by ID
    getCustomerById: (state) => (id) => state.customers.find(customer => customer.id === id),

    // Get customer by phone number (exact match)
    getCustomerByPhone: (state) => (phoneNumber) => {
      return state.customers.find(customer => customer.phone_number === phoneNumber)
    },

    // Get customers by partial phone number match
    getCustomersByPhoneMatch: (state) => (phoneNumber) => {
      if (!phoneNumber) return []
      return state.customers.filter(customer => 
        customer.phone_number.includes(phoneNumber)
      )
    },

    // Get filtered customers (based on current search)
    getFilteredCustomers: (state) => {
      if (!state.searchQuery) return state.customers
      return state.customers.filter(customer => 
        customer.phone_number.includes(state.searchQuery) ||
        customer.full_name.includes(state.searchQuery) ||
        customer.email.includes(state.searchQuery)
      )
    },

    // Get loading state
    getIsLoading: (state) => state.isLoading,

    // Get error message
    getError: (state) => state.error,

    // Get search query
    getSearchQuery: (state) => state.searchQuery,

    // Get customers count
    getCustomersCount: (state) => state.customers.length,

    // Get active customers count
    getActiveCustomersCount: (state) => state.customers.filter(customer => customer.is_active === true).length,

    // Get disabled customers count
    getDisabledCustomersCount: (state) => state.customers.filter(customer => customer.is_active === false).length,

    // Get filtered customers count
    getFilteredCustomersCount: (state) => {
      if (!state.searchQuery) return state.customers.length
      return state.customers.filter(customer => 
        customer.phone_number.includes(state.searchQuery) ||
        customer.full_name.includes(state.searchQuery) ||
        customer.email.includes(state.searchQuery)
      ).length
    }
  },

  actions: {
    // Fetch all customers
    async fetchCustomers() {
      this.isLoading = true
      this.error = null

      try {
        // Updated to use the new API endpoint for listing customers
        const response = await api.get('/users/customers/')
        this.customers = response.data
        
        return {
          success: true,
          data: this.customers,
          count: this.customers.length
        }
      } catch (error) {
        this.error = 'حدث خطأ أثناء تحميل بيانات العملاء'
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
        // Updated to use the PATCH method as defined in the YAML file
        const response = await api.patch(`/users/customers/${customerId}/`, {
          is_active: newStatus
        })

        // Update customer in local state
        const customerIndex = this.customers.findIndex(c => c.id === customerId)
        if (customerIndex !== -1) {
          // The API returns the updated user object, so we can use that
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

    // Activate customer
    async activateCustomer(customerId) {
      return await this.toggleCustomerStatus(customerId, true)
    },

    // Disable customer
    async disableCustomer(customerId) {
      return await this.toggleCustomerStatus(customerId, false)
    },

    // Search customers by phone number, name, or email
    searchCustomers(query) {
      this.searchQuery = query || ''
      
      if (!query) {
        this.filteredCustomers = this.customers
        return this.customers
      }
      
      this.filteredCustomers = this.customers.filter(customer => 
        customer.phone_number.includes(query) ||
        customer.full_name.includes(query) ||
        customer.email.includes(query)
      )
      
      return this.filteredCustomers
    },

    // Search customers by phone number only
    searchByPhoneNumber(phoneNumber) {
      this.searchQuery = phoneNumber || ''
      
      if (!phoneNumber) {
        this.filteredCustomers = this.customers
        return this.customers
      }
      
      this.filteredCustomers = this.customers.filter(customer => 
        customer.phone_number.includes(phoneNumber)
      )
      
      return this.filteredCustomers
    },

    // Find exact customer by phone number
    findCustomerByExactPhone(phoneNumber) {
      if (!phoneNumber) return null
      
      const customer = this.customers.find(customer => 
        customer.phone_number === phoneNumber
      )
      
      return customer || null
    },

    // Get suggestions for phone number input (partial matches)
    getPhoneNumberSuggestions(phoneNumber) {
      if (!phoneNumber || phoneNumber.length < 3) return []
      
      return this.customers
        .filter(customer => customer.phone_number.includes(phoneNumber))
        .map(customer => ({
          id: customer.id,
          phoneNumber: customer.phone_number,
          fullName: customer.full_name,
          email: customer.email,
          isActive: customer.is_active
        }))
        .slice(0, 10) // Limit to 10 suggestions
    },

    // Check if phone number exists
    phoneNumberExists(phoneNumber) {
      return this.customers.some(customer => customer.phone_number === phoneNumber)
    },

    // Check if email exists
    emailExists(email) {
      return this.customers.some(customer => customer.email === email)
    },

    // Clear search
    clearSearch() {
      this.searchQuery = ''
      this.filteredCustomers = []
    },

    // Clear error
    clearError() {
      this.error = null
    },

    // Filter customers by active status (can be combined with search)
    filterByStatus(isActive) {
      let baseCustomers = this.searchQuery ? this.filteredCustomers : this.customers
      
      if (isActive === null || isActive === undefined) {
        return baseCustomers
      }
      
      return baseCustomers.filter(customer => customer.is_active === isActive)
    },

    // Sort customers by registration date
    sortByRegistrationDate(customers = null, ascending = true) {
      const customersToSort = customers || this.getFilteredCustomers
      
      return [...customersToSort].sort((a, b) => {
        const dateA = new Date(a.registration_date)
        const dateB = new Date(b.registration_date)
        return ascending ? dateA - dateB : dateB - dateA
      })
    },

    // Sort customers by name (Arabic locale)
    sortByName(customers = null, ascending = true) {
      const customersToSort = customers || this.getFilteredCustomers
      
      return [...customersToSort].sort((a, b) => {
        const nameA = a.full_name.toLowerCase()
        const nameB = b.full_name.toLowerCase()
        if (ascending) {
          return nameA.localeCompare(nameB, 'ar')
        } else {
          return nameB.localeCompare(nameA, 'ar')
        }
      })
    },

    // Sort customers by email
    sortByEmail(customers = null, ascending = true) {
      const customersToSort = customers || this.getFilteredCustomers
      
      return [...customersToSort].sort((a, b) => {
        const emailA = a.email.toLowerCase()
        const emailB = b.email.toLowerCase()
        return ascending ? emailA.localeCompare(emailB) : emailB.localeCompare(emailA)
      })
    },

    // Get customers by role (though all seem to be CUSTOMER in the JSON)
    getCustomersByRole(role) {
      return this.customers.filter(customer => customer.role === role)
    },

    // Get customers registered in a specific date range
    getCustomersByDateRange(startDate, endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      return this.customers.filter(customer => {
        const regDate = new Date(customer.registration_date)
        return regDate >= start && regDate <= end
      })
    }
  }
})
import { defineStore } from 'pinia'
import axios from 'axios'

// Configure axios base URL for json-server
const API_BASE_URL = 'http://localhost:3002/'
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
    getActiveCustomers: (state) => state.customers.filter(customer => customer.Status === 'Active'),

    // Get disabled customers only
    getDisabledCustomers: (state) => state.customers.filter(customer => customer.Status === 'Disabled'),

    // Get customer by ID
    getCustomerById: (state) => (id) => state.customers.find(customer => customer.id === id),

    // Get customer by phone number (exact match)
    getCustomerByPhone: (state) => (phoneNumber) => {
      return state.customers.find(customer => customer.PhoneNumber === phoneNumber)
    },

    // Get customers by partial phone number match
    getCustomersByPhoneMatch: (state) => (phoneNumber) => {
      if (!phoneNumber) return []
      return state.customers.filter(customer => 
        customer.PhoneNumber.includes(phoneNumber)
      )
    },

    // Get filtered customers (based on current search)
    getFilteredCustomers: (state) => {
      if (!state.searchQuery) return state.customers
      return state.customers.filter(customer => 
        customer.PhoneNumber.includes(state.searchQuery)
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
    getActiveCustomersCount: (state) => state.customers.filter(customer => customer.Status === 'Active').length,

    // Get disabled customers count
    getDisabledCustomersCount: (state) => state.customers.filter(customer => customer.Status === 'Disabled').length,

    // Get filtered customers count
    getFilteredCustomersCount: (state) => {
      if (!state.searchQuery) return state.customers.length
      return state.customers.filter(customer => 
        customer.PhoneNumber.includes(state.searchQuery)
      ).length
    }
  },

  actions: {
    // Fetch all customers
    async fetchCustomers() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/customers')
        // Remove passwords from customer data for security
        this.customers = response.data.map(({ Password: _, ...customer }) => customer)
        
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

    // Toggle customer status (Active/Disabled)
    async toggleCustomerStatus(customerId, newStatus) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.patch(`/customers/${customerId}`, {
          Status: newStatus
        })

        // Update customer in local state
        const customerIndex = this.customers.findIndex(c => c.id === customerId)
        if (customerIndex !== -1) {
          this.customers[customerIndex] = {
            ...this.customers[customerIndex],
            Status: newStatus
          }
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
      return await this.toggleCustomerStatus(customerId, 'Active')
    },

    // Disable customer
    async disableCustomer(customerId) {
      return await this.toggleCustomerStatus(customerId, 'Disabled')
    },

    // Search customers by phone number only
    searchByPhoneNumber(phoneNumber) {
      this.searchQuery = phoneNumber || ''
      
      if (!phoneNumber) {
        this.filteredCustomers = this.customers
        return this.customers
      }
      
      this.filteredCustomers = this.customers.filter(customer => 
        customer.PhoneNumber.includes(phoneNumber)
      )
      
      return this.filteredCustomers
    },

    // Find exact customer by phone number
    findCustomerByExactPhone(phoneNumber) {
      if (!phoneNumber) return null
      
      const customer = this.customers.find(customer => 
        customer.PhoneNumber === phoneNumber
      )
      
      return customer || null
    },

    // Get suggestions for phone number input (partial matches)
    getPhoneNumberSuggestions(phoneNumber) {
      if (!phoneNumber || phoneNumber.length < 3) return []
      
      return this.customers
        .filter(customer => customer.PhoneNumber.includes(phoneNumber))
        .map(customer => ({
          id: customer.id,
          phoneNumber: customer.PhoneNumber,
          fullName: customer.FullName,
          status: customer.Status
        }))
        .slice(0, 10) // Limit to 10 suggestions
    },

    // Check if phone number exists
    phoneNumberExists(phoneNumber) {
      return this.customers.some(customer => customer.PhoneNumber === phoneNumber)
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

    // Filter customers by status (can be combined with phone search)
    filterByStatus(status) {
      let baseCustomers = this.searchQuery ? this.filteredCustomers : this.customers
      
      if (!status || status === 'all') {
        return baseCustomers
      }
      
      return baseCustomers.filter(customer => customer.Status === status)
    },

    // Sort customers by registration date
    sortByRegistrationDate(customers = null, ascending = true) {
      const customersToSort = customers || this.getFilteredCustomers
      
      return [...customersToSort].sort((a, b) => {
        const dateA = new Date(a.RegistrationDate)
        const dateB = new Date(b.RegistrationDate)
        return ascending ? dateA - dateB : dateB - dateA
      })
    },

    // Sort customers by name (Arabic locale)
    sortByName(customers = null, ascending = true) {
      const customersToSort = customers || this.getFilteredCustomers
      
      return [...customersToSort].sort((a, b) => {
        const nameA = a.FullName.toLowerCase()
        const nameB = b.FullName.toLowerCase()
        if (ascending) {
          return nameA.localeCompare(nameB, 'ar')
        } else {
          return nameB.localeCompare(nameA, 'ar')
        }
      })
    }
  }
})
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Import your components
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Customers from '@/views/Customer/Customers.vue'
import CustomerDetails from '@/views/Customer/CustomerDetails.vue'
import Orders from '@/views/Orders.vue'
import DeliveryLocations from '@/views/DeliveryLocations.vue'
import Categories from '@/views/Category/Categories.vue'
import Products from '@/views/Product/Products.vue'
import ProductRatings from '@/views/Product/ProductRatings.vue'
import AddCategory from '@/views/Category/AddCategory.vue'
import AddProduct from '@/views/Product/AddProduct.vue'
import ProductProp from '@/views/Product/ProductProp.vue'
import AddPurchaseInvoice from '@/views/Product/AddPurchaseInvoice.vue'
import PurchaseInvoices from '@/views/Product/PurchaseInvoices.vue'
import PurchaseInvoiceDetails from '@/views/Product/PurchaseInvoiceDetails.vue'
import Employees from '@/views/Employee/Employees.vue'
import AddEmployee from '@/views/Employee/AddEmployee.vue'
import Settings from '@/views/Settings.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true } // Added this meta
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/customers',
    name: 'Customers',
    component: Customers,
    meta: { requiresAuth: true }
  },
  {
    path: '/customers/:id',
    name: 'CustomerDetails',
    component: CustomerDetails,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: Categories,
    meta: { requiresAuth: true }
  },
  {
    path: '/delivery-locations',
    name: 'DeliveryLocations',
    component: DeliveryLocations,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-category',
    name: 'AddCategory',
    component: AddCategory,
    meta: { requiresAuth: true }
  },
  {
    path: '/products',
    name: 'Products',
    component: Products,
    meta: { requiresAuth: true }
  },
  {
    path: '/product-ratings/:id',
    name: 'ProductRatings',
    component: ProductRatings,
    props: true,
    meta: { requiresAuth: true }
  }, 
  {
    path: '/purchase-invoices/:id',
    name: 'PurchaseInvoiceDetails',
    component: PurchaseInvoiceDetails,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-product',
    name: 'AddProduct',
    component: AddProduct,
    meta: { requiresAuth: true }
  },
  {
    path: '/product-prop',
    name: 'ProductProp',
    component: ProductProp,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-purchase-invoice',
    name: 'AddPurchaseInvoice',
    component: AddPurchaseInvoice,
    meta: { requiresAuth: true }
  },
  {
    path: '/purchase-invoices',
    name: 'PurchaseInvoices',
    component: PurchaseInvoices,
    meta: { requiresAuth: true }
  },  
  {
    path: '/employees',
    name: 'Employees',
    component: Employees,
    meta: { 
      requiresAuth: true,
      requiredRole: 'ADMIN'
    }
  },
  {
    path: '/add-employee',
    name: 'AddEmployee',
    component: AddEmployee,
    meta: { 
      requiresAuth: true,
      requiredRole: 'ADMIN'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { 
      requiresAuth: true
    }
  },
  // Updated default redirects
  {
    path: '/',
    redirect: '/dashboard' // Changed from /login to /dashboard
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard' // Changed from /login to /dashboard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Updated navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // CRITICAL: Always wait for auth initialization to complete
  if (!authStore.isInitialized) {
    await authStore.initAuth()
  }

  const isAuthenticated = authStore.getIsAuthenticated
  const userRole = authStore.getCurrentUser?.role

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // Check if route requires guest (not authenticated) - prevents authenticated users from accessing login
  if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard')
    return
  }

  // Check role-based access
  if (to.meta.requiredRole && userRole !== to.meta.requiredRole) {
    // If user doesn't have required role, redirect to dashboard
    next('/dashboard')
    return
  }

  next()
})

export default router
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Import your components
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Customers from '@/views/Customers.vue'
import Orders from '@/views/Orders.vue'
import Categories from '@/views/Category/Categories.vue'
import Products from '@/views/Product/Products.vue'
import AddCategory from '@/views/Category/AddCategory.vue'
import AddProduct from '@/views/Product/AddProduct.vue'
import Employees from '@/views/Employee/Employees.vue'
import AddEmployee from '@/views/Employee/AddEmployee.vue'
import Settings from '@/views/Settings.vue'
const routes = [
  
  // {
  //   path: '/admin/dashboard',
  //   name: 'AdminDashboard',
  //   component: AdminDashboard,
  //   meta: { 
  //     requiresAuth: true,
  //     requiredRole: 'admin'
  //   }
  // },
  // {
  //   path: '/employee/dashboard',
  //   name: 'EmployeeDashboard',
  //   component: EmployeeDashboard,
  //   meta: { 
  //     requiresAuth: true,
  //     requiredRole: 'employee'
  //   }
  // },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
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
   path: '/add-product',
    name: 'AddProduct',
    component: AddProduct,
    meta: { requiresAuth: true }
  },
  {
   path: '/employees',
    name: 'Employees',
    component: Employees,
    meta: { 
      requiresAuth: true,
      requiredRole: 'admin'
     }
  },
  {
   path: '/add-employee',
    name: 'AddEmployee',
    component: AddEmployee,
    meta: { 
      requiresAuth: true,
      requiredRole: 'admin'
     }
  },
  {
   path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { 
      requiresAuth: true,
     }
  },
  //ادخال خاطيء
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth if not already done
  if (!authStore.getIsAuthenticated && localStorage.getItem('auth_user')) {
    await authStore.initAuth()
  }

  const isAuthenticated = authStore.getIsAuthenticated
  const userRole = authStore.getUserRole

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && isAuthenticated) {
    // // Redirect based on role
    // if (userRole === 'admin') {
    //   next('/admin/dashboard')
    // } else if (userRole === 'employee') {
    //   next('/employee/dashboard')
    // } else {
    next('/dashboard')
    // }
    return
  }

  // Check role-based access
  if (to.meta.requiredRole && userRole !== to.meta.requiredRole) {
    // Redirect to appropriate dashboard based on user's role
    // if (userRole === 'admin') {
    //   next('/admin/dashboard')
    // } else if (userRole === 'employee') {
    //   next('/employee/dashboard')
    // } else {
    next('/dashboard')
    // }
    return
  }

  next()
})

export default router
<template>
  <div v-if="!authStore.isInitialized" class="loading-overlay">
    <div class="spinner"></div>
    <p class="loading-text">يتم التحميل...</p>
  </div>
  
  <div v-else id="app" class="rtl-app">
    <div v-if="!isLoginPage" class="dashboard-layout">
      <Sidebar/>
      <main class="main-content" :class="{ 'sidebar-expanded': sidebarExpanded }">
        <div class="p-3 p-md-4">
          <router-view />
        </div>
      </main>
    </div>
    
    <router-view v-else />
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/authStore'

export default {
  name: 'App',
  components: {
    Sidebar
  },
  setup() {
    const route = useRoute()
    const sidebarExpanded = ref(localStorage.getItem("is_expanded") === "true")
    const authStore = useAuthStore()

    const isLoginPage = computed(() => {
      return route.path === '/login'
    })

    onMounted(async () => {
      await authStore.initAuth()

      const handleStorageChange = () => {
        sidebarExpanded.value = localStorage.getItem("is_expanded") === "true"
      }
      
      const handleSidebarToggle = (event) => {
        sidebarExpanded.value = event.detail.expanded
      }
      
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('sidebarToggle', handleSidebarToggle)
      
      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('sidebarToggle', handleSidebarToggle)
      }
    })
    
    return {
      isLoginPage,
      sidebarExpanded,
      authStore
    }
  }
}
</script>

<style lang="scss">
:root {
	--primary: #646464;
	--primary-alt: #000000;
	--grey: #64748b;
	--dark: #ffffff;
	--dark-alt: #f8fafc;
	--light: #475569;
	--sidebar-width: 300px;
	--sidebar-collapsed: 80px;
	--border-color: #e2e8f0;
	--shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	--text-muted: #94a3b8;
	--hover-bg: #f1f5f9;
	--active-bg: #e2e7e4;
}

/* Global RTL setup */
.rtl-app {
  direction: rtl;
  font-family: 'Tajawal', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

/* --- UPDATED STYLES FOR LOADING STATE --- */
.loading-overlay {
  display: flex;
  flex-direction: column; /* Stack spinner and text vertically */
  justify-content: center;
  align-items: center;
  gap: 1.5rem; /* Space between spinner and text */
  height: 100vh;
  width: 100%;
  background-color: var(--dark-alt);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #e2e8f0; /* Light grey border */
  border-top: 5px solid var(--primary); /* Primary color for spinner part */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--primary);
  font-size: 1.25rem;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dashboard Layout */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* Main content area - adjusted for fixed sidebar */
.main-content {
  flex: 1;
  background: #ffffff;
  margin-right: var(--sidebar-collapsed);
  margin-left: 1rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  min-height: 100vh;
  transition: margin-right 0.3s ease-in-out;
  
  &.sidebar-expanded {
    margin-right: var(--sidebar-width);
  }
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .main-content {
    margin-right: 0 !important;
    margin-left: 0;
    border-radius: 0;
  }
}

/* Form controls RTL */
.form-floating {
  direction: rtl;
}

.form-floating > .form-control {
  text-align: right;
}

.form-floating > label {
  right: 0;
  left: auto;
  transform-origin: 100% 0;
}

.form-floating > .form-control:focus ~ label,
.form-floating > .form-control:not(:placeholder-shown) ~ label {
  transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
  transform-origin: 100% 0;
}

/* Global input RTL */
input, textarea, select {
  direction: rtl;
  text-align: right;
}

/* LTR override class for specific elements */
.ltr {
  direction: ltr !important;
  text-align: left !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content {
    margin-right: 0 !important;
    margin-left: 0 !important;
  }
}
</style>
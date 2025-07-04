<template>
  <div id="app" class="rtl-app">
    <!-- Show sidebar on all pages except login -->
    <div v-if="!isLoginPage" class="dashboard-layout">
      <Sidebar/>
      <main class="main-content" :class="{ 'sidebar-expanded': sidebarExpanded }">
        <div class="p-3 p-md-4">
          <router-view />
        </div>
      </main>
    </div>
    
    <!-- Show only router-view on login page -->
    <router-view v-else />
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'App',
  components: {
    Sidebar
  },
  setup() {
    const route = useRoute()
    const sidebarExpanded = ref(localStorage.getItem("is_expanded") === "true")

    // Check if current page is login
    const isLoginPage = computed(() => {
      return route.path === '/login'
    })

    // Listen for sidebar toggle changes
    onMounted(() => {
      const handleStorageChange = () => {
        sidebarExpanded.value = localStorage.getItem("is_expanded") === "true"
      }
      
      const handleSidebarToggle = (event) => {
        sidebarExpanded.value = event.detail.expanded
      }
      
      // Listen for storage changes (when sidebar is toggled)
      window.addEventListener('storage', handleStorageChange)
      
      // Listen for custom events from the sidebar component
      window.addEventListener('sidebarToggle', handleSidebarToggle)
      
      // Cleanup
      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('sidebarToggle', handleSidebarToggle)
      }
    })
    
    return {
      isLoginPage,
      sidebarExpanded
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
  
  // When sidebar is expanded
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
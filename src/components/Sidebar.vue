<template>
  <aside 
    :class="[
      'sidebar',
      'd-flex',
      'flex-column',
      'bg-white',
      'border-start',
      'shadow',
      'overflow-hidden',
      { 'sidebar-expanded': is_expanded }
    ]"
  >
    <!-- Logo Section (Fixed) -->
    <div class="sidebar-header p-3 text-center">
      <img :src="logoURL" alt="Vue" class="logo-img" />
      <p>متجرنا الالكتروني</p>
    </div>

    <!-- Menu Toggle (Fixed) -->
    <div class="sidebar-toggle d-flex justify-content-end px-3 mb-3">
      <button 
        class="btn btn-link p-0 menu-toggle-btn" 
        @click="ToggleMenu"
        type="button"
      >
        <span class="material-icons fs-2 text-secondary">keyboard_double_arrow_right</span>
      </button>
    </div>

    <!-- Scrollable Content Area -->
    <div class="sidebar-content flex-grow-1 px-2">
      <!-- Main Menu -->
      <div class="menu-section">
        <h6 class="sidebar-heading text-uppercase text-muted small fw-bold px-2 mb-2">
          القائمة الرئيسية
        </h6>
        <nav class="nav flex-column mb-4">
          <router-link 
            to="/dashboard" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <span class="material-icons me-3">home</span>
            <span class="sidebar-text">لوحة التحكم</span>
          </router-link>
          <router-link 
            to="/customers" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <span class="material-icons me-3">group</span>
            <span class="sidebar-text">العملاء</span>
          </router-link>
          <router-link 
            to="/orders" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <span class="material-icons me-3">shopping_basket</span>
            <span class="sidebar-text">الطلبات</span>
          </router-link>
        </nav>
      </div>

      <!-- Categories & Products -->
      <div class="menu-section">
        <h6 class="sidebar-heading text-uppercase text-muted small fw-bold px-2 mb-2">
          الفئات والمنتجات
        </h6>
        <nav class="nav flex-column mb-4">
          <router-link 
            to="/categories" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <span class="material-icons me-3">category</span>
            <span class="sidebar-text">الفئات</span>
          </router-link>
          <router-link 
            to="/add-category" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <span class="material-icons me-3">add</span>
            <span class="sidebar-text">اضافة فئة</span>
          </router-link>
          <router-link 
            to="/products" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <span class="material-icons me-3">inventory</span>
            <span class="sidebar-text">المنتجات</span>
          </router-link>
          <router-link 
            to="/add-product" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <span class="material-icons me-3">add</span>
            <span class="sidebar-text">اضافة منتج</span>
          </router-link>
        </nav>
      </div>

      <!-- Employee Management (Admin Only) -->
      <div v-if="isAdmin" class="menu-section">
        <h6 class="sidebar-heading text-uppercase text-muted small fw-bold px-2 mb-2">
          ادارة الموظفين
        </h6>
        <nav class="nav flex-column mb-4">
          <router-link 
            to="/employees" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <span class="material-icons me-3">assignment_ind</span>
            <span class="sidebar-text">الموظفين</span>
          </router-link>
          <router-link 
            to="/add-employee" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <span class="material-icons me-3">add</span>
            <span class="sidebar-text">اضافة موظف</span>
          </router-link>
        </nav>
      </div>

      <!-- Settings -->
      <div class="menu-section">
        <h6 class="sidebar-heading text-uppercase text-muted small fw-bold px-2 mb-2">
          الاعدادات
        </h6>
        <nav class="nav flex-column">
          <router-link 
            to="/settings" 
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
          >
            <i class="fas fa-user-cog me-3"></i>
            <span class="sidebar-text">الملف الشخصي</span>
          </router-link>
        </nav>
      </div>
    </div>

    <!-- User Profile Section (Fixed at bottom) -->
    <UserProfile :sidebar-expanded="is_expanded" />
  </aside>
</template>

<script>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import logoURL from "../assets/icons/e-commerce-logo.png";
import { useAuthStore } from "../stores/authStore";
import UserProfile from "./UserProfile.vue";

export default {
  components: {
    UserProfile
  },
  setup() {
    const is_expanded = ref(localStorage.getItem("is_expanded") === "true");
    const router = useRouter();
    const authStore = useAuthStore();

    const ToggleMenu = () => {
      is_expanded.value = !is_expanded.value;
      localStorage.setItem("is_expanded", is_expanded.value);
      
      // Emit custom event to update main content layout
      window.dispatchEvent(new CustomEvent('sidebarToggle', { 
        detail: { expanded: is_expanded.value } 
      }));
    };

    // Get admin status from store
    const isAdmin = computed(() => authStore.isAdmin);

    return {
      ToggleMenu,
      is_expanded,
      logoURL,
      isAdmin,
    };
  },
};
</script>

<style lang="scss" scoped>
.sidebar {
  width: var(--sidebar-collapsed);
  height: 100vh;
  position: fixed;
  top: 0;
  right: 0;
  transition: width 0.3s ease-in-out;
  background-color: var(--dark) !important;
  border-color: var(--border-color) !important;
  z-index: 1000;
  
  // Fixed header section
  .sidebar-header {
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
    
    .logo-img {
      width: 2rem;
      height: auto;
    }
  }

  // Fixed toggle section
  .sidebar-toggle {
    flex-shrink: 0;
    
    .menu-toggle-btn {
      transition: transform 0.2s ease-in-out;
      
      &:hover {
        .material-icons {
          color: var(--primary) !important;
          transform: translateX(0.5rem);
        }
      }
    }
  }

  // Scrollable content area
  .sidebar-content {
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    
    // Force LTR direction to move scrollbar to right side
    direction: ltr;
    
    // Custom scrollbar styling
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.3);
      }
    }
    
    // Firefox scrollbar
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
    
    // Reset content back to RTL
    .menu-section {
      direction: rtl;
    }
  }

  // Menu sections spacing
  .menu-section {
    margin-bottom: 1rem;
  }

  // Sidebar headings
  .sidebar-heading {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    font-size: 0.75rem;
  }

  // Sidebar text
  .sidebar-text {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    white-space: nowrap;
    color: var(--light);
    font-weight: 500;
  }

  // Sidebar links
  .sidebar-link {
    color: var(--grey) !important;
    transition: all 0.2s ease-in-out;
    margin-bottom: 0.25rem;
    
    .material-icons {
      font-size: 1.5rem;
      color: var(--grey);
      transition: color 0.2s ease-in-out;
      min-width: 1.5rem;
    }

    &:hover {
      background-color: var(--hover-bg) !important;
      transform: translateX(-2px);
      
      .material-icons,
      .sidebar-text {
        color: var(--primary) !important;
      }
    }

    &.router-link-active {
      background-color: var(--active-bg) !important;
      border-right: 3px solid var(--primary);
      
      .material-icons,
      .sidebar-text {
        color: var(--primary-alt) !important;
      }
    }
  }

  // Expanded state
  &.sidebar-expanded {
    width: var(--sidebar-width);
    
    .sidebar-toggle .menu-toggle-btn {
      transform: rotate(-180deg);
    }
    
    .sidebar-heading,
    .sidebar-text {
      opacity: 1;
    }
  }
}

// Mobile responsiveness
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    z-index: 1050;
  }
}
</style>
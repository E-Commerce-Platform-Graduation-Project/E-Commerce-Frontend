<template>
  <aside
    :class="[
      'sidebar',
      'd-flex',
      'flex-column',
      'bg-white',
      'overflow-hidden',
      { 'sidebar-expanded': is_expanded },
      { 'is-mobile-open': isMobileOpen },
    ]"
  >
    <div class="sidebar-header p-3 text-center">
      <img :src="logoURL" alt="logo" class="logo-img" />
      <p class="fw-bold h5 text-dark">Flaww Store</p>
    </div>

    <div class="sidebar-toggle d-none d-lg-flex justify-content-end px-3 mb-3">
      <button
        class="btn btn-link p-0 menu-toggle-btn"
        @click="ToggleMenu"
        type="button"
      >
        <span class="material-icons fs-2 text-secondary"
          >keyboard_double_arrow_right</span
        >
      </button>
    </div>

    <div class="sidebar-content flex-grow-1 px-2">
      <div class="menu-section">
        <h6
          class="sidebar-heading text-uppercase text-muted small fw-bold px-2 mb-2"
        >
          القائمة الرئيسية
        </h6>
        <nav class="nav flex-column mb-4">
          <router-link
            to="/dashboard"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">dashboard</span>
            <span class="sidebar-text">لوحة البيانات</span>
          </router-link>
          <router-link
            to="/customers"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">group</span>
            <span class="sidebar-text">العملاء</span>
          </router-link>

          <router-link
            to="/orders"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="
              resetOrderCount();
              handleLinkClick();
            "
          >
            <span class="material-icons me-3">shopping_basket</span>
            <span class="sidebar-text ms-2">الطلبات</span>
            <span
              v-if="newOrderCount > 0"
              class="notification-badge ms-auto"
              :class="{ 'shake-animation': newOrderCount > 0 }"
            >
              {{ newOrderCount }}
            </span>
          </router-link>

          <router-link
            to="/delivery-locations"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">local_shipping</span>
            <span class="sidebar-text">إدارة المدن والمناطق</span>
          </router-link>

          <router-link
            to="/support-tickets"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="
              resetTicketCount();
              handleLinkClick();
            "
          >
            <span class="material-icons me-3">confirmation_number</span>
            <span class="sidebar-text ms-2">إدارة تذاكر الدعم</span>
            <span
              v-if="newTicketCount > 0"
              class="notification-badge ms-auto"
              :class="{ 'shake-animation': newTicketCount > 0 }"
            >
              {{ newTicketCount }}
            </span>
          </router-link>
        </nav>
      </div>

      <div class="menu-section">
        <h6
          class="sidebar-heading text-uppercase text-muted small fw-bold px-2 mb-2"
        >
          ادارة الفئات
        </h6>
        <nav class="nav flex-column mb-4">
          <router-link
            to="/categories"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">category</span>
            <span class="sidebar-text">الفئات</span>
          </router-link>
          <router-link
            to="/add-category"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">add</span>
            <span class="sidebar-text">إضافة فئة</span>
          </router-link>
        </nav>
      </div>

      <div class="menu-section">
        <h6
          class="sidebar-heading text-uppercase text-muted small fw-bold px-2 mb-2"
        >
          ادارة المنتجات
        </h6>
        <nav class="nav flex-column mb-4">
          <router-link
            to="/products"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">inventory</span>
            <span class="sidebar-text">المنتجات</span>
          </router-link>
          <router-link
            to="/add-product"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">add</span>
            <span class="sidebar-text">إضافة منتج</span>
          </router-link>
          <router-link
            to="/purchase-invoices"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">request_page</span>
            <span class="sidebar-text">فواتير الشراء</span>
          </router-link>
          <router-link
            to="/add-purchase-invoice"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">add</span>
            <span class="sidebar-text">إنشاء فاتورة شراء</span>
          </router-link>
          <router-link
            to="/product-prop"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">settings</span>
            <span class="sidebar-text">إدارة خواص المنتجات</span>
          </router-link>
        </nav>
      </div>

      <div v-if="isAdmin" class="menu-section">
        <h6
          class="sidebar-heading text-uppercase text-muted small fw-bold px-2 mb-2"
        >
          ادارة الموظفين
        </h6>
        <nav class="nav flex-column mb-4">
          <router-link
            to="/employees"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">assignment_ind</span>
            <span class="sidebar-text">الموظفين</span>
          </router-link>
          <router-link
            to="/add-employee"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <span class="material-icons me-3">add</span>
            <span class="sidebar-text">إضافة موظف</span>
          </router-link>
        </nav>
      </div>

      <div class="menu-section">
        <h6
          class="sidebar-heading text-uppercase text-muted small fw-bold px-2 mb-2"
        >
          الاعدادات
        </h6>
        <nav class="nav flex-column">
          <router-link
            to="/settings"
            class="nav-link sidebar-link d-flex align-items-center text-decoration-none p-2 rounded"
            @click="handleLinkClick"
          >
            <i class="fas fa-user-cog me-3"></i>
            <span class="sidebar-text">الملف الشخصي</span>
          </router-link>
        </nav>
      </div>
    </div>

    <div class="user-profile-wrapper">
      <UserProfile :sidebar-expanded="isEffectivelyExpanded" />
    </div>
  </aside>
</template>

<script>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import logoURL from "../assets/icons/e-commerce-logo3.png";
import { useAuthStore } from "../stores/authStore";
import UserProfile from "./UserProfile.vue";
import { useNotificationStore } from "../stores/notificationStore";
import { useSupportTicketNotificationStore } from "../stores/supportTicketNotificationStore";

export default {
  components: {
    UserProfile,
  },
  props: {
    isMobileOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["close-mobile-menu"],
  setup(props, { emit }) {
    const is_expanded = ref(localStorage.getItem("is_expanded") === "true");
    const router = useRouter();
    const authStore = useAuthStore();
    const notificationStore = useNotificationStore();
    const newOrderCount = computed(() => notificationStore.getNewOrderCount);
    const resetOrderCount = () => {
      notificationStore.resetNewOrderCount();
    };
    const ticketNotificationStore = useSupportTicketNotificationStore();
    const newTicketCount = computed(
      () => ticketNotificationStore.getNewTicketCount
    );
    const resetTicketCount = () => {
      ticketNotificationStore.resetNewTicketCount();
    };

    const isEffectivelyExpanded = computed(() => {
      return is_expanded.value || props.isMobileOpen;
    });

    const ToggleMenu = () => {
      is_expanded.value = !is_expanded.value;
      localStorage.setItem("is_expanded", is_expanded.value);
      window.dispatchEvent(
        new CustomEvent("sidebarToggle", {
          detail: { expanded: is_expanded.value },
        })
      );
    };

    const handleLinkClick = () => {
      emit("close-mobile-menu");
    };

    const isAdmin = computed(() => authStore.isAdmin);

    return {
      ToggleMenu,
      is_expanded,
      logoURL,
      isAdmin,
      newOrderCount,
      resetOrderCount,
      newTicketCount,
      resetTicketCount,
      handleLinkClick,
      isEffectivelyExpanded,
    };
  },
};
</script>

<style lang="scss" scoped>
/* --- START: UPDATED CSS LOGIC --- */
.sidebar {
  height: 100vh;
  position: fixed;
  top: 0;
  right: 0;
  transition: width 0.3s ease-in-out, box-shadow 0.3s ease-in-out,
    transform 0.3s ease-in-out;
  background-color: var(--dark) !important;
  border-color: var(--border-color) !important;
  z-index: 1050;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.07);

  // --- START: MODIFIED TEXT TRANSITION LOGIC ---
  .sidebar-heading,
  .sidebar-text,
  .notification-badge {
    white-space: nowrap;
    // Base state for text is now hidden and transitions quickly
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  // --- END: MODIFIED TEXT TRANSITION LOGIC ---

  /* --- MOBILE-specific styles (screens <= 1024px) --- */
  @media (max-width: 1024px) {
    width: var(--sidebar-width);
    transform: translateX(100%);

    &.is-mobile-open {
      transform: translateX(0);

      // When mobile menu is open, force text to be visible
      .sidebar-heading,
      .sidebar-text,
      .notification-badge {
        opacity: 1;
      }
    }
  }

  /* --- DESKTOP-specific styles (screens > 1024px) --- */
  @media (min-width: 1025px) {
    width: var(--sidebar-collapsed);

    &.sidebar-expanded {
      width: var(--sidebar-width);

      // When expanded, fade text in after a short delay
      .sidebar-heading,
      .sidebar-text,
      .notification-badge {
        opacity: 1;
        transition-delay: 0.1s; // This delay allows the sidebar to expand first
      }
    }

    &:not(.sidebar-expanded) {
      .sidebar-heading,
      .sidebar-text,
      .notification-badge {
        // Ensure text is not interactive when invisible
        pointer-events: none;
      }
    }
  }
  /* --- END: UPDATED CSS LOGIC --- */

  .sidebar-header {
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
    .logo-img {
      width: 2rem;
      height: auto;
    }
  }

  .sidebar-toggle {
    flex-shrink: 0;
    .menu-toggle-btn {
      transition: transform 0.2s ease-in-out;
      &:hover .material-icons {
        color: var(--primary) !important;
      }
    }
  }

  .sidebar-content {
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    direction: ltr;
    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.2); border-radius: 3px; }
    .menu-section { direction: rtl; }
  }

  .menu-section {
    margin-bottom: 1rem;
  }

  .sidebar-heading {
    font-size: 0.75rem;
  }

  .sidebar-text {
    color: var(--light);
    font-weight: 500;
  }

  .sidebar-link {
    color: var(--grey) !important;
    transition: all 0.2s ease-in-out;
    margin-bottom: 0.25rem;
    position: relative;
    &::before {
      content: "";
      position: absolute;
      top: 50%;
      right: 0;
      width: 4px;
      height: 70%;
      background-color: var(--primary);
      border-radius: 4px 0 0 4px;
      transform: translateY(-50%) scaleY(0);
      transition: transform 0.2s ease-in-out;
    }
    .material-icons {
      font-size: 1.5rem;
      color: var(--grey);
      transition: color 0.2s ease-in-out, transform 0.2s ease-in-out;
      min-width: 1.5rem;
    }
    &:hover {
      background-color: var(--hover-bg) !important;
      &::before { transform: translateY(-50%) scaleY(1); }
      .material-icons { color: var(--primary) !important; transform: scale(1.1); }
      .sidebar-text { color: var(--primary) !important; }
    }
    &.router-link-active {
      background-color: var(--active-bg) !important;
      &::before { transform: translateY(-50%) scaleY(1); }
      .material-icons, .sidebar-text { color: var(--primary-alt) !important; }
    }
  }

  .notification-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background-color: #dc3545;
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .user-profile-wrapper {
    padding: 0.5rem;
    display: flex;
    justify-content: center;
  }

  &.sidebar-expanded {
    .sidebar-toggle .menu-toggle-btn {
      transform: rotate(-180deg);
    }
    .user-profile-wrapper {
      justify-content: flex-start;
    }
  }
  
  // Desktop tooltips for collapsed state
  @media (min-width: 1025px) {
    &:not(.sidebar-expanded) {
      .sidebar-link {
        justify-content: center;
        .material-icons {
          margin-right: 0;
        }
        .sidebar-text {
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 1rem;
          padding: 0.5rem 0.75rem;
          background-color: var(--dark);
          color: var(--light);
          border-radius: 0.375rem;
          transition-delay: 0.1s;
        }
        &:hover .sidebar-text {
          opacity: 1;
          transform: translateY(-50%) translateX(-8px);
        }
      }
    }
  }
}

/* Shake Animation */
.shake-animation {
  animation: shake 2.5s cubic-bezier(0.36, 0.07, 0.19, 0.67) both infinite;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
  40%, 60% { transform: translate3d(3px, 0, 0); }
}
</style>
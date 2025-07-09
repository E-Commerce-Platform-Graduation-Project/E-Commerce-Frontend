<template>
  <div class="user-profile-section">
    <div class="user-info d-flex align-items-center p-3" @click="toggleDropdown">
      <div class="user-avatar me-3">
        <img 
          :src="userAvatar" 
          :alt="currentUser?.full_name || 'مستخدم'" 
          class="avatar-img rounded-circle"
          @error="handleImageError"
        />
        <div class="status-indicator"></div>
      </div>
      
      <div class="user-details flex-grow-1" v-if="sidebarExpanded">
        <h6 class="user-name mb-1">{{ fullName }}</h6>
        <small class="user-role text-muted">{{ userRoleText }}</small>
      </div>
      
      <div class="dropdown-arrow" v-if="sidebarExpanded">
        <span class="material-icons" :class="{ 'rotated': isDropdownOpen }">
          keyboard_arrow_down
        </span>
      </div>
    </div>

    <transition name="dropdown-slide">
      <div class="user-dropdown" v-if="isDropdownOpen && sidebarExpanded">
        <div class="dropdown-content">
          <div 
            class="dropdown-item logout-item d-flex align-items-center w-100" 
            @click="showLogoutModal"
          >
            <span class="material-icons me-2">logout</span>
            <span>تسجيل الخروج</span>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal-fade">
      <div class="modal-overlay" v-if="isLogoutModalOpen" @click="hideLogoutModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h5 class="modal-title">تسجيل الخروج</h5>
          </div>
          <div class="modal-body">
            <p class="modal-text">هل أنت متأكد من تسجيل الخروج ؟</p>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-cancel" 
              @click="hideLogoutModal"
            >
              إلغاء
            </button>
            <button 
              type="button" 
              class="btn btn-confirm" 
              @click="confirmLogout"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

export default {
  name: 'UserProfile',
  props: {
    sidebarExpanded: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const router = useRouter()
    const authStore = useAuthStore()
    const isDropdownOpen = ref(false)
    const isLogoutModalOpen = ref(false)

    const currentUser = computed(() => authStore.getCurrentUser)

    const fullName = computed(() => {
      if (!currentUser.value) return 'مستخدم'
      return currentUser.value.full_name || 'مستخدم'
    })

    const userRoleText = computed(() => {
      const role = currentUser.value?.role
      switch (role) {
        case 'ADMIN':
          return 'مدير'
        case 'EMPLOYEE':
          return 'موظف'
        default:
          return 'مستخدم'
      }
    })

    const userAvatar = computed(() => {
      if (currentUser.value?.profile_image) {
        return currentUser.value.profile_image
      }
      return generateAvatarUrl(fullName.value)
    })

    const generateAvatarUrl = (name) => {
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=646464&color=ffffff&size=40&rounded=true&font-size=0.6`
    }

    const handleImageError = (event) => {
      event.target.src = generateAvatarUrl(fullName.value)
    }

    const toggleDropdown = () => {
      if (!props.sidebarExpanded) return
      isDropdownOpen.value = !isDropdownOpen.value
    }

    const closeDropdown = (event) => {
      if (!event.target.closest('.user-profile-section')) {
        isDropdownOpen.value = false
      }
    }

    const showLogoutModal = () => {
      isDropdownOpen.value = false
      isLogoutModalOpen.value = true
    }

    const hideLogoutModal = () => {
      isLogoutModalOpen.value = false
    }

    // Handle logout confirmation
    const confirmLogout = async () => {
      try {
        // --- FIX: Wait for the logout action to complete ---
        await authStore.logout()
        isLogoutModalOpen.value = false
        await router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    onMounted(() => {
      document.addEventListener('click', closeDropdown)
    })

    onUnmounted(() => {
      document.removeEventListener('click', closeDropdown)
    })

    return {
      currentUser,
      fullName,
      userRoleText,
      userAvatar,
      isDropdownOpen,
      isLogoutModalOpen,
      toggleDropdown,
      showLogoutModal,
      hideLogoutModal,
      confirmLogout,
      handleImageError
    }
  }
}
</script>

<style lang="scss" scoped>
/* Your existing styles are fine and do not need changes */
.user-profile-section {
  border-top: 1px solid var(--border-color);
  margin-top: auto;
  
  .user-info {
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    border-radius: 8px;
    margin: 0.5rem;
    
    &:hover {
      background-color: var(--hover-bg);
    }
    
    .user-avatar {
      position: relative;
      
      .avatar-img {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border: 2px solid var(--border-color);
      }
      
      .status-indicator {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        background-color: #10b981;
        border: 2px solid white;
        border-radius: 50%;
      }
    }
    
    .user-details {
      .user-name {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--light);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .user-role {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }
    
    .dropdown-arrow .material-icons {
      font-size: 1.2rem;
      color: var(--text-muted);
      transition: transform 0.3s ease-in-out;
      
      &.rotated {
        transform: rotate(180deg);
      }
    }
  }
  
  .user-dropdown {
    margin: 0 0.5rem 0.5rem 0.5rem;
    
    .dropdown-content {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      color: var(--light);
      text-decoration: none;
      width: 100%;
      text-align: right;
      font-size: 0.875rem;
      transition: all 0.2s ease-in-out;
      cursor: pointer;
      user-select: none;
      
      .material-icons {
        font-size: 1.1rem;
        color: var(--grey);
        transition: color 0.2s ease-in-out;
      }
      
      &:hover {
        background-color: var(--hover-bg);
        
        .material-icons {
          color: var(--primary);
        }
      }
      
      &.logout-item:hover {
        background-color: #fef2f2;
        color: #dc2626;
        
        .material-icons {
          color: #dc2626;
        }
      }
    }
    
    .dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 0.25rem 0;
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
  
  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
}

.modal-body {
  padding: 20px 24px;
  text-align: center;
  
  .modal-text {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }
}

.modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
  
  .btn {
    padding: 8px 24px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    min-width: 80px;
    
    &.btn-cancel {
      background-color: #f3f4f6;
      color: #6b7280;
      
      &:hover {
        background-color: #e5e7eb;
      }
    }
    
    &.btn-confirm {
      background-color: #b91010;
      color: white;
      
      &:hover {
        background-color: #960505;
      }
    }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
}

.dropdown-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: top;
}

.dropdown-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: top;
}

.dropdown-slide-enter-from {
  opacity: 0;
  transform: scaleY(0) translateY(-10px);
}

.dropdown-slide-leave-to {
  opacity: 0;
  transform: scaleY(0) translateY(-10px);
}

.dropdown-slide-enter-to,
.dropdown-slide-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

@media (max-width: 768px) {
  .user-profile-section {
    .user-info {
      .user-avatar .avatar-img {
        width: 35px;
        height: 35px;
      }
      
      .user-details .user-name {
        font-size: 0.8rem;
      }
    }
  }
  
  .modal-container {
    width: 350px;
    
    .modal-header {
      padding: 16px 20px 12px;
    }
    
    .modal-body {
      padding: 16px 20px;
    }
    
    .modal-footer {
      padding: 12px 20px 20px;
    }
  }
}
</style>
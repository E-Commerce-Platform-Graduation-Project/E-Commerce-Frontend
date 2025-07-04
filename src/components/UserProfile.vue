<template>
  <div class="user-profile-section">
    <!-- User Avatar and Info -->
    <div class="user-info d-flex align-items-center p-3" @click="toggleDropdown">
      <div class="user-avatar me-3">
        <img 
          :src="userAvatar" 
          :alt="currentUser?.FullName || 'مستخدم'" 
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

    <!-- Dropdown Menu with smooth transition -->
    <transition name="dropdown-slide">
      <div class="user-dropdown" v-if="isDropdownOpen && sidebarExpanded">
        <div class="dropdown-content">
          <div 
            class="dropdown-item logout-item d-flex align-items-center w-100" 
            @click="handleLogout"
          >
            <span class="material-icons me-2">logout</span>
            <span>تسجيل الخروج</span>
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

    // Get current user from store
    const currentUser = computed(() => authStore.getCurrentUser)

    // Computed user full name
    const fullName = computed(() => {
      if (!currentUser.value) return 'مستخدم'
      return currentUser.value.FullName || 'مستخدم'
    })

    // User role text in Arabic
    const userRoleText = computed(() => {
      const role = currentUser.value?.Role
      switch (role) {
        case 'admin':
          return 'مدير'
        case 'employee':
          return 'موظف'
        case 'manager':
          return 'مدير قسم'
        default:
          return 'مستخدم'
      }
    })

    // User avatar - you can customize this logic
    const userAvatar = computed(() => {
      // If user has profile image
      if (currentUser.value?.ProfileImage) {
        return currentUser.value.ProfileImage
      }
      
      // Default avatar based on user initials or role
      return generateAvatarUrl(fullName.value)
    })

    // Generate avatar URL (you can use a service like UI Avatars)
    const generateAvatarUrl = (name) => {
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=646464&color=ffffff&size=40&rounded=true&font-size=0.6`
    }

    // Handle image error - fallback to generated avatar
    const handleImageError = (event) => {
      event.target.src = generateAvatarUrl(fullName.value)
    }

    // Toggle dropdown
    const toggleDropdown = () => {
      if (!props.sidebarExpanded) return
      isDropdownOpen.value = !isDropdownOpen.value
    }

    // Close dropdown when clicking outside
    const closeDropdown = (event) => {
      if (!event.target.closest('.user-profile-section')) {
        isDropdownOpen.value = false
      }
    }

    // Handle logout
    const handleLogout = async () => {
      try {
        authStore.logout()
        await router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    // Lifecycle hooks
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
      toggleDropdown,
      handleLogout,
      handleImageError
    }
  }
}
</script>

<style lang="scss" scoped>
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

// Smooth dropdown transition
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

// Remove the old slideDown animation as it's replaced by the transition
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Mobile responsiveness
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
}
</style>
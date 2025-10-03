<template>
  <div class="employee-row" :class="{ 'inactive': !employee.is_active }" @click="$emit('view-employee', employee)">
    <!-- Employee Info -->
    <div class="employee-info">
      <!-- Avatar -->
      <div class="employee-avatar" >
        <div class="avatar-circle bg-dark text-white" :class="employee.role.toLowerCase()">
          <i class="fas fa-user"></i>
        </div>
        <div class="status-indicator" :class="{ 'active': employee.is_active }"></div>
      </div>

      <!-- Employee Details -->
      <div class="employee-details">
        <h4 class="employee-name">{{ employee.full_name || 'غير محدد' }}</h4>
        <p class="employee-role">
          <i class="fas fa-briefcase"></i>
          {{ getRoleText(employee.role) }}
        </p>
      </div>
    </div>

    <!-- Phone Number -->
    <div class="username-info">
      <div class="username-text">
        <i class="fas fa-phone"></i>
        <span>{{ employee.phone_number || 'غير محدد' }}</span>
      </div>
    </div>

    <!-- Email Info -->
    <div class="contact-info">
      <div class="phone-number">
        <i class="fas fa-envelope"></i>
        <span>{{ employee.email || 'غير محدد' }}</span>
      </div>
    </div>

    <!-- Role Badge -->
    <div class="role-badge">
      <span class="badge" :class="employee.role.toLowerCase()">
        {{ getRoleText(employee.role) }}
      </span>
    </div>

    <!-- Last Login -->
    <div class="join-date">
      <i class="fas fa-calendar"></i>
      <span>{{ formatDate(employee.last_login) }}</span>
    </div>

    <!-- Actions -->
    <div class="employee-actions">
      <!-- Toggle Status Button -->
      <div class="status-toggle-container">
        <button 
          @click.stop="$emit('toggle-activate', employee)"
          :class="['status-toggle', { 'active': employee.is_active }]"
          :title="employee.is_active ? 'إلغاء التفعيل' : 'تفعيل'"
        >
          <div class="toggle-slider"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

export default {
  name: 'SingleEmployee',
  props: {
    employee: {
      type: Object,
      required: true
    }
  },
  emits: ['edit-employee', 'toggle-activate', 'view-employee'],
  setup(props) {
    const authStore = useAuthStore()

    // Computed
    const canDelete = computed(() => {
      return authStore.isAdmin && props.employee.id !== authStore.user?.id
    })

    // Methods
    const getRoleText = (role) => {
      const roleMap = {
        'ADMIN': 'مدير',
        'EMPLOYEE': 'موظف',
      }
      return roleMap[role] || 'غير محدد'
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'لم يسجل دخول'

      const date = new Date(dateString)
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }

      return date.toLocaleDateString('ar-EG', options)
    }

    return {
      canDelete,
      getRoleText,
      formatDate
    }
  }
}
</script>

<style scoped>
.employee-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr;
  gap: 15px;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.employee-row:hover {
  background: #f8f9fa;
}

.employee-row.inactive {
  opacity: 0.6;
  background: #fafafa;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  min-width: 0;
}

.employee-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.avatar-circle.admin {
  background: tomato;
}

.avatar-circle.employee {
  background: #2883a7;
}


.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: #ccc;
}

.status-indicator.active {
  background: #4CAF50;
}

.employee-details {
  min-width: 0;
  flex: 1;
}

.employee-name {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-role {
  margin: 0;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}

.username-info,
.contact-info,
.join-date {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.username-text,
.phone-number {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.username-text span,
.phone-number span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  text-align: center;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  display: inline-block;
  white-space: nowrap;
}

.badge.admin {
  background: tomato;
}

.badge.employee {
  background: #2883a7;
}

.badge.manager {
  background: #ff9800;
}

.join-date {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  white-space: nowrap;
}

.join-date span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.view-btn {
  background: #e3f2fd;
  color: #2196f3;
}

.view-btn:hover {
  background: #2196f3;
  color: white;
}

.toggle-btn.activate {
  background: #e8f5e8;
  color: #4caf50;
}

.toggle-btn.activate:hover {
  background: #4caf50;
  color: white;
}

.toggle-btn.deactivate {
  background: #ffe0e0;
  color: #ff0000;
}

.toggle-btn.deactivate:hover {
  background: #ff0000;
  color: white;
}

/* Status toggle - copied from customers file */
.status-toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 150;
}

.status-toggle {
  position: relative;
  width: 50px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: #dc3545;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.status-toggle.active {
  background-color: #28a745;
}

.status-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.status-toggle.active .toggle-slider {
  transform: translateX(26px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .employee-row {
    grid-template-columns: 200px 120px 140px 100px 140px 120px;
    gap: 10px;
    padding: 15px 10px;
  }

  .employee-info {
    gap: 10px;
  }

  .avatar-circle {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .employee-name {
    font-size: 14px;
  }

  .employee-role {
    font-size: 12px;
  }

  .username-info,
  .contact-info,
  .join-date {
    font-size: 12px;
  }

  .badge {
    font-size: 10px;
    padding: 3px 8px;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .employee-actions {
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .employee-row {
    grid-template-columns: 180px 100px 120px 80px 120px 100px;
    gap: 8px;
    padding: 12px 8px;
  }

  .avatar-circle {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .employee-name {
    font-size: 13px;
  }

  .employee-role {
    font-size: 11px;
  }

  .username-text,
  .phone-number,
  .join-date {
    font-size: 11px;
  }

  .username-text i,
  .phone-number i,
  .join-date i {
    font-size: 10px;
  }

  .badge {
    font-size: 9px;
    padding: 2px 6px;
  }

  .action-btn {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }

  .employee-actions {
    gap: 3px;
  }
}
</style>
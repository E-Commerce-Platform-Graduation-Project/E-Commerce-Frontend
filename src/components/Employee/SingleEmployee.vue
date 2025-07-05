<template>
  <div class="employee-row" :class="{ 'inactive': !employee.IsActive }" @click="$emit('view-employee', employee)">
    <!-- Employee Info -->
    <div class="employee-info">
      <!-- Avatar -->
      <div class="employee-avatar">
        <div class="avatar-circle" :class="employee.Role">
          <i class="fas fa-user"></i>
        </div>
        <div class="status-indicator" :class="{ 'active': employee.IsActive }"></div>
      </div>

      <!-- Employee Details -->
      <div class="employee-details">
        <h4 class="employee-name">{{ employee.FullName || 'غير محدد' }}</h4>
        <p class="employee-role">
          <i class="fas fa-briefcase"></i>
          {{ getRoleText(employee.Role) }}
        </p>
      </div>
    </div>

    <!-- Username -->
    <div class="username-info">
      <div class="username-text">
        <i class="fas fa-user-circle"></i>
        <span>{{ employee.UserName || 'غير محدد' }}</span>
      </div>
    </div>

    <!-- Contact Info -->
    <div class="contact-info">
      <div class="phone-number">
        <i class="fas fa-phone"></i>
        <span>{{ employee.PhoneNumber || 'غير محدد' }}</span>
      </div>
    </div>

    <!-- Role Badge -->
    <div class="role-badge">
      <span class="badge" :class="employee.Role">
        {{ getRoleText(employee.Role) }}
      </span>
    </div>

    <!-- Join Date -->
    <div class="join-date">
      <i class="fas fa-calendar"></i>
      <span>{{ formatDate(employee.LastLogin) }}</span>
    </div>

    <!-- Actions -->
    <div class="employee-actions">
      <!-- Toggle Status Button -->
      <button @click="$emit('toggle-activate', employee)" class="action-btn toggle-btn"
        :class="{ 'deactivate': employee.IsActive, 'activate': !employee.IsActive }"
        :title="employee.IsActive ? 'إلغاء التفعيل' : 'تفعيل'">
        <i class="fas" :class="employee.IsActive ? 'fa-user-slash' : 'fa-user-check'"></i>
      </button>
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
        admin: 'مدير',
        employee: 'موظف',
        //manager: 'مدير فرع'
      }
      return roleMap[role] || 'غير محدد'
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'غير محدد'

      const date = new Date(dateString)
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }

      return date.toLocaleDateString('en-US', options)
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
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
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
<template>
  <div class="employees-list">
    <!-- Table Container with Horizontal Scroll -->
    <div class="table-container">
      <!-- Table Header -->
      <div class="table-header bg-dark text-white">
        <div class="header-cell name-cell">الاسم</div>
        <div class="header-cell phone-cell">رقم الهاتف</div>
        <div class="header-cell email-cell">البريد الإلكتروني</div>
        <div class="header-cell role-cell">الدور</div>
        <div class="header-cell date-cell">آخر تسجيل دخول</div>
        <div class="header-cell actions-cell">إجراءات</div>
      </div>

      <!-- Empty State -->
      <div v-if="employees.length === 0" class="empty-state">
        <i class="fas fa-users empty-icon"></i>
        <h3>لا يوجد موظفين</h3>
        <p>لم يتم العثور على أي موظفين</p>
      </div>

      <!-- Employees List -->
      <div v-else class="employees-grid">
        <SingleEmployee
          v-for="employee in employees"
          :key="employee.id"
          :employee="employee"
          @edit-employee="handleEditEmployee"
          @toggle-activate="handleToggleActivate"
          @view-employee="handleViewEmployee"
        />
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ confirmAction.title }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ confirmAction.message }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeConfirmModal" class="cancel-btn">إلغاء</button>
          <button @click="executeAction" class="confirm-btn" :class="confirmAction.type">
            {{ confirmAction.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import SingleEmployee from './SingleEmployee.vue'

export default {
  name: 'EmployeesList',
  components: {
    SingleEmployee
  },
  props: {
    employees: {
      type: Array,
      required: true
    }
  },
  emits: ['employee-updated', 'employee-deleted', 'view-employee'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    
    // State
    const showConfirmModal = ref(false)
    const confirmAction = ref({})
    const pendingAction = ref(null)

    // Methods
    const handleEditEmployee = (employee) => {
      // Navigate to edit employee page or open edit modal
      // For now, we'll emit to parent to handle
      console.log('Edit employee:', employee)
      // You can implement edit functionality here
    }

    const handleToggleActivate = async (employee) => {
      const action = employee.is_active ? 'deactivate' : 'activate'
      const actionText = employee.is_active ? 'إلغاء تفعيل' : 'تفعيل'
      
      confirmAction.value = {
        title: `${actionText} الموظف`,
        message: `هل أنت متأكد من ${actionText} الموظف "${employee.full_name}"؟`,
        confirmText: actionText,
        type: employee.is_active ? 'danger' : 'success',
        action: 'toggle-status',
        employee: employee
      }
      
      showConfirmModal.value = true
    }

    const handleViewEmployee = (employee) => {
      emit('view-employee', employee)
    }

    const executeAction = async () => {
      const { action, employee } = confirmAction.value
      
      try {
        if (action === 'toggle-status') {
          await authStore.toggleUserStatus(employee.id, !employee.is_active)
          const updatedEmployee = {
            ...employee,
            is_active: !employee.is_active
          }
          emit('employee-updated', updatedEmployee)
        } else if (action === 'delete') {
          await authStore.deleteUser(employee.id)
          emit('employee-deleted', employee.id)
        }
        
        closeConfirmModal()
      } catch (error) {
        console.error('Error executing action:', error)
        // Handle error (show toast, etc.)
        closeConfirmModal()
      }
    }

    const closeConfirmModal = () => {
      showConfirmModal.value = false
      confirmAction.value = {}
    }

    return {
      showConfirmModal,
      confirmAction,
      handleEditEmployee,
      handleToggleActivate,
      handleViewEmployee,
      executeAction,
      closeConfirmModal
    }
  }
}
</script>

<style scoped>
.employees-list {
  background: white;
  width: 100%;
  overflow: hidden;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.table-container::-webkit-scrollbar {
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr;
  gap: 15px;
  padding: 20px;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-cell {
  text-align: center;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-cell {
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

.employees-grid {
  display: flex;
  flex-direction: column;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 20px 20px 0 20px;
  text-align: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.modal-body {
  padding: 20px;
  text-align: center;
}

.modal-body p {
  margin: 0;
  color: #666;
  font-size: 16px;
  line-height: 1.5;
}

.modal-footer {
  padding: 0 20px 20px 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.cancel-btn, .confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  color: white;
}

.confirm-btn.success {
  background: #4CAF50;
}

.confirm-btn.success:hover {
  background: #45a049;
}

.confirm-btn.danger {
  background: #f44336;
}

.confirm-btn.danger:hover {
  background: #d32f2f;
}

/* Responsive Design - Mobile First Approach */
@media (max-width: 768px) {
  .table-header {
    gap: 10px;
    padding: 15px 10px;
    font-size: 12px;
  }

  .empty-state {
    padding: 40px 20px;
  }

  .empty-icon {
    font-size: 36px;
  }

  .empty-state h3 {
    font-size: 20px;
  }

  .empty-state p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .table-header {
    gap: 8px;
    padding: 12px 8px;
    font-size: 11px;
  }

  .empty-state {
    padding: 30px 15px;
  }

  .empty-icon {
    font-size: 32px;
  }

  .empty-state h3 {
    font-size: 18px;
  }

  .empty-state p {
    font-size: 13px;
  }
}
</style>
<template>
  <div v-if="showLoading" class="loading-overlay">
    <div class="spinner"></div>
    <p class="loading-text">يتم التحميل...</p>
  </div>

  <div v-else id="app" class="rtl-app">
    <div v-if="showWelcomeMessage" class="success-notification">
      {{ showWelcomeMessage }}
    </div>

    <div v-if="!isLoginPage" class="dashboard-layout">
      <Sidebar />
      <main
        class="main-content"
        :class="{ 'sidebar-expanded': sidebarExpanded }"
      >
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
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/authStore'

import { db } from './firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

// Import ALL necessary stores
import { useNotificationStore } from './stores/notificationStore'
import { useSupportTicketNotificationStore } from './stores/supportTicketNotificationStore' // <-- IMPORT NEW STORE

export default {
  name: 'App',
  components: {
    Sidebar
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const sidebarExpanded = ref(localStorage.getItem("is_expanded") === "true")
    const authStore = useAuthStore()
    const appLoaded = ref(false)
    
    // Instantiate ALL stores
    const notificationStore = useNotificationStore();
    const ticketNotificationStore = useSupportTicketNotificationStore(); // <-- INSTANTIATE NEW STORE
    
    let unsubscribeFromOrderNotifications = null;
    let unsubscribeFromTicketNotifications = null; // <-- NEW: For tickets

    const showWelcomeMessage = ref(null);

    const isLoginPage = computed(() => {
      return route.path === '/login'
    })

    const showLoading = computed(() => {
      return !authStore.isInitialized || !appLoaded.value
    })

    // Watcher for the Welcome Message
    watch(() => authStore.user, (newUser, oldUser) => {
      if (newUser && !oldUser) {
        const userName = newUser.full_name || 'المستخدم';
        showWelcomeMessage.value = `مرحباً بك يا ${userName}`;
        setTimeout(() => {
            showWelcomeMessage.value = null;
        }, 3000);
      }
    });

    // Watcher for ALL Push Notifications
    watch(() => authStore.user, (newUser) => {
      if (newUser) {
        // --- Setup Order Notifications Listener ---
        if (!unsubscribeFromOrderNotifications) {
            console.log("User logged in. Listening for UNREAD order notifications...");
            let isInitialLoad = true;
            const notificationsQuery = query(collection(db, 'notifications'), where("is_read", "==", false));

            unsubscribeFromOrderNotifications = onSnapshot(notificationsQuery, (snapshot) => {
                notificationStore.newOrderCount = snapshot.size;

                if (isInitialLoad) {
                    const unreadCount = snapshot.docChanges().length;
                    if (unreadCount > 0) {
                        const summaryNotification = new Notification("طلبات جديدة", {
                            body: `لديك ${unreadCount} طلب جديد لم تقم بمشاهدته.`,
                            icon: "/favicon.ico"
                        });
                        summaryNotification.onclick = () => { router.push('/orders'); };
                    }
                    isInitialLoad = false;
                } else {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "added" && !change.doc.metadata.hasPendingWrites) {
                            const data = change.doc.data();
                            const individualNotification = new Notification(data.title, { body: data.message, icon: "/favicon.ico" });
                            individualNotification.onclick = () => { router.push('/orders'); };
                        }
                    });
                }
            });
        }

        // --- NEW: Setup Ticket Notifications Listener ---
        if (!unsubscribeFromTicketNotifications) {
            console.log("User logged in. Listening for UNREAD ticket notifications...");
            let isInitialLoad = true;
            const ticketsQuery = query(collection(db, 'ticket_notifications'), where("is_read", "==", false)); // <-- Use 'ticket_notifications' collection

            unsubscribeFromTicketNotifications = onSnapshot(ticketsQuery, (snapshot) => {
                ticketNotificationStore.setNewTicketCount(snapshot.size); // <-- Update the new store

                if (isInitialLoad) {
                    const unreadCount = snapshot.docChanges().length;
                    if (unreadCount > 0) {
                        const summaryNotification = new Notification("تذاكر دعم جديدة", {
                            body: `لديك ${unreadCount} تذكرة دعم جديدة لم تقم بمشاهدتها.`, // <-- Custom message
                            icon: "/favicon.ico"
                        });
                        summaryNotification.onclick = () => { router.push('/support-tickets'); }; // <-- Navigate to tickets
                    }
                    isInitialLoad = false;
                } else {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "added" && !change.doc.metadata.hasPendingWrites) {
                            const data = change.doc.data();
                            const individualNotification = new Notification(data.title, { body: data.message, icon: "/favicon.ico" });
                            individualNotification.onclick = () => { router.push('/support-tickets'); }; // <-- Navigate to tickets
                        }
                    });
                }
            });
        }

      } else {
        // --- Teardown Order Listener on Logout ---
        if (unsubscribeFromOrderNotifications) {
          console.log("User logged out. Stopping order Firestore listener.");
          unsubscribeFromOrderNotifications();
          unsubscribeFromOrderNotifications = null;
        }
        // --- NEW: Teardown Ticket Listener on Logout ---
        if (unsubscribeFromTicketNotifications) {
          console.log("User logged out. Stopping ticket Firestore listener.");
          unsubscribeFromTicketNotifications();
          unsubscribeFromTicketNotifications = null;
        }
      }
    }, { immediate: true }); 

    onMounted(async () => {
      if ("Notification" in window && Notification.permission === "default") {
          try {
              const permission = await Notification.requestPermission();
              console.log("Notification permission:", permission);
          } catch (error) {
              console.error("Error requesting notification permission:", error);
          }
      }

      const minLoadingTime = 300;
      const startTime = Date.now()
      
      const handleStorageChange = () => {
        sidebarExpanded.value = localStorage.getItem("is_expanded") === "true"
      }
      
      const handleSidebarToggle = (event) => {
        sidebarExpanded.value = event.detail.expanded
      }
      
      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('sidebarToggle', handleSidebarToggle)
      
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime))
      }
      
      appLoaded.value = true
      
      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('sidebarToggle', handleSidebarToggle)
        if (unsubscribeFromOrderNotifications) {
          unsubscribeFromOrderNotifications();
        }
        if (unsubscribeFromTicketNotifications) { // <-- NEW: Cleanup
          unsubscribeFromTicketNotifications();
        }
      }
    })
    
    return {
      isLoginPage,
      sidebarExpanded,
      authStore,
      showLoading,
      showWelcomeMessage
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
  font-family: "Tajawal", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

/* --- LOADING STYLES --- */
.loading-overlay {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  height: 100vh;
  width: 100%;
  background-color: var(--dark-alt);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  opacity: 1;
  transition: opacity 0.3s ease-out;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #e2e8f0;
  border-top: 5px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--primary);
  font-size: 1.25rem;
  font-weight: 500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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
input,
textarea,
select {
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

/* NEW: Success Notification Styles */
.success-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #28a745;
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  font-size: 1.1rem;
  font-weight: 500;
  animation: slideDown 0.3s ease-out, fadeOut 0.5s ease-in 2.5s forwards;
  direction: rtl;
  text-align: center;
}

@keyframes slideDown {
  from {
    top: -100px;
    opacity: 0;
  }
  to {
    top: 20px;
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

</style>
<template>
  <div v-if="showLoading" class="loading-overlay">
    <div class="spinner"></div>
    <p class="loading-text">يتم التحميل...</p>
  </div>

  <div v-else id="app" class="rtl-app">
    <div
      v-if="isMobileNavOpen"
      class="sidebar-backdrop"
      @click="isMobileNavOpen = false"
    ></div>
    <div v-if="showWelcomeMessage" class="success-notification">
      {{ showWelcomeMessage }}
    </div>

    <div v-if="!isLoginPage" class="dashboard-layout">
      <Sidebar
        :is-mobile-open="isMobileNavOpen"
        @close-mobile-menu="isMobileNavOpen = false"
      />
      <main
        class="main-content"
        :class="{ 'sidebar-expanded': sidebarExpanded }"
      >
        <div class="mobile-header d-lg-none">
          <button
            class="btn btn-link p-1"
            @click.stop="isMobileNavOpen = !isMobileNavOpen"
          >
            <span class="material-icons fs-1 text-dark">menu</span>
          </button>
          <div class="mobile-header-logo">
            <img src="./assets/icons/e-commerce-logo3.png" alt="logo" />
            <span>Flaww Store</span>
          </div>
        </div>
        <div class="p-3 p-md-4">
          <router-view />
        </div>
      </main>
    </div>

    <router-view v-else />
  </div>
</template>

<script>
// App.vue - Updated <script> section with reply notifications

import Sidebar from "./components/Sidebar.vue";
import { computed, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "./stores/authStore";

import { db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

import { useNotificationStore } from "./stores/notificationStore";
import { useSupportTicketNotificationStore } from "./stores/supportTicketNotificationStore";

export default {
  name: "App",
  components: {
    Sidebar,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const sidebarExpanded = ref(localStorage.getItem("is_expanded") === "true");
    const authStore = useAuthStore();
    const appLoaded = ref(false);

    const isMobileNavOpen = ref(false);

    const notificationStore = useNotificationStore();
    const ticketNotificationStore = useSupportTicketNotificationStore();

    let unsubscribeFromOrderNotifications = null;
    let unsubscribeFromTicketNotifications = null;
    let unsubscribeFromReplyNotifications = null; // NEW: Reply notifications listener

    const showWelcomeMessage = ref(null);

    const isLoginPage = computed(() => {
      return route.path === "/login";
    });

    const showLoading = computed(() => {
      return !authStore.isInitialized || !appLoaded.value;
    });

    watch(
      () => authStore.user,
      (newUser, oldUser) => {
        if (newUser && !oldUser) {
          const userName = newUser.full_name || "المستخدم";
          showWelcomeMessage.value = `مرحباً بك يا ${userName}`;
          setTimeout(() => {
            showWelcomeMessage.value = null;
          }, 3000);
        }
      }
    );

    watch(
      () => authStore.user,
      (newUser) => {
        if (newUser) {
          // Order notifications listener (existing)
          if (!unsubscribeFromOrderNotifications) {
            console.log(
              "User logged in. Listening for UNREAD order notifications..."
            );
            let isInitialLoad = true;
            const notificationsQuery = query(
              collection(db, "notifications"),
              where("is_read", "==", false)
            );

            unsubscribeFromOrderNotifications = onSnapshot(
              notificationsQuery,
              (snapshot) => {
                notificationStore.newOrderCount = snapshot.size;

                if (isInitialLoad) {
                  const unreadCount = snapshot.docChanges().length;
                  if (unreadCount > 0) {
                    const summaryNotification = new Notification("طلبات جديدة", {
                      body: `لديك ${unreadCount} طلب جديد لم تقم بمشاهدته.`,
                      icon: "/favicon.ico",
                    });
                    summaryNotification.onclick = () => {
                      router.push("/orders");
                    };
                  }
                  isInitialLoad = false;
                } else {
                  snapshot.docChanges().forEach((change) => {
                    if (
                      change.type === "added" &&
                      !change.doc.metadata.hasPendingWrites
                    ) {
                      const data = change.doc.data();
                      const individualNotification = new Notification(data.title, {
                        body: data.message,
                        icon: "/favicon.ico",
                      });
                      individualNotification.onclick = () => {
                        router.push("/orders");
                      };
                    }
                  });
                }
              }
            );
          }

          // Ticket notifications listener (existing)
          if (!unsubscribeFromTicketNotifications) {
            console.log(
              "User logged in. Listening for UNREAD ticket notifications..."
            );
            let isInitialLoad = true;
            const ticketsQuery = query(
              collection(db, "ticket_notifications"),
              where("is_read", "==", false)
            );

            unsubscribeFromTicketNotifications = onSnapshot(
              ticketsQuery,
              (snapshot) => {
                ticketNotificationStore.setNewTicketCount(snapshot.size);

                if (isInitialLoad) {
                  const unreadCount = snapshot.docChanges().length;
                  if (unreadCount > 0) {
                    const summaryNotification = new Notification(
                      "تذاكر دعم جديدة",
                      {
                        body: `لديك ${unreadCount} تذكرة دعم جديدة لم تقم بمشاهدتها.`,
                        icon: "/favicon.ico",
                      }
                    );
                    summaryNotification.onclick = () => {
                      router.push("/support-tickets");
                    };
                  }
                  isInitialLoad = false;
                } else {
                  snapshot.docChanges().forEach((change) => {
                    if (
                      change.type === "added" &&
                      !change.doc.metadata.hasPendingWrites
                    ) {
                      const data = change.doc.data();
                      const individualNotification = new Notification(data.title, {
                        body: data.message,
                        icon: "/favicon.ico",
                      });
                      individualNotification.onclick = () => {
                        router.push("/support-tickets");
                      };
                    }
                  });
                }
              }
            );
          }

          // NEW: Reply notifications listener
          if (!unsubscribeFromReplyNotifications) {
            console.log(
              "User logged in. Listening for UNREAD reply notifications..."
            );
            let isInitialLoad = true;
            const replyQuery = query(
              collection(db, "reply_notifications"),
              where("is_read", "==", false),
              where("type", "==", "new_reply")
            );

            unsubscribeFromReplyNotifications = onSnapshot(
              replyQuery,
              (snapshot) => {
                // Count is handled in the store via SupportTickets.vue listener
                // This listener is just for browser notifications

                if (isInitialLoad) {
                  const unreadCount = snapshot.docChanges().length;
                  if (unreadCount > 0) {
                    const summaryNotification = new Notification(
                      "ردود جديدة على التذاكر",
                      {
                        body: `لديك ${unreadCount} رد جديد على تذاكر الدعم.`,
                        icon: "/favicon.ico",
                      }
                    );
                    summaryNotification.onclick = () => {
                      router.push("/support-tickets");
                    };
                  }
                  isInitialLoad = false;
                } else {
                  snapshot.docChanges().forEach((change) => {
                    if (
                      change.type === "added" &&
                      !change.doc.metadata.hasPendingWrites
                    ) {
                      const data = change.doc.data();
                      const individualNotification = new Notification(
                        data.title || "رد جديد",
                        {
                          body: data.message || "تم إضافة رد جديد على تذكرة الدعم",
                          icon: "/favicon.ico",
                        }
                      );
                      individualNotification.onclick = () => {
                        // Navigate to specific ticket if ticket_id is available
                        if (data.ticket_id) {
                          router.push(`/support-tickets/${data.ticket_id}`);
                        } else {
                          router.push("/support-tickets");
                        }
                      };
                    }
                  });
                }
              }
            );
          }
        } else {
          // User logged out - cleanup all listeners
          if (unsubscribeFromOrderNotifications) {
            console.log("User logged out. Stopping order Firestore listener.");
            unsubscribeFromOrderNotifications();
            unsubscribeFromOrderNotifications = null;
          }
          if (unsubscribeFromTicketNotifications) {
            console.log("User logged out. Stopping ticket Firestore listener.");
            unsubscribeFromTicketNotifications();
            unsubscribeFromTicketNotifications = null;
          }
          if (unsubscribeFromReplyNotifications) {
            console.log("User logged out. Stopping reply Firestore listener.");
            unsubscribeFromReplyNotifications();
            unsubscribeFromReplyNotifications = null;
          }
        }
      },
      { immediate: true }
    );

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
      const startTime = Date.now();

      const handleStorageChange = () => {
        sidebarExpanded.value = localStorage.getItem("is_expanded") === "true";
      };

      const handleSidebarToggle = (event) => {
        sidebarExpanded.value = event.detail.expanded;
      };

      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("sidebarToggle", handleSidebarToggle);

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      appLoaded.value = true;

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("sidebarToggle", handleSidebarToggle);
        if (unsubscribeFromOrderNotifications) {
          unsubscribeFromOrderNotifications();
        }
        if (unsubscribeFromTicketNotifications) {
          unsubscribeFromTicketNotifications();
        }
        if (unsubscribeFromReplyNotifications) {
          unsubscribeFromReplyNotifications();
        }
      };
    });

    return {
      isLoginPage,
      sidebarExpanded,
      authStore,
      showLoading,
      showWelcomeMessage,
      isMobileNavOpen,
    };
  },
};
</script>

<style lang="scss">
/* --- App.vue STYLES --- */
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
  &.has-mobile-menu-open {
    overflow: hidden;
  }
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dashboard Layout */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* Main content area */
.main-content {
  flex: 1;
  background: #ffffff;
  transition: margin-right 0.3s ease-in-out;

  @media (min-width: 1025px) {
    margin-right: var(--sidebar-collapsed);
    &.sidebar-expanded {
      margin-right: var(--sidebar-width);
    }
  }

  @media (max-width: 1024px) {
    margin-right: 0 !important;
    margin-left: 0;
  }
}

/* --- START: UPDATED Mobile Header and Backdrop Styles --- */
.mobile-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: #fff;
  /* --- THIS IS THE CHANGE --- */
  position: sticky; /* Makes it stick to the top */
  top: 0;           /* Sticks to the very top of the viewport */
  z-index: 1020;    /* Ensures it stays above the page content */
}
/* --- END: UPDATED Mobile Header --- */

.mobile-header-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
  img {
    height: 30px;
    width: auto;
  }
  span {
    font-weight: bold;
    font-size: 1.1rem;
  }
}

.sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
  display: none;
}

@media (max-width: 1024px) {
  .sidebar-backdrop {
    display: block;
  }
}

/* Success Notification Styles */
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
  from { top: -100px; opacity: 0; }
  to { top: 20px; opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Your other global styles remain here */
</style>
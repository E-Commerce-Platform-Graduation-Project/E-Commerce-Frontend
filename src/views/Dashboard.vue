<template>
  <div class="dashboard-container">
    <h2 class="dashboard-title">لوحة البيانات</h2>

    <div v-if="loading" class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-text">جاري التحميل...</p>
    </div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="dashboard-grid">
      <div class="metric-card revenue">
        <span class="metric-icon material-icons text-success">money</span>
        <div class="metric-content">
          <h3>إجمالي الإيرادات</h3>
          <p class="metric-value">{{ formatCurrency(totalRevenue) }}</p>
        </div>
      </div>
      <div class="metric-card orders">
        <span class="metric-icon material-icons text-success">shopping_basket</span>
        <div class="metric-content">
          <h3>إجمالي الطلبات</h3>
          <p class="metric-value">{{ totalOrders }}</p>
        </div>
      </div>
      <div class="metric-card profit">
        <span class="metric-icon material-icons text-success">monetization_on</span>
        <div class="metric-content">
          <h3>إجمالي الأرباح</h3>
          <p class="metric-value">{{ formatCurrency(totalProfit) }}</p>
        </div>
      </div>
      <div class="chart-card orders-status">
        <div class="d-flex align-items-center">
          <span class="material-icons m-2">redeem</span>
          <h3 class="mb-0">حالة الطلبات</h3>
        </div>

        <div class="bar-chart">
          <div v-for="item in sortedOrdersStatusSummary" :key="item.status" class="bar-item">
            <div class="bar-label">{{ translateStatus(item.status) }}</div>
            <div class="bar-wrapper" :class="getStatusWrapperClass(item.status)">
              <div class="bar" :class="[getStatusBarClass(item.status), { 'animate-bar': shouldAnimate }]"
                :style="{ width: shouldAnimate ? `${(item.count / totalOrdersCount) * 100}%` : '0%' }">
                <span class="bar-value">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="chart-card tickets-status">
        <div class="d-flex align-items-center">
          <span class="material-icons m-2">confirmation_number</span>
          <h3 class="mb-0">حالة التذاكر</h3>
        </div>
        <div class="bar-chart">
          <div v-for="item in ticketsStatusSummary" :key="item.status" class="bar-item">
            <div class="bar-label">{{ translateStatus(item.status) }}</div>
            <div class="bar-wrapper" :class="getTicketStatusWrapperClass(item.status)">
              <div class="bar" :class="[getTicketStatusBarClass(item.status), { 'animate-bar': shouldAnimate }]"
                :style="{ width: shouldAnimate ? `${(item.count / totalTicketsCount) * 100}%` : '0%' }">
                <span class="bar-value">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="list-card best-products">

        <div class="d-flex align-items-center">
          <span class="material-icons m-2 text-success">trending_up</span>
          <h3 class="mb-0">الاكثر مبيعاَ</h3>
        </div>
        <div class="product-list">
          <div v-for="(product, index) in bestSellingProducts" :key="product.id" class="product-item">
            <span class="product-rank">{{ index + 1 }}</span>
            <div class="product-info">
              <p class="product-name">{{ product.product__name }}</p>
              <p class="product-sku">{{ product.sku }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="list-card worst-products">
        <div class="d-flex align-items-center">
          <span class="material-icons m-2 text-danger">trending_down</span>
          <h3 class="mb-0">الاقل مبيعاَ</h3>
        </div>
        <div class="product-list">
          <div v-for="(product, index) in worstSellingProducts" :key="product.id" class="product-item">
            <span class="product-rank warning">{{ index + 1 }}</span>
            <div class="product-info">
              <p class="product-name">{{ product.product__name }}</p>
              <p class="product-sku">{{ product.sku }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="list-card low-stock">
        <div class="d-flex align-items-center">
          <span class="material-icons m-2 text-warning">warning</span>
          <h3 class="mb-0">منخفضة المخزون</h3>
        </div>
        <div class="stock-list">
          <div v-for="item in lowStockItems" :key="item.id" class="stock-item"
            :class="{ 'out-of-stock ': item.quantity_in_stock === 0 }">
            <div class="stock-info">
              <p class="product-name">{{ item.product__name }}</p>
              <p class="product-sku">{{ item.sku }}</p>
            </div>
            <span class="stock-quantity" :class="{ 'text-danger': item.quantity_in_stock === 0 }">{{
              item.quantity_in_stock }}</span>
          </div>
        </div>
      </div>
      <div class="list-card top-customers">
        <div class="d-flex align-items-center">
          <span class="material-icons m-2 text-warning">star</span>
          <h3 class="mb-0">افضل العملاء</h3>
        </div>
        <div class="customer-list">
          <div v-for="(customer, index) in topCustomers" :key="customer.id" class="customer-item">
            <span class="customer-rank">{{ index + 1 }}</span>
            <p class="customer-name">{{ customer.full_name }}</p>
          </div>
        </div>
      </div>

      <div class="chart-card orders-city-map">
        <div class="d-flex align-items-center">
          <span class="material-icons m-2">navigation</span>
        <h3 class="mb-0">الطلبات حسب المدينة</h3>
        </div>
        <div class="map-container">
          <div class="map-wrapper">
            <div ref="mapContainer" class="leaflet-map"></div>

            <div v-if="isGeocoding" class="geocoding-overlay">
              <div class="spinner"></div>
              <p>يتم تحميل المدن...</p>
            </div>
          </div>

          <div class="city-stats-grid">
            <div v-for="city in ordersPerCity" :key="city.address__city__name" class="city-stat-card">
              <div class="city-stat-icon"><span class="material-icons text-danger">location_pin</span></div>
              <div class="city-stat-content">
                <h4 class="text-dark">{{ city.address__city__name }}</h4>
                <p class="city-stat-count">{{ city.orders_count }} طلب</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useDashboardStore } from '@/stores/dashboardStore';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default {
  setup() {
    const dashboardStore = useDashboardStore();
    const mapContainer = ref(null);
    const map = ref(null);
    const loading = computed(() => dashboardStore.loading);
    const isGeocoding = ref(false);
    const shouldAnimate = ref(false);

    onMounted(() => {
      dashboardStore.fetchDashboardData();
    });

    const geocodeAndAddPins = async (cityData) => {
      if (!map.value) return;
      isGeocoding.value = true;

      try {
        const promises = cityData.map(async (city) => {
          const cityName = city.address__city__name;
          const query = encodeURIComponent(`${cityName}, Libya`);
          const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

          const response = await fetch(url);
          if (!response.ok) throw new Error('Network response was not ok');
          const results = await response.json();

          if (results.length > 0) {
            return {
              name: cityName,
              count: city.orders_count,
              coords: [parseFloat(results[0].lat), parseFloat(results[0].lon)]
            };
          }
          return null;
        });

        const locations = await Promise.all(promises);

        locations.forEach(location => {
          if (location && location.coords) {
            // Create custom red icon
            const redIcon = L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: iconShadow,
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });

            const marker = L.marker(location.coords, { icon: redIcon })
              .addTo(map.value)
              .bindPopup(`<div style="font-family: 'Tajawal', sans-serif; text-align: center;"><strong style="font-size: 16px;">${location.name}</strong><br><span style="font-size: 14px; color: #4299e1;">${location.count} طلب</span></div>`);

            // Add hover effect
            marker.on('mouseover', function(e) {
              const newIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: iconShadow,
                iconSize: [38, 62],
                iconAnchor: [19, 62],
                popupAnchor: [1, -51],
                shadowSize: [62, 62]
              });
              this.setIcon(newIcon);
              this.openPopup();
            });

            marker.on('mouseout', function(e) {
              this.setIcon(redIcon);
              this.closePopup();
            });
          }
        });
      } catch (error) {
        console.error("An error occurred during geocoding:", error);
      } finally {
        isGeocoding.value = false;
      }
    };

    watch(loading, (newLoading, oldLoading) => {
      if (newLoading === false && oldLoading === true) {
        nextTick(() => {
          // Trigger bar animation after a short delay
          setTimeout(() => {
            shouldAnimate.value = true;
          }, 100);

          if (mapContainer.value && !map.value) {
            map.value = L.map(mapContainer.value).setView([27.5, 17.5], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map.value);
          }
          const cityData = dashboardStore.ordersPerCity;
          if (cityData && cityData.length > 0) {
            geocodeAndAddPins(cityData);
          }
        });
      }
    });

    const formatCurrency = (value) => new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(value);

    // --- NEW: Status Translations ---
    const statusTranslations = {
      // Order Statuses
      'pending': 'قيد الانتظار',
      'processing': 'قيد التجهيز',
      'shipped': 'في الطريق الى الزبون',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      // Ticket Statuses
      'open': 'مفتوحة',
      'in progress': 'قيد المعالجة',
      'closed': 'مغلقة',
    };
    const translateStatus = (status) => {
      const lowerCaseStatus = status.toLowerCase();
      return statusTranslations[lowerCaseStatus] || status;
    };
    // ---------------------------------

    // Sort orders status in the specified order
    const statusOrder = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    const sortedOrdersStatusSummary = computed(() => {
      if (!dashboardStore.ordersStatusSummary) return [];

      return [...dashboardStore.ordersStatusSummary].sort((a, b) => {
        const indexA = statusOrder.indexOf(a.status.toLowerCase());
        const indexB = statusOrder.indexOf(b.status.toLowerCase());
        return indexA - indexB;
      });
    });

    // Calculate total orders count for percentage calculation
    const totalOrdersCount = computed(() => {
      if (!dashboardStore.ordersStatusSummary) return 1;
      return dashboardStore.ordersStatusSummary.reduce((sum, item) => sum + item.count, 0) || 1;
    });

    // --- NEW: Calculate total tickets count ---
    const totalTicketsCount = computed(() => {
      if (!dashboardStore.ticketsStatusSummary) return 1;
      return dashboardStore.ticketsStatusSummary.reduce((sum, item) => sum + item.count, 0) || 1;
    });
    // -----------------------------------------

    const getStatusWrapperClass = (status) => {
      const statusMap = {
        'pending': 'status-wrapper-pending',
        'processing': 'status-wrapper-processing',
        'shipped': 'status-wrapper-shipped',
        'completed': 'status-wrapper-completed',
        'cancelled': 'status-wrapper-cancelled'
      };
      return statusMap[status.toLowerCase()] || '';
    };

    const getStatusBarClass = (status) => {
      const statusMap = {
        'pending': 'status-bar-pending',
        'processing': 'status-bar-processing',
        'shipped': 'status-bar-shipped',
        'completed': 'status-bar-completed',
        'cancelled': 'status-bar-cancelled'
      };
      return statusMap[status.toLowerCase()] || '';
    };

    // --- NEW: Ticket Status Color Mappings ---
    const getTicketStatusWrapperClass = (status) => {
      const statusMap = {
        'open': 'status-wrapper-open',
        'in progress': 'status-wrapper-in-progress',
        'closed': 'status-wrapper-closed'
      };
      return statusMap[status.toLowerCase()] || '';
    };

    const getTicketStatusBarClass = (status) => {
      const statusMap = {
        'open': 'status-bar-open',
        'in progress': 'status-bar-in-progress',
        'closed': 'status-bar-closed'
      };
      return statusMap[status.toLowerCase()] || '';
    };
    // -----------------------------------------

    return {
      loading,
      isGeocoding,
      shouldAnimate,
      error: computed(() => dashboardStore.error),
      totalRevenue: computed(() => dashboardStore.totalRevenue),
      totalOrders: computed(() => dashboardStore.totalOrders),
      totalProfit: computed(() => dashboardStore.totalProfit),
      ordersStatusSummary: computed(() => dashboardStore.ordersStatusSummary),
      sortedOrdersStatusSummary,
      totalOrdersCount,
      ticketsStatusSummary: computed(() => dashboardStore.ticketsStatusSummary),
      totalTicketsCount,
      bestSellingProducts: computed(() => dashboardStore.bestSellingProducts),
      worstSellingProducts: computed(() => dashboardStore.worstSellingProducts),
      lowStockItems: computed(() => dashboardStore.lowStockItems),
      topCustomers: computed(() => dashboardStore.topCustomers),
      ordersPerCity: computed(() => dashboardStore.ordersPerCity),
      formatCurrency,
      getStatusWrapperClass,
      getStatusBarClass,
      getTicketStatusWrapperClass,
      getTicketStatusBarClass,
      translateStatus,
      mapContainer
    };
  }
};
</script>

<style scoped>
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 3rem;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #e2e8f0;
  border-top-color: #000000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 1.5rem;
  color: #4a5568;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.map-wrapper {
  position: relative;
  width: 100%;
}

.geocoding-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.85);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #2d3748;
  font-weight: bold;
  font-size: 1.1rem;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #4299e1;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.leaflet-map {
  width: 100%;
  height: 450px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-container {
  padding: 2rem;
  direction: rtl;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: bold;
  color: #1a202c;
  margin-bottom: 2rem;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: #e53e3e;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  font-size: 3rem;
}

.metric-content h3 {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1a202c;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1a202c;
  margin-bottom: 1.5rem;
}

.orders-status {
  grid-column: span 2;
}

.orders-city-map {
  grid-column: span 2;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bar-label {
  min-width: 150px;
  font-weight: 500;
  color: #4a5568;
  font-size: 0.9rem;
}

.bar-wrapper {
  flex: 1;
  background-color: #edf2f7;
  border-radius: 8px;
  overflow: hidden;
  height: 35px;
}

/* Status-specific wrapper backgrounds (soft colors) */
.status-wrapper-pending {
  background-color: #fff8e1 !important;
}

.status-wrapper-processing {
  background-color: #e0f7fa !important;
}

.status-wrapper-shipped {
  background-color: #f3e5f5 !important;
}

.status-wrapper-completed {
  background-color: #e8f5e9 !important;
}

.status-wrapper-cancelled {
  background-color: #ffebee !important;
}

/* NEW: Ticket Status wrapper backgrounds */
.status-wrapper-open {
  background-color: #f59f0b27 !important;
}

.status-wrapper-in-progress {
  background-color: #06b5d423 !important;
}

.status-wrapper-closed {
  background-color: #22c55e27 !important;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #4299e1, #3182ce);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-left: 0.5rem;
  border-radius: 8px;
  min-width: 60px;
  width: 0%;
}

.bar.animate-bar {
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Status-specific bar colors (dark colors) */
.status-bar-pending {
  background: #f59e0b !important;
}

.status-bar-processing {
  background: #06b6d4 !important;
}

.status-bar-shipped {
  background: #a855f7 !important;
}

.status-bar-completed {
  background: #22c55e !important;
}

.status-bar-cancelled {
  background: #ef4444 !important;
}

/* NEW: Ticket Status bar colors */
.status-bar-open {
  background: #f59e0b !important;
}

.status-bar-in-progress {
  background: #06b6d4 !important;
}

.status-bar-closed {
  background: #22c55e !important;
}

.bar-value {
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  padding: 0 0.5rem;
}

.list-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-card h3 {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1a202c;
  margin-bottom: 1.5rem;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: #c0c0c02a;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.product-item:hover {
  background-color: #edf2f7;
}

.product-rank {
  min-width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #40972f;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.85rem;
}

.product-rank.warning {
  background-color: #ce392e;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.product-sku {
  font-size: 0.85rem;
  color: #718096;
}

.stock-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #c0c0c02a;
  border-radius: 8px;
}

.stock-info {
  flex: 1;
}

.stock-quantity {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fd7e14;
  min-width: 50px;
  text-align: center;
}

.stock-quantity.text-danger {
  color: #ef4444;
}

.customer-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.customer-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: #c0c0c02a;
  border-radius: 8px;
}

.customer-rank {
  min-width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: rgb(0, 0, 0);
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.85rem;
  box-shadow: black 0px 0px 7px 0px;
}

.customer-name {
  font-weight: 600;
  color: #2d3748;
}

.map-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.city-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.city-stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f3f3f3 0%, #ffffff 100%);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.city-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.city-stat-icon {
  font-size: 2rem;
}

.city-stat-content {
  flex: 1;
}

.city-stat-content h4 {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.city-stat-count {
  color: rgba(7, 7, 7, 0.9);
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .orders-status,
  .orders-city-map {
    grid-column: span 1;
  }

  .city-stats-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
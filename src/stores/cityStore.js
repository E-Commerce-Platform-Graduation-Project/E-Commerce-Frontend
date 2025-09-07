import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';

export const useCityStore = defineStore('city', () => {
    const cities = ref([]);
    const regions = ref([]);

    // City functions
    async function fetchCities() {
        try {
            const response = await api.get('products/cities/');
            console.log('Fetched cities:', response.data);
            cities.value = response.data.map(city => ({
                ...city,
                id: parseInt(city.id),
                is_active: city.is_active ?? true,
                default_shipping_cost: city.default_shipping_cost || '0.00',
                create_default_region: city.create_default_region ?? false
            }));
        } catch (error) {
            console.error('Error fetching cities:', error);
            console.error('Full error:', error.response?.data);
        }
    }

    async function addCity(cityData) {
        try {
            const payload = {
                name: cityData.name.trim(),
                create_default_region: cityData.create_default_region || false,
                is_active: cityData.is_active ?? true,
                default_shipping_cost: cityData.default_shipping_cost || '0.00'
            };

            console.log('Sending city payload:', payload);

            const response = await api.post('products/cities/', payload);
            
            const newCity = {
                ...response.data,
                id: parseInt(response.data.id),
                is_active: response.data.is_active ?? true,
                create_default_region: response.data.create_default_region ?? false
            };
            cities.value.push(newCity);
            return { success: true, data: newCity };
        } catch (error) {
            console.error('Error adding city:', error);
            const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                error.response?.data?.name?.[0] ||
                'خطأ في إضافة المدينة';
            return { success: false, error: errorMessage };
        }
    }

    async function editCity(id, cityData) {
        try {
            const payload = {
                name: cityData.name.trim(),
                create_default_region: cityData.create_default_region || false,
                is_active: cityData.is_active ?? true
            };
            
            if (cityData.create_default_region) {
                payload.default_shipping_cost = cityData.default_shipping_cost || '0.00';
            }

            console.log('Editing city with payload:', payload);

            const response = await api.put(`products/cities/${id}/`, payload);
            
            // Find and update the city in the local state with the server response
            const index = cities.value.findIndex(c => c.id === id);
            if (index !== -1) {
                cities.value[index] = { ...cities.value[index], ...response.data };
            }

            return { success: true };
        } catch (error) {
            console.error('Error editing city:', error);
            const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                error.response?.data?.name?.[0] ||
                'خطأ في تعديل المدينة';
            return { success: false, error: errorMessage };
        }
    }

    async function deleteCity(id) {
        try {
            await api.delete(`products/cities/${id}/`);
            cities.value = cities.value.filter(c => c.id !== id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting city:', error);
            const errorMessage = error.response?.data?.error || 'خطأ في حذف المدينة';
            return { success: false, error: errorMessage };
        }
    }

    async function toggleCityStatus(id, isActive) {
        // --- START: MODIFIED CODE ---
        try {
            const city = cities.value.find(c => c.id === id);
            if (!city) return { success: false, error: 'لم يتم العثور على المدينة' };

            const payload = {
                name: city.name,
                create_default_region: city.create_default_region,
                is_active: isActive
            };
            if (city.create_default_region) {
                payload.default_shipping_cost = city.default_shipping_cost;
            }

            // 1. Update the city status on the server
            await api.put(`products/cities/${id}/`, payload);
            
            // 2. Update the city's local state
            city.is_active = isActive;

            // 3. Find all regions for this city and update their status to match the city's new status
            const cityRegions = regions.value.filter(r => r.city === id);
            
            const regionUpdatePromises = cityRegions.map(region => {
                // Only make an API call if the region's current status is different
                if (region.is_active !== isActive) {
                    return toggleRegionStatus(region.id, isActive);
                }
                return Promise.resolve(); // Do nothing if the status is already correct
            });

            // 4. Wait for all region updates to complete
            await Promise.all(regionUpdatePromises);
            console.log(`Synced all regions for city ID ${id} to active state: ${isActive}`);

            return { success: true };
        } catch (error) {
            console.error('Error toggling city status and its regions:', error);
            // Revert city's UI state on failure
            const city = cities.value.find(c => c.id === id);
            if(city) city.is_active = !isActive;
            // Note: Individual region toggles handle their own UI reversion on failure.
            
            const errorMessage = error.response?.data?.error || 'خطأ في تغيير حالة المدينة';
            return { success: false, error: errorMessage };
        }
        // --- END: MODIFIED CODE ---
    }


    // Region functions
    async function fetchRegions(cityId = null) {
        try {
            const url = cityId ? `products/regions/?city=${cityId}` : 'products/regions/';
            const response = await api.get(url);
            
            const processedRegions = response.data.map(region => ({
                ...region,
                id: parseInt(region.id),
                city: parseInt(region.city),
                is_active: region.is_active ?? true,
                shipping_cost: region.shipping_cost || '0.00'
            }));

            if (!cityId) {
                regions.value = processedRegions;
            }
            return processedRegions;

        } catch (error) {
            console.error('Error fetching regions:', error);
            return [];
        }
    }

    async function addRegion(regionData) {
        try {
            const payload = {
                name: regionData.name.trim(),
                shipping_cost: regionData.shipping_cost || '0.00',
                is_active: regionData.is_active ?? true,
                city: parseInt(regionData.city)
            };

            const response = await api.post('products/regions/', payload);
            
            const newRegion = {
                ...response.data,
                id: parseInt(response.data.id),
                city: parseInt(response.data.city),
                is_active: response.data.is_active ?? true
            };
            regions.value.push(newRegion);
            return { success: true, data: newRegion };
        } catch (error) {
            console.error('Error adding region:', error);
            const errorMessage = error.response?.data?.name?.[0] || 'خطأ في إضافة المنطقة';
            return { success: false, error: errorMessage };
        }
    }

    async function editRegion(id, regionData) {
        try {
            const payload = {
                name: regionData.name.trim(),
                shipping_cost: regionData.shipping_cost || '0.00',
                is_active: regionData.is_active ?? true,
                city: parseInt(regionData.city)
            };

            await api.put(`products/regions/${id}/`, payload);
            
            const index = regions.value.findIndex(r => r.id === id);
            if (index !== -1) {
                regions.value[index] = { ...regions.value[index], ...payload, id };
            }
            return { success: true };
        } catch (error) {
            console.error('Error editing region:', error);
            const errorMessage = error.response?.data?.name?.[0] || 'خطأ في تعديل المنطقة';
            return { success: false, error: errorMessage };
        }
    }

    async function deleteRegion(id) {
        try {
            await api.delete(`products/regions/${id}/`);
            regions.value = regions.value.filter(r => r.id !== id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting region:', error);
            const errorMessage = error.response?.data?.error || 'خطأ في حذف المنطقة';
            return { success: false, error: errorMessage };
        }
    }

    async function toggleRegionStatus(id, isActive) {
        try {
            const region = regions.value.find(r => r.id === id);
            if (!region) return { success: false, error: 'لم يتم العثور على المنطقة' };

            const payload = {
                name: region.name,
                shipping_cost: region.shipping_cost,
                is_active: isActive,
                city: region.city
            };

            await api.put(`products/regions/${id}/`, payload);
            
            region.is_active = isActive;
            return { success: true };
        } catch (error) {
            console.error('Error toggling region status:', error);
             // Revert UI on failure
            const region = regions.value.find(r => r.id === id);
            if(region) region.is_active = !isActive;
            
            const errorMessage = error.response?.data?.error || 'خطأ في تغيير حالة المنطقة';
            return { success: false, error: errorMessage };
        }
    }

    // Computed getters
    const activeCities = computed(() => cities.value.filter(city => city.is_active));
    const getRegionsByCityComputed = computed(() => (cityId) => 
        regions.value.filter(region => region.city === cityId)
    );

    return {
        cities,
        regions,
        fetchCities,
        addCity,
        editCity,
        deleteCity,
        toggleCityStatus,
        fetchRegions,
        addRegion,
        editRegion,
        deleteRegion,
        toggleRegionStatus,
        activeCities,
        getRegionsByCity: getRegionsByCityComputed
    };
});
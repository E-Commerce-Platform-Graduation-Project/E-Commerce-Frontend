import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api';

export const usePropStore = defineStore('property', () => {
    const properties = ref([]);

    async function fetchAttributes() {
        try {
            const response = await api.get('products/attributes/');
            console.log('Fetched attributes:', response.data); // Debug log
            // Initialize newValue property for each property
            properties.value = response.data.map(prop => ({
                ...prop,
                id: parseInt(prop.id), // Ensure ID is integer
                newValue: '', // Add this property for form binding
                // Map attribute_values to values for component compatibility
                values: Array.isArray(prop.attribute_values) ? prop.attribute_values : (Array.isArray(prop.values) ? prop.values : [])
            }));
        } catch (error) {
            console.error('Error fetching attributes:', error);
            console.error('Full error:', error.response?.data);
        }
    }

    async function addAttribute(name) {
        try {
            const response = await api.post('products/attributes/', { name });
            // Add newValue property to the new attribute
            const newAttribute = {
                ...response.data,
                newValue: '',
                values: response.data.attribute_values || response.data.values || []
            };
            properties.value.push(newAttribute);
            return { success: true };
        } catch (error) {
            console.error('Error adding attribute:', error);
            const errorMessage = error.response?.data?.non_field_errors?.[0] ||
               error.response?.data?.name?.[0] ||
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'خطأ في إضافة الخاصية';
            return { success: false, error: errorMessage };
        }
    }

    async function editAttribute(id, name) {
        try {
            await api.put(`products/attributes/${id}/`, { name });
            const index = properties.value.findIndex(p => p.id === id);
            if (index !== -1) {
                properties.value[index].name = name;
            }
            return { success: true };
        } catch (error) {
            console.error('Error editing attribute:', error);
            const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                error.response?.data?.name?.[0] ||
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'خطأ في تعديل الخاصية';
            return { success: false, error: errorMessage };
        }
    }

    async function deleteAttribute(id) {
        try {
            await api.delete(`products/attributes/${id}/`);
            properties.value = properties.value.filter(p => p.id !== id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting attribute:', error);
            const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                error.response?.data?.name?.[0] ||
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'خطأ في حذف الخاصية';
            return { success: false, error: errorMessage };
        }
    }

    async function addAttributeValue(attributeId, value) {
        try {
            // Convert attributeId to integer to match Django's expectations
            const payload = {
                attribute: parseInt(attributeId),
                value: value.toString().trim()
            };

            console.log('Sending payload:', payload); // Debug log

            const response = await api.post('products/attribute-values/', payload);
            const index = properties.value.findIndex(p => p.id === attributeId);
            if (index !== -1) {
                // Ensure values array exists before pushing
                if (!properties.value[index].values) {
                    properties.value[index].values = [];
                }
                properties.value[index].values.push(response.data);
                // Clear the input field
                properties.value[index].newValue = '';
            }
            return { success: true };
        } catch (error) {
            console.error('Error adding attribute value:', error);
            console.error('Full error:', error.response?.data); // More detailed error logging

            const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                error.response?.data?.name?.[0] ||
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'خطأ في إضافة القيمة';

            return { success: false, error: errorMessage };
        }
    }

    async function editAttributeValue(id, attributeId, value) {
        try {
            await api.put(`products/attribute-values/${id}/`, {
                attribute: attributeId,
                value
            });
            // Update the local state immediately
            const propIndex = properties.value.findIndex(p => p.id === attributeId);
            if (propIndex !== -1) {
                const valueIndex = properties.value[propIndex].values.findIndex(v => v.id === id);
                if (valueIndex !== -1) {
                    properties.value[propIndex].values[valueIndex].value = value;
                }
            }
            return { success: true };
        } catch (error) {
            console.error('Error editing attribute value:', error);
            const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                error.response?.data?.name?.[0] ||
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'خطأ في تعديل القيمة';
            return { success: false, error: errorMessage };
        }
    }

    async function deleteAttributeValue(id, attributeId) {
        try {
            await api.delete(`products/attribute-values/${id}/`);
            // Remove from local state immediately instead of re-fetching
            const propIndex = properties.value.findIndex(p => p.id === attributeId);
            if (propIndex !== -1) {
                properties.value[propIndex].values = properties.value[propIndex].values.filter(v => v.id !== id);
            }
            return { success: true };
        } catch (error) {
            console.error('Error deleting attribute value:', error);
            const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                error.response?.data?.name?.[0] ||
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'خطأ في حذف القيمة';
            return { success: false, error: errorMessage };
        }
    }

    return {
        properties,
        fetchAttributes,
        addAttribute,
        editAttribute,
        deleteAttribute,
        addAttributeValue,
        editAttributeValue,
        deleteAttributeValue,
    };
});
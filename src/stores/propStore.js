import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePropStore = defineStore('property', () => {
    // Simplified structure to match the database schema
    const properties = ref([
        {
            id: 1,
            name: 'المقاس',
            values: ['S', 'M', 'L', 'XL', '40', '41', '42', 'مقاس واحد'],
            newValue: ''
        },
        {
            id: 2,
            name: 'الخامة',
            values: ['قطن', 'صوف', 'بوليستر','جلد طبيعي'],
            newValue: ''
        },
        {
            id: 3,
            name: 'الموسم',
            values: ['صيفي', 'شتوي'],
            newValue: ''
        }
    ]);

    /**
     * MODIFIED FUNCTION
     * Now accepts a 'name' and an array of 'values' to add a new property in one step.
     */
    function addProperty(name, values = []) {
        if (!name.trim()) return;
        const newId = Math.max(0, ...properties.value.map(p => p.id)) + 1;
        properties.value.push({
            id: newId,
            name,
            values, // Assign the incoming values array directly
            newValue: ''
        });
    }

    function deleteProperty(propId) {
        properties.value = properties.value.filter(p => p.id !== propId);
    }

    function addValueToProperty(propId) {
        const prop = properties.value.find(p => p.id === propId);
        if (prop && prop.newValue.trim() && !prop.values.includes(prop.newValue.trim())) {
            prop.values.push(prop.newValue.trim());
            prop.newValue = ''; // Clear input after adding
        }
    }

    function deleteValueFromProperty(propId, value) {
        const prop = properties.value.find(p => p.id === propId);
        if (prop) {
            prop.values = prop.values.filter(v => v !== value);
        }
    }

    return {
        properties,
        addProperty,
        deleteProperty,
        addValueToProperty,
        deleteValueFromProperty,
    };
});
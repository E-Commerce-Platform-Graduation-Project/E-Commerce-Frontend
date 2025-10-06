<template>
    <div class="container my-5">
        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border" role="status"></div>
            <p class="mt-2">جاري تحميل التفاصيل...</p>
        </div>
        <div v-else-if="!invoice" class="alert alert-danger">
            لم يتم العثور على الفاتورة بالرقم المطلوب.
        </div>

        <div v-else>
            <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div>
                    <h1 class="h3 mb-1">تفاصيل فاتورة الشراء <span class="text-dark">#{{ invoice.id }}</span></h1>
                    <p class="text-muted mb-0">
                        بتاريخ {{ formatDate(invoice.date) }} بواسطة <strong>{{ invoice.user }}</strong>
                    </p>
                </div>

                <div class="d-flex gap-2">
                    <div class="dropdown">
                        <button class="btn btn-primary dropdown-toggle" type="button" id="exportDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                           <i class="fas fa-file-export me-2"></i> تصدير
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="exportDropdown">
                            <li>
                                <a class="dropdown-item" href="#" @click.prevent="exportToPDF">
                                    <i class="fas fa-file-pdf text-danger me-2"></i> PDF تصدير كـ
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" @click.prevent="exportToExcel">
                                    <i class="fas fa-file-excel text-success me-2"></i> Excel تصدير كـ
                                </a>
                            </li>
                        </ul>
                    </div>

                    <router-link to="/purchase-invoices" class="btn btn-outline-secondary">
                       <i class="fas fa-arrow-left me-2"></i> العودة إلى السجل
                    </router-link>
                </div>
                </div>

            <div class="card shadow-sm border-0" id="invoice-content">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th scope="col" style="width: 35%;">المنتج</th>
                                    <th scope="col" style="width: 25%;">رقم المتغير (SKU)</th>
                                    <th scope="col" style="width: 15%;">الخواص</th>
                                    <th scope="col" class="text-center" style="width: 10%;">الكمية</th>
                                    <th scope="col" class="text-center" style="width: 15%;">سعر الوحدة</th>
                                    <th scope="col" class="text-end">الإجمالي الفرعي</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in invoice.items" :key="index">
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <img v-if="getItemImage(item)" 
                                                :src="getItemImage(item)" 
                                                :alt="item.productName"
                                                class="product-img mx-3"
                                                @error="handleImageError">
                                            <div v-else class="product-placeholder me-3">
                                                <i class="fas fa-box"></i>
                                            </div>
                                            <div>
                                                <div class="fw-bold">{{ item.productName }}</div>
                                                <small class="text-muted">SKU: {{ item.variantSku }}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <code class="text-muted">{{ item.variantSku }}</code>
                                    </td>
                                    <td>
                                        <div class="props-display">
                                            <span class="prop-chip" v-if="extractColorFromSku(item.variantSku)">
                                                <span class="prop-color-dot"
                                                    :style="{ backgroundColor: extractColorFromSku(item.variantSku) }"></span>
                                                <strong class="prop-name">اللون:</strong>
                                                {{ extractColorFromSku(item.variantSku) }}
                                            </span>
                                            <span class="prop-chip" v-if="extractSizeFromSku(item.variantSku)">
                                                <strong class="prop-name">المقاس:</strong>
                                                {{ extractSizeFromSku(item.variantSku) }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="text-center">{{ item.quantity }}</td>
                                    <td class="text-center">{{ formatCurrency(item.costPerUnit) }}</td>
                                    <td class="text-end fw-bold">{{ formatCurrency(item.costPerUnit * item.quantity) }}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="table-light">
                                    <td colspan="5" class="text-start fw-bold h5">الإجمالي الكلي للفاتورة</td>
                                    <td class="text-end fw-bold h5 text-success">{{ formatCurrency(invoice.totalAmount) }}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const route = useRoute();
const productStore = useProductStore();

const isLoading = ref(true);
const invoiceId = computed(() => parseInt(route.params.id));
const invoice = computed(() => productStore.getInvoiceById(invoiceId.value));

onMounted(async () => {
    isLoading.value = true;
    await productStore.fetchPurchaseInvoiceDetails(invoiceId.value);
    isLoading.value = false;
});

const exportToPDF = async () => {
    if (!invoice.value) return;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Helper function to format currency for PDF (avoiding Arabic text issues)
    const formatPDFCurrency = (amount) => {
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ل`;
    };

    const fontResponse = await fetch('/NotoSansArabic-Regular.ttf');
    const fontBlob = await fontResponse.blob();
    const fontReader = new FileReader();

    fontReader.onload = async function (event) {
        const fontBase64 = event.target.result.split(',')[1];
        
        doc.addFileToVFS('NotoSansArabic-Regular.ttf', fontBase64);
        doc.addFont('NotoSansArabic-Regular.ttf', 'NotoSansArabic', 'normal');
        doc.setFont('NotoSansArabic');

        // Add logo
        try {
            const logoResponse = await fetch('/e-commerce-logo3.png');
            const logoBlob = await logoResponse.blob();
            const logoBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(logoBlob);
            });
            doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30);
        } catch (error) {
            console.error('Error loading logo:', error);
        }

        doc.setFontSize(18);
        doc.text(`فاتورة شراء رقم: #${invoice.value.id}`, 200, 20, { align: 'right' });

        doc.setFontSize(10);
        doc.text(`التاريخ: ${formatDate(invoice.value.date)}`, 200, 30, { align: 'right' });
        doc.text(`بواسطة: ${invoice.value.user}`, 200, 35, { align: 'right' });

        const head = [[
            'الإجمالي الفرعي',
            'سعر الوحدة',
            'الكمية',
            'المنتج'
        ]];
        
        const body = invoice.value.items.map(item => [
            formatPDFCurrency(item.costPerUnit * item.quantity),
            formatPDFCurrency(item.costPerUnit),
            item.quantity,
            item.productName,
        ]);

        autoTable(doc, {
            head: head,
            body: body,
            startY: 45,
            theme: 'grid',
            styles: { 
                font: 'NotoSansArabic',
                fontStyle: 'normal',
                fontSize: 10,
                halign: 'right'
            },
            headStyles: { 
                font: 'NotoSansArabic',
                halign: 'right',
                fillColor: [0, 0, 0],
                textColor: [255, 255, 255]
            },
            bodyStyles: { 
                font: 'NotoSansArabic',
                halign: 'right'
            },
            columnStyles: {
                0: { halign: 'right' },
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            },
            margin: { left: 10, right: 10 }
        });

        const finalY = doc.lastAutoTable.finalY;
        
        // Add total in a styled table row matching the main table structure
        autoTable(doc, {
            body: [[
                formatPDFCurrency(invoice.value.totalAmount),
                '',
                '',
                'الإجمالي الكلي'
            ]],
            startY: finalY + 2,
            theme: 'plain',
            styles: { 
                font: 'NotoSansArabic',
                fontSize: 12,
                fontStyle: 'bold',
                fillColor: [240, 240, 240]
            },
            columnStyles: {
                0: { halign: 'right' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' }
            },
            margin: { left: 10, right: 10 }
        });

        doc.save(`invoice-${invoice.value.id}.pdf`);
    };

    fontReader.readAsDataURL(fontBlob);
};

const exportToExcel = () => {
    if (!invoice.value) return;

    const dataForSheet = invoice.value.items.map(item => ({
        'المنتج': item.productName,
        'رقم المتغير (SKU)': item.variantSku,
        'الكمية': item.quantity,
        'سعر الوحدة': item.costPerUnit,
        'الإجمالي الفرعي': item.costPerUnit * item.quantity
    }));

    dataForSheet.push({});
    dataForSheet.push({
        'المنتج': 'الإجمالي الكلي للفاتورة',
        'الإجمالي الفرعي': invoice.value.totalAmount
    });

    const ws = XLSX.utils.json_to_sheet(dataForSheet);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Invoice ${invoice.value.id}`);
    XLSX.writeFile(wb, `invoice-${invoice.value.id}.xlsx`);
};

const getItemImage = (item) => {
    if (item.images && item.images.length > 0) {
        const sortedImages = [...item.images].sort((a, b) => 
            (a.display_order || 0) - (b.display_order || 0)
        );
        return sortedImages[0].image;
    }
    return null;
};

const handleImageError = (event) => {
    event.target.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = 'product-placeholder me-3';
    placeholder.innerHTML = '<i class="fas fa-box"></i>';
    event.target.parentNode.insertBefore(placeholder, event.target);
};

const extractColorFromSku = (variantSku) => {
    const parts = variantSku.split('-');
    for (const part of parts) {
        if (part.startsWith('#') && part.length === 7) {
            return part;
        }
    }
    return null;
};

const extractSizeFromSku = (variantSku) => {
    const parts = variantSku.split('-');
    const lastPart = parts[parts.length - 1];
    if (lastPart.startsWith('#')) {
        return parts[parts.length - 2] || '';
    }
    return lastPart || '';
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-LY', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-LY', { 
        style: 'currency', 
        currency: 'LYD' 
    }).format(amount);
};
</script>

<style scoped>
.card {
    border-radius: 0.75rem;
}
.table {
    font-size: 0.95rem;
}
.product-img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
}
.product-placeholder {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 0.5rem;
    font-size: 1.5rem;
}
.table tfoot tr {
    border-top: 2px solid #dee2e6;
}
.fw-medium {
    font-weight: 500;
}
.props-display {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}
.prop-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    background-color: #eef2ff;
    color: #0f0f0f;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}
.prop-color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
}
.prop-name {
    color: #64748b;
}
</style>
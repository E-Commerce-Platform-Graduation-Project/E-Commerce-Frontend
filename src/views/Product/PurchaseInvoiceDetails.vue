<template>
    <div class="container mobile-invoice-details-container my-5">
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

                <div class="d-flex gap-2 ms-3">
                    <div class="dropdown">
                        <button class="btn btn-primary dropdown-toggle" type="button" id="exportDropdown"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-file-export me-2"></i> تصدير
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="exportDropdown">
                            <li>
                                <a class="dropdown-item" href="#" @click.prevent="exportToPDF">
                                    <i class="fas fa-file-pdf text-danger me-2"></i>تصدير كـ PDF
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" @click.prevent="exportToExcel">
                                    <i class="fas fa-file-excel text-success me-2"></i>تصدير كـ Excel
                                </a>
                            </li>
                        </ul>
                    </div>

                    <button @click="goBack" class="btn btn-outline-secondary">
                        <i class="fas fa-arrow-left me-2"></i> العودة إلى السجل
                    </button>
                </div>
            </div>

            <div class="invoice-table-wrapper">
                <div class="invoice-table-scroll-container">
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
                                                    <img v-if="getItemImage(item)" :src="getItemImage(item)"
                                                        :alt="item.productName" class="product-img mx-3"
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
                                            <td class="text-end fw-bold">{{ formatCurrency(item.costPerUnit *
                                                item.quantity) }}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr class="table-light">
                                            <td colspan="5" class="text-start fw-bold h5">الإجمالي الكلي للفاتورة</td>
                                            <td class="text-end fw-bold h5 text-success">{{
                                                formatCurrency(invoice.totalAmount) }}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const route = useRoute();
const router = useRouter();
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

    // Try to load custom font, fallback to Times if it fails
    let fontLoaded = false;
    try {
        const fontResponse = await fetch('/NotoSansArabic-Regular.ttf');
        if (fontResponse.ok) {
            const fontBlob = await fontResponse.blob();
            const fontBase64 = await new Promise((resolve, reject) => {
                const fontReader = new FileReader();
                fontReader.onload = (e) => resolve(e.target.result.split(',')[1]);
                fontReader.onerror = reject;
                fontReader.readAsDataURL(fontBlob);
            });

            doc.addFileToVFS('NotoSansArabic-Regular.ttf', fontBase64);
            doc.addFont('NotoSansArabic-Regular.ttf', 'NotoSansArabic', 'normal');
            doc.setFont('NotoSansArabic');
            fontLoaded = true;
        }
    } catch (error) {
        console.warn('Failed to load custom font, using default:', error);
    }

    // If custom font failed, use Times (has better Arabic support than Helvetica)
    if (!fontLoaded) {
        doc.setFont('times', 'normal');
    }

    const processContent = async () => {
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
            'الخواص',
            'SKU',
            'المنتج'
        ]];

        const body = invoice.value.items.map(item => {
            const color = extractColorFromSku(item.variantSku);
            const size = extractSizeFromSku(item.variantSku);
            let properties = [];
            if (color) {
                // Color with placeholder for circle after the hex code
                properties.push(`اللون: ${color} ○`);
            }
            if (size) {
                properties.push(`المقاس: ${size}`);
            }
            const propsText = properties.join('\n'); // Use newline instead of |

            return [
                formatPDFCurrency(item.costPerUnit * item.quantity),
                formatPDFCurrency(item.costPerUnit),
                item.quantity,
                propsText,
                item.variantSku,
                item.productName,
            ];
        });

        const currentFont = fontLoaded ? 'NotoSansArabic' : 'times';

        autoTable(doc, {
            head: head,
            body: body,
            startY: 45,
            theme: 'grid',
            styles: {
                font: currentFont,
                fontStyle: 'normal',
                fontSize: 9,
                halign: 'right',
                cellPadding: 2
            },
            headStyles: {
                font: currentFont,
                halign: 'right',
                fillColor: [0, 0, 0],
                textColor: [255, 255, 255]
            },
            bodyStyles: {
                font: currentFont,
                halign: 'right',
                valign: 'middle'
            },
            columnStyles: {
                0: { halign: 'right', cellWidth: 25 },
                1: { halign: 'right', cellWidth: 25 },
                2: { halign: 'center', cellWidth: 15 },
                3: { halign: 'right', cellWidth: 40 },
                4: { halign: 'right', cellWidth: 30 },
                5: { halign: 'right', cellWidth: 'auto' }
            },
            margin: { left: 10, right: 10 },
            didDrawCell: (data) => {
                // Draw color circles in the properties column (column index 3)
                if (data.section === 'body' && data.column.index === 3) {
                    const item = invoice.value.items[data.row.index];
                    const color = extractColorFromSku(item.variantSku);

                    if (color) {
                        // Convert hex color to RGB
                        const hexToRgb = (hex) => {
                            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                            return result ? {
                                r: parseInt(result[1], 16),
                                g: parseInt(result[2], 16),
                                b: parseInt(result[3], 16)
                            } : null;
                        };

                        const rgb = hexToRgb(color);
                        if (rgb) {
                            // Position circle after the color hex code
                            const circleRadius = 2.5;
                            const size = extractSizeFromSku(item.variantSku);

                            // Calculate position: far left of cell (after hex code in RTL)
                            let yOffset = 0;
                            if (size) {
                                yOffset = -3; // Move up to align with first line (اللون line)
                            }

                            const xPos = data.cell.x + 4; // Position at the start (after color code)
                            const yPos = data.cell.y + (data.cell.height / 2) + yOffset;

                            doc.setFillColor(rgb.r, rgb.g, rgb.b);
                            doc.setDrawColor(180, 180, 180); // Gray border
                            doc.setLineWidth(0.2);
                            doc.circle(xPos, yPos, circleRadius, 'FD'); // 'FD' = Fill and Draw border
                        }
                    }
                }
            }
        });

        const finalY = doc.lastAutoTable.finalY;

        // Add total in a styled table row matching the main table structure
        autoTable(doc, {
            body: [[
                formatPDFCurrency(invoice.value.totalAmount),
                '',
                '',
                '',
                '',
                'الإجمالي الكلي للفاتورة'
            ]],
            startY: finalY + 2,
            theme: 'plain',
            styles: {
                font: currentFont,
                fontSize: 12,
                fontStyle: 'normal',   // ← was 'bold', which breaks Arabic fonts
                halign: 'right',       // ← add this
                fillColor: [240, 240, 240]
            },
            columnStyles: {
                0: { halign: 'right', cellWidth: 25 },
                1: { halign: 'center', cellWidth: 25 },
                2: { halign: 'center', cellWidth: 15 },
                3: { halign: 'center', cellWidth: 35 },
                4: { halign: 'center', cellWidth: 30 },
                5: { halign: 'right', cellWidth: 'auto' }
            },
            margin: { left: 10, right: 10 }
        });

        doc.save(`invoice-${invoice.value.id}.pdf`);
    };

    await processContent();
};

const exportToExcel = async () => {
    if (!invoice.value) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create header rows with logo placeholder and info
    const headerData = [
        ['', '', '', '', '', 'فاتورة شراء رقم: #' + invoice.value.id],
        ['', '', '', '', '', 'التاريخ: ' + formatDate(invoice.value.date)],
        ['', '', '', '', '', 'بواسطة: ' + invoice.value.user],
        [] // Empty row
    ];

    // Create table headers (RTL order - right to left)
    const tableHeaders = [
        'الإجمالي الفرعي',
        'سعر الوحدة',
        'الكمية',
        'الخواص',
        'SKU',
        'المنتج'
    ];

    // Create data rows (RTL order - right to left)
    const dataRows = invoice.value.items.map(item => {
        const color = extractColorFromSku(item.variantSku);
        const size = extractSizeFromSku(item.variantSku);
        let properties = [];
        if (color) properties.push(`اللون: ${color}`);
        if (size) properties.push(`المقاس: ${size}`);

        return [
            item.costPerUnit * item.quantity, // الإجمالي الفرعي
            item.costPerUnit,                  // سعر الوحدة
            item.quantity,                     // الكمية
            properties.join(' | '),            // الخواص
            item.variantSku,                   // SKU
            item.productName                   // المنتج
        ];
    });

    // Add empty row and total
    const totalRow = [
        invoice.value.totalAmount,
        '',
        '',
        '',
        '',
        'الإجمالي الكلي للفاتورة'
    ];

    // Combine all data
    const allData = [
        ...headerData,
        tableHeaders,
        ...dataRows,
        [], // Empty row before total
        totalRow
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths
    ws['!cols'] = [
        { wch: 18 }, // الإجمالي الفرعي
        { wch: 15 }, // سعر الوحدة
        { wch: 10 }, // الكمية
        { wch: 35 }, // الخواص
        { wch: 40 }, // SKU
        { wch: 30 }  // المنتج
    ];

    // Set row heights (first 3 rows taller for logo area)
    ws['!rows'] = [
        { hpt: 30 }, // Row 0
        { hpt: 25 }, // Row 1
        { hpt: 25 }, // Row 2
        { hpt: 20 }  // Row 3 (empty)
    ];

    // Apply RTL and styling
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;

            // Initialize cell style
            if (!ws[cellAddress].s) ws[cellAddress].s = {};

            // Apply RTL alignment
            ws[cellAddress].s.alignment = {
                horizontal: 'right',
                vertical: 'center',
                readingOrder: 2 // RTL
            };

            // Header rows styling (0-2)
            if (R <= 2) {
                ws[cellAddress].s.font = { bold: true, sz: 12 };
                ws[cellAddress].s.alignment = {
                    horizontal: 'right',
                    vertical: 'center',
                    readingOrder: 2
                };
            }

            // Table header row styling (row 4, index 4)
            if (R === 4) {
                ws[cellAddress].s.fill = { fgColor: { rgb: "000000" } };
                ws[cellAddress].s.font = { bold: true, color: { rgb: "FFFFFF" }, sz: 11 };
                ws[cellAddress].s.alignment = {
                    horizontal: 'center',
                    vertical: 'center',
                    readingOrder: 2
                };
                ws[cellAddress].s.border = {
                    top: { style: 'thin', color: { rgb: "FFFFFF" } },
                    bottom: { style: 'thin', color: { rgb: "FFFFFF" } },
                    left: { style: 'thin', color: { rgb: "FFFFFF" } },
                    right: { style: 'thin', color: { rgb: "FFFFFF" } }
                };
            }

            // Data rows styling
            if (R > 4 && R < range.e.r - 1) {
                ws[cellAddress].s.border = {
                    top: { style: 'thin', color: { rgb: "E0E0E0" } },
                    bottom: { style: 'thin', color: { rgb: "E0E0E0" } },
                    left: { style: 'thin', color: { rgb: "E0E0E0" } },
                    right: { style: 'thin', color: { rgb: "E0E0E0" } }
                };
            }

            // Total row styling
            if (R === range.e.r) {
                ws[cellAddress].s.fill = { fgColor: { rgb: "F0F0F0" } };
                ws[cellAddress].s.font = { bold: true, sz: 12 };
                ws[cellAddress].s.border = {
                    top: { style: 'medium', color: { rgb: "000000" } },
                    bottom: { style: 'medium', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "E0E0E0" } },
                    right: { style: 'thin', color: { rgb: "E0E0E0" } }
                };
            }

            // Center align for quantity column (column index 2)
            if (C === 2 && R > 4 && R < range.e.r) {
                ws[cellAddress].s.alignment = {
                    horizontal: 'center',
                    vertical: 'center',
                    readingOrder: 2
                };
            }

            // Format currency cells (columns 0 and 1)
            if ((C === 0 || C === 1) && R > 4) {
                if (typeof ws[cellAddress].v === 'number') {
                    ws[cellAddress].z = '#,##0.00 "د.ل"';
                }
            }
        }
    }

    // Add logo image
    try {
        const logoResponse = await fetch('/e-commerce-logo3.png');
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result.split(',')[1]);
            reader.readAsDataURL(logoBlob);
        });

        // Add image to workbook
        if (!wb.Workbook) wb.Workbook = {};
        if (!wb.Workbook.Sheets) wb.Workbook.Sheets = [];

        const wsIndex = 0;
        if (!wb.Workbook.Sheets[wsIndex]) {
            wb.Workbook.Sheets[wsIndex] = {};
        }

        // Add image using xlsx image support
        if (!ws['!images']) ws['!images'] = [];
        ws['!images'].push({
            name: 'logo.png',
            data: logoBase64,
            opts: {
                base64: true
            },
            position: {
                type: 'twoCellAnchor',
                from: { col: 0, row: 0 },
                to: { col: 1, row: 2 }
            }
        });
    } catch (error) {
        console.error('Error loading logo for Excel:', error);
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `فاتورة ${invoice.value.id}`);

    // Write file with bookType xlsx to support images
    XLSX.writeFile(wb, `invoice-${invoice.value.id}.xlsx`, { bookType: 'xlsx', type: 'binary' });
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

const goBack = () => {
    const returnPage = route.query.returnPage;
    if (returnPage) {
        router.push({ path: '/purchase-invoices', query: { page: returnPage } });
    } else {
        router.push('/purchase-invoices');
    }
};
</script>

<style scoped>
/* IMPORTANT: Allow horizontal scroll on mobile */
:deep(.main-content) {
    overflow-x: visible !important;
}

@media (max-width: 1170px) {

    :deep(.main-content),
    :deep(.p-3),
    :deep(.p-md-4) {
        overflow-x: visible !important;
        overflow-y: visible !important;
    }
}

/* Container adjustments */
.mobile-invoice-details-container {
    overflow: visible;
}

@media (max-width: 1170px) {
    .mobile-invoice-details-container {
        overflow-x: hidden !important;
        overflow-y: visible !important;
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
    }
}

/* Invoice table wrapper and scroll container */
.invoice-table-wrapper {
    position: relative;
    width: 100%;
    overflow: visible;
    margin-left: -0.5rem;
    margin-right: -0.5rem;
}

@media (max-width: 1170px) {
    .invoice-table-wrapper {
        overflow: visible !important;
        max-width: 100vw;
        width: calc(100% + 1rem);
    }
}

.invoice-table-scroll-container {
    width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
    position: relative;
}

@media (max-width: 1170px) {
    .invoice-table-scroll-container {
        overflow-x: scroll !important;
        overflow-y: visible !important;
        border-radius: 0 0 12px 12px;
        width: 100%;
        max-width: 100%;
    }
}

.invoice-table-scroll-container::-webkit-scrollbar {
    height: 8px;
}

.invoice-table-scroll-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.invoice-table-scroll-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
}

.invoice-table-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #555;
}

.card {
    border-radius: 0.75rem;
    min-width: 100%;
}

@media (max-width: 1170px) {
    .card {
        min-width: 1000px;
        width: 1000px;
    }
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

/* Responsive design */
@media (max-width: 1170px) {
    .invoice-table-wrapper {
        overflow: visible !important;
        max-width: 100vw;
        width: calc(100% + 1rem);
    }

    .invoice-table-scroll-container {
        overflow-x: scroll !important;
        overflow-y: visible !important;
    }
}

@media (max-width: 768px) {
    .d-flex.gap-2 {
        flex-direction: column;
        gap: 10px !important;
    }

    .btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
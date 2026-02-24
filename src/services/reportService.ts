import * as XLSX from 'xlsx';
import { CaseRecord } from '../types';

export interface ReportFilters {
    dateRange?: { start: string; end: string };
    status?: string;
    responsible?: string;
    situation?: string;
    category?: string;
}

export interface ReportData {
    title: string;
    headers: string[];
    rows: any[][];
    summary?: { label: string; value: string | number }[];
}

// Apply filters to case history
export const filterCases = (cases: CaseRecord[], filters: ReportFilters): CaseRecord[] => {
    return cases.filter(c => {
        // Date range filter
        if (filters.dateRange?.start && filters.dateRange?.end) {
            const caseDate = new Date(c.createdAt);
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            endDate.setHours(23, 59, 59, 999);

            if (caseDate < startDate || caseDate > endDate) return false;
        }

        // Status filter
        if (filters.status && filters.status !== 'all' && c.status !== filters.status) {
            return false;
        }

        // Responsible filter
        if (filters.responsible && filters.responsible !== 'all' && c.fileConfig.responsibleUserId !== filters.responsible) {
            return false;
        }

        // Situation filter
        if (filters.situation && filters.situation !== 'all' && (c.situation || 'Iniciado') !== filters.situation) {
            return false;
        }

        // Category filter
        if (filters.category && filters.category !== 'all' && c.fileConfig.category !== filters.category) {
            return false;
        }

        return true;
    });
};

// Generate General Report
export const generateGeneralReport = (cases: CaseRecord[], filters: ReportFilters): ReportData => {
    const filteredCases = filterCases(cases, filters);

    return {
        title: 'Listado General de Expedientes',
        headers: ['Expediente', 'Cliente', 'Tipo', 'Estado', 'Situación', 'Fecha Apertura', 'Fecha Cierre', 'Responsable'],
        rows: filteredCases.map(c => [
            c.fileNumber,
            `${c.client.surnames} ${c.client.firstName}`,
            c.fileConfig.category,
            c.status,
            c.situation || 'Iniciado',
            new Date(c.createdAt).toLocaleDateString('es-ES'),
            c.closedAt ? new Date(c.closedAt).toLocaleDateString('es-ES') : '-',
            c.fileConfig.responsibleUserId || '-'
        ]),
        summary: [
            { label: 'Total Expedientes', value: filteredCases.length },
            { label: 'Abiertos', value: filteredCases.filter(c => c.status !== 'Cerrado').length },
            { label: 'Cerrados', value: filteredCases.filter(c => c.status === 'Cerrado').length }
        ]
    };
};

// Generate By Status Report
export const generateByStatusReport = (cases: CaseRecord[], filters: ReportFilters): ReportData => {
    const filteredCases = filterCases(cases, filters);

    // Group by status
    const grouped = filteredCases.reduce((acc, c) => {
        const status = c.status || 'Sin Estado';
        if (!acc[status]) acc[status] = [];
        acc[status].push(c);
        return acc;
    }, {} as Record<string, CaseRecord[]>);

    const rows: any[][] = [];
    Object.entries(grouped).forEach(([status, statusCases]) => {
        rows.push([status, statusCases.length, `${((statusCases.length / filteredCases.length) * 100).toFixed(1)}%`]);
    });

    return {
        title: 'Expedientes por Estado',
        headers: ['Estado', 'Cantidad', 'Porcentaje'],
        rows,
        summary: [
            { label: 'Total Expedientes', value: filteredCases.length },
            { label: 'Estados Diferentes', value: Object.keys(grouped).length }
        ]
    };
};

// Generate By Client Report
export const generateByClientReport = (cases: CaseRecord[], filters: ReportFilters): ReportData => {
    const filteredCases = filterCases(cases, filters);

    // Group by client NIF
    const grouped = filteredCases.reduce((acc, c) => {
        const key = c.client.nif || 'Sin NIF';
        if (!acc[key]) {
            acc[key] = {
                name: `${c.client.surnames || ''} ${c.client.firstName || ''}`,
                nif: c.client.nif || '',
                cases: []
            };
        }
        acc[key].cases.push(c);
        return acc;
    }, {} as Record<string, { name: string; nif: string; cases: CaseRecord[] }>);

    const rows = Object.values(grouped)
        .sort((a, b) => b.cases.length - a.cases.length)
        .map(client => [
            client.name,
            client.nif,
            client.cases.length,
            client.cases.filter(c => c.status === 'Cerrado').length,
            client.cases.filter(c => c.status !== 'Cerrado').length
        ]);

    return {
        title: 'Expedientes por Cliente',
        headers: ['Cliente', 'NIF/CIF', 'Total Expedientes', 'Cerrados', 'Abiertos'],
        rows,
        summary: [
            { label: 'Total Clientes', value: Object.keys(grouped).length },
            { label: 'Total Expedientes', value: filteredCases.length }
        ]
    };
};

// Generate Stalled Cases Report (no movement in 30 days)
export const generateStalledReport = (cases: CaseRecord[], filters: ReportFilters): ReportData => {
    const filteredCases = filterCases(cases, filters);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stalledCases = filteredCases.filter(c => {
        if (c.status === 'Cerrado') return false;
        const lastUpdate = new Date(c.updatedAt);
        return lastUpdate < thirtyDaysAgo;
    });

    return {
        title: 'Expedientes Estancados (>30 días sin movimiento)',
        headers: ['Expediente', 'Cliente', 'Estado', 'Última Actualización', 'Días sin Movimiento'],
        rows: stalledCases.map(c => {
            const daysSinceUpdate = Math.floor((Date.now() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
            return [
                c.fileNumber,
                `${c.client.surnames} ${c.client.firstName}`,
                c.status,
                new Date(c.updatedAt).toLocaleDateString('es-ES'),
                daysSinceUpdate
            ];
        }),
        summary: [
            { label: 'Expedientes Estancados', value: stalledCases.length },
            { label: 'Total Expedientes Activos', value: filteredCases.filter(c => c.status !== 'Cerrado').length }
        ]
    };
};

// Generate Performance Report (by user)
export const generatePerformanceReport = (cases: CaseRecord[], filters: ReportFilters, users: any[]): ReportData => {
    const filteredCases = filterCases(cases, filters);

    const grouped = filteredCases.reduce((acc, c) => {
        const userId = c.fileConfig.responsibleUserId || 'Sin Asignar';
        if (!acc[userId]) {
            acc[userId] = {
                total: 0,
                closed: 0,
                open: 0
            };
        }
        acc[userId].total++;
        if (c.status === 'Cerrado') {
            acc[userId].closed++;
        } else {
            acc[userId].open++;
        }
        return acc;
    }, {} as Record<string, { total: number; closed: number; open: number }>);

    const rows = Object.entries(grouped).map(([userId, stats]) => {
        const user = users.find(u => u.id === userId);
        const userName = user ? user.name : userId;
        const closeRate = stats.total > 0 ? ((stats.closed / stats.total) * 100).toFixed(1) : '0.0';

        return [
            userName,
            stats.total,
            stats.closed,
            stats.open,
            `${closeRate}%`
        ];
    }).sort((a, b) => (b[1] as number) - (a[1] as number));

    return {
        title: 'Rendimiento por Usuario',
        headers: ['Usuario', 'Total Expedientes', 'Cerrados', 'Abiertos', 'Tasa de Cierre'],
        rows,
        summary: [
            { label: 'Total Expedientes', value: filteredCases.length },
            { label: 'Usuarios Activos', value: Object.keys(grouped).length }
        ]
    };
};

// Export to Excel
export const exportToExcel = (reportData: ReportData, filename: string = 'informe.xlsx') => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create main data sheet
    const wsData: any[][] = [
        [reportData.title],
        [],
        reportData.headers,
        ...reportData.rows
    ];

    // Add summary if exists
    if (reportData.summary && reportData.summary.length > 0) {
        wsData.push([]);
        wsData.push(['RESUMEN']);
        reportData.summary.forEach(item => {
            wsData.push([item.label, item.value]);
        });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Style the title (merge cells)
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: reportData.headers.length - 1 } }];

    // Set column widths
    ws['!cols'] = reportData.headers.map(() => ({ wch: 20 }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Informe');

    // Generate file and trigger download
    XLSX.writeFile(wb, filename);
};

// Export to PDF (simplified - uses browser print)
export const exportToPDF = (reportData: ReportData) => {
    // Create a printable HTML version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportData.title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background-color: #1e40af; color: white; padding: 10px; text-align: left; }
                td { border: 1px solid #ddd; padding: 8px; }
                tr:nth-child(even) { background-color: #f9fafb; }
                .summary { margin-top: 30px; background-color: #eff6ff; padding: 15px; border-radius: 8px; }
                .summary h2 { color: #1e40af; margin-top: 0; }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>${reportData.title}</h1>
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 20px;">Imprimir / Guardar como PDF</button>
            <table>
                <thead>
                    <tr>
                        ${reportData.headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${reportData.rows.map(row => `
                        <tr>
                            ${row.map(cell => `<td>${cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${reportData.summary ? `
                <div class="summary">
                    <h2>Resumen</h2>
                    ${reportData.summary.map(item => `
                        <p><strong>${item.label}:</strong> ${item.value}</p>
                    `).join('')}
                </div>
            ` : ''}
            <p style="margin-top: 40px; color: #6b7280; font-size: 12px;">
                Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
            </p>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};

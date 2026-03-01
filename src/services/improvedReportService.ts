import * as XLSX from 'xlsx';
import { CaseRecord } from '../types';

// ============================
// INTERFACES
// ============================

export interface ImprovedReportFilters {
    // Fecha
    openingDateRange?: { start: string; end: string };
    closingDateRange?: { start: string; end: string };

    // Estado
    statusType: 'todos' | 'abiertos' | 'cerrados';

    // Responsable
    responsibleUserId?: string;

    // Tipo de expediente
    expedienteType?: string;

    // Buscador rápido
    quickSearch?: string; // ID, Prefijo, Cliente, Notaría, texto libre
}

export interface ReportData {
    title: string;
    headers: string[];
    rows: any[][];
    summary?: { label: string; value: string | number }[];
    totalCount: number;
}

export type ReportType =
    | 'listado_general'
    | 'listado_abiertos_cerrados'
    | 'rendimiento_basico'
    | 'mas_30_dias'
    | 'incompletos';

// ============================
// FILTROS INTELIGENTES
// ============================

export const applyFilters = (
    cases: CaseRecord[],
    filters: ImprovedReportFilters
): CaseRecord[] => {
    return cases.filter(c => {
        // 1. Filtro de Fecha de Apertura
        if (filters.openingDateRange?.start && filters.openingDateRange?.end) {
            const openDate = new Date(c.createdAt);
            const startDate = new Date(filters.openingDateRange.start);
            const endDate = new Date(filters.openingDateRange.end);
            endDate.setHours(23, 59, 59, 999);

            if (openDate < startDate || openDate > endDate) return false;
        }

        // 2. Filtro de Fecha de Cierre (solo si statusType es 'cerrados')
        if (filters.statusType === 'cerrados' && filters.closingDateRange?.start && filters.closingDateRange?.end) {
            if (!c.closedAt) return false;

            const closeDate = new Date(c.closedAt);
            const startDate = new Date(filters.closingDateRange.start);
            const endDate = new Date(filters.closingDateRange.end);
            endDate.setHours(23, 59, 59, 999);

            if (closeDate < startDate || closeDate > endDate) return false;
        }

        // 3. Filtro de Estado
        const isClosed = c.status === 'Cerrado' || c.status === 'Archivado';
        if (filters.statusType === 'abiertos' && isClosed) return false;
        if (filters.statusType === 'cerrados' && !isClosed) return false;

        // 4. Filtro de Responsable
        if (filters.responsibleUserId && c.fileConfig.responsibleUserId !== filters.responsibleUserId) {
            return false;
        }

        // 5. Filtro de Tipo de Expediente
        if (filters.expedienteType && c.fileConfig.category !== filters.expedienteType) {
            return false;
        }

        // 6. Buscador Rápido (ID, Prefijo, Cliente, Notaría, texto)
        if (filters.quickSearch && filters.quickSearch.trim() !== '') {
            const searchTerm = filters.quickSearch.toLowerCase().trim();
            const cleanSearchTerm = searchTerm.replace(/[^a-z0-9]/g, ''); // Solo alfanuméricos para búsqueda flexible

            // Función helper para limpiar strings de separadores comunes
            const cleanString = (str: string | undefined) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

            const matchesID = c.fileNumber.toLowerCase().includes(searchTerm);
            const matchesPrefix = c.fileConfig.category.toLowerCase().includes(searchTerm);

            // Búsqueda de nombre (flexible)
            const clientFullName = `${c.client.surnames} ${c.client.firstName}`.toLowerCase();
            const matchesClient = clientFullName.includes(searchTerm);

            // Búsqueda de NIF (flexible: ignora guiones, puntos, espacios)
            const clientNifClean = cleanString(c.client.nif);
            const matchesNIF = clientNifClean.includes(cleanSearchTerm);

            // Buscar en campos de texto libre
            const matchesDescription = c.description?.toLowerCase().includes(searchTerm);

            if (!matchesID && !matchesPrefix && !matchesClient && !matchesNIF && !matchesDescription) {
                return false;
            }
        }

        return true;
    });
};

// ============================
// GENERADORES DE INFORMES
// ============================

/**
 * 1) Listado General (Predeterminado)
 */
export const generateListadoGeneral = (
    cases: CaseRecord[],
    filters: ImprovedReportFilters
): ReportData => {
    const filtered = applyFilters(cases, filters);

    return {
        title: 'Listado General de Expedientes',
        headers: [
            'ID',
            'Prefijo',
            'Cliente',
            'Estado',
            'Responsable',
            'Fecha Apertura',
            'Fecha Cierre'
        ],
        rows: filtered.map(c => [
            c.fileNumber,
            c.fileConfig.category,
            `${c.client.surnames} ${c.client.firstName}`,
            c.status,
            c.fileConfig.responsibleUserId || '-',
            new Date(c.createdAt).toLocaleDateString('es-ES'),
            c.closedAt ? new Date(c.closedAt).toLocaleDateString('es-ES') : '-'
        ]),
        totalCount: filtered.length,
        summary: [
            { label: 'Total expedientes', value: filtered.length },
            { label: 'Abiertos', value: filtered.filter(c => c.status !== 'Cerrado' && c.status !== 'Archivado').length },
            { label: 'Cerrados', value: filtered.filter(c => c.status === 'Cerrado' || c.status === 'Archivado').length }
        ]
    };
};

/**
 * 2) Listado Abiertos / Cerrados (según filtros)
 */
export const generateListadoAbiertoCerrados = (
    cases: CaseRecord[],
    filters: ImprovedReportFilters
): ReportData => {
    const filtered = applyFilters(cases, filters);

    const statusLabel =
        filters.statusType === 'abiertos' ? 'Abiertos' :
            filters.statusType === 'cerrados' ? 'Cerrados' :
                'Todos';

    return {
        title: `Listado de Expedientes ${statusLabel}`,
        headers: [
            'ID',
            'Prefijo',
            'Cliente',
            'Estado',
            'Responsable',
            'Fecha Apertura',
            'Fecha Cierre'
        ],
        rows: filtered.map(c => [
            c.fileNumber,
            c.fileConfig.category,
            `${c.client.surnames} ${c.client.firstName}`,
            c.status,
            c.fileConfig.responsibleUserId || '-',
            new Date(c.createdAt).toLocaleDateString('es-ES'),
            c.closedAt ? new Date(c.closedAt).toLocaleDateString('es-ES') : '-'
        ]),
        totalCount: filtered.length,
        summary: [
            { label: `Total ${statusLabel.toLowerCase()}`, value: filtered.length }
        ]
    };
};

/**
 * 3) Rendimiento Básico
 * - Aperturas en el periodo
 * - Cierres en el periodo
 * - Tiempo medio de tramitación por responsable
 */
export const generateRendimientoBasico = (
    cases: CaseRecord[],
    filters: ImprovedReportFilters,
    users: any[]
): ReportData => {
    const filtered = applyFilters(cases, filters);

    // Contar aperturas en el periodo
    let aperturas = 0;
    if (filters.openingDateRange?.start && filters.openingDateRange?.end) {
        const startDate = new Date(filters.openingDateRange.start);
        const endDate = new Date(filters.openingDateRange.end);
        endDate.setHours(23, 59, 59, 999);

        aperturas = cases.filter(c => {
            const openDate = new Date(c.createdAt);
            return openDate >= startDate && openDate <= endDate;
        }).length;
    } else {
        aperturas = filtered.length;
    }

    // Contar cierres en el periodo
    let cierres = 0;
    if (filters.closingDateRange?.start && filters.closingDateRange?.end) {
        const startDate = new Date(filters.closingDateRange.start);
        const endDate = new Date(filters.closingDateRange.end);
        endDate.setHours(23, 59, 59, 999);

        cierres = cases.filter(c => {
            if (!c.closedAt) return false;
            const closeDate = new Date(c.closedAt);
            return closeDate >= startDate && closeDate <= endDate;
        }).length;
    } else {
        cierres = filtered.filter(c => c.closedAt).length;
    }

    // Tiempo medio por responsable
    const userStats: Record<string, { total: number; totalDays: number; closed: number }> = {};

    filtered.forEach(c => {
        const userId = c.fileConfig.responsibleUserId || 'Sin asignar';

        if (!userStats[userId]) {
            userStats[userId] = { total: 0, totalDays: 0, closed: 0 };
        }

        userStats[userId].total++;

        if (c.closedAt) {
            const openDate = new Date(c.createdAt);
            const closeDate = new Date(c.closedAt);
            const days = Math.ceil((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));

            userStats[userId].totalDays += days;
            userStats[userId].closed++;
        }
    });

    const rows = Object.entries(userStats).map(([userId, stats]) => {
        const user = users.find(u => u.id === userId);
        const userName = user ? user.name : userId;
        const avgDays = stats.closed > 0 ? Math.round(stats.totalDays / stats.closed) : 0;

        return [
            userName,
            stats.total,
            stats.closed,
            stats.closed > 0 ? `${avgDays} días` : '-'
        ];
    });

    return {
        title: 'Rendimiento Básico',
        headers: [
            'Responsable',
            'Total Expedientes',
            'Cerrados',
            'Tiempo Medio Tramitación'
        ],
        rows,
        totalCount: filtered.length,
        summary: [
            { label: 'Aperturas en el periodo', value: aperturas },
            { label: 'Cierres en el periodo', value: cierres },
            { label: 'En tramitación', value: filtered.filter(c => !c.closedAt).length }
        ]
    };
};

/**
 * 4) Expedientes +30 días sin cerrar
 */
export const generateMas30Dias = (
    cases: CaseRecord[],
    filters: ImprovedReportFilters
): ReportData => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aplicar filtros base primero
    const baseFiltered = applyFilters(cases, filters);

    // Filtrar por >30 días y estado abierto
    const filtered = baseFiltered.filter(c => {
        if (c.status === 'Cerrado' || c.status === 'Archivado') return false;

        const openDate = new Date(c.createdAt);
        return openDate < thirtyDaysAgo;
    });

    const rows = filtered.map(c => {
        const openDate = new Date(c.createdAt);
        const daysSinceOpen = Math.ceil((Date.now() - openDate.getTime()) / (1000 * 60 * 60 * 24));

        return [
            c.fileNumber,
            c.fileConfig.category,
            `${c.client.surnames} ${c.client.firstName}`,
            c.status,
            new Date(c.createdAt).toLocaleDateString('es-ES'),
            `${daysSinceOpen} días`,
            c.fileConfig.responsibleUserId || '-'
        ];
    });

    return {
        title: 'Expedientes +30 días sin cerrar',
        headers: [
            'ID',
            'Prefijo',
            'Cliente',
            'Estado',
            'Fecha Apertura',
            'Días Abierto',
            'Responsable'
        ],
        rows,
        totalCount: filtered.length,
        summary: [
            { label: 'Expedientes estancados', value: filtered.length }
        ]
    };
};

/**
 * 5) Expedientes incompletos / sin documentación
 */
export const generateIncompletos = (
    cases: CaseRecord[],
    filters: ImprovedReportFilters
): ReportData => {
    const baseFiltered = applyFilters(cases, filters);

    const filtered = baseFiltered.filter(c => {
        // Criterios de "incompleto":
        // - Sin responsable asignado
        // - Sin descripción
        // - Sin datos económicos
        // - Sin documentos adjuntos

        const noResponsible = !c.fileConfig.responsibleUserId;
        const noDescription = !c.description || c.description.trim() === '';
        const noEconomic = !c.economicData || c.economicData.lines.length === 0;
        const noDocuments = !c.attachments || c.attachments.length === 0;

        return noResponsible || noDescription || noEconomic || noDocuments;
    });

    const rows = filtered.map(c => {
        const issues: string[] = [];

        if (!c.fileConfig.responsibleUserId) issues.push('Sin responsable');
        if (!c.description || c.description.trim() === '') issues.push('Sin descripción');
        if (!c.economicData || c.economicData.lines.length === 0) issues.push('Sin datos económicos');
        if (!c.attachments || c.attachments.length === 0) issues.push('Sin documentos');

        return [
            c.fileNumber,
            c.fileConfig.category,
            `${c.client.surnames} ${c.client.firstName}`,
            c.status,
            issues.join(', '),
            c.fileConfig.responsibleUserId || '-'
        ];
    });

    return {
        title: 'Expedientes Incompletos',
        headers: [
            'ID',
            'Prefijo',
            'Cliente',
            'Estado',
            'Campos Faltantes',
            'Responsable'
        ],
        rows,
        totalCount: filtered.length,
        summary: [
            { label: 'Expedientes incompletos', value: filtered.length }
        ]
    };
};

// ============================
// EXPORTACIÓN
// ============================

export const exportToExcel = (reportData: ReportData, filename?: string) => {
    const wb = XLSX.utils.book_new();

    const wsData: any[][] = [
        [reportData.title],
        [],
        reportData.headers,
        ...reportData.rows
    ];

    if (reportData.summary && reportData.summary.length > 0) {
        wsData.push([]);
        wsData.push(['RESUMEN']);
        reportData.summary.forEach(item => {
            wsData.push([item.label, item.value]);
        });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: reportData.headers.length - 1 } }];
    ws['!cols'] = reportData.headers.map(() => ({ wch: 20 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Informe');

    const finalFilename = filename || `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, finalFilename);
};

export const exportToPDF = (reportData: ReportData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportData.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          padding: 40px; 
          color: #1e293b;
        }
        h1 { 
          color: #0f172a; 
          border-bottom: 3px solid #3b82f6; 
          padding-bottom: 12px; 
          margin-bottom: 24px;
          font-size: 28px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th { 
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white; 
          padding: 12px; 
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td { 
          border: 1px solid #e2e8f0; 
          padding: 10px;
          font-size: 14px;
        }
        tr:nth-child(even) { background-color: #f8fafc; }
        tr:hover { background-color: #f1f5f9; }
        .summary { 
          margin-top: 30px; 
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 20px; 
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .summary h2 { 
          color: #1e40af; 
          margin-bottom: 12px;
          font-size: 18px;
        }
        .summary p {
          margin: 8px 0;
          font-size: 14px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
          text-align: center;
        }
        @media print {
          button { display: none; }
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>${reportData.title}</h1>
      <button onclick="window.print()" style="padding: 12px 24px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 20px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
        📄 Imprimir / Guardar como PDF
      </button>
      <p style="margin-bottom: 16px; color: #64748b;">Total de registros: <strong>${reportData.totalCount}</strong></p>
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
          <h2>📊 Resumen</h2>
          ${reportData.summary.map(item => `
            <p><strong>${item.label}:</strong> ${item.value}</p>
          `).join('')}
        </div>
      ` : ''}
      <div class="footer">
        Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
        <br>
        AGA Nexus v1.0
      </div>
    </body>
    </html>
  `;

    printWindow.document.write(html);
    printWindow.document.close();
};

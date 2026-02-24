/**
 * Sistema de Vistas Guardadas (Saved Views)
 * Permite guardar configuraciones de filtros para acceso rápido
 */

export type ViewType = 'cases' | 'clients' | 'invoices' | 'proformas' | 'albaranes' | 'billing';

export interface SavedViewFilters {
    // Filtros comunes
    searchQuery?: string;
    clientId?: string | null;
    clientLabel?: string;
    responsibleId?: string; // ID del usuario responsable

    // Filtros de Expedientes (Match ExpedienteFilters)
    numeroExpediente?: string;
    prefijoId?: string;
    clienteTexto?: string;
    identificadorDesde?: string;
    identificadorHasta?: string;
    situacion?: string;
    estado?: string;
    responsable?: string;
    tipoFecha?: 'apertura' | 'cierre' | 'actualizacion' | 'factura';
    fechaDesde?: string;
    fechaHasta?: string;
    saldoDesde?: number;
    saldoHasta?: number;
    saldoNoZero?: boolean;
    saldoPositivo?: boolean;
    saldoNegativo?: boolean;
    textoObservaciones?: string;
    categoria?: string;

    // Filtros de Clientes (Match ClientFilters)
    tipo?: string;
    provincia?: string;
    poblacion?: string;
    metodoCobro?: string;
    bancoCobro?: string;

    // Filtros de Facturación (Hermes-Tenue naming)
    minAmount?: number;
    maxAmount?: number;
    isPaid?: boolean;

    // Extensible
    [key: string]: any;
}

export interface SavedView {
    id: string;
    name: string;
    description?: string;
    type: ViewType;
    filters: SavedViewFilters;

    // Metadata
    createdBy: string;
    createdByName?: string;
    createdAt: string;
    updatedAt: string;

    // Compartir
    isShared: boolean;
    sharedWith?: string[]; // Array de user IDs
    isPublic?: boolean; // Visible para todos

    // Organización
    icon?: string; // Nombre del icono de lucide-react
    color?: string; // Color del badge
    isPinned?: boolean; // Fijar en la parte superior
    order?: number; // Orden de visualización

    // Estadísticas
    usageCount?: number;
    lastUsedAt?: string;
}

export interface SavedViewCreate {
    name: string;
    description?: string;
    type: ViewType;
    filters: SavedViewFilters;
    icon?: string;
    color?: string;
    isShared?: boolean;
    isPublic?: boolean;
}

export interface SavedViewUpdate {
    name?: string;
    description?: string;
    filters?: SavedViewFilters;
    icon?: string;
    color?: string;
    isShared?: boolean;
    isPublic?: boolean;
    isPinned?: boolean;
    order?: number;
}

/**
 * Vistas predefinidas del sistema
 */
export const PREDEFINED_VIEWS: Record<ViewType, SavedView[]> = {
    cases: [
        {
            id: 'preset-cases-active',
            name: 'Mis Expedientes Activos',
            description: 'Expedientes abiertos asignados a mí',
            type: 'cases',
            filters: {
                estado: 'Abierto',
                // responsibleId se añadirá dinámicamente
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'FolderOpen',
            color: 'emerald',
            isPinned: true,
            order: 1
        },
        {
            id: 'preset-cases-urgent',
            name: 'Expedientes Urgentes',
            description: 'Expedientes en situación urgente',
            type: 'cases',
            filters: {
                situacion: 'Urgente'
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'AlertCircle',
            color: 'red',
            isPinned: true,
            order: 2
        },
        {
            id: 'preset-cases-pending',
            name: 'Pendientes de Documentación',
            description: 'Expedientes esperando documentos',
            type: 'cases',
            filters: {
                situacion: 'Pendiente Documentación'
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'FileText',
            color: 'amber',
            isPinned: false,
            order: 3
        }
    ],
    clients: [
        {
            id: 'preset-clients-particulares',
            name: 'Particulares',
            description: 'Clientes de tipo particular',
            type: 'clients',
            filters: {
                tipo: 'PARTICULAR'
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'User',
            color: 'sky',
            isPinned: true,
            order: 1
        },
        {
            id: 'preset-clients-empresas',
            name: 'Empresas',
            description: 'Clientes de tipo empresa',
            type: 'clients',
            filters: {
                tipo: 'EMPRESA'
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'Briefcase',
            color: 'indigo',
            isPinned: true,
            order: 2
        }
    ],
    invoices: [
        {
            id: 'preset-invoices-pending',
            name: 'Facturas Pendientes Este Mes',
            description: 'Facturas emitidas sin pagar del mes actual',
            type: 'invoices',
            filters: {
                status: 'issued',
                isPaid: false,
                dateType: 'createdAt',
                // startDate y endDate se calcularán dinámicamente
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'AlertTriangle',
            color: 'red',
            isPinned: true,
            order: 1
        },
        {
            id: 'preset-invoices-paid',
            name: 'Facturas Pagadas',
            description: 'Facturas cobradas',
            type: 'invoices',
            filters: {
                status: 'issued',
                isPaid: true
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'CheckCircle2',
            color: 'emerald',
            isPinned: false,
            order: 2
        }
    ],
    proformas: [
        {
            id: 'preset-proformas-pending',
            name: 'Proformas Pendientes',
            description: 'Proformas enviadas sin respuesta',
            type: 'proformas',
            filters: {
                status: 'sent'
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'Clock',
            color: 'amber',
            isPinned: true,
            order: 1
        }
    ],
    albaranes: [
        {
            id: 'preset-albaranes-pending',
            name: 'Albaranes Sin Facturar',
            description: 'Albaranes pendientes de facturación',
            type: 'albaranes',
            filters: {
                status: 'pending'
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'FileText',
            color: 'sky',
            isPinned: true,
            order: 1
        }
    ],
    billing: [
        {
            id: 'preset-billing-ready',
            name: 'Listos para Facturar',
            description: 'Albaranes agrupados por cliente',
            type: 'billing',
            filters: {
                status: 'Pending'
            },
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isShared: false,
            isPublic: true,
            icon: 'Receipt',
            color: 'emerald',
            isPinned: true,
            order: 1
        }
    ]
};

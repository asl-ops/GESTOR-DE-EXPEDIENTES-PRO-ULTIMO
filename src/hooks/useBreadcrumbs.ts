import { useMemo } from 'react';
import {
    Users,
    FolderOpen,
    Receipt,
    FileText,
    CreditCard,
    Settings,
    UserCog,
    BarChart3,
    Briefcase
} from 'lucide-react';
import { BreadcrumbItem } from '@/components/ui/Breadcrumbs';

/**
 * Hook para generar breadcrumbs basados en la ruta actual
 * Centraliza la lógica de navegación y mantiene consistencia
 */
export const useBreadcrumbs = (
    currentRoute: string,
    customItems?: BreadcrumbItem[]
): BreadcrumbItem[] => {
    return useMemo(() => {
        // Si hay items personalizados, usarlos directamente
        if (customItems && customItems.length > 0) {
            return customItems;
        }

        // Generar breadcrumbs automáticamente basados en la ruta
        const hash = currentRoute.replace('#/', '');
        const parts = hash.split('/').filter(Boolean);

        if (parts.length === 0) {
            return [{ label: 'Panel Principal', icon: BarChart3 }];
        }

        const breadcrumbs: BreadcrumbItem[] = [];

        // Primera parte de la ruta
        const mainRoute = parts[0];

        switch (mainRoute) {
            case 'clients':
                breadcrumbs.push({
                    label: 'Clientes',
                    href: '/clients',
                    icon: Users
                });
                break;

            case 'cases':
            case 'expedientes':
                breadcrumbs.push({
                    label: 'Expedientes',
                    href: '/cases',
                    icon: FolderOpen
                });
                break;

            case 'invoices':
                breadcrumbs.push({
                    label: 'Facturas',
                    href: '/invoices',
                    icon: Receipt
                });
                break;

            case 'proformas':
                breadcrumbs.push({
                    label: 'Proformas',
                    href: '/proformas',
                    icon: FileText
                });
                break;

            case 'albaranes':
                breadcrumbs.push({
                    label: 'Albaranes',
                    href: '/albaranes',
                    icon: CreditCard
                });
                break;

            case 'billing':
                breadcrumbs.push({
                    label: 'Facturación',
                    href: '/billing',
                    icon: Briefcase
                });
                break;

            case 'config':
                breadcrumbs.push({
                    label: 'Administración',
                    href: '/config',
                    icon: Settings
                });
                break;

            case 'responsible':
                breadcrumbs.push({
                    label: 'Responsables',
                    href: '/responsible',
                    icon: UserCog
                });
                break;

            default:
                breadcrumbs.push({
                    label: mainRoute.charAt(0).toUpperCase() + mainRoute.slice(1),
                    href: `/${mainRoute}`
                });
        }

        // Subrutas (ej: /clients/123, /cases/detail)
        if (parts.length > 1) {
            const subRoute = parts[1];

            // Si es un ID (número o UUID), mostrar "Detalle"
            if (/^[0-9a-f-]+$/i.test(subRoute)) {
                breadcrumbs.push({
                    label: 'Detalle'
                });
            } else {
                breadcrumbs.push({
                    label: subRoute.charAt(0).toUpperCase() + subRoute.slice(1)
                });
            }
        }

        return breadcrumbs;
    }, [currentRoute, customItems]);
};

/**
 * Breadcrumbs predefinidos para rutas comunes
 */
export const COMMON_BREADCRUMBS = {
    clients: [
        { label: 'Clientes', icon: Users }
    ],
    clientDetail: (clientName: string) => [
        { label: 'Clientes', href: '/clients', icon: Users },
        { label: clientName }
    ],
    cases: [
        { label: 'Expedientes', icon: FolderOpen }
    ],
    caseDetail: (caseNumber: string) => [
        { label: 'Expedientes', href: '/cases', icon: FolderOpen },
        { label: caseNumber }
    ],
    invoices: [
        { label: 'Facturas', icon: Receipt }
    ],
    invoiceDetail: (invoiceNumber: string) => [
        { label: 'Facturas', href: '/invoices', icon: Receipt },
        { label: invoiceNumber }
    ],
    proformas: [
        { label: 'Proformas', icon: FileText }
    ],
    proformaDetail: (proformaNumber: string) => [
        { label: 'Proformas', href: '/proformas', icon: FileText },
        { label: proformaNumber }
    ],
    albaranes: [
        { label: 'Albaranes', icon: CreditCard }
    ],
    albaranDetail: (albaranNumber: string) => [
        { label: 'Albaranes', href: '/albaranes', icon: CreditCard },
        { label: albaranNumber }
    ],
    billing: [
        { label: 'Facturación', icon: Briefcase }
    ],
    config: [
        { label: 'Administración', icon: Settings }
    ],
    responsible: [
        { label: 'Responsables', icon: UserCog }
    ]
};

export default useBreadcrumbs;

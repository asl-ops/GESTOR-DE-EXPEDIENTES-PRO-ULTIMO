import { setViewMode } from '@/services/viewModeService';

export interface ModuleNavItem {
    id: 'clients' | 'dashboard' | 'billing' | 'proformas' | 'invoices';
    label: string;
    path: string;
}

export const MODULE_NAV_ITEMS: ModuleNavItem[] = [
    { id: 'clients', label: 'Clientes', path: '/clients' },
    { id: 'dashboard', label: 'Expedientes', path: '/' },
    { id: 'billing', label: 'Albaranes', path: '/billing' },
    { id: 'proformas', label: 'Proformas', path: '/proformas' },
    { id: 'invoices', label: 'Facturas', path: '/invoices' }
];

export const navigateToModule = (path: string) => {
    setViewMode('menu');
    window.location.hash = path;
};

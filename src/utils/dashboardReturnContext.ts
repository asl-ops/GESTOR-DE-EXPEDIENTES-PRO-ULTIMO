import type { ExpedienteFilters } from '@/components/ExpedienteFilterPanel';
import type { PageSize } from '@/components/PaginationControls';

export const DASHBOARD_RETURN_CONTEXT_KEY = 'dashboard-return-client-context';
const DASHBOARD_RETURN_CONTEXT_MARKER_KEY = 'dashboard-return-client-context-active';
const DASHBOARD_RETURN_CONTEXT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export interface DashboardSortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export interface DashboardReturnContext {
    sourceView: 'dashboard';
    timestamp: number;
    clientId?: string;
    clientLabel?: string;
    identifier?: string;
    searchQuery?: string;
    identifierFilter?: string;
    prefixFilter?: string;
    responsibleFilter?: string;
    responsibleLabel?: string;
    statusFilter?: string;
    categoryFilter?: string;
    situationFilter?: string;
    dateFilterType?: 'createdAt' | 'closedAt';
    startDate?: string;
    endDate?: string;
    currentPage?: number;
    pageSize?: PageSize;
    sortConfig?: DashboardSortConfig | null;
    expedienteFilters?: ExpedienteFilters;
    isExpedienteFilterPanelOpen?: boolean;
    isSearchExpanded?: boolean;
}

export const saveDashboardReturnContext = (context: DashboardReturnContext) => {
    sessionStorage.setItem(DASHBOARD_RETURN_CONTEXT_KEY, JSON.stringify(context));
    sessionStorage.setItem(DASHBOARD_RETURN_CONTEXT_MARKER_KEY, '1');
};

export const consumeDashboardReturnContext = (): DashboardReturnContext | null => {
    const hasMarker = sessionStorage.getItem(DASHBOARD_RETURN_CONTEXT_MARKER_KEY) === '1';
    if (!hasMarker) return null;

    const raw = sessionStorage.getItem(DASHBOARD_RETURN_CONTEXT_KEY);
    sessionStorage.removeItem(DASHBOARD_RETURN_CONTEXT_MARKER_KEY);
    sessionStorage.removeItem(DASHBOARD_RETURN_CONTEXT_KEY);

    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as DashboardReturnContext;
        if (parsed.sourceView !== 'dashboard') return null;
        if (!parsed.timestamp || Date.now() - parsed.timestamp > DASHBOARD_RETURN_CONTEXT_MAX_AGE_MS) return null;
        return parsed;
    } catch {
        return null;
    }
};

export const clearDashboardReturnContext = () => {
    sessionStorage.removeItem(DASHBOARD_RETURN_CONTEXT_MARKER_KEY);
    sessionStorage.removeItem(DASHBOARD_RETURN_CONTEXT_KEY);
};

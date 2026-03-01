export type ClientNavigationModule = 'dashboard' | 'billing' | 'proformas' | 'invoices' | 'economico';

export interface ClientNavigationContext {
    active: boolean;
    timestamp: number;
    clientId?: string | null;
    identifier?: string;
    clientName?: string;
    sourceModule?: ClientNavigationModule;
}

const CLIENT_NAV_CONTEXT_KEY = 'client-navigation-context';
const CLIENT_NAV_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export interface ClientNavigationHashData {
    enabled: boolean;
    clientId?: string;
    identifier?: string;
    clientName?: string;
}

const parsePathAndQuery = (path: string) => {
    const [rawPath, rawQuery] = path.split('?');
    const normalizedPath = rawPath?.startsWith('/') ? rawPath : `/${rawPath || ''}`;
    return {
        path: normalizedPath,
        params: new URLSearchParams(rawQuery || '')
    };
};

const sanitizeText = (value?: string | null) => (value || '').trim();

export const saveClientNavigationContext = (context: Omit<ClientNavigationContext, 'timestamp'>) => {
    const payload: ClientNavigationContext = {
        ...context,
        timestamp: Date.now(),
        clientId: sanitizeText(context.clientId) || undefined,
        identifier: sanitizeText(context.identifier) || undefined,
        clientName: sanitizeText(context.clientName) || undefined
    };
    sessionStorage.setItem(CLIENT_NAV_CONTEXT_KEY, JSON.stringify(payload));
};

export const readClientNavigationContext = (): ClientNavigationContext | null => {
    const raw = sessionStorage.getItem(CLIENT_NAV_CONTEXT_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as ClientNavigationContext;
        if (!parsed?.timestamp || Date.now() - parsed.timestamp > CLIENT_NAV_MAX_AGE_MS) {
            sessionStorage.removeItem(CLIENT_NAV_CONTEXT_KEY);
            return null;
        }
        return parsed;
    } catch {
        sessionStorage.removeItem(CLIENT_NAV_CONTEXT_KEY);
        return null;
    }
};

export const clearClientNavigationContext = () => {
    sessionStorage.removeItem(CLIENT_NAV_CONTEXT_KEY);
};

export const extractClientNavigationFromHash = (hash: string = window.location.hash): ClientNavigationHashData => {
    const query = hash.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const enabled = params.get('clientNav') === '1';
    const clientId = sanitizeText(params.get('clientId'));
    const identifier = sanitizeText(params.get('identifier'));
    const clientName = sanitizeText(params.get('clientName'));
    return {
        enabled,
        clientId: clientId || undefined,
        identifier: identifier || undefined,
        clientName: clientName || undefined
    };
};

export const buildPathWithClientNavigation = (
    path: string,
    context?: Partial<ClientNavigationContext> | null
) => {
    const { path: normalizedPath, params } = parsePathAndQuery(path);
    const fallback = readClientNavigationContext();
    const ctx = context ?? fallback;

    if (!ctx || !ctx.active) return `${normalizedPath}${params.toString() ? `?${params.toString()}` : ''}`;

    const clientId = sanitizeText(ctx.clientId || fallback?.clientId);
    const identifier = sanitizeText(ctx.identifier || fallback?.identifier);
    const clientName = sanitizeText(ctx.clientName || fallback?.clientName);

    params.set('clientNav', '1');
    if (clientId) params.set('clientId', clientId);
    if (identifier) params.set('identifier', identifier);
    if (clientName) params.set('clientName', clientName);

    return `${normalizedPath}?${params.toString()}`;
};

export const getClientNavigationReturnPath = (): string => {
    return buildPathWithClientNavigation('/', readClientNavigationContext());
};

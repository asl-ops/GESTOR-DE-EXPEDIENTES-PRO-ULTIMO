export interface RecentClientIdentifierEntry {
    identifier: string;
    displayName: string;
}

const BASE_KEY = 'recent-client-identifiers-v1';
const DEFAULT_MAX_ITEMS = 8;

const normalizeIdentifier = (value?: string | null): string =>
    (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

const getSessionKey = (userId?: string | null): string =>
    `${BASE_KEY}:${userId || 'anon'}`;

const normalizeEntry = (entry: unknown): RecentClientIdentifierEntry | null => {
    if (typeof entry === 'string') {
        const identifier = normalizeIdentifier(entry);
        if (!identifier) return null;
        return { identifier, displayName: '' };
    }

    if (!entry || typeof entry !== 'object') return null;

    const maybe = entry as Partial<RecentClientIdentifierEntry>;
    const identifier = normalizeIdentifier(maybe.identifier);
    if (!identifier) return null;

    return {
        identifier,
        displayName: (maybe.displayName || '').trim(),
    };
};

export const readRecentClientIdentifiers = (
    userId?: string | null,
    maxItems: number = DEFAULT_MAX_ITEMS,
): RecentClientIdentifierEntry[] => {
    if (typeof window === 'undefined') return [];

    try {
        const raw = window.sessionStorage.getItem(getSessionKey(userId));
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map(normalizeEntry)
            .filter((entry): entry is RecentClientIdentifierEntry => !!entry)
            .slice(0, Math.max(1, maxItems));
    } catch {
        return [];
    }
};

export const writeRecentClientIdentifiers = (
    userId: string | null | undefined,
    items: RecentClientIdentifierEntry[],
    maxItems: number = DEFAULT_MAX_ITEMS,
): RecentClientIdentifierEntry[] => {
    const normalized = items
        .map(normalizeEntry)
        .filter((entry): entry is RecentClientIdentifierEntry => !!entry)
        .slice(0, Math.max(1, maxItems));

    if (typeof window === 'undefined') return normalized;

    try {
        window.sessionStorage.setItem(getSessionKey(userId), JSON.stringify(normalized));
    } catch {
        // ignore storage failures
    }

    return normalized;
};

export const pushRecentClientIdentifier = (
    userId: string | null | undefined,
    identifier?: string | null,
    displayName: string = '',
    maxItems: number = DEFAULT_MAX_ITEMS,
): RecentClientIdentifierEntry[] => {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    if (!normalizedIdentifier) return readRecentClientIdentifiers(userId, maxItems);

    const current = readRecentClientIdentifiers(userId, maxItems);
    const existing = current.find(item => item.identifier === normalizedIdentifier);

    const nextEntry: RecentClientIdentifierEntry = {
        identifier: normalizedIdentifier,
        displayName: displayName.trim() || existing?.displayName || '',
    };

    const next = [nextEntry, ...current.filter(item => item.identifier !== normalizedIdentifier)]
        .slice(0, Math.max(1, maxItems));

    return writeRecentClientIdentifiers(userId, next, maxItems);
};

export const normalizeRecentClientIdentifier = normalizeIdentifier;

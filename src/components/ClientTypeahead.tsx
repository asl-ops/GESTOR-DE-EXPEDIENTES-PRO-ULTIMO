import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Client as ClientV2, ClientCreateInput } from '@/types/client';
import { searchClients, createClient } from '@/services/clientService';
import { isMostlyNumeric, normalizeText } from '@/utils/normalize';
import { Search, X, History, ChevronDown } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import {
    pushRecentClientIdentifier,
    readRecentClientIdentifiers,
    normalizeRecentClientIdentifier,
    type RecentClientIdentifierEntry
} from '@/utils/recentClientIdentifiers';

type Props = {
    valueClientId?: string | null;
    valueLabel?: string; // texto mostrado (ej: snapshot actual)
    placeholder?: string;
    disabled?: boolean;

    // cuando el usuario selecciona un cliente del dropdown
    onSelect: (client: ClientV2) => void;

    // si se usa como filtro, puede interesar "limpiar selección"
    onClear?: () => void;

    // modo filtro: si quieres permitir escribir sin seleccionar
    allowFreeText?: boolean;
    onFreeTextChange?: (text: string) => void;

    // alta rápida
    enableQuickCreate?: boolean;
    defaultClientType?: 'PARTICULAR' | 'EMPRESA';
    onQuickCreate?: (created: ClientV2) => void;

    limit?: number;
    compact?: boolean;
};

function useDebounced<T>(value: T, ms = 250): T {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

export const ClientTypeahead: React.FC<Props> = ({
    valueClientId,
    valueLabel,
    placeholder = 'Buscar cliente por nombre o documento…',
    disabled,
    onSelect,
    onClear,
    allowFreeText = false,
    onFreeTextChange,
    enableQuickCreate = true,
    defaultClientType = 'PARTICULAR',
    onQuickCreate,
    limit = 10,
    compact = false,
}) => {
    const { currentUser, savedClients } = useAppContext();
    const [input, setInput] = useState(valueLabel ?? '');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<ClientV2[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [recentIdentifiers, setRecentIdentifiers] = useState<RecentClientIdentifierEntry[]>([]);
    const [isRecentsOpen, setIsRecentsOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const recentsRef = useRef<HTMLDivElement | null>(null);

    // si cambia desde fuera (ej: editar expediente), sincroniza
    useEffect(() => {
        setInput(valueLabel ?? '');
    }, [valueLabel, valueClientId]);

    const debounced = useDebounced(input, 250);

    const shouldSearch = useMemo(() => {
        const q = debounced.trim();
        if (!q) return false;
        const numeric = isMostlyNumeric(q);
        if (numeric) return q.replace(/\s/g, '').length >= 3;
        return normalizeText(q).length >= 2;
    }, [debounced]);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!shouldSearch || disabled) {
                setItems([]);
                setLoading(false);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await searchClients({ q: debounced.trim(), limit });
                if (cancelled) return;
                setItems(res.items ?? []);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.message ?? 'Error buscando clientes');
                setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [debounced, shouldSearch, disabled, limit]);

    // cerrar dropdown al click fuera
    useEffect(() => {
        function onDocMouseDown(ev: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(ev.target as Node)) {
                setOpen(false);
                setIsRecentsOpen(false);
            }
        }
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, []);

    const getDisplayNameForIdentifier = (identifier: string): string => {
        const normalized = normalizeRecentClientIdentifier(identifier);
        if (!normalized) return '';

        const match = savedClients.find(client =>
            normalizeRecentClientIdentifier(client.documento) === normalized ||
            normalizeRecentClientIdentifier(client.nif) === normalized
        );

        return match?.nombre || match?.legalName || '';
    };

    const reloadRecents = () => {
        const loaded = readRecentClientIdentifiers(currentUser?.id);
        const hydrated = loaded.map(entry => ({
            identifier: entry.identifier,
            displayName: entry.displayName || getDisplayNameForIdentifier(entry.identifier)
        }));
        setRecentIdentifiers(hydrated);
    };

    useEffect(() => {
        reloadRecents();
    }, [currentUser?.id, savedClients]);

    const showQuickCreate = useMemo(() => {
        if (!enableQuickCreate) return false;
        const q = debounced.trim();
        if (!q) return false;
        if (!shouldSearch) return false;
        if (items.length > 0) return false; // si ya hay resultados, no estorbes
        return true;
    }, [enableQuickCreate, debounced, shouldSearch, items.length]);

    const handleChange = (v: string) => {
        setInput(v);
        setOpen(true);
        setIsRecentsOpen(false);
        if (allowFreeText && onFreeTextChange) onFreeTextChange(v);
        if (!v && onClear) onClear();
    };

    const pick = (c: ClientV2) => {
        onSelect(c);
        // Label mejorado: NOMBRE — DOCUMENTO — TELÉFONO
        const parts = [c.nombre];
        if (c.documento) parts.push(c.documento);
        if (c.telefono) parts.push(c.telefono);
        setInput(parts.join(' — '));
        setOpen(false);
        setIsRecentsOpen(false);
        const identifier = c.documento || c.nif || '';
        if (identifier) {
            const updated = pushRecentClientIdentifier(currentUser?.id, identifier, c.nombre || '');
            setRecentIdentifiers(updated.map(entry => ({
                ...entry,
                displayName: entry.displayName || getDisplayNameForIdentifier(entry.identifier)
            })));
        }
    };

    const handlePickRecent = (recent: RecentClientIdentifierEntry) => {
        const normalized = normalizeRecentClientIdentifier(recent.identifier);
        if (!normalized) return;

        const match = savedClients.find(client =>
            normalizeRecentClientIdentifier(client.documento) === normalized ||
            normalizeRecentClientIdentifier(client.nif) === normalized
        );

        if (match) {
            pick(match as unknown as ClientV2);
            return;
        }

        setInput(recent.identifier);
        if (allowFreeText && onFreeTextChange) onFreeTextChange(recent.identifier);
        setOpen(false);
        setIsRecentsOpen(false);
        const updated = pushRecentClientIdentifier(currentUser?.id, recent.identifier, recent.displayName);
        setRecentIdentifiers(updated.map(entry => ({
            ...entry,
            displayName: entry.displayName || getDisplayNameForIdentifier(entry.identifier)
        })));
    };

    const quickCreate = async () => {
        const q = debounced.trim();
        if (!q) return;

        // heurística simple: si es mostly numérico lo tratamos como documento
        const numeric = isMostlyNumeric(q);
        const payload: ClientCreateInput = numeric
            ? { tipo: defaultClientType, nombre: q, documento: q }
            : { tipo: defaultClientType, nombre: q };

        setLoading(true);
        setError(null);
        try {
            const created = await createClient(payload);
            pick(created);
            onQuickCreate?.(created);
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo crear el cliente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none ${compact ? 'w-3.5 h-3.5' : ''}`} />
                <input
                    type="text"
                    disabled={disabled}
                    value={input}
                    placeholder={placeholder}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => setOpen(true)}
                    className={`w-full pl-11 pr-36 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-white shadow-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed ${compact ? 'py-1.5' : 'py-2.5'
                        }`}
                />
                {(valueClientId || input) && onClear && (
                    <button
                        type="button"
                        onClick={() => {
                            setInput('');
                            onClear();
                        }}
                        className="absolute right-24 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <div ref={recentsRef} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsRecentsOpen(v => !v);
                            setOpen(false);
                        }}
                        className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                        title="Identificadores recientes de esta sesión"
                        disabled={disabled}
                    >
                        <History className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Recientes</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isRecentsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isRecentsOpen && !disabled && (
                        <div className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-xl border border-slate-200 bg-white shadow-xl z-[60] overflow-hidden">
                            <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                                Ultimos identificadores
                            </div>
                            {recentIdentifiers.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-slate-400">
                                    Sin identificadores en esta sesion.
                                </div>
                            ) : (
                                <div className="max-h-56 overflow-auto">
                                    {recentIdentifiers.map((recent) => (
                                        <button
                                            key={recent.identifier}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handlePickRecent(recent);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-sky-50 border-b border-slate-50 last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-slate-700">{recent.identifier}</span>
                                                <span className="text-xs text-slate-500 truncate ml-auto">{recent.displayName || '-'}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {open && (shouldSearch || showQuickCreate || loading || error) && !disabled && (
                <div className="absolute z-50 left-0 right-0 mt-1 border border-slate-200 rounded-lg bg-white shadow-lg overflow-hidden max-h-80">
                    {loading && (
                        <div className="px-4 py-3 text-sm text-slate-600">Buscando…</div>
                    )}

                    {!loading && error && (
                        <div className="px-4 py-3 text-sm text-red-600">{error}</div>
                    )}

                    {!loading && !error && items.length > 0 && (
                        <ul className="overflow-auto max-h-72">
                            {items.map((c) => (
                                <li key={c.id} className="border-b border-slate-100 last:border-b-0">
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            pick(c);
                                        }}
                                        className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="text-sm font-normal text-slate-800 uppercase tracking-tight">{c.nombre}</div>
                                        <div className="app-label !text-slate-400 !lowercase mt-1">
                                            {c.documento ? `doc: ${c.documento}` : 'sin documento'}
                                            {c.telefono ? ` · tel: ${c.telefono}` : ''}
                                            {c.email ? ` · ${c.email}` : ''}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {!loading && !error && showQuickCreate && (
                        <div className="border-t border-slate-100">
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    void quickCreate();
                                }}
                                className="w-full text-left px-5 py-4 hover:bg-sky-50 transition-colors text-sky-600 text-[11px] font-normal uppercase tracking-widest"
                            >
                                + Alta Rápida: "{debounced.trim()}"
                            </button>
                            <div className="px-5 pb-3 app-muted">
                                Se creará automáticamente con perfil "{defaultClientType.toLowerCase()}".
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

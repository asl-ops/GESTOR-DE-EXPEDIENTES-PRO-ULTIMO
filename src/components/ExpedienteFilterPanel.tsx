import React, { useMemo } from 'react';
import { Filter, X, RotateCcw, ChevronDown, FileText, Users, Calendar, DollarSign, Tag, Hash, User, MapPin, Pin } from 'lucide-react';
import type { PrefixConfig } from '@/types';

export interface ExpedienteFilters {
    // A) Identificación
    numeroExpediente?: string;
    prefijoId?: string;
    clienteTexto?: string;
    identificadorDesde?: string;
    identificadorHasta?: string;

    // B) Estado y Situación
    situacion?: string;  // 'Todos' | 'Abierto' | 'Cerrado'
    estado?: string;     // Single estado de tramitación
    responsable?: string; // Single responsable ID

    // C) Fechas
    tipoFecha?: 'apertura' | 'cierre' | 'actualizacion' | 'factura';
    fechaDesde?: string;
    fechaHasta?: string;

    // D) Económico
    saldoDesde?: number;
    saldoHasta?: number;
    saldoNoZero?: boolean;
    saldoPositivo?: boolean;
    saldoNegativo?: boolean;

    // E) Texto libre
    textoObservaciones?: string;
    searchQuery?: string;
    etiquetas?: string[];
    [key: string]: any;
}

interface ExpedienteFilterPanelProps {
    filters: ExpedienteFilters;
    onFiltersChange: (filters: ExpedienteFilters) => void;
    onClose: () => void;
    isOpen: boolean;

    // Data for selects
    prefixes?: PrefixConfig[];
    estados?: string[];
    responsables?: Array<{ id: string; name: string }>;
    etiquetas?: string[];
    isPinned?: boolean;
    onTogglePin?: () => void;
}

const ExpedienteFilterPanel: React.FC<ExpedienteFilterPanelProps> = ({
    filters,
    onFiltersChange,
    onClose,
    isOpen,
    prefixes = [],
    estados = [],
    responsables = [],
    isPinned = false,
    onTogglePin
}) => {
    const updateFilter = <K extends keyof ExpedienteFilters>(key: K, value: ExpedienteFilters[K]) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFiltersChange({});
    };

    const hasActiveFilters = useMemo(() => {
        return Object.values(filters).some(v => {
            if (Array.isArray(v)) return v.length > 0;
            return v !== undefined && v !== '' && v !== false;
        });
    }, [filters]);

    // Date shortcuts
    const applyDateShortcut = (shortcut: string) => {
        const today = new Date();
        let desde: Date | null = null;
        let hasta: Date = today;

        switch (shortcut) {
            case 'hoy':
                desde = today;
                break;
            case 'semana':
                desde = new Date(today);
                desde.setDate(today.getDate() - today.getDay());
                break;
            case 'mes':
                desde = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case '30dias':
                desde = new Date(today);
                desde.setDate(today.getDate() - 30);
                break;
            case 'año':
                desde = new Date(today.getFullYear(), 0, 1);
                break;
        }

        if (desde) {
            updateFilter('fechaDesde', desde.toISOString().split('T')[0]);
            updateFilter('fechaHasta', hasta.toISOString().split('T')[0]);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Mobile overlay backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Filter Panel - Push content on desktop, overlay on mobile */}
            <div className={`
        flex flex-col h-full bg-white font-sans overflow-hidden border-r border-slate-100 shrink-0
        w-80 transition-all duration-300 ease-in-out
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-sky-600" />
                        <h2 className="app-section-title !mb-0 !text-[13px]">Filtros</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="app-muted hover:text-sky-600 transition-colors flex items-center gap-1 text-xs"
                                title="Limpiar todos los filtros"
                            >
                                <RotateCcw className="w-3 h-3" /> Limpiar
                            </button>
                        )}
                        {onTogglePin && (
                            <button
                                onClick={onTogglePin}
                                className={`p-1.5 rounded-lg transition-colors ${isPinned
                                    ? 'text-sky-600 bg-sky-50 hover:bg-sky-100'
                                    : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                                    }`}
                                title={isPinned ? 'Desfijar panel de filtros' : 'Fijar panel de filtros'}
                                aria-label={isPinned ? 'Desfijar panel de filtros' : 'Fijar panel de filtros'}
                            >
                                <Pin className={`w-4 h-4 ${isPinned ? 'fill-sky-600' : ''}`} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-colors ml-2"
                            title="Cerrar filtros"
                            aria-label="Cerrar filtros"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 no-scrollbar">

                    {/* A) IDENTIFICACIÓN */}
                    <div className="space-y-4">
                        <h3 className="app-title text-xs uppercase tracking-wider text-slate-500 font-semibold ml-1">
                            Identificación
                        </h3>

                        {/* Nº Expediente */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1 text-xs">Nº Expediente</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={filters.numeroExpediente || ''}
                                    onChange={(e) => updateFilter('numeroExpediente', e.target.value || undefined)}
                                    placeholder="NÚMERO DE EXPEDIENTE"
                                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Prefijo */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1 text-xs">Prefijo</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={filters.prefijoId || ''}
                                    onChange={(e) => updateFilter('prefijoId', e.target.value || undefined)}
                                    className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Todos los prefijos</option>
                                    {prefixes.map(p => (
                                        <option key={p.id} value={p.id}>{p.code} - {p.description}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Cliente */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1 text-xs">Cliente</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={filters.clienteTexto || ''}
                                    onChange={(e) => updateFilter('clienteTexto', e.target.value || undefined)}
                                    placeholder="Nombre o DNI..."
                                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Identificador Cliente (Rango) */}
                        <div className="space-y-3">
                            <label className="app-label-block px-1 text-xs">Identificador Cliente</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={filters.identificadorDesde || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                            updateFilter('identificadorDesde', val || undefined);
                                        }}
                                        placeholder="Desde"
                                        maxLength={8}
                                        inputMode="numeric"
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={filters.identificadorHasta || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                            updateFilter('identificadorHasta', val || undefined);
                                        }}
                                        placeholder="Hasta"
                                        maxLength={8}
                                        inputMode="numeric"
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* B) ESTADO Y SITUACIÓN */}
                    <div className="border-t border-slate-50 pt-6 space-y-4">
                        <h3 className="app-title text-xs uppercase tracking-wider text-slate-500 font-semibold ml-1">
                            Estado y Situación
                        </h3>

                        {/* Situación (dropdown unificado) */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1 text-xs">Situación</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={filters.situacion || ''}
                                    onChange={(e) => updateFilter('situacion', e.target.value || undefined)}
                                    className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Todos</option>
                                    <option value="Abierto">Abiertos</option>
                                    <option value="Cerrado">Cerrados</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Estado de Tramitación (dropdown) */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1 text-xs">Estado de Tramitación</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={filters.estado || ''}
                                    onChange={(e) => updateFilter('estado', e.target.value || undefined)}
                                    className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Todos</option>
                                    {estados.map(e => (
                                        <option key={e} value={e}>{e}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Responsable (dropdown) */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1 text-xs">Responsable</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={filters.responsable || ''}
                                    onChange={(e) => updateFilter('responsable', e.target.value || undefined)}
                                    className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Todos</option>
                                    {responsables.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* C) FECHAS */}
                    <div className="border-t border-slate-50 pt-6 space-y-4">
                        <h3 className="app-title text-xs uppercase tracking-wider text-slate-500 font-semibold ml-1">
                            Fechas
                        </h3>

                        {/* Tipo de Fecha */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1 text-xs">Tipo de Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={filters.tipoFecha || 'apertura'}
                                    onChange={(e) => updateFilter('tipoFecha', e.target.value as any)}
                                    className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="apertura">Fecha de Apertura</option>
                                    <option value="cierre">Fecha de Cierre</option>
                                    <option value="actualizacion">Última Actualización</option>
                                    <option value="factura">Fecha de Factura</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Rango de Fechas */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-slate-500 px-1">Desde</label>
                                <input
                                    type="date"
                                    value={filters.fechaDesde || ''}
                                    onChange={(e) => updateFilter('fechaDesde', e.target.value || undefined)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-slate-500 px-1">Hasta</label>
                                <input
                                    type="date"
                                    value={filters.fechaHasta || ''}
                                    onChange={(e) => updateFilter('fechaHasta', e.target.value || undefined)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Atajos de Fecha */}
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: 'Hoy', value: 'hoy' },
                                { label: 'Esta semana', value: 'semana' },
                                { label: 'Este mes', value: 'mes' },
                                { label: 'Últimos 30 días', value: '30dias' },
                                { label: 'Año actual', value: 'año' }
                            ].map(shortcut => (
                                <button
                                    key={shortcut.value}
                                    onClick={() => applyDateShortcut(shortcut.value)}
                                    className="px-2.5 py-1 text-[10px] font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
                                >
                                    {shortcut.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* D) ECONÓMICO */}
                    <div className="border-t border-slate-50 pt-6 space-y-4">
                        <h3 className="app-title text-xs uppercase tracking-wider text-slate-500 font-semibold ml-1">
                            Económico
                        </h3>

                        {/* Rango de Saldo */}
                        <div className="space-y-3">
                            <label className="app-label-block px-1 text-xs">Rango de Saldo (€)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="number"
                                        value={filters.saldoDesde ?? ''}
                                        onChange={(e) => updateFilter('saldoDesde', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        placeholder="Desde"
                                        step="0.01"
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                        type="number"
                                        value={filters.saldoHasta ?? ''}
                                        onChange={(e) => updateFilter('saldoHasta', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        placeholder="Hasta"
                                        step="0.01"
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Checkboxes de Saldo */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                                <input
                                    type="checkbox"
                                    id="saldoNoZero"
                                    checked={filters.saldoNoZero || false}
                                    onChange={(e) => updateFilter('saldoNoZero', e.target.checked || undefined)}
                                    className="w-4 h-4 text-sky-600 bg-slate-50 border-slate-300 rounded focus:ring-sky-500 focus:ring-2"
                                />
                                <label htmlFor="saldoNoZero" className="text-sm text-slate-700 cursor-pointer">
                                    Saldo ≠ 0
                                </label>
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <input
                                    type="checkbox"
                                    id="saldoPositivo"
                                    checked={filters.saldoPositivo || false}
                                    onChange={(e) => updateFilter('saldoPositivo', e.target.checked || undefined)}
                                    className="w-4 h-4 text-sky-600 bg-slate-50 border-slate-300 rounded focus:ring-sky-500 focus:ring-2"
                                />
                                <label htmlFor="saldoPositivo" className="text-sm text-slate-700 cursor-pointer">
                                    Saldo &gt; 0
                                </label>
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <input
                                    type="checkbox"
                                    id="saldoNegativo"
                                    checked={filters.saldoNegativo || false}
                                    onChange={(e) => updateFilter('saldoNegativo', e.target.checked || undefined)}
                                    className="w-4 h-4 text-sky-600 bg-slate-50 border-slate-300 rounded focus:ring-sky-500 focus:ring-2"
                                />
                                <label htmlFor="saldoNegativo" className="text-sm text-slate-700 cursor-pointer">
                                    Saldo &lt; 0
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* E) TEXTO LIBRE / OBSERVACIONES */}
                    <div className="border-t border-slate-50 pt-6 space-y-4 pb-6">
                        <h3 className="app-title text-xs uppercase tracking-wider text-slate-500 font-semibold ml-1">
                            Texto Libre
                        </h3>

                        {/* Buscar en Observaciones */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1 text-xs">Buscar en Observaciones</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={filters.textoObservaciones || ''}
                                    onChange={(e) => updateFilter('textoObservaciones', e.target.value || undefined)}
                                    placeholder="Texto a buscar..."
                                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer shadow fade */}
                <div className="h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
        </>
    );
};

export default ExpedienteFilterPanel;

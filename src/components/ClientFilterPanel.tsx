import React from 'react';
import { Filter, X, RotateCcw, ChevronDown, MapPin, CreditCard, Hash, Users } from 'lucide-react';
import type { ClientFilters, ClientType } from '@/types/client';
import { PaymentMethod } from '@/types/paymentMethod';

interface ClientFilterPanelProps {
    filters: ClientFilters;
    onFiltersChange: (filters: ClientFilters) => void;
    onClose: () => void;
    paymentMethods?: PaymentMethod[];
    isOpen: boolean;
}

// Spanish provinces
const PROVINCIAS_ES = [
    "ÁLAVA", "ALBACETE", "ALICANTE", "ALMERÍA", "ASTURIAS", "ÁVILA", "BADAJOZ", "BARCELONA",
    "BURGOS", "CÁCERES", "CÁDIZ", "CANTABRIA", "CASTELLÓN", "CIUDAD REAL", "CÓRDOBA", "CUENCA",
    "GIRONA", "GRANADA", "GUADALAJARA", "GIPUZKOA", "HUELVA", "HUESCA", "ILLES BALEARS", "JAÉN",
    "A CORUÑA", "LA RIOJA", "LAS PALMAS", "LEÓN", "LLEIDA", "LUGO", "MADRID", "MÁLAGA", "MURCIA",
    "NAVARRA", "OURENSE", "PALENCIA", "PONTEVEDRA", "SALAMANCA", "SANTA CRUZ DE TENERIFE",
    "SEGOVIA", "SEVILLA", "SORIA", "TARRAGONA", "TERUEL", "TOLEDO", "VALENCIA", "VALLADOLID",
    "BIZKAIA", "ZAMORA", "ZARAGOZA", "CEUTA", "MELILLA"
];

// Municipalities by province (sample data - extend as needed)
const MUNICIPIOS_POR_PROVINCIA: Record<string, string[]> = {
    "ALMERÍA": ["Almería", "Roquetas de Mar", "El Ejido", "Níjar", "Vícar", "Adra"],
    "MADRID": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón"],
    "BARCELONA": ["Barcelona", "L'Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró"],
    "VALENCIA": ["Valencia", "Torrent", "Gandia", "Paterna", "Sagunto", "Alzira"],
    "SEVILLA": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe"],
    "MÁLAGA": ["Málaga", "Marbella", "Vélez-Málaga", "Mijas", "Fuengirola", "Torremolinos"],
};

const ClientFilterPanel: React.FC<ClientFilterPanelProps> = ({
    filters,
    onFiltersChange,
    onClose,
    paymentMethods = [],
    isOpen
}) => {
    const updateFilter = <K extends keyof ClientFilters>(key: K, value: ClientFilters[K]) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFiltersChange({
            tipo: undefined,
            provincia: undefined,
            poblacion: undefined,
            metodoCobro: undefined,
            bancoCobro: undefined,
            identificadorDesde: undefined,
            identificadorHasta: undefined,
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

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
                                className="app-muted hover:text-sky-600 transition-colors flex items-center gap-1"
                                title="Limpiar todos los filtros"
                            >
                                <RotateCcw className="w-3 h-3" /> Limpiar
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

                    {/* 1. Tipo de Cliente */}
                    <div className="flex flex-col gap-2">
                        <label className="app-label-block px-1">Tipo de Cliente</label>
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                value={filters.tipo || ''}
                                onChange={(e) => updateFilter('tipo', e.target.value as ClientType || undefined)}
                                className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Todos</option>
                                <option value="PARTICULAR">Persona Física</option>
                                <option value="EMPRESA">Jurídica</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* 2. Ubicación */}
                    <div className="border-t border-slate-50 pt-6">
                        <h3 className="app-title mb-4 ml-1">Ubicación</h3>

                        {/* Provincia */}
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="app-label-block px-1">Provincia</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={filters.provincia || ''}
                                    onChange={(e) => {
                                        const prov = e.target.value || undefined;
                                        updateFilter('provincia', prov);
                                        // Reset población if provincia changes
                                        if (prov !== filters.provincia) {
                                            updateFilter('poblacion', undefined);
                                        }
                                    }}
                                    className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Todas las provincias</option>
                                    {PROVINCIAS_ES.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Población */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1">Población</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    list="municipios-filter"
                                    value={filters.poblacion || ''}
                                    onChange={(e) => updateFilter('poblacion', e.target.value || undefined)}
                                    placeholder={filters.provincia ? "Seleccionar población..." : "Primero selecciona provincia"}
                                    disabled={!filters.provincia}
                                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <datalist id="municipios-filter">
                                    {filters.provincia && MUNICIPIOS_POR_PROVINCIA[filters.provincia]?.map(m => (
                                        <option key={m} value={m} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                    </div>

                    {/* 3. Cobro */}
                    <div className="border-t border-slate-50 pt-6">
                        <h3 className="app-title mb-4 ml-1">Cobro</h3>

                        {/* Método de Cobro */}
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="app-label-block px-1">Método de Cobro</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={filters.metodoCobro || ''}
                                    onChange={(e) => updateFilter('metodoCobro', e.target.value || undefined)}
                                    className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Todos los métodos</option>
                                    {paymentMethods.map(pm => (
                                        <option key={pm.id} value={pm.id}>{pm.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Banco de Cobro */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1">Banco de Cobro</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={filters.bancoCobro || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        updateFilter('bancoCobro', val || undefined);
                                    }}
                                    placeholder="Código banco (4 dígitos)"
                                    maxLength={4}
                                    inputMode="numeric"
                                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. Identificador (Rango) */}
                    <div className="border-t border-slate-50 pt-6">
                        <h3 className="app-title mb-4 ml-1">Identificador</h3>

                        {/* Desde */}
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="app-label-block px-1">Desde</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={filters.identificadorDesde || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        updateFilter('identificadorDesde', val || undefined);
                                    }}
                                    placeholder="12345678"
                                    maxLength={8}
                                    inputMode="numeric"
                                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-normal text-slate-700 bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Hasta */}
                        <div className="flex flex-col gap-2">
                            <label className="app-label-block px-1">Hasta</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={filters.identificadorHasta || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        updateFilter('identificadorHasta', val || undefined);
                                    }}
                                    placeholder="99999999"
                                    maxLength={8}
                                    inputMode="numeric"
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

export default ClientFilterPanel;

import React from 'react';
import {
    Filter,
    RotateCcw,
    Activity,
    X
} from 'lucide-react';
import SmartDatePicker from './ui/SmartDatePicker';

export interface EconomicFilters {
    periodMode: 'all' | 'fiscalYear' | 'custom';
    fiscalYear?: number;
    startDate: string;
    endDate: string;
    dateType: 'createdAt' | 'closedAt';
    caseStatus: string; // 'opened' | 'closed' | 'all'
    deliveryNoteStatus: string; // 'pending' | 'invoiced' | 'all'
    invoiceStatus: string; // 'pending' | 'paid' | 'overdue' | 'all'
}

interface EconomicFiltersPanelProps {
    filters: EconomicFilters;
    onFilterChange: (newFilters: EconomicFilters) => void;
    onClear: () => void;
    onClose: () => void;
    isOpen: boolean;
}

const EconomicFiltersPanel: React.FC<EconomicFiltersPanelProps> = ({
    filters,
    onFilterChange,
    onClear,
    onClose,
    isOpen
}) => {
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - i);

    const fiscalBounds = (year: number) => ({
        start: `${year}-01-01`,
        end: `${year}-12-31`
    });

    const hasActiveFilters =
        filters.periodMode !== 'all' ||
        filters.startDate ||
        filters.endDate ||
        filters.caseStatus !== 'all' ||
        filters.deliveryNoteStatus !== 'all' ||
        filters.invoiceStatus !== 'all';

    const updateFilter = (key: keyof EconomicFilters, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const handlePeriodModeChange = (value: string) => {
        if (value === 'all') {
            onFilterChange({
                ...filters,
                periodMode: 'all',
                fiscalYear: undefined,
                startDate: '',
                endDate: ''
            });
            return;
        }

        if (value === 'custom') {
            onFilterChange({
                ...filters,
                periodMode: 'custom',
                fiscalYear: undefined
            });
            return;
        }

        const year = Number(value);
        if (!Number.isFinite(year)) return;
        const { start, end } = fiscalBounds(year);
        onFilterChange({
            ...filters,
            periodMode: 'fiscalYear',
            fiscalYear: year,
            startDate: start,
            endDate: end
        });
    };

    const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
        if (filters.periodMode === 'fiscalYear' && filters.fiscalYear) {
            const bounds = fiscalBounds(filters.fiscalYear);
            const currentStart = key === 'startDate' ? value : filters.startDate;
            const currentEnd = key === 'endDate' ? value : filters.endDate;
            const stillFiscal = currentStart === bounds.start && currentEnd === bounds.end;
            onFilterChange({
                ...filters,
                [key]: value,
                periodMode: stillFiscal ? 'fiscalYear' : 'custom',
                fiscalYear: stillFiscal ? filters.fiscalYear : undefined
            });
            return;
        }

        onFilterChange({
            ...filters,
            [key]: value,
            periodMode: (value || (key === 'startDate' ? filters.endDate : filters.startDate)) ? 'custom' : 'all',
            fiscalYear: undefined
        });
    };

    const periodSelectValue =
        filters.periodMode === 'fiscalYear' && filters.fiscalYear
            ? String(filters.fiscalYear)
            : filters.periodMode === 'custom'
                ? 'custom'
                : 'all';

    if (!isOpen) return null;

    return (
        <>
            {/* Mobile overlay backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Filter Panel */}
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
                        <h2 className="app-section-title !mb-0 !text-[13px]">FILTROS</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        {hasActiveFilters && (
                            <button
                                onClick={onClear}
                                className="app-muted hover:text-sky-600 transition-colors flex items-center gap-1 text-xs"
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 no-scrollbar">

                    {/* Periodo Global */}
                    <div>
                        <h3 className="app-title mb-4 ml-1">Periodo Global</h3>

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="app-label-block px-1">Ejercicio</label>
                            <div className="relative">
                                <select
                                    value={periodSelectValue}
                                    onChange={(e) => handlePeriodModeChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-[#cfdbe7] rounded-lg h-12 pl-4 pr-10 text-base font-normal text-[#0d141b] appearance-none focus:ring-2 focus:ring-[#1380ec]/20 outline-none transition-all"
                                >
                                    <option value="all">Todos</option>
                                    <option value="custom">Personalizado</option>
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <Activity className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <SmartDatePicker
                                label="Fecha desde"
                                value={filters.startDate}
                                onChange={(val) => handleDateChange('startDate', val)}
                            />
                            <SmartDatePicker
                                label="Fecha hasta"
                                value={filters.endDate}
                                onChange={(val) => handleDateChange('endDate', val)}
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-50 pt-6"></div>

                    {/* Case Status */}
                    <div className="flex flex-col gap-2">
                        <label className="app-label-block px-1">Estado Expedientes</label>
                        <div className="relative">
                            <select
                                value={filters.caseStatus}
                                onChange={(e) => updateFilter('caseStatus', e.target.value)}
                                className="w-full bg-slate-50 border border-[#cfdbe7] rounded-lg h-12 pl-4 pr-10 text-base font-normal text-[#0d141b] appearance-none focus:ring-2 focus:ring-[#1380ec]/20 outline-none transition-all"
                            >
                                <option value="all">Todos</option>
                                <option value="opened">Abiertos</option>
                                <option value="closed">Cerrados</option>
                            </select>
                            <Activity className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Delivery Note Status */}
                    <div className="flex flex-col gap-2">
                        <label className="app-label-block px-1">Estado Albaranes</label>
                        <div className="relative">
                            <select
                                value={filters.deliveryNoteStatus}
                                onChange={(e) => updateFilter('deliveryNoteStatus', e.target.value)}
                                className="w-full bg-slate-50 border border-[#cfdbe7] rounded-lg h-12 pl-4 pr-10 text-base font-normal text-[#0d141b] appearance-none focus:ring-2 focus:ring-[#1380ec]/20 outline-none transition-all"
                            >
                                <option value="all">Todos</option>
                                <option value="pending">Pendientes de Facturar</option>
                                <option value="invoiced">Facturados</option>
                                <option value="void">Anulados</option>
                            </select>
                            <Activity className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Invoice Status */}
                    <div className="flex flex-col gap-2">
                        <label className="app-label-block px-1">Estado Facturas</label>
                        <div className="relative">
                            <select
                                value={filters.invoiceStatus}
                                onChange={(e) => updateFilter('invoiceStatus', e.target.value)}
                                className="w-full bg-slate-50 border border-[#cfdbe7] rounded-lg h-12 pl-4 pr-10 text-base font-normal text-[#0d141b] appearance-none focus:ring-2 focus:ring-[#1380ec]/20 outline-none transition-all"
                            >
                                <option value="all">Todas</option>
                                <option value="pending">Pendientes de Pago</option>
                                <option value="paid">Pagadas</option>
                                <option value="overdue">Vencidas</option>
                            </select>
                            <Activity className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                </div>
                <div className="h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
        </>
    );
};

export default EconomicFiltersPanel;

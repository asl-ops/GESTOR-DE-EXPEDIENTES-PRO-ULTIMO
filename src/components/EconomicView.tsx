
import React, { useState, useMemo, useEffect } from 'react';
import EconomicFiltersPanel, { EconomicFilters } from './EconomicFiltersPanel';
import { useEconomic } from '@/hooks/useEconomic';
import { useToast } from '@/hooks/useToast';
import { ClientTypeahead } from '@/components/ClientTypeahead';
import PaginationControls, { PageSize } from '@/components/PaginationControls';
import KPICards from './economic/KPICards';
import {
    Briefcase,
    Building,
    X,
    Euro,
    Wallet,
    Copy,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { BackToHubButton } from './ui/BackToHubButton';
import { BackToClientNavigationButton } from './ui/BackToClientNavigationButton';
import { PremiumFilterButton } from './ui/PremiumFilterButton';
import { Button } from './ui/Button';
import { CopyAction } from './ui/ActionFeedback';
import { navigateToModule } from '@/utils/moduleNavigation';
import { getClientNavigationReturnPath, saveClientNavigationContext } from '@/utils/clientNavigationContext';

// Safe Formatters
const formatCurrency = (value?: number) =>
    typeof value === 'number' && !isNaN(value)
        ? value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
        : '—';

const formatCompactCurrency = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '0,00 €';
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${sign}${formatted} €`;
};

const formatDate = (value?: any) => {
    if (!value || value === '-') return '—';
    try {
        const d = value instanceof Date ? value : (value?.toDate ? value.toDate() : new Date(value));
        if (!d || isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return '—';
    }
};

type TabType = 'expedientes' | 'facturas';
type AgaTabType = 'expedientesAbiertos' | 'facturasExpedientes' | 'saldoContable';
type LedgerSortDirection = 'asc' | 'desc';

const EconomicView: React.FC = () => {
    const { addToast } = useToast();

    // -- State --
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(() => {
        return localStorage.getItem('economic-filters-open') === 'true';
    });

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedClientLabel, setSelectedClientLabel] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('expedientes');
    const [activeAgaTab, setActiveAgaTab] = useState<AgaTabType>('expedientesAbiertos');

    const [filters, setFilters] = useState<EconomicFilters>({
        periodMode: 'all',
        fiscalYear: undefined,
        startDate: '',
        endDate: '',
        dateType: 'createdAt',
        caseStatus: 'all',
        deliveryNoteStatus: 'all',
        invoiceStatus: 'all'
    });
    const [ledgerSortDirection, setLedgerSortDirection] = useState<LedgerSortDirection>('desc');

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.periodMode !== 'all') {
            count++;
        } else if (filters.startDate || filters.endDate) {
            count++;
        }
        if (filters.caseStatus !== 'all') count++;
        if (filters.deliveryNoteStatus !== 'all') count++;
        if (filters.invoiceStatus !== 'all') count++;
        return count;
    }, [filters]);

    const handleClearFilters = () => {
        setFilters({
            periodMode: 'all',
            fiscalYear: undefined,
            startDate: '',
            endDate: '',
            dateType: 'createdAt',
            caseStatus: 'all',
            deliveryNoteStatus: 'all',
            invoiceStatus: 'all'
        });
    };

    // Pagination
    const [pageSize, setPageSize] = useState<PageSize>(() => {
        const saved = localStorage.getItem('economic-per-page');
        if (saved === 'all') return 'all';
        if (saved) {
            const num = parseInt(saved, 10);
            if (!isNaN(num) && [25, 50, 100].includes(num)) return num as PageSize;
        }
        return 25;
    });

    const [casesPage, setCasesPage] = useState(1);
    const [invPage, setInvPage] = useState(1);

    const handlePageSizeChange = (newSize: PageSize) => {
        setPageSize(newSize);
        localStorage.setItem('economic-per-page', String(newSize));
        setCasesPage(1);
        setInvPage(1);
    };

    const getSlice = <T,>(list: T[], page: number) => {
        if (pageSize === 'all') return list;
        const start = (page - 1) * (pageSize as number);
        const end = start + (pageSize as number);
        return list.slice(start, end);
    };

    // -- Hook --
    const {
        loading,
        loadingSummary,
        isRefreshing,
        client,
        cases,
        invoices,
        ledgerEntries,
        kpis,
        summary,
        casesState,
        invoicesState,
        ledgerState,
        casesError,
        invoicesError,
        ledgerError,
        ensureCasesLoaded,
        ensureInvoicesLoaded,
        ensureLedgerLoaded
    } = useEconomic(selectedClientId, filters, pageSize);

    // Prevent loading flicker for very fast requests
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
    useEffect(() => {
        if (!selectedClientId) {
            setShowLoadingOverlay(false);
            return;
        }
        if (!loadingSummary) {
            setShowLoadingOverlay(false);
            return;
        }
        const timer = window.setTimeout(() => setShowLoadingOverlay(true), 200);
        return () => window.clearTimeout(timer);
    }, [loadingSummary, selectedClientId]);

    useEffect(() => {
        if (activeAgaTab === 'expedientesAbiertos') setActiveTab('expedientes');
        if (activeAgaTab === 'facturasExpedientes') setActiveTab('facturas');
    }, [activeAgaTab]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const clientId = params.get('clientId');
        const identifier = params.get('identifier');
        const clientName = params.get('clientName');
        if (!clientId) return;
        setSelectedClientId(clientId);
        if (clientName) {
            setSelectedClientLabel(clientName);
        } else if (identifier) {
            setSelectedClientLabel(identifier);
        }
        saveClientNavigationContext({
            active: true,
            clientId,
            identifier: identifier || undefined,
            clientName: clientName || undefined,
            sourceModule: 'economico'
        });
    }, []);

    const paginatedCases = getSlice(cases, casesPage);
    const paginatedInvoices = getSlice(invoices, invPage);
    const sortedLedgerEntries = useMemo(() => {
        const copy = [...ledgerEntries];
        copy.sort((a, b) => {
            const ta = new Date(a.fecha || 0).getTime();
            const tb = new Date(b.fecha || 0).getTime();
            if (ledgerSortDirection === 'asc') return ta - tb;
            return tb - ta;
        });
        return copy;
    }, [ledgerEntries, ledgerSortDirection]);

    // -- Handlers --
    const handleDrillDown = async (type: 'openCases' | 'pendingInvoices' | 'contableBalance') => {
        if (type === 'openCases') {
            setActiveAgaTab('expedientesAbiertos');
            setActiveTab('expedientes');
            setFilters(prev => ({ ...prev, caseStatus: 'opened' }));
            await ensureCasesLoaded();
            return;
        }
        if (type === 'pendingInvoices') {
            setActiveAgaTab('facturasExpedientes');
            setActiveTab('facturas');
            setFilters(prev => ({ ...prev, invoiceStatus: 'pending' }));
            await ensureInvoicesLoaded();
            return;
        }
        setActiveAgaTab('saldoContable');
        await ensureLedgerLoaded();
    };

    const TabButton = ({ id, label, icon: Icon, count }: { id: TabType, label: string, icon: any, count: number }) => (
        <button
            onClick={async () => {
                setActiveTab(id);
                if (id === 'expedientes') {
                    await ensureCasesLoaded();
                }
                if (id === 'facturas') {
                    await ensureInvoicesLoaded();
                }
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === id
                ? 'border-sky-500 text-sky-600 bg-sky-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
        >
            <Icon className={`w-4 h-4 ${activeTab === id ? 'text-sky-500' : 'text-slate-400'}`} />
            {label}
            {count > 0 && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {count}
                </span>
            )}
        </button>
    );

    const AgaTabButton = ({ id, label, icon: Icon }: { id: AgaTabType, label: string, icon: any }) => (
        <button
            onClick={async () => {
                setActiveAgaTab(id);
                if (id === 'expedientesAbiertos') {
                    setActiveTab('expedientes');
                    await ensureCasesLoaded();
                }
                if (id === 'facturasExpedientes') {
                    setActiveTab('facturas');
                    await ensureInvoicesLoaded();
                }
                if (id === 'saldoContable') {
                    await ensureLedgerLoaded();
                }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${activeAgaTab === id
                ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-200 hover:text-sky-700'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    const AGAPlaceholderContent = () => {
        const moduleTitle: Record<AgaTabType, string> = {
            expedientesAbiertos: 'Expedientes Abiertos',
            facturasExpedientes: 'Facturas de Expedientes',
            saldoContable: 'Saldo Contable'
        };

        if (activeAgaTab !== 'saldoContable') {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Clientes AGA</div>
                            <div className="text-2xl font-mono text-slate-700">—</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Expedientes Históricos</div>
                            <div className="text-2xl font-mono text-slate-700">—</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Facturas Pendientes</div>
                            <div className="text-2xl font-mono text-slate-700">—</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Saldo Contable</div>
                            <div className="text-2xl font-mono text-slate-700">—</div>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">Mapa de Integración</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">Clientes + Expedientes</div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">Facturas + Saldos</div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">Extracto de movimientos</div>
                        </div>
                    </div>
                </div>
            );
        }

        const rowsByTab: Record<AgaTabType, string[]> = {
            expedientesAbiertos: [],
            facturasExpedientes: [],
            saldoContable: ['Fecha', 'Asiento', 'Documento', 'Concepto', 'Debe/Haber']
        };

        return (
            <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Módulo</p>
                        <h3 className="text-sm font-semibold text-slate-700">{moduleTitle[activeAgaTab]}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="!h-9 !px-3 !text-[10px] !tracking-widest">
                            Filtros
                        </Button>
                        <Button variant="outline" size="sm" className="!h-9 !px-3 !text-[10px] !tracking-widest">
                            Exportar
                        </Button>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Tabla del módulo</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-white">
                                    {rowsByTab[activeAgaTab].map((col) => (
                                        <th key={col} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3].map((r) => (
                                    <tr key={r} className="border-b border-slate-50">
                                        {rowsByTab[activeAgaTab].map((col) => (
                                            <td key={`${r}-${col}`} className="px-4 py-3 text-slate-600">
                                                <span className="inline-block h-3 w-20 rounded bg-slate-100" />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // -- Renders --
    return (
        <div className="flex h-full bg-[#fcfdfe] overflow-hidden">
            {/* Filters Panel */}
            <EconomicFiltersPanel
                filters={filters}
                onFilterChange={setFilters}
                onClear={handleClearFilters}
                onClose={() => setIsFilterPanelOpen(false)}
                isOpen={isFilterPanelOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-10 py-8 flex-none z-10 shadow-sm relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-indigo-200 shadow-sm">
                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                    Económico
                                </span>
                            </div>
                            <BackToHubButton />

                            {selectedClientId && (
                                <BackToClientNavigationButton onClick={() => navigateToModule(getClientNavigationReturnPath())} />
                            )}

                            <PremiumFilterButton
                                isActive={isFilterPanelOpen}
                                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                                tooltip={`Filtrar económico${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
                            />

                            {/* Active filter chips */}
                            {activeFilterCount > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-100 rounded-full">
                                    <div className="size-1.5 rounded-full bg-sky-400" />
                                    <span className="text-[10px] font-normal uppercase tracking-widest text-sky-700">
                                        {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} activo{activeFilterCount > 1 ? 's' : ''}
                                    </span>
                                    <button
                                        onClick={handleClearFilters}
                                        className="text-sky-400 hover:text-sky-600 transition-colors ml-1"
                                        title="Limpiar filtros"
                                    >
                                        <X size={10} strokeWidth={3} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Client Selector Row */}
                    <div className="mt-6 flex flex-col xl:flex-row gap-4 items-end xl:items-start">
                        {/* Client Selector */}
                        <div className="w-full xl:flex-1 min-w-0 xl:max-w-[780px]">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">
                                Cliente Seleccionado
                            </label>
                            <div className="h-[36px]">
                                <ClientTypeahead
                                    valueClientId={selectedClientId}
                                    valueLabel={selectedClientLabel}
                                    placeholder="Buscar Cliente..."
                                    onSelect={(c) => {
                                        setSelectedClientId(c.id);
                                        setSelectedClientLabel((c.documento ? c.documento + ' — ' : '') + c.nombre);
                                    }}
                                    onClear={() => {
                                        setSelectedClientId(null);
                                        setSelectedClientLabel('');
                                        setFilters({
                                            periodMode: 'all',
                                            fiscalYear: undefined,
                                            startDate: '',
                                            endDate: '',
                                            dateType: 'createdAt',
                                            caseStatus: 'all',
                                            deliveryNoteStatus: 'all',
                                            invoiceStatus: 'all'
                                        });
                                    }}
                                    enableQuickCreate={false}
                                    limit={10}
                                    compact={true}
                                />
                            </div>
                        </div>

                        {/* Account Number */}
                        <div className="w-full xl:w-[330px] shrink-0">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">
                                Cuenta Contable
                            </label>
                            <button
                                onClick={() => client?.cuentaContable ? addToast('Módulo Contabilidad: Próximamente', 'info') : null}
                                className={'w-full h-[36px] bg-white border border-slate-200 rounded-xl px-3 flex items-center justify-between shadow-sm transition-all font-mono ' + (client?.cuentaContable ? 'hover:border-sky-300 cursor-pointer group' : 'cursor-default')}
                            >
                                {client?.cuentaContable ? (
                                    <CopyAction text={client.cuentaContable}>
                                        <div className="inline-flex items-center gap-1.5 group/copy">
                                            <span className="text-sm font-normal text-slate-700 font-mono tabular-nums tracking-[0.02em]">
                                                {String(client.cuentaContable).slice(0, 10)}
                                            </span>
                                            <Copy className="w-3.5 h-3.5 text-slate-300 group-hover/copy:text-sky-500 transition-colors" />
                                        </div>
                                    </CopyAction>
                                ) : (
                                    <span className="text-sm font-normal text-slate-700 font-mono tabular-nums">—</span>
                                )}
                                {client?.cuentaContable && (
                                    <Building className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition-colors" />
                                )}
                            </button>
                        </div>

                        {/* Saldo Contable */}
                        <div className="w-full xl:w-[240px] shrink-0">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">
                                Saldo Contable
                            </label>
                            <div className="w-full h-[36px] bg-white border border-slate-200 rounded-xl px-3 flex items-center justify-between shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {summary.periodLabel}
                                </span>
                                <div className="text-right">
                                    <span className="text-sm font-mono tabular-nums text-slate-700 tracking-[0.01em] whitespace-nowrap">
                                        {loadingSummary ? 'Cargando...' : formatCompactCurrency(summary.saldoContable)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-1 flex items-center justify-end gap-1.5">
                                <span className="text-[10px] uppercase tracking-widest text-slate-400">Origen:</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${summary.contableMeta.source === 'economicBalances'
                                    ? 'text-sky-700 border-sky-200 bg-sky-50'
                                    : 'text-amber-700 border-amber-200 bg-amber-50'
                                    }`}>
                                    {summary.contableMeta.source === 'economicBalances' ? 'Balances' : 'Mayor'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* AGA integration visual shell */}
                    <div className="mt-6 border-t border-slate-100 pt-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700">Integración AGA CCS GI</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">Visual</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <AgaTabButton id="expedientesAbiertos" label="Expedientes abiertos" icon={Briefcase} />
                            <AgaTabButton id="facturasExpedientes" label="Facturas pendientes" icon={Euro} />
                            <AgaTabButton id="saldoContable" label="Extracto mayor cliente" icon={Wallet} />
                        </div>
                    </div>
                </div>

                <div className="relative flex-1 overflow-y-auto p-8 scrollbar-thin">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {!selectedClientId ? (
                            <div className="space-y-6">
                                <div className="flex flex-col items-center justify-center py-14 opacity-80">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Briefcase className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-600">Integración visual activa</h3>
                                    <p className="text-sm text-slate-400 mt-1">Selecciona cliente cuando quieras cruzar datos reales</p>
                                </div>
                                <AGAPlaceholderContent />
                            </div>
                        ) : (
                            <>
                                {activeAgaTab === 'saldoContable' ? (
                                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                            <h3 className="text-sm font-semibold text-slate-700">Extracto Mayor del Cliente</h3>
                                            <p className="text-xs text-slate-500 mt-1">Movimientos importados desde mayor contable</p>
                                        </div>
                                        <div className="overflow-auto max-h-[640px]">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-white z-10">
                                                    <tr className="border-b border-slate-100 text-left bg-slate-50/30">
                                                        <th className="py-3 px-5 font-semibold text-slate-600 w-36">
                                                            <button
                                                                type="button"
                                                                onClick={() => setLedgerSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                                                className="inline-flex items-center gap-1 rounded-md text-slate-600 hover:text-sky-600 transition-colors"
                                                                title={ledgerSortDirection === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
                                                            >
                                                                <span>Fecha</span>
                                                                {ledgerSortDirection === 'asc' ? (
                                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                                ) : (
                                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        </th>
                                                        <th className="py-3 px-5 font-semibold text-slate-600 w-24">Asiento</th>
                                                        <th className="py-3 px-5 font-semibold text-slate-600 w-28">Documento</th>
                                                        <th className="py-3 px-5 font-semibold text-slate-600">Concepto</th>
                                                        <th className="py-3 px-5 font-semibold text-slate-600 w-28 text-right">Debe</th>
                                                        <th className="py-3 px-5 font-semibold text-slate-600 w-28 text-right">Haber</th>
                                                        <th className="py-3 px-5 font-semibold text-slate-600 w-28 text-right">Saldo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {sortedLedgerEntries.map((entry) => (
                                                        <tr key={entry.id} className="hover:bg-slate-50">
                                                            <td className="py-3 px-5 text-slate-500">{formatDate(entry.fecha)}</td>
                                                            <td className="py-3 px-5 font-mono text-slate-600">{entry.asiento || '—'}</td>
                                                            <td className="py-3 px-5 font-mono text-slate-600">
                                                                {entry.documento ? (
                                                                    <CopyAction text={entry.documento}>
                                                                        <div className="inline-flex items-center gap-1 group/copy">
                                                                            <span>{entry.documento}</span>
                                                                            <Copy size={12} className="text-slate-300 group-hover/copy:text-sky-500" />
                                                                        </div>
                                                                    </CopyAction>
                                                                ) : (
                                                                    '—'
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-5 text-slate-700">{entry.descripcion || '—'}</td>
                                                            <td className="py-3 px-5 text-right font-mono text-slate-700">{formatCurrency(entry.debe)}</td>
                                                            <td className="py-3 px-5 text-right font-mono text-slate-700">{formatCurrency(entry.haber)}</td>
                                                            <td className="py-3 px-5 text-right font-mono text-slate-900">{formatCurrency(entry.saldo)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {ledgerState === 'idle' && (
                                                <div className="py-12 text-center text-slate-500">Pulsa "Extracto mayor cliente" para cargar el extracto del cliente.</div>
                                            )}
                                            {ledgerState === 'loading' && (
                                                <div className="py-12 text-center text-slate-500">Cargando extracto contable...</div>
                                            )}
                                            {ledgerState === 'error' && (
                                                <div className="py-12 text-center text-rose-600">{ledgerError || 'No se pudo cargar el extracto.'}</div>
                                            )}
                                            {ledgerState === 'ready' && ledgerEntries.length === 0 && (
                                                <div className="py-12 text-center text-slate-500">No hay extracto importado para este cliente/cuenta contable.</div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* KPIs */}
                                        <KPICards
                                            kpis={kpis}
                                            saldoContable={summary.saldoContable}
                                            onDrillDown={handleDrillDown}
                                            loading={loading}
                                        />

                                        <div className="h-[600px]">
                                            <div className="h-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                                {/* Tabs Header */}
                                                <div className="flex border-b border-slate-100 bg-slate-50/30">
                                                    <TabButton id="expedientes" label="Expedientes" icon={Briefcase} count={cases.length} />
                                                    <TabButton id="facturas" label="Facturas" icon={Euro} count={invoices.length} />
                                                </div>

                                        {/* Table Content */}
                                        <div className="flex-1 overflow-hidden flex flex-col relative">
                                            <div className="flex-1 overflow-auto">
                                                {(activeTab === 'expedientes' && casesState === 'idle') && (
                                                    <div className="py-12 text-center text-slate-500">Pulsa "Expedientes" para cargar el detalle bajo demanda.</div>
                                                )}
                                                {(activeTab === 'facturas' && invoicesState === 'idle') && (
                                                    <div className="py-12 text-center text-slate-500">Pulsa "Facturas" para cargar el detalle bajo demanda.</div>
                                                )}
                                                {(activeTab === 'expedientes' && casesState === 'loading') && (
                                                    <div className="py-12 text-center text-slate-500">Cargando expedientes...</div>
                                                )}
                                                {(activeTab === 'facturas' && invoicesState === 'loading') && (
                                                    <div className="py-12 text-center text-slate-500">Cargando facturas...</div>
                                                )}
                                                {(activeTab === 'expedientes' && casesState === 'error') && (
                                                    <div className="py-12 text-center text-rose-600">{casesError || 'No se pudieron cargar los expedientes.'}</div>
                                                )}
                                                {(activeTab === 'facturas' && invoicesState === 'error') && (
                                                    <div className="py-12 text-center text-rose-600">{invoicesError || 'No se pudieron cargar las facturas.'}</div>
                                                )}
                                                <table className="w-full text-sm">
                                                    {/* EXPEDIENTES */}
                                                    {activeTab === 'expedientes' && casesState === 'ready' && (
                                                        <>
                                                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                                                <tr className="border-b border-slate-100 text-left bg-slate-50/30">
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Nº Exp</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600">Asunto</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Fecha</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {paginatedCases.map(c => (
                                                                    <tr key={c.fileNumber} className="hover:bg-slate-50">
                                                                        <td className="py-3 px-6 font-mono text-slate-500">{c.fileNumber}</td>
                                                                        <td className="py-3 px-6 font-medium text-slate-800">{c.description || 'Sin asunto'}</td>
                                                                        <td className="py-3 px-6 text-slate-500">{formatDate(c.createdAt)}</td>
                                                                        <td className="py-3 px-6">
                                                                            <span className={'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ' + (c.closedAt ? 'bg-slate-100 text-slate-600' : 'bg-green-50 text-green-700')}>
                                                                                {c.closedAt ? 'Cerrado' : 'Abierto'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </>
                                                    )}

                                                    {/* FACTURAS */}
                                                    {activeTab === 'facturas' && invoicesState === 'ready' && (
                                                        <>
                                                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                                                <tr className="border-b border-slate-100 text-left bg-slate-50/30">
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Nº Fra</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Fecha</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32 text-right">Importe</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {paginatedInvoices.map(inv => (
                                                                    <tr key={inv.id} className="hover:bg-slate-50">
                                                                        <td className="py-3 px-6 font-mono text-slate-500">{inv.number || 'Pendiente'}</td>
                                                                        <td className="py-3 px-6 text-slate-500">{formatDate(inv.createdAt)}</td>
                                                                        <td className="py-3 px-6 text-right font-normal text-slate-700">{formatCurrency(inv.total)}</td>
                                                                        <td className="py-3 px-6">
                                                                            {inv.isPaid ? (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">Cobrada</span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700">Pdte. Cobro</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </>
                                                    )}

                                                </table>
                                            </div>

                                            {/* Footer Pagination */}
                                            <div className="border-t border-slate-100">
                                                <PaginationControls
                                                    currentPage={
                                                        activeTab === 'expedientes' ? casesPage : invPage
                                                    }
                                                    totalPages={
                                                        activeTab === 'expedientes'
                                                            ? (pageSize === 'all' ? 1 : Math.ceil(cases.length / (pageSize as number)))
                                                            : (pageSize === 'all' ? 1 : Math.ceil(invoices.length / (pageSize as number)))
                                                    }
                                                    pageSize={pageSize}
                                                    totalItems={
                                                        activeTab === 'expedientes' ? cases.length : invoices.length
                                                    }
                                                    onPageChange={
                                                        activeTab === 'expedientes' ? setCasesPage : setInvPage
                                                    }
                                                    onPageSizeChange={handlePageSizeChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {showLoadingOverlay && (
                        <div
                            className="absolute inset-0 z-30 bg-white/82 backdrop-blur-[1px] flex items-center justify-center pointer-events-auto"
                            aria-live="polite"
                            aria-busy="true"
                        >
                            <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-sky-100 bg-white shadow-sm">
                                <svg className="animate-spin h-8 w-8 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3.2A4.8 4.8 0 007.2 12H4z"></path>
                                </svg>
                                <span className="text-xs font-bold uppercase tracking-widest text-sky-700">
                                    {isRefreshing ? 'Actualizando resumen económico...' : 'Cargando datos económicos...'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default EconomicView;


import React, { useState, useMemo } from 'react';
import EconomicFiltersPanel, { EconomicFilters } from './EconomicFiltersPanel';
import { useEconomic } from '@/hooks/useEconomic';
import { useToast } from '@/hooks/useToast';
import { ClientTypeahead } from '@/components/ClientTypeahead';
import PaginationControls, { PageSize } from '@/components/PaginationControls';
import KPICards from './economic/KPICards';
import ActivityTimeline from './economic/ActivityTimeline';
import {
    Receipt,
    Briefcase,
    Building,
    Filter,
    X,
    Euro,
    File
} from 'lucide-react';
import { BackToHubButton } from './ui/BackToHubButton';

// Safe Formatters
const formatCurrency = (value?: number) =>
    typeof value === 'number' && !isNaN(value)
        ? value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
        : '—';

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

type TabType = 'expedientes' | 'albaranes' | 'facturas' | 'proformas';

const EconomicView: React.FC = () => {
    const { addToast } = useToast();

    // -- State --
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(() => {
        return localStorage.getItem('economic-filters-open') === 'true';
    });

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedClientLabel, setSelectedClientLabel] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('expedientes');

    const [filters, setFilters] = useState<EconomicFilters>({
        startDate: '',
        endDate: '',
        dateType: 'createdAt',
        caseStatus: 'all',
        deliveryNoteStatus: 'all',
        invoiceStatus: 'all'
    });

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.startDate || filters.endDate) count++;
        if (filters.caseStatus !== 'all') count++;
        if (filters.deliveryNoteStatus !== 'all') count++;
        if (filters.invoiceStatus !== 'all') count++;
        return count;
    }, [filters]);

    const handleClearFilters = () => {
        setFilters({
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
    const [dnPage, setDnPage] = useState(1);
    const [invPage, setInvPage] = useState(1);
    const [profPage, setProfPage] = useState(1);

    const handlePageSizeChange = (newSize: PageSize) => {
        setPageSize(newSize);
        localStorage.setItem('economic-per-page', String(newSize));
        setCasesPage(1);
        setDnPage(1);
        setInvPage(1);
        setProfPage(1);
    };

    const getSlice = <T,>(list: T[], page: number) => {
        if (pageSize === 'all') return list;
        const start = (page - 1) * (pageSize as number);
        const end = start + (pageSize as number);
        return list.slice(start, end);
    };

    // -- Hook --
    const {
        client,
        cases,
        deliveryNotes,
        invoices,
        proformas,
        kpis,
        timeline
    } = useEconomic(selectedClientId, filters, pageSize);

    const paginatedCases = getSlice(cases, casesPage);
    const paginatedDeliveryNotes = getSlice(deliveryNotes, dnPage);
    const paginatedInvoices = getSlice(invoices, invPage);
    const paginatedProformas = getSlice(proformas, profPage);

    // -- Handlers --
    const handleDrillDown = (type: 'invoiced' | 'paid' | 'pending' | 'overdue' | 'billing') => {
        if (type === 'billing') {
            setActiveTab('albaranes');
            setFilters(prev => ({ ...prev, deliveryNoteStatus: 'pending' }));
        } else {
            setActiveTab('facturas');
            if (type === 'invoiced') setFilters(prev => ({ ...prev, invoiceStatus: 'all' })); // Or 'issued' if desired
            if (type === 'paid') setFilters(prev => ({ ...prev, invoiceStatus: 'paid' }));
            if (type === 'pending') setFilters(prev => ({ ...prev, invoiceStatus: 'pending' }));
            if (type === 'overdue') setFilters(prev => ({ ...prev, invoiceStatus: 'overdue' }));
        }
    };

    const TabButton = ({ id, label, icon: Icon, count }: { id: TabType, label: string, icon: any, count: number }) => (
        <button
            onClick={() => setActiveTab(id)}
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

                            {/* Filtros button */}
                            <button
                                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm hover:shadow-md active:scale-95 group relative ${isFilterPanelOpen
                                    ? 'bg-sky-500 border-sky-600 text-white'
                                    : 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200 hover:border-sky-300'
                                    }`}
                                title="Abrir panel de filtros"
                            >
                                <Filter className={`w-4 h-4 transition-colors ${isFilterPanelOpen
                                    ? 'text-white'
                                    : 'text-sky-600 group-hover:text-sky-700'
                                    }`} />
                                <span className={`text-xs font-bold uppercase tracking-wider ${isFilterPanelOpen
                                    ? 'text-white'
                                    : 'text-sky-700'
                                    }`}>
                                    Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                                </span>
                            </button>

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
                    <div className="mt-6 flex flex-col md:flex-row gap-4 items-end md:items-start">
                        {/* Client Selector */}
                        <div className="flex-1 w-full md:w-auto">
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
                        <div className="w-full md:w-64 shrink-0">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">
                                Cuenta Contable
                            </label>
                            <button
                                onClick={() => client?.cuentaContable ? addToast('Módulo Contabilidad: Próximamente', 'info') : null}
                                className={'w-full h-[36px] bg-white border border-slate-200 rounded-xl px-3 flex items-center justify-between shadow-sm transition-all ' + (client?.cuentaContable ? 'hover:border-sky-300 cursor-pointer group' : 'cursor-default')}
                            >
                                <span className="text-sm font-normal text-slate-700 font-mono">
                                    {client?.cuentaContable || '—'}
                                </span>
                                {client?.cuentaContable && (
                                    <Building className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition-colors" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {!selectedClientId ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Briefcase className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-600">Selecciona un cliente</h3>
                                <p className="text-sm text-slate-400 mt-1">Usa el buscador superior para ver la ficha económica</p>
                            </div>
                        ) : (
                            <>
                                {/* KPIs */}
                                <KPICards kpis={kpis} onDrillDown={handleDrillDown} />

                                <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
                                    {/* Left: Tabs + Table */}
                                    <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                        {/* Tabs Header */}
                                        <div className="flex border-b border-slate-100 bg-slate-50/30">
                                            <TabButton id="expedientes" label="Expedientes" icon={Briefcase} count={cases.length} />
                                            <TabButton id="albaranes" label="Albaranes" icon={Receipt} count={deliveryNotes.length} />
                                            <TabButton id="facturas" label="Facturas" icon={Euro} count={invoices.length} />
                                            <TabButton id="proformas" label="Proformas" icon={File} count={proformas.length} />
                                        </div>

                                        {/* Table Content */}
                                        <div className="flex-1 overflow-hidden flex flex-col relative">
                                            <div className="flex-1 overflow-auto">
                                                <table className="w-full text-sm">
                                                    {/* EXPEDIENTES */}
                                                    {activeTab === 'expedientes' && (
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

                                                    {/* ALBARANES */}
                                                    {activeTab === 'albaranes' && (
                                                        <>
                                                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                                                <tr className="border-b border-slate-100 text-left bg-slate-50/30">
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Nº Doc</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600">Concepto</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Fecha</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32 text-right">Importe</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {paginatedDeliveryNotes.map(dn => (
                                                                    <tr key={dn.id} className="hover:bg-slate-50">
                                                                        <td className="py-3 px-6 font-mono text-slate-500">{dn.id.substring(0, 8)}...</td>
                                                                        <td className="py-3 px-6 text-slate-700 truncate max-w-[200px]">{(dn.lines[0]?.concept) || '—'}</td>
                                                                        <td className="py-3 px-6 text-slate-500">{formatDate(dn.createdAt)}</td>
                                                                        <td className="py-3 px-6 text-right font-normal text-slate-700">{formatCurrency(dn.total)}</td>
                                                                        <td className="py-3 px-6">
                                                                            <span className={'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ' + (dn.status === 'invoiced' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700')}>
                                                                                {dn.status === 'invoiced' ? 'Facturado' : 'Pdte. Fac.'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </>
                                                    )}

                                                    {/* FACTURAS */}
                                                    {activeTab === 'facturas' && (
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

                                                    {/* PROFORMAS */}
                                                    {activeTab === 'proformas' && (
                                                        <>
                                                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                                                <tr className="border-b border-slate-100 text-left bg-slate-50/30">
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Nº Prof</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Fecha</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32 text-right">Importe</th>
                                                                    <th className="py-3 px-6 font-semibold text-slate-600 w-32">Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {paginatedProformas.map(prof => (
                                                                    <tr key={prof.id} className="hover:bg-slate-50">
                                                                        <td className="py-3 px-6 font-mono text-slate-500">{prof.number || 'Borrador'}</td>
                                                                        <td className="py-3 px-6 text-slate-500">{formatDate(prof.createdAt)}</td>
                                                                        <td className="py-3 px-6 text-right font-normal text-slate-700">{formatCurrency(prof.total)}</td>
                                                                        <td className="py-3 px-6">
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                                                {prof.status}
                                                                            </span>
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
                                                        activeTab === 'expedientes' ? casesPage :
                                                            activeTab === 'albaranes' ? dnPage :
                                                                activeTab === 'facturas' ? invPage : profPage
                                                    }
                                                    totalPages={
                                                        activeTab === 'expedientes' ? (pageSize === 'all' ? 1 : Math.ceil(cases.length / (pageSize as number))) :
                                                            activeTab === 'albaranes' ? (pageSize === 'all' ? 1 : Math.ceil(deliveryNotes.length / (pageSize as number))) :
                                                                activeTab === 'facturas' ? (pageSize === 'all' ? 1 : Math.ceil(invoices.length / (pageSize as number))) :
                                                                    (pageSize === 'all' ? 1 : Math.ceil(proformas.length / (pageSize as number)))
                                                    }
                                                    pageSize={pageSize}
                                                    totalItems={
                                                        activeTab === 'expedientes' ? cases.length :
                                                            activeTab === 'albaranes' ? deliveryNotes.length :
                                                                activeTab === 'facturas' ? invoices.length : proformas.length
                                                    }
                                                    onPageChange={
                                                        activeTab === 'expedientes' ? setCasesPage :
                                                            activeTab === 'albaranes' ? setDnPage :
                                                                activeTab === 'facturas' ? setInvPage : setProfPage
                                                    }
                                                    onPageSizeChange={handlePageSizeChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Activity Timeline */}
                                    <div className="w-full lg:w-80 shrink-0">
                                        <ActivityTimeline events={timeline} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EconomicView;

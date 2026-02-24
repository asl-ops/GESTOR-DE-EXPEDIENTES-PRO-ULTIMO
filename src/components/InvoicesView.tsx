import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Receipt, Printer, Eye, Trash2, Copy, MoreHorizontal, Ban, ExternalLink, Banknote, Filter, X } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { CopyAction } from './ui/ActionFeedback';
import { useToast } from '@/hooks/useToast';
import BillingFiltersPanel, { BillingFilters } from './BillingFiltersPanel';
import InvoiceDetailModal from './InvoiceDetailModal';
import InvoicePDFDocument from './InvoicePDFDocument';
import { Invoice, InvoiceStatus } from '../types/billing';
import { useInvoices } from '../hooks/useInvoices';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { BackToHubButton } from './ui/BackToHubButton';
import { useConfirmation, confirmVoid, confirmDelete } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';
import Breadcrumbs from './ui/Breadcrumbs';
import { ColumnSelectorMenu, type ColumnSelectorOption } from './ui/ColumnSelectorMenu';
import { navigateToModule } from '@/utils/moduleNavigation';

interface InvoicesViewProps {
    onViewCase?: (caseId: string) => void;
}

const INVOICES_VISIBLE_FIELDS_KEY = 'invoices-visible-fields-v1';

const statusLabels: Record<InvoiceStatus, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
    issued: { label: 'Emitida', color: 'bg-emerald-100 text-emerald-600' },
    void: { label: 'Anulada', color: 'bg-slate-200 text-slate-500' }
};

const InvoicesView: React.FC<InvoicesViewProps> = ({ onViewCase }) => {
    const { subscribeToInvoices, deleteInvoice, voidInvoice, markAsPaid } = useInvoices();
    const { addToast } = useToast();
    const { company } = useCompanySettings();

    // Data state
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Filter state
    const [filters, setFilters] = useState<BillingFilters>({
        searchQuery: '',
        clientId: null,
        clientLabel: '',
        caseId: '',
        prefix: '',
        responsibleId: '',
        responsibleLabel: '',
        dateType: 'createdAt',
        startDate: '',
        endDate: '',
        status: 'Todos'
    });

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.clientId) count++;
        if (filters.caseId) count++;
        if (filters.prefix) count++;
        if (filters.responsibleId) count++;
        if (filters.startDate || filters.endDate) count++;
        if (filters.status !== 'Todos') count++;
        return count;
    }, [filters]);

    const handleClearFilters = () => {
        setFilters({
            searchQuery: '',
            clientId: null,
            clientLabel: '',
            caseId: '',
            prefix: '',
            responsibleId: '',
            responsibleLabel: '',
            dateType: 'createdAt',
            startDate: '',
            endDate: '',
            status: 'Todos'
        });
    };

    // UI state
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(() => {
        const saved = localStorage.getItem('invoices-filters-open');
        return saved === 'true';
    });
    const invoicesFieldOptions: ColumnSelectorOption[] = [
        { id: 'number', label: 'Número' },
        { id: 'client', label: 'Cliente' },
        { id: 'amount', label: 'Importe' },
        { id: 'status', label: 'Estado' }
    ];
    const [visibleFields, setVisibleFields] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem(INVOICES_VISIBLE_FIELDS_KEY);
            if (!raw) return invoicesFieldOptions.map(f => f.id);
            const parsed = JSON.parse(raw) as string[];
            const allowed = new Set(invoicesFieldOptions.map(f => f.id));
            const filtered = parsed.filter(id => allowed.has(id));
            return filtered.length > 0 ? filtered : invoicesFieldOptions.map(f => f.id);
        } catch {
            return invoicesFieldOptions.map(f => f.id);
        }
    });
    const visibleFieldsSet = useMemo(() => new Set(visibleFields), [visibleFields]);

    useEffect(() => {
        localStorage.setItem(INVOICES_VISIBLE_FIELDS_KEY, JSON.stringify(visibleFields));
    }, [visibleFields]);

    const toggleVisibleField = (id: string) => {
        setVisibleFields(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };


    // ✅ Cerrar automáticamente el panel de filtros después de inactividad
    useEffect(() => {
        // Solo cerrar si el panel está abierto Y no hay filtros activos
        if (isFilterPanelOpen && activeFilterCount === 0) {
            // Esperar 5 segundos de inactividad antes de cerrar
            const timer = setTimeout(() => {
                setIsFilterPanelOpen(false);
                localStorage.setItem('invoices-filters-open', 'false');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [isFilterPanelOpen, activeFilterCount]);

    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Confirmation modal
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    // Realtime subscription
    useEffect(() => {
        const unsubscribe = subscribeToInvoices((data) => {
            setInvoices(data);
        });
        return () => unsubscribe();
    }, [subscribeToInvoices]);

    // Detect clientId from URL
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const clientId = params.get('clientId');
        if (clientId) {
            setSelectedClientId(clientId);
        }
    }, []);

    // Close menu on scroll or click outside
    useEffect(() => {
        if (!openMenuId) return;

        const handleScroll = () => { setOpenMenuId(null); setMenuPos(null); };
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
                setMenuPos(null);
            }
        };

        window.addEventListener('scroll', handleScroll, { capture: true });
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    // Handlers
    const handleDelete = async (invoice: Invoice) => {
        if (invoice.status !== 'draft') {
            // Anular factura emitida
            const confirmed = await confirm({
                ...confirmVoid('factura'),
                message: `La factura ${invoice.number} será anulada.`,
                description: 'La factura perderá su validez legal y se generará un registro de anulación. Esta acción no se puede deshacer.'
            });

            if (!confirmed) return;

            try {
                await voidInvoice(invoice.id);
                addToast('Factura anulada correctamente', 'success');
            } catch (error) {
                console.error(error);
                addToast('Error al anular factura', 'error');
            }
        } else {
            // Eliminar borrador
            const confirmed = await confirm({
                ...confirmDelete('factura'),
                message: `La factura borrador será eliminada permanentemente.`,
                description: 'Esta acción no se puede deshacer. El borrador será eliminado de la base de datos.'
            });

            if (!confirmed) return;

            try {
                await deleteInvoice(invoice.id);
                addToast('Factura eliminada correctamente', 'success');
            } catch (error) {
                console.error(error);
                addToast('Error al eliminar factura', 'error');
            }
        }
    };


    const handleDownloadPdf = async (invoice: Invoice) => {
        const blob = await pdf(<InvoicePDFDocument invoice={invoice} company={company} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `factura - ${invoice.number || invoice.id.slice(0, 8)}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        addToast('PDF descargado', 'success');
    };

    const handleInvoiceUpdated = () => {
        setIsDetailOpen(false);
        setSelectedInvoice(null);
    };

    // Filtering in memory
    const filteredInvoices = invoices.filter(inv => {
        if (filters.clientId && inv.clientId !== filters.clientId) return false;
        if (filters.caseId && inv.expedienteNumero && !inv.expedienteNumero.includes(filters.caseId)) return false;
        if (filters.status !== 'Todos') {
            const statusMap: Record<string, InvoiceStatus[]> = {
                'Pending': ['draft'],
                'Invoiced': ['issued'],
                'Void': ['void']
            };
            if (statusMap[filters.status] && !statusMap[filters.status].includes(inv.status)) return false;
        }
        return true;
    });

    // Suggestions for filters
    const allCaseIds = useMemo(() => Array.from(new Set(invoices.map(i => i.expedienteNumero).filter(Boolean) as string[])), [invoices]);
    const allPrefixes = useMemo(() => Array.from(new Set(invoices.map(i => i.expedienteNumero?.split('-')[0]).filter(Boolean) as string[])), [invoices]);

    return (
        <div className="flex h-full bg-[#fcfdfe] overflow-hidden">
            {/* Filter Panel (LEFT SIDE) */}
            <BillingFiltersPanel
                filters={filters}
                onFilterChange={setFilters}
                onClear={handleClearFilters}
                onClose={() => setIsFilterPanelOpen(false)}
                isOpen={isFilterPanelOpen}
                caseIds={allCaseIds}
                prefixes={allPrefixes}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full bg-[#fcfdfe] overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-10 py-8 flex-none">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="app-tab app-tab-active cursor-default !py-1 !px-0 !h-auto">
                                Facturas
                            </div>

                            {/* Breadcrumbs */}
                            <Breadcrumbs
                                items={[]}
                                className="hidden lg:flex"
                            />

                            <BackToHubButton />

                            {/* Botón Volver a Clientes - Solo visible cuando se filtra por cliente */}
                            {selectedClientId && (
                                <button
                                    onClick={() => {
                                        setSelectedClientId(null);
                                        navigateToModule('/clients');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 hover:border-slate-300 transition-all shadow-sm hover:shadow-md active:scale-95 group"
                                    title="Volver al explorador de clientes"
                                >
                                    <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Volver a Clientes
                                    </span>
                                </button>
                            )}

                            {/* Filtros button */}
                                <button
                                    onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm hover:shadow-md active:scale-95 group relative ${isFilterPanelOpen
                                    ? 'bg-sky-500 border-sky-600 text-white'
                                    : 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200 hover:border-sky-300'
                                    } `}
                                title="Abrir panel de filtros"
                            >
                                <Filter className={`w-4 h-4 transition-colors ${isFilterPanelOpen
                                    ? 'text-white'
                                    : 'text-sky-600 group-hover:text-sky-700'
                                    } `} />
                                <span className={`text-xs font-bold uppercase tracking-wider ${isFilterPanelOpen
                                    ? 'text-white'
                                    : 'text-sky-700'
                                    } `}>
                                    Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                                    </span>
                                </button>

                                <ColumnSelectorMenu
                                    title="Columnas"
                                    options={invoicesFieldOptions}
                                    visibleIds={visibleFields}
                                    onToggle={toggleVisibleField}
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
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-7xl mx-auto">
                        {filteredInvoices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 opacity-50">
                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                    <Receipt className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-700">
                                    {invoices.length === 0 ? 'No hay facturas todavía' : 'No hay facturas con estos filtros'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-2 text-center max-w-md">
                                    {invoices.length === 0
                                        ? 'Las facturas se crean desde albaranes pendientes en la sección de Albaranes.'
                                        : 'Prueba a limpiar los filtros.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="divide-y divide-slate-100">
                                    {filteredInvoices.map(invoice => {
                                        const statusInfo = statusLabels[invoice.status];
                                        return (
                                            <div
                                                key={invoice.id}
                                                className="p-4 flex items-center gap-6 group hover:bg-slate-50 transition-colors cursor-pointer"
                                                onDoubleClick={() => { setSelectedInvoice(invoice); setIsDetailOpen(true); }}
                                            >
                                                {/* Icon */}
                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Receipt size={18} />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                                    {visibleFieldsSet.has('number') && <div>
                                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                                                            Número
                                                        </div>
                                                        <div className="font-medium text-slate-700 flex items-center gap-2">
                                                            {invoice.number ? (
                                                                <CopyAction text={invoice.number}>
                                                                    <div className="flex items-center gap-2 group/copy">
                                                                        <span className="font-mono">{invoice.number}</span>
                                                                        <div className="p-1 text-slate-300 group-hover/copy:text-sky-500 transition-colors">
                                                                            <Copy size={12} />
                                                                        </div>
                                                                    </div>
                                                                </CopyAction>
                                                            ) : (
                                                                <span className="text-slate-400 italic">Borrador</span>
                                                            )}
                                                        </div>
                                                    </div>}
                                                    {visibleFieldsSet.has('client') && <div>
                                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Cliente</div>
                                                        <div className="text-slate-600 text-sm">
                                                            {invoice.clientName || <span className="italic text-slate-400">Sin cliente</span>}
                                                        </div>
                                                    </div>}
                                                    {visibleFieldsSet.has('amount') && <div>
                                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Importe</div>
                                                        <div className="font-normal text-slate-700 flex items-center gap-1">
                                                            {invoice.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                            <span className="text-[10px] text-slate-400">EUR</span>
                                                        </div>
                                                    </div>}
                                                    {visibleFieldsSet.has('status') && <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusInfo.color} `}>
                                                            {statusInfo.label}
                                                        </span>
                                                        {invoice.status === 'issued' && (
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${invoice.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} `}>
                                                                {invoice.isPaid ? 'Pagada' : 'Pendiente'}
                                                            </span>
                                                        )}
                                                    </div>}
                                                </div>

                                                {/* Actions - Menu ⋯ */}
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (openMenuId === invoice.id) {
                                                                setOpenMenuId(null);
                                                                setMenuPos(null);
                                                            } else {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                let top = rect.bottom + 6;
                                                                let left = rect.right - 192;
                                                                if (left < 16) left = 16;
                                                                if (top + 200 > window.innerHeight) top = rect.top - 200;
                                                                setMenuPos({ top, left });
                                                                setOpenMenuId(invoice.id);
                                                            }
                                                        }}
                                                        className={`p-2 rounded-lg transition-all duration-150 ${openMenuId === invoice.id ? 'bg-slate-200 text-slate-700 opacity-100' : 'text-slate-400 opacity-50 hover:opacity-100 hover:bg-slate-100'} `}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>

                                                    {openMenuId === invoice.id && menuPos && (
                                                        <div
                                                            ref={menuRef}
                                                            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
                                                            className="w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] py-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => { setSelectedInvoice(invoice); setIsDetailOpen(true); setOpenMenuId(null); setMenuPos(null); }}
                                                                className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> Vista Previa
                                                            </button>
                                                            <button
                                                                onClick={async () => { setOpenMenuId(null); setMenuPos(null); await handleDownloadPdf(invoice); }}
                                                                className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2"
                                                            >
                                                                <Printer className="w-3.5 h-3.5" /> Descargar PDF
                                                            </button>
                                                            {invoice.expedienteId && onViewCase && (
                                                                <button
                                                                    onClick={() => { setOpenMenuId(null); setMenuPos(null); onViewCase(invoice.expedienteId!); }}
                                                                    className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-sky-600 flex items-center gap-2"
                                                                >
                                                                    <ExternalLink className="w-3.5 h-3.5" /> Ir al expediente
                                                                </button>
                                                            )}
                                                            {invoice.status === 'issued' && !invoice.isPaid && (
                                                                <button
                                                                    onClick={async () => {
                                                                        setOpenMenuId(null); setMenuPos(null);
                                                                        await markAsPaid(invoice.id);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs font-normal text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                                                >
                                                                    <Banknote className="w-3.5 h-3.5" /> Marcar Pagada
                                                                </button>
                                                            )}
                                                            <div className="h-px bg-slate-100 my-1" />
                                                            <button
                                                                onClick={() => { handleDelete(invoice); setOpenMenuId(null); setMenuPos(null); }}
                                                                className="w-full text-left px-3 py-2 text-xs font-normal text-red-500 hover:bg-red-50 flex items-center gap-2"
                                                            >
                                                                {invoice.status === 'draft' ? (
                                                                    <><Trash2 className="w-3.5 h-3.5" /> Eliminar</>
                                                                ) : (
                                                                    <><Ban className="w-3.5 h-3.5" /> Anular</>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Detail Modal */}
            {selectedInvoice && (
                <InvoiceDetailModal
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    invoice={selectedInvoice}
                    onUpdate={handleInvoiceUpdated}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmationState.isOpen}
                onClose={closeConfirmation}
                onConfirm={confirmationState.onConfirm}
                title={confirmationState.title}
                message={confirmationState.message}
                description={confirmationState.description}
                confirmText={confirmationState.confirmText}
                cancelText={confirmationState.cancelText}
                variant={confirmationState.variant}
            />
        </div>
    );
};

export default InvoicesView;

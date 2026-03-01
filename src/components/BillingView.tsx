import React, { useEffect, useMemo, useState, useRef } from 'react';
import { CreditCard, FileText, Eye, MoreHorizontal, Printer, Receipt, Filter, X, Calendar, Copy } from 'lucide-react';
import { useBilling } from '../hooks/useBilling';
import { useInvoices } from '../hooks/useInvoices';
import { DeliveryNote, ClientDeliveryGroup } from '../types/billing';
import DeliveryNoteDetailModal from './DeliveryNoteDetailModal';
import InvoiceDetailModal from './InvoiceDetailModal';
import { useHashRouter } from '../hooks/useHashRouter';
import BillingFiltersPanel, { BillingFilters } from './BillingFiltersPanel';
import { BackToHubButton } from './ui/BackToHubButton';
import Breadcrumbs from './ui/Breadcrumbs';
import { CopyAction } from './ui/ActionFeedback';

interface BillingViewProps {
}

const BillingView: React.FC<BillingViewProps> = () => {
    const { navigateTo } = useHashRouter();
    const { subscribeToPendingNotes, loading } = useBilling();
    const { createInvoiceFromDeliveryNote } = useInvoices();

    // Raw Data
    const [notes, setNotes] = useState<DeliveryNote[]>([]);
    const [createdInvoice, setCreatedInvoice] = useState<any>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    // Filters State
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
        status: 'Pending'
    });

    const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.clientId) count++;
        if (filters.caseId) count++;
        if (filters.prefix) count++;
        if (filters.responsibleId) count++;
        if (filters.startDate || filters.endDate) count++;
        if (filters.status !== 'Pending') count++; // Pending is default
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
            status: 'Pending'
        });
    };

    // Filter panel open state with localStorage
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(() => {
        const saved = localStorage.getItem('billing-filters-open');
        return saved === 'true';
    });


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

    useEffect(() => {
        // Realtime subscription
        const unsubscribe = subscribeToPendingNotes((fetchedNotes) => {
            setNotes(fetchedNotes);
        });
        return () => unsubscribe();
    }, [subscribeToPendingNotes]);

    const handleNoteUpdated = () => {
        setIsDetailOpen(false);
        // Notes update automatically via subscription if data changes on server
    };

    // Derived State: Filtered Notes
    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            // 1. Client Filter
            if (filters.clientId && note.clientId !== filters.clientId) return false;

            // 2. Case ID / Number
            if (filters.caseId && !note.expedienteNumero.toLowerCase().includes(filters.caseId.toLowerCase())) return false;

            // 3. Prefix
            if (filters.prefix && !note.expedienteNumero.toLowerCase().startsWith(filters.prefix.toLowerCase())) return false;

            // 4. Responsible (Not yet in DeliveryNote type? If not, skip or assume strictly 'Pending' integration)
            // Note: deliveryNote doesn't have responsibleId yet. We skip or match if property exists.
            // if (filters.responsibleId && note.responsibleId !== filters.responsibleId) return false;

            // 5. Date Range
            const dateValue = filters.dateType === 'createdAt' ? note.createdAt : note.closedAt;
            if (dateValue) {
                const date = new Date(dateValue);
                if (filters.startDate) {
                    const start = new Date(filters.startDate);
                    if (date < start) return false;
                }
                if (filters.endDate) {
                    const end = new Date(filters.endDate);
                    end.setHours(23, 59, 59, 999);
                    if (date > end) return false;
                }
            }

            // 6. Status
            if (filters.status !== 'Todos' && note.status !== filters.status.toLowerCase()) return false;

            return true;
        });
    }, [notes, filters]);

    // Derived State: Grouped
    const groups = useMemo(() => {
        const grouped: Record<string, ClientDeliveryGroup> = {};
        filteredNotes.forEach(note => {
            if (!grouped[note.clientId]) {
                grouped[note.clientId] = {
                    clientId: note.clientId,
                    clientName: note.clientName,
                    clientIdentity: note.clientIdentity,
                    deliveryNotes: []
                };
            }
            grouped[note.clientId].deliveryNotes.push(note);
        });
        return Object.values(grouped).sort((a, b) => a.clientName.localeCompare(b.clientName));
    }, [filteredNotes]);

    // Suggestions for filters
    const allCaseIds = useMemo(() => Array.from(new Set(notes.map(n => n.expedienteNumero))), [notes]);
    const allPrefixes = useMemo(() => Array.from(new Set(notes.map(n => n.expedienteNumero.split('-')[0]))), [notes]);

    return (
        <div className="flex h-full bg-[#fcfdfe] overflow-hidden">
            {/* Filter Panel (LEFT SIDE, PUSH CONTENT) */}
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
                                Facturación
                            </div>

                            {/* Breadcrumbs */}
                            <Breadcrumbs
                                items={[]}
                                className="hidden lg:flex"
                            />

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
                </div>

                {/* Content list */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {loading && groups.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">Cargando albaranes...</div>
                        ) : groups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 opacity-50">
                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                    <CreditCard className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-700">
                                    {notes.length === 0 ? 'Todo al día' : 'No hay albaranes con estos filtros'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    {notes.length === 0 ? 'No hay albaranes pendientes de facturación.' : 'Prueba a limpiar los filtros.'}
                                </p>
                            </div>
                        ) : (
                            groups.map(group => (
                                <div key={group.clientId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                                    {/* Group Header */}
                                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-slate-700">
                                        <div>
                                            <h3 className="font-medium text-sm tracking-tight text-slate-700">{group.clientName}</h3>
                                            <div className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">
                                                {group.clientIdentity ? (
                                                    <CopyAction text={group.clientIdentity}>
                                                        <div className="inline-flex items-center gap-1 group/copy">
                                                            <span>{group.clientIdentity}</span>
                                                            <Copy size={11} className="text-slate-300 group-hover/copy:text-sky-500" />
                                                        </div>
                                                    </CopyAction>
                                                ) : (
                                                    'Sin Documento'
                                                )} • {group.clientId.slice(0, 8)}...
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest bg-slate-200/50 text-slate-500 px-3 py-1 rounded-full">
                                            {group.deliveryNotes.length} Exp.
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="divide-y divide-slate-100">
                                        {group.deliveryNotes.map(note => (
                                            <div
                                                key={note.id}
                                                className="p-4 flex items-center gap-6 group hover:bg-slate-50 transition-colors cursor-pointer"
                                                onDoubleClick={() => { setSelectedNote(note); setIsDetailOpen(true); }}
                                            >
                                                {/* Icon */}
                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <FileText size={18} />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                                    <div>
                                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Expediente</div>
                                                        <div className="font-medium text-slate-700">{note.expedienteNumero}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Fecha Cierre</div>
                                                        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                                                            <Calendar size={12} className="text-slate-400" />
                                                            {new Date(note.closedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Importe</div>
                                                        <div className="font-normal text-slate-700 flex items-center gap-1">
                                                            {note.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">EUR</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider 
                                                            ${note.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                                note.status === 'invoiced' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                            {note.status === 'pending' ? 'Pendiente' : note.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions - Dropdown Menu */}
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (openMenuId === note.id) {
                                                                setOpenMenuId(null);
                                                                setMenuPos(null);
                                                            } else {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                let top = rect.bottom + 6;
                                                                let left = rect.right - 192;
                                                                if (left < 16) left = 16;
                                                                if (top + 200 > window.innerHeight) top = rect.top - 200;
                                                                setMenuPos({ top, left });
                                                                setOpenMenuId(note.id);
                                                            }
                                                        }}
                                                        className={`p-2 rounded-lg transition-all duration-150 ${openMenuId === note.id ? 'bg-slate-200 text-slate-700 opacity-100' : 'text-slate-400 opacity-50 hover:opacity-100 hover:bg-slate-100'}`}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>

                                                    {openMenuId === note.id && menuPos && (
                                                        <div
                                                            ref={menuRef}
                                                            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
                                                            className="w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] py-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => { setSelectedNote(note); setIsDetailOpen(true); setOpenMenuId(null); setMenuPos(null); }}
                                                                className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> Vista Previa
                                                            </button>
                                                            <button
                                                                onClick={() => { navigateTo(`/expedientes/${note.expedienteId}`); setOpenMenuId(null); setMenuPos(null); }}
                                                                className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-sky-600 flex items-center gap-2"
                                                            >
                                                                <FileText className="w-3.5 h-3.5" /> Ir al Expediente
                                                            </button>
                                                            <div className="h-px bg-slate-100 my-1" />
                                                            <button
                                                                onClick={() => { window.print(); setOpenMenuId(null); setMenuPos(null); }}
                                                                className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center gap-2"
                                                            >
                                                                <Printer className="w-3.5 h-3.5" /> Imprimir
                                                            </button>
                                                            {note.status === 'pending' && (
                                                                <button
                                                                    onClick={async () => {
                                                                        setOpenMenuId(null); setMenuPos(null);
                                                                        const invoice = await createInvoiceFromDeliveryNote(note);
                                                                        if (invoice) {
                                                                            setCreatedInvoice(invoice);
                                                                            setIsInvoiceModalOpen(true);
                                                                        }
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs font-normal text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                                                >
                                                                    <Receipt className="w-3.5 h-3.5" /> Emitir Factura
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail Modal */}
                {selectedNote && (
                    <DeliveryNoteDetailModal
                        isOpen={isDetailOpen}
                        onClose={() => setIsDetailOpen(false)}
                        deliveryNote={selectedNote}
                        onUpdate={handleNoteUpdated}
                    />
                )}

                {/* Invoice Modal for newly created invoice */}
                {createdInvoice && (
                    <InvoiceDetailModal
                        isOpen={isInvoiceModalOpen}
                        onClose={() => { setIsInvoiceModalOpen(false); setCreatedInvoice(null); }}
                        invoice={createdInvoice}
                        onUpdate={() => { setIsInvoiceModalOpen(false); setCreatedInvoice(null); }}
                    />
                )}
            </div>
        </div>
    );
};

export default BillingView;

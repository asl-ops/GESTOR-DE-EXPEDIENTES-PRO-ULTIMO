import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Users, Briefcase, FileText, Receipt, Euro, ChevronRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { performGlobalSearch, GroupedSearchResults } from '../services/globalSearchService';
import { useHashRouter } from '../hooks/useHashRouter';
import CasePreviewModal from './CasePreviewModal';
import ClientDetailModal from './ClientDetailModal';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [previewState, setPreviewState] = useState<{
        type: 'client' | 'case' | 'invoice' | 'proforma' | 'deliveryNote';
        data: any;
    } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const { savedClients, caseHistory } = useAppContext();
    const { navigateTo } = useHashRouter();

    // 🧠 CONCEPTO: useMemo para optimizar búsqueda
    // Solo recalcula cuando cambia searchQuery o los datos
    const searchResults: GroupedSearchResults = useMemo(() => {
        if (searchQuery.trim().length < 2) {
            return {
                clients: [],
                cases: [],
                invoices: [],
                proformas: [],
                deliveryNotes: []
            };
        }

        return performGlobalSearch(searchQuery, {
            clients: savedClients || [],
            cases: caseHistory || []
        });
    }, [searchQuery, savedClients, caseHistory]);

    // Calcular total de resultados
    const totalResults = searchResults.clients.length +
        searchResults.cases.length +
        searchResults.invoices.length +
        searchResults.proformas.length +
        searchResults.deliveryNotes.length;

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setSearchQuery(''); // Limpiar búsqueda al abrir
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle ESC key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // 🧠 CONCEPTO: Navegación con teclado (↑↓ Enter)
    // Flatten all results into a single array for navigation
    const allResults = useMemo(() => {
        return [
            ...searchResults.clients,
            ...searchResults.cases,
            ...searchResults.invoices,
            ...searchResults.proformas,
            ...searchResults.deliveryNotes
        ];
    }, [searchResults]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || totalResults === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % allResults.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (allResults[selectedIndex]) {
                    const result = allResults[selectedIndex];
                    handleSelectResult(result.type, result.data);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, totalResults, allResults, selectedIndex]);

    // Reset selected index when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    // Handle click outside to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle result selection - Open preview instead of navigating directly
    const handleSelectResult = (type: string, data: any) => {
        // Open preview modal
        setPreviewState({
            type: type as 'client' | 'case' | 'invoice' | 'proforma' | 'deliveryNote',
            data
        });
    };

    // Handle navigation from preview to full record
    const handleOpenFromPreview = () => {
        if (!previewState) return;

        const { type, data } = previewState;

        // Close preview and search modal
        setPreviewState(null);
        onClose();

        // Navigate to full record
        if (type === 'client') {
            navigateTo('/clients'); // TODO: Navigate to specific client
        } else if (type === 'case') {
            navigateTo(`/detail/${data.fileNumber}`);
        } else if (type === 'invoice') {
            navigateTo('/invoices'); // TODO: Navigate to specific invoice
        } else if (type === 'proforma') {
            navigateTo('/proformas'); // TODO: Navigate to specific proforma
        } else if (type === 'deliveryNote') {
            navigateTo('/delivery-notes'); // TODO: Navigate to specific delivery note
        }
    };

    // Helper to get global index for a result (for keyboard navigation highlighting)
    const getGlobalIndex = (type: string, localIndex: number): number => {
        let offset = 0;

        if (type === 'client') {
            return localIndex;
        }
        offset += searchResults.clients.length;

        if (type === 'case') {
            return offset + localIndex;
        }
        offset += searchResults.cases.length;

        if (type === 'invoice') {
            return offset + localIndex;
        }
        offset += searchResults.invoices.length;

        if (type === 'proforma') {
            return offset + localIndex;
        }
        offset += searchResults.proformas.length;

        if (type === 'deliveryNote') {
            return offset + localIndex;
        }

        return -1;
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleBackdropClick}
            >
                <div
                    ref={modalRef}
                    className="w-full max-w-3xl bg-white rounded-[32px] shadow-2xl shadow-slate-900/20 overflow-hidden animate-in slide-in-from-top-4 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Header */}
                    <div className="flex items-center gap-4 px-8 py-6 border-b border-slate-100">
                        <Search className="w-6 h-6 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar clientes, expedientes, facturas, proformas..."
                            className="flex-1 text-lg font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                        />
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                            title="Cerrar (ESC)"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Results Area */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {searchQuery.trim().length < 2 ? (
                            // Empty state - show hints
                            <div className="p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-[24px] flex items-center justify-center">
                                    <Search className="w-10 h-10 text-sky-600" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">
                                    Búsqueda Global
                                </h3>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-8">
                                    Escribe al menos 2 caracteres para buscar
                                </p>

                                {/* Search hints */}
                                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-left">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Clientes</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">DNI, CIF, Nombre</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-left">
                                        <Briefcase className="w-5 h-5 text-indigo-600" />
                                        <div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Expedientes</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Código, Asunto</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-left">
                                        <Euro className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Facturas</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Número, Importe</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-left">
                                        <FileText className="w-5 h-5 text-orange-600" />
                                        <div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Proformas</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Número, Importe</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : totalResults === 0 ? (
                            // No results
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-[20px] flex items-center justify-center">
                                    <Search className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-sm font-black text-slate-600 uppercase tracking-wider">
                                    No se encontraron resultados
                                </p>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mt-2">
                                    Intenta con otro término de búsqueda
                                </p>
                            </div>
                        ) : (
                            // Search results grouped by type
                            <div className="p-6 space-y-6">
                                {/* Clientes */}
                                {searchResults.clients.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3 px-2">
                                            <Users className="w-4 h-4 text-blue-600" />
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                Clientes ({searchResults.clients.length})
                                            </h4>
                                        </div>
                                        <div className="space-y-1">
                                            {searchResults.clients.slice(0, 5).map((result, index) => {
                                                const globalIndex = getGlobalIndex('client', index);
                                                const isSelected = globalIndex === selectedIndex;

                                                return (
                                                    <button
                                                        key={result.id}
                                                        onClick={() => handleSelectResult(result.type, result.data)}
                                                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group text-left ${isSelected
                                                            ? 'bg-blue-50 ring-2 ring-blue-500'
                                                            : 'hover:bg-blue-50'
                                                            }`}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                                {result.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                                                                {result.subtitle}
                                                            </p>
                                                        </div>
                                                        <ChevronRight className={`w-5 h-5 transition-all flex-shrink-0 ml-4 ${isSelected
                                                            ? 'text-blue-600 translate-x-1'
                                                            : 'text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1'
                                                            }`} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Expedientes */}
                                {searchResults.cases.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3 px-2">
                                            <Briefcase className="w-4 h-4 text-indigo-600" />
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                Expedientes ({searchResults.cases.length})
                                            </h4>
                                        </div>
                                        <div className="space-y-1">
                                            {searchResults.cases.slice(0, 5).map((result, index) => {
                                                const globalIndex = getGlobalIndex('case', index);
                                                const isSelected = globalIndex === selectedIndex;

                                                return (
                                                    <button
                                                        key={result.id}
                                                        onClick={() => handleSelectResult(result.type, result.data)}
                                                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group text-left ${isSelected
                                                            ? 'bg-indigo-50 ring-2 ring-indigo-500'
                                                            : 'hover:bg-indigo-50'
                                                            }`}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                                {result.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 truncate">
                                                                {result.subtitle}
                                                            </p>
                                                        </div>
                                                        <ChevronRight className={`w-5 h-5 transition-all flex-shrink-0 ml-4 ${isSelected
                                                            ? 'text-indigo-600 translate-x-1'
                                                            : 'text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1'
                                                            }`} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Facturas */}
                                {searchResults.invoices.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3 px-2">
                                            <Euro className="w-4 h-4 text-emerald-600" />
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                Facturas ({searchResults.invoices.length})
                                            </h4>
                                        </div>
                                        <div className="space-y-1">
                                            {searchResults.invoices.slice(0, 5).map((result) => (
                                                <button
                                                    key={result.id}
                                                    onClick={() => handleSelectResult(result.type, result.data)}
                                                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-emerald-50 transition-colors group text-left"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {result.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 truncate">
                                                            {result.subtitle}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Proformas */}
                                {searchResults.proformas.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3 px-2">
                                            <FileText className="w-4 h-4 text-orange-600" />
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                Proformas ({searchResults.proformas.length})
                                            </h4>
                                        </div>
                                        <div className="space-y-1">
                                            {searchResults.proformas.slice(0, 5).map((result) => (
                                                <button
                                                    key={result.id}
                                                    onClick={() => handleSelectResult(result.type, result.data)}
                                                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-orange-50 transition-colors group text-left"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {result.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 truncate">
                                                            {result.subtitle}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Albaranes */}
                                {searchResults.deliveryNotes.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3 px-2">
                                            <Receipt className="w-4 h-4 text-amber-600" />
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                Albaranes ({searchResults.deliveryNotes.length})
                                            </h4>
                                        </div>
                                        <div className="space-y-1">
                                            {searchResults.deliveryNotes.slice(0, 5).map((result) => (
                                                <button
                                                    key={result.id}
                                                    onClick={() => handleSelectResult(result.type, result.data)}
                                                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-amber-50 transition-colors group text-left"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {result.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 truncate">
                                                            {result.subtitle}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer with keyboard hints */}
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            <span className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">↑↓</kbd>
                                Navegar
                            </span>
                            <span className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">Enter</kbd>
                                Abrir
                            </span>
                            <span className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">ESC</kbd>
                                Cerrar
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">
                            Ctrl+K para abrir
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modals - Higher z-index to appear above search modal */}
            {previewState?.type === 'case' && (
                <CasePreviewModal
                    isOpen={true}
                    onClose={() => setPreviewState(null)}
                    caseRecord={previewState.data}
                    onOpen={handleOpenFromPreview}
                />
            )}

            {previewState?.type === 'client' && (
                <ClientDetailModal
                    clientId={previewState.data.id}
                    onClose={() => setPreviewState(null)}
                    onSelectClient={(id) => {
                        setPreviewState({
                            ...previewState,
                            data: { ...previewState.data, id }
                        });
                    }}
                    onSaved={() => {
                        // Refresh if needed
                        setPreviewState(null);
                    }}
                />
            )}

            {/* TODO: Add preview modals for invoices, proformas, delivery notes */}
        </>
    );
};

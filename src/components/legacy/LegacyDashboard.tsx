import React, { useState, useMemo, useEffect } from 'react';
import {
    GridViewIcon,
    ListViewIcon,
} from '@/components/icons';
import { Lock, RotateCcw, Copy, FileText, Trash2, Users } from 'lucide-react';
import ExpedienteCard from '@/components/ExpedienteCard';
import ExpedienteListItem from '@/components/ExpedienteListItem';
import ConfirmationModal from '@/components/ConfirmationModal';
import CaseCloseModal from '@/components/CaseCloseModal';
import FilterPanel from '@/components/FilterPanel';
import PaginationControls from '@/components/PaginationControls';
import NewCaseModal from '@/components/NewCaseModal';
import ImprovedReportsModule from '@/components/ImprovedReportsModule';
import KanbanView from '@/components/KanbanView';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { useBilling } from '@/hooks/useBilling';
import { useProformas } from '@/hooks/useProformas';
import { FileCategory, CaseRecord } from '@/types';
import { getPrefixes } from '@/services/prefixService';
import { PrefixConfig } from '@/types';

interface DashboardProps {
    onSelectCase: (c: any) => void;
    onCreateNewCase: (category: FileCategory, subType?: string) => void;
    onShowResponsibleDashboard: () => void;
}

interface ColumnDef {
    id: string;
    label: string;
    minWidth: number;
    defaultWidth: number;
    align?: 'left' | 'center' | 'right';
}

const DEFAULT_COLUMN_DEFS: ColumnDef[] = [
    { id: 'numero', label: 'Número', minWidth: 80, defaultWidth: 100, align: 'left' },
    { id: 'cliente', label: 'Cliente', minWidth: 150, defaultWidth: 200, align: 'left' },
    { id: 'estado', label: 'Estado', minWidth: 100, defaultWidth: 120, align: 'center' },
    { id: 'acciones', label: 'Acciones', minWidth: 100, defaultWidth: 120, align: 'right' },
];

// ... existing code ...

const Dashboard: React.FC<DashboardProps> = ({
    onSelectCase,
    onCreateNewCase,
    onShowResponsibleDashboard,
}) => {
    const { caseHistory, appSettings, deleteCase, saveMultipleCases, saveCase } = useAppContext();
    const { addToast } = useToast();
    const { createDeliveryNoteFromCase } = useBilling();
    const { createProformaFromCase } = useProformas();
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('list'); // Vista lista por defecto
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedClientLabel, setSelectedClientLabel] = useState('');
    const [identifierFilter, setIdentifierFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [prefixes, setPrefixes] = useState<PrefixConfig[]>([]);
    const [situationFilter, setSituationFilter] = useState('Todos');
    const [dateFilterType, setDateFilterType] = useState<'createdAt' | 'closedAt'>('createdAt');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
    const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
    const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
    const [isReportsModuleOpen, setIsReportsModuleOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [isBatchCloseModalOpen, setIsBatchCloseModalOpen] = useState(false);
    const [caseToClose, setCaseToClose] = useState<CaseRecord | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<'all' | 25 | 50 | 100>(25);

    // 🆕 Pre-aplicar filtro desde URL (navegación desde ClientExplorer)
    useEffect(() => {
        const applyFilterFromUrl = () => {
            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            const clientIdFromUrl = params.get('clientId');

            console.log('🔍 Verificando URL params:', { clientIdFromUrl, hash: window.location.hash });

            // Solo aplicar si hay clientId en URL y aún no hemos aplicado filtro
            if (clientIdFromUrl && !selectedClientId) {
                console.log('📋 Aplicando filtro desde URL:', clientIdFromUrl);

                // Resolver cliente por ID para obtener label actualizado
                import('@/services/clientService').then(({ getClientById }) => {
                    getClientById(clientIdFromUrl)
                        .then((client) => {
                            if (client) {
                                console.log('✅ Cliente encontrado:', client);
                                // Construir label con misma lógica que ClientTypeahead
                                const parts = [client.nombre];
                                if (client.documento) parts.push(client.documento);
                                if (client.telefono) parts.push(client.telefono);

                                setSelectedClientId(client.id);
                                setSelectedClientLabel(parts.join(' — '));
                                console.log('🎯 Filtro aplicado:', client.id);
                            }
                        })
                        .catch((error) => {
                            console.error('❌ Error buscando cliente:', error);
                        })
                        .finally(() => {
                            // Limpiar URL usando hash routing (con delay para evitar race condition)
                            setTimeout(() => {
                                if (window.location.hash.includes('clientId=')) {
                                    window.location.hash = '/';
                                }
                            }, 100);
                        });
                });
            }
        };

        // Ejecutar al montar
        applyFilterFromUrl();

        // Escuchar cambios de hash
        window.addEventListener('hashchange', applyFilterFromUrl);

        return () => {
            window.removeEventListener('hashchange', applyFilterFromUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo montar/desmontar listener

    // Removed static FILE_CATEGORIES, will load prefixes dynamically

    const processedCases = useMemo(() => {
        if (!caseHistory) return [];
        const filtered = caseHistory.filter(c => {
            if (c.status === 'Eliminado') return false;

            // 🆕 FILTRO POR CLIENTE (usa clienteId SOLO si está seleccionado)
            if (selectedClientId) {
                // Si hay clienteId seleccionado, filtrar SOLO por ese campo
                // Los expedientes viejos sin clienteId no aparecerán (comportamiento esperado)
                const matchesClient = c.clienteId === selectedClientId;
                if (!matchesClient) return false;
            }

            // Identifier filter (searches in client NIF/CIF/NIE)
            const matchesIdentifier = !identifierFilter ||
                (c.client.nif || '').toLowerCase().includes(identifierFilter.toLowerCase());

            // Client search (DNI/NIE/CIF, names) - normalized to ignore commas and extra spaces
            // NOTA: Este filtro solo aplica si NO hay selectedClientId (búsqueda por texto)
            const matchesSearch = selectedClientId || !searchQuery || (() => {
                const normalizedQuery = searchQuery.toLowerCase().replace(/[,\s]+/g, ' ').trim();
                const normalizedSurnames = (c.client.surnames || '').toLowerCase().replace(/[,\s]+/g, ' ').trim();
                const normalizedFirstName = (c.client.firstName || '').toLowerCase().replace(/[,\s]+/g, ' ').trim();
                const normalizedNif = (c.client.nif || '').toLowerCase().replace(/[,\s]+/g, ' ').trim();
                const normalizedFullName = `${normalizedSurnames} ${normalizedFirstName}`;

                return normalizedFullName.includes(normalizedQuery) ||
                    normalizedSurnames.includes(normalizedQuery) ||
                    normalizedFirstName.includes(normalizedQuery) ||
                    normalizedNif.includes(normalizedQuery);
            })();

            const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
            const matchesCategory = categoryFilter === 'Todos' || c.fileConfig.category === categoryFilter;
            const matchesSituation = situationFilter === 'Todos' ||
                (c.situation || 'Iniciado') === situationFilter ||
                (situationFilter === 'Cerrado' && c.status === 'Cerrado');

            let matchesDate = true;
            if (startDate && endDate) {
                const dateStr = dateFilterType === 'closedAt' ? (c.closedAt || c.createdAt) : c[dateFilterType];
                const dateToCheck = new Date(dateStr);
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchesDate = dateToCheck >= start && dateToCheck <= end;
            }

            return matchesIdentifier && matchesSearch && matchesStatus && matchesCategory && matchesDate && matchesSituation;
        });

        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any = '';
                let bValue: any = '';

                switch (sortConfig.key) {
                    case 'type':
                        aValue = a.fileConfig.category || '';
                        bValue = b.fileConfig.category || '';
                        break;
                    case 'createdAt':
                        aValue = new Date(a.createdAt).getTime();
                        bValue = new Date(b.createdAt).getTime();
                        break;
                    case 'closedAt':
                        aValue = a.closedAt ? new Date(a.closedAt).getTime() : 0;
                        bValue = b.closedAt ? new Date(b.closedAt).getTime() : 0;
                        break;
                    default:
                        aValue = a[sortConfig.key as keyof CaseRecord] || '';
                        bValue = b[sortConfig.key as keyof CaseRecord] || '';
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [caseHistory, selectedClientId, searchQuery, identifierFilter, statusFilter, categoryFilter, startDate, endDate, dateFilterType, situationFilter, sortConfig]);

    useEffect(() => {

        // Load prefixes for dropdown
        const load = async () => {
            try {
                const data = await getPrefixes();
                setPrefixes(data);
            } catch (e) {
                console.error('Error loading prefixes', e);
            }
        };
        load();
    }, []);

    const confirmDelete = async () => {
        if (caseToDelete) {
            await deleteCase(caseToDelete);
            setCaseToDelete(null);
        }
    };

    const handleBatchDelete = () => {
        if (selectedCases.length > 0) {
            setIsBatchDeleteModalOpen(true);
        }
    };

    const confirmBatchDelete = async () => {
        for (const fileNumber of selectedCases) {
            await deleteCase(fileNumber);
        }
        setSelectedCases([]);
        setIsBatchDeleteModalOpen(false);
        addToast(`${selectedCases.length} expedientes eliminados correctamente`, 'success');
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedClientId(null);
        setSelectedClientLabel('');
        setIdentifierFilter('');
        setStatusFilter('Todos');
        setCategoryFilter('Todos');
        setSituationFilter('Todos');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const handleDuplicateCase = async (originalCase: CaseRecord) => {
        try {
            // Obtener el prefijo del expediente original (ejemplo: "EXP")
            const prefix = originalCase.fileNumber.split('-')[0];
            // Filtrar casos que comparten el mismo prefijo
            const samePrefixCases = caseHistory.filter(c => c.fileNumber.startsWith(`${prefix}-`));
            // Ordenar descendente por número
            const sorted = samePrefixCases.sort((a, b) => b.fileNumber.localeCompare(a.fileNumber));

            // Generar el siguiente número ordinal para ese prefijo
            let newFileNumber = `${prefix}-0001`;
            if (sorted.length > 0) {
                const lastNumber = sorted[0].fileNumber;
                const match = lastNumber.match(/-\d+$/);
                if (match) {
                    const nextNum = parseInt(match[0].substring(1)) + 1;
                    newFileNumber = `${prefix}-${String(nextNum).padStart(4, '0')}`;
                }
            }

            // Crear copia del expediente con el nuevo número
            const duplicatedCase: CaseRecord = {
                ...originalCase,
                fileNumber: newFileNumber,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'Iniciado',
                situation: 'Iniciado',
                tasks: originalCase.tasks.map(t => ({
                    ...t,
                    id: crypto.randomUUID(), // Generate new ID for the task
                    createdAt: new Date().toISOString() // Reset creation date for the new task
                })),
                communications: originalCase.communications.map(c => ({
                    ...c,
                    id: crypto.randomUUID(), // Generate new ID for the communication
                    date: new Date().toISOString() // Reset date for the new communication
                })),
                attachments: [],
                economicData: {
                    lines: originalCase.economicData.lines.map(line => ({ ...line })),
                    subtotalAmount: originalCase.economicData.subtotalAmount,
                    vatAmount: originalCase.economicData.vatAmount,
                    totalAmount: originalCase.economicData.totalAmount,
                },
            };

            // Guardar el nuevo expediente y abrir su pantalla de mantenimiento
            await saveCase(duplicatedCase);
            // Navegar a la vista de detalle del nuevo expediente
            onSelectCase(newFileNumber);
        } catch (error) {
            console.error('Error duplicando expediente:', error);
        }
    };

    const handleCaseClick = (c: CaseRecord) => {
        if (c.status === 'Cerrado') {
            addToast('El expediente está cerrado. Debe reabrirlo para poder modificarlo.', 'warning');
            return;
        }
        // Fix: Pass fileNumber string instead of the whole object, as App.tsx expects string
        onSelectCase(c.fileNumber);
    };

    const handleToggleCase = (fileNumber: string) => {
        setSelectedCases(prev =>
            prev.includes(fileNumber)
                ? prev.filter(id => id !== fileNumber)
                : [...prev, fileNumber]
        );
    };

    const handleSelectAll = () => {
        const pageIds = paginatedCases.map(c => c.fileNumber);
        const allSelected = pageIds.every(id => selectedCases.includes(id));

        if (allSelected) {
            // Deselect all on this page
            setSelectedCases(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            // Select all on this page
            setSelectedCases(prev => {
                const newSelection = [...prev];
                pageIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
        }
    };

    const handleBatchClose = () => {
        if (selectedCases.length > 0) setIsBatchCloseModalOpen(true);
    };

    const confirmBatchClose = async (options: { createAlbaran: boolean; createProforma: boolean }) => {
        if (selectedCases.length === 0) return;
        const now = new Date();
        const casesToUpdate = caseHistory.filter(c => selectedCases.includes(c.fileNumber));
        const updatedCases = casesToUpdate.map(c => ({
            ...c,
            status: 'Cerrado',
            situation: 'Cerrado',
            closedAt: now.toISOString()
        }));

        try {
            // Build toast message based on selected options
            const actions: string[] = [];
            if (options.createAlbaran) actions.push('albaranes');
            if (options.createProforma) actions.push('proformas');
            const actionText = actions.length > 0 ? ` y generando ${actions.join(' y ')}` : '';

            addToast(`Cerrando expedientes${actionText}...`, 'info');

            // Execute in parallel with individual error handling
            await Promise.all(casesToUpdate.map(async (c) => {
                // Order: First Albarán, then Proforma

                // 1. Create Delivery Note (Albarán) if selected
                if (options.createAlbaran) {
                    try {
                        await createDeliveryNoteFromCase({
                            client: c.client,
                            clientSnapshot: c.clientSnapshot,
                            fileNumber: c.fileNumber,
                            economicData: c.economicData
                        });
                    } catch (err) {
                        console.error(`Failed to create delivery note for ${c.fileNumber}`, err);
                    }
                }

                // 2. Create Proforma if selected
                if (options.createProforma) {
                    try {
                        await createProformaFromCase({
                            client: c.client,
                            clientSnapshot: c.clientSnapshot,
                            fileNumber: c.fileNumber,
                            economicData: c.economicData
                        });
                    } catch (err) {
                        console.error(`Failed to create proforma for ${c.fileNumber}`, err);
                    }
                }
            }));

            await saveMultipleCases(updatedCases);
            setSelectedCases([]);
            setIsBatchCloseModalOpen(false);
            addToast(`${casesToUpdate.length} expedientes cerrados correctamente con fecha ${now.toLocaleDateString()}`, 'success');
        } catch (error) {
            console.error('Error in batch close:', error);
            addToast('Error al cerrar expedientes. Consulta la consola.', 'error');
        }
    };

    const handleSingleClose = async () => {
        if (!caseToClose) return;
        const now = new Date();
        const updatedCase = {
            ...caseToClose,
            status: 'Cerrado',
            situation: 'Cerrado',
            closedAt: now.toISOString()
        };
        await saveMultipleCases([updatedCase]);
        setCaseToClose(null);
        addToast(`Expediente ${caseToClose.fileNumber} cerrado correctamente con fecha ${now.toLocaleDateString()}`, 'success');
    };

    const handleBatchReopen = async () => {
        if (selectedCases.length === 0) return;
        const casesToUpdate = caseHistory.filter(c => selectedCases.includes(c.fileNumber));
        const updatedCases = casesToUpdate.map(c => ({
            ...c,
            status: 'Iniciado', // Or 'Abierto' if that's a valid status, defaulting to 'Iniciado' based on prompt
            situation: 'Iniciado',
            closedAt: undefined
        }));
        await saveMultipleCases(updatedCases);
        setSelectedCases([]);
    };

    // Pagination calculations
    const totalItems = processedCases.length;
    const numPageSize = typeof pageSize === 'number' ? pageSize : totalItems;
    const totalPages = Math.ceil(totalItems / numPageSize);
    const startIndex = (currentPage - 1) * numPageSize;
    const endIndex = startIndex + numPageSize;
    const paginatedCases = processedCases.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedCases([]); // Clear selection on filter change
    }, [selectedClientId, searchQuery, identifierFilter, statusFilter, categoryFilter, startDate, endDate, situationFilter]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Explorador de Expedientes</h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsNewCaseModalOpen(true)}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                        >
                            + Nuevo Expediente
                        </button>
                        <button
                            onClick={onShowResponsibleDashboard}
                            className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors font-medium"
                        >
                            Panel Responsable
                        </button>
                        <button
                            onClick={() => setIsReportsModuleOpen(true)}
                            className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-200 transition-colors font-medium flex items-center gap-1"
                        >
                            <FileText className="w-4 h-4" /> Informes
                        </button>
                        <button
                            onClick={() => window.location.hash = '/clients'}
                            className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors font-medium flex items-center gap-1"
                        >
                            <Users className="w-4 h-4" /> Clientes
                        </button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        title="Vista Lista"
                    >
                        <ListViewIcon />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        title="Vista Cuadrícula"
                    >
                        <GridViewIcon />
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded transition-colors ${viewMode === 'kanban' ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        title="Vista Kanban"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <FilterPanel
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedClientId={selectedClientId}
                setSelectedClientId={setSelectedClientId}
                selectedClientLabel={selectedClientLabel}
                setSelectedClientLabel={setSelectedClientLabel}
                identifierFilter={identifierFilter}
                setIdentifierFilter={setIdentifierFilter}
                prefixFilter={''}
                setPrefixFilter={() => {}}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                situationFilter={situationFilter}
                setSituationFilter={setSituationFilter}
                responsibleFilter={''}
                setResponsibleFilter={() => {}}
                responsibleLabel={''}
                setResponsibleLabel={() => {}}
                dateFilterType={dateFilterType}
                setDateFilterType={setDateFilterType}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                prefixes={prefixes}
                caseStatuses={Array.from(new Set([...(appSettings?.caseStatuses || []), 'Iniciado', 'Cerrado']))}
                onClearFilters={handleClearFilters}
            />

            {/* Batch Actions - Moved below filters for visibility */}
            {/* Batch Actions - Always visible */}
            <div className={`border p-3 rounded-lg flex items-center justify-between mb-4 transition-colors ${selectedCases.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center gap-2 text-sm ${selectedCases.length > 0 ? 'text-blue-800' : 'text-slate-500'}`}>
                    <span className="font-bold">{selectedCases.length}</span> seleccionados
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const caseToDuplicate = caseHistory.find(c => c.fileNumber === selectedCases[0]);
                            if (caseToDuplicate) handleDuplicateCase(caseToDuplicate);
                        }}
                        disabled={selectedCases.length !== 1}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-1 ${selectedCases.length !== 1
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                            }`}
                    >
                        <Copy className="w-4 h-4" /> Duplicar
                    </button>
                    <button
                        onClick={handleBatchReopen}
                        disabled={selectedCases.length === 0}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-1 ${selectedCases.length === 0
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
                            }`}
                    >
                        <RotateCcw className="w-4 h-4" /> Reabrir
                    </button>
                    <button
                        onClick={handleBatchClose}
                        disabled={selectedCases.length === 0}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-1 ${selectedCases.length === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                    >
                        <Lock className="w-4 h-4" /> Cerrar
                    </button>
                    <button
                        onClick={() => {
                            if (selectedCases.length === 1) {
                                const caseToEdit = caseHistory.find(c => c.fileNumber === selectedCases[0]);
                                if (caseToEdit) onSelectCase(caseToEdit.fileNumber);
                            }
                        }}
                        disabled={selectedCases.length !== 1}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-1 ${selectedCases.length !== 1
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50'
                            }`}
                    >
                        <FileText className="w-4 h-4" /> Mantener
                    </button>
                    <button
                        onClick={handleBatchDelete}
                        disabled={selectedCases.length === 0}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-1 ${selectedCases.length === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                </div>
            </div>


            {viewMode === 'kanban' ? (
                <KanbanView
                    cases={processedCases}
                    onUpdateCase={async (updatedCase) => {
                        await saveCase(updatedCase);
                        addToast(`Expediente ${updatedCase.fileNumber} actualizado a ${updatedCase.status}`, 'success');
                    }}
                    onSelectCase={onSelectCase}
                    onClose={() => setViewMode('list')}
                />
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedCases.map((c) => (
                        <ExpedienteCard
                            key={c.fileNumber}
                            caseRecord={c}
                            onSelectCase={handleCaseClick}
                            onDelete={() => setCaseToDelete(c.fileNumber)}
                            onDuplicate={handleDuplicateCase}
                        />
                    ))}
                    {paginatedCases.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            <p className="text-lg font-medium">No se encontraron expedientes</p>
                            <p className="text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="divide-y border rounded-lg bg-white">
                    <div className="grid grid-cols-[auto_1fr_1fr_3fr_1fr_1fr_1fr_1fr_2fr] gap-2 p-3 font-bold text-sm bg-slate-200">
                        <div className="flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={paginatedCases.length > 0 && paginatedCases.every(c => selectedCases.includes(c.fileNumber))}
                                onChange={handleSelectAll}
                                className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                            />
                        </div>
                        <div
                            className="cursor-pointer hover:bg-slate-300 flex items-center gap-1 truncate"
                            onClick={() => {
                                const direction = sortConfig?.key === 'type' && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                                setSortConfig({ key: 'type', direction });
                            }}
                        >
                            Tipo {sortConfig?.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </div>
                        <div className="truncate">EXPEDIENTE</div>
                        <div className="truncate">Cliente</div>
                        <div
                            className="cursor-pointer hover:bg-slate-300 flex items-center justify-center gap-1"
                            onClick={() => {
                                const direction = sortConfig?.key === 'createdAt' && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                                setSortConfig({ key: 'createdAt', direction });
                            }}
                        >
                            FECHA APERTURA {sortConfig?.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </div>
                        <div
                            className="cursor-pointer hover:bg-slate-300 flex items-center justify-center gap-1"
                            onClick={() => {
                                const direction = sortConfig?.key === 'closedAt' && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                                setSortConfig({ key: 'closedAt', direction });
                            }}
                        >
                            FECHA CIERRE {sortConfig?.key === 'closedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </div>
                        <div className="text-center truncate">Saldo</div>
                        <div className="">
                            <select
                                value={situationFilter}
                                onChange={e => setSituationFilter(e.target.value)}
                                className="w-full border rounded p-1 text-xs"
                            >
                                <option value="Todos">Todos</option>
                                <option value="Iniciado">Iniciado</option>
                                <option value="En Proceso">En Proceso</option>
                                <option value="Cerrado">Cerrado</option>
                                <option value="Finalizado">Finalizado</option>
                            </select>
                        </div>
                        <div className="">Estado</div>
                    </div>
                    {paginatedCases.map((c) => (
                        <ExpedienteListItem
                            key={c.fileNumber}
                            caseRecord={c}
                            columnDefs={DEFAULT_COLUMN_DEFS}
                            onSelectCase={handleCaseClick}
                            isSelected={selectedCases.includes(c.fileNumber)}
                            onToggleSelection={handleToggleCase}
                        />
                    ))}
                    {paginatedCases.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            <p className="text-lg font-medium">No se encontraron expedientes</p>
                            <p className="text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {totalItems > 0 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
            )}

            {caseToDelete && (
                <ConfirmationModal
                    isOpen={!!caseToDelete}
                    title="Eliminar Expediente"
                    message={`¿Eliminar definitivamente el expediente ${caseToDelete}?`}
                    onConfirm={confirmDelete}
                    onClose={() => setCaseToDelete(null)}
                />
            )}

            <CaseCloseModal
                isOpen={isBatchCloseModalOpen}
                onClose={() => setIsBatchCloseModalOpen(false)}
                onConfirm={confirmBatchClose}
                selectedCasesCount={selectedCases.length}
            />

            <ConfirmationModal
                isOpen={!!caseToClose}
                title="Cerrar Expediente"
                message={`¿Estás seguro de que deseas cerrar el expediente ${caseToClose?.fileNumber}? Se registrará la fecha de cierre actual.`}
                onConfirm={handleSingleClose}
                onClose={() => setCaseToClose(null)}
            />

            <ConfirmationModal
                isOpen={isBatchDeleteModalOpen}
                title="Eliminar Expedientes"
                message={`¿Estás seguro de que deseas eliminar los ${selectedCases.length} expedientes seleccionados? Esta acción no se puede deshacer.`}
                onConfirm={confirmBatchDelete}
                onClose={() => setIsBatchDeleteModalOpen(false)}
            />

            <NewCaseModal
                isOpen={isNewCaseModalOpen}
                onClose={() => setIsNewCaseModalOpen(false)}
                onCreate={(category: FileCategory, subType?: string) => {
                    setIsNewCaseModalOpen(false);
                    onCreateNewCase(category, subType);
                }}
            />

            {isReportsModuleOpen && (
                <ImprovedReportsModule onClose={() => setIsReportsModuleOpen(false)} />
            )}
        </div>
    );
};

export default Dashboard;

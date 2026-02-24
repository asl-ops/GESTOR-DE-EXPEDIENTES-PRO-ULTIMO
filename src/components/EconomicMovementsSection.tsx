import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    CaseRecord,
    MovimientoExpediente,
    EstadoMovimiento,
    RegimenIVA,
    Movimiento,
    Naturaleza,
    PrefijoMovimiento
} from '@/types';
import { getMovimientoById, getMovimientos } from '@/services/movimientoService';
import { getPrefixByCode } from '@/services/prefixService';
import { getPrefijoMovimientos } from '@/services/prefijoMovimientoService';
import { roundToTwo, calculateIVA } from '@/utils/fiscalUtils';
import { Trash2, Plus, Lock, Euro, Check, Search, X, TrendingUp, Database, AlertCircle, Eye, Edit2 } from 'lucide-react';
import { PremiumNumericInput } from './ui/PremiumNumericInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import ConfirmationModal from './ConfirmationModal';

interface EconomicMovementsSectionProps {
    caseRecord: CaseRecord;
    onChange: (movimientos: MovimientoExpediente[]) => void;
}

const MovementRow = ({
    mov,
    isHeader,
    isActive,
    isEditing,
    isSelected,
    error,
    onActivate,
    onDelete,
    onUpdate,
    onSave,
    onCancel,
    onNavigate,
    onToggleSelect,
    editMode,
    onUpdateMode,
    editBuffer
}: {
    mov: MovimientoExpediente,
    isHeader: boolean,
    isActive: boolean,
    isEditing: boolean,
    isSelected: boolean,
    error?: string,
    onActivate: () => void,
    onDelete: () => void,
    onUpdate: (data: Partial<MovimientoExpediente>) => void,
    onSave: () => void,
    onCancel: () => void,
    onNavigate: (direction: 'up' | 'down' | 'next') => void,
    onToggleSelect: () => void,
    editMode?: 'amount' | 'text',
    onUpdateMode?: (mode: 'amount' | 'text') => void,
    editBuffer?: Partial<MovimientoExpediente>
}) => {
    const amountRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const isRealizado = mov.estado === EstadoMovimiento.REALIZADO;

    // Auto-focus logic
    useEffect(() => {
        if (isEditing) {
            if (editMode === 'text' && nameRef.current) {
                nameRef.current.focus();
                nameRef.current.select();
            } else if (editMode === 'amount' && amountRef.current) {
                amountRef.current.focus();
                amountRef.current.select();
            }
        }
    }, [isEditing, editMode]);

    const handleKeyDown = (e: React.KeyboardEvent) => {

        if (isEditing) {
            // In edit mode
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (editMode === 'text') {
                    onUpdateMode?.('amount');
                } else {
                    onSave();
                    onNavigate('next');
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onSave();
                onNavigate('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onSave();
                onNavigate('down');
            }
        } else if (isActive) {
            // In active row mode (not editing)
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate(); // Start editing
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onNavigate('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onNavigate('down');
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                onDelete();
            }
        }
    };

    const displayName = mov.descripcionOverride || mov.nombreSnapshot;
    const isConceptosVarios = (displayName || '').trim().toUpperCase() === 'CONCEPTOS VARIOS';

    return (
        <div
            tabIndex={isActive && !isHeader ? 0 : -1}
            onKeyDown={handleKeyDown}
            onClick={!isHeader && !isEditing ? onActivate : undefined}
            className={`group flex items-center gap-4 p-3 bg-white border rounded-2xl transition-all duration-200 outline-none ${isEditing
                ? (error ? 'border-rose-300 ring-2 ring-rose-50 shadow-md' : 'border-sky-400 ring-4 ring-sky-100 shadow-lg')
                : isActive
                    ? 'border-sky-300 ring-2 ring-sky-50 bg-sky-50/30 shadow-md'
                    : isSelected
                        ? 'border-sky-200 bg-sky-50/20'
                        : isRealizado
                            ? 'border-slate-200 hover:border-sky-200'
                            : 'border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-200'
                } ${isHeader ? 'bg-slate-50/50 cursor-default' : 'cursor-pointer hover:shadow-sm'}`}
        >
            {/* 1. Selection Toggle */}
            <div className="flex-shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
                    className={`size-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${isSelected
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-200'
                        : isRealizado
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-sky-50 hover:text-sky-500 hover:border-sky-200'
                            : 'bg-slate-50 text-slate-200 border border-slate-100 hover:bg-slate-100 hover:text-slate-400'
                        }`}
                    title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                >
                    <Check size={16} className={isSelected ? 'animate-in zoom-in-50 duration-200' : ''} strokeWidth={isRealizado ? 3 : 2} />
                </button>
            </div>

            {/* 2. Description */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 group/title">
                    {isEditing && editMode === 'text' ? (
                        <div className="flex-1 relative">
                            <input
                                ref={nameRef}
                                value={editBuffer?.descripcionOverride || ''}
                                onChange={(e) => onUpdate({ descripcionOverride: e.target.value })}
                                onKeyDown={handleKeyDown}
                                className="w-full text-sm font-bold text-sky-800 bg-sky-50/50 border-none outline-none p-0 focus:ring-0 placeholder:text-sky-200 uppercase"
                                placeholder="Escribe el nombre del concepto..."
                            />
                        </div>
                    ) : (
                        <h5 className={`text-sm font-bold truncate transition-colors uppercase tracking-tight ${isEditing ? 'text-sky-700' : isActive ? 'text-slate-900' : isRealizado ? 'text-slate-700' : 'text-slate-400'
                            }`}>
                            {displayName || 'Sin descripción'}
                        </h5>
                    )}

                    {!isConceptosVarios && !isEditing && !isHeader && isActive && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onActivate(); onUpdateMode?.('text'); }}
                            className="p-1 text-slate-300 hover:text-sky-500 hover:bg-sky-50 rounded transition-all opacity-0 group-hover/title:opacity-100"
                            title="Editar texto"
                        >
                            <Edit2 size={12} strokeWidth={3} />
                        </button>
                    )}

                    {isHeader && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            SISTEMA
                        </span>
                    )}
                </div>
                {isActive && !isEditing && !isHeader && (
                    <p className="text-[10px] text-sky-500 font-bold mt-0.5 uppercase tracking-wide animate-in fade-in slide-in-from-top-1">
                        PULSA ENTER PARA EDITAR IMPORTE
                    </p>
                )}
                {error && <p className="text-[10px] text-rose-500 font-medium mt-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
            </div>

            {/* 3. Amount */}
            <div className="flex items-center gap-3">
                <div className={`relative group/input flex items-center transition-all duration-200 ${isEditing ? 'scale-105' : 'scale-100'
                    }`}>
                    <PremiumNumericInput
                        ref={amountRef}
                        value={mov.importe || 0}
                        disabled={isHeader}
                        readOnly={!isEditing}
                        blankWhenZero={true}
                        onChange={(val) => onUpdate({ importe: val })}
                        onKeyDown={handleKeyDown}
                        className={`text-base tabular-nums w-28 text-right transition-all font-bold ${isEditing
                            ? 'text-sky-600 bg-sky-50 border-sky-300'
                            : isActive
                                ? 'text-slate-900 cursor-pointer'
                                : isHeader
                                    ? 'cursor-not-allowed opacity-50'
                                    : isRealizado
                                        ? 'text-slate-900'
                                        : 'text-slate-300 font-normal'
                            }`}
                        placeholder=""
                    />
                    <Euro size={12} className={`ml-1 transition-colors ${isEditing ? 'text-sky-500' : isRealizado ? 'text-slate-400' : 'text-slate-200'
                        }`} />
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Eliminar"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div >
    );
};

const EconomicSummaryModal = ({ isOpen, onClose, totals }: { isOpen: boolean, onClose: () => void, totals: any }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white border border-slate-200 rounded-[28px] p-8 shadow-2xl w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                            <Euro size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 tracking-tight">Cálculo Económico</h4>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Resumen del Expediente</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between group">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500">Honorarios Prof.</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">(Base Imponible 21%)</span>
                        </div>
                        <span className="font-semibold text-slate-700 text-sm tabular-nums">
                            {totals.honorarios.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                        </span>
                    </div>

                    <div className="flex items-center justify-between group">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500">Suplidos</span>
                            <span className="text-[10px] text-amber-500/80 uppercase tracking-tighter">(Pagos Delegados - Sin IVA)</span>
                        </div>
                        <span className="font-semibold text-slate-700 text-sm tabular-nums">
                            {totals.suplidos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                        </span>
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IVA (21%)</span>
                            <span className="font-bold text-slate-500 text-sm tabular-nums">
                                {totals.vat.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-slate-800">Total General</span>
                            <span className="font-black text-sky-700 text-2xl tabular-nums tracking-tighter">
                                {totals.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50/80 rounded-2xl p-4 flex gap-3">
                    <AlertCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-normal text-left">
                        Los totales se recalculan automáticamente al activar movimientos o cambiar importes.
                    </p>
                </div>

                <Button variant="primary" className="w-full h-11 rounded-xl" onClick={onClose}>
                    Cerrar
                </Button>
            </div>
        </div>
    );
};

export const EconomicMovementsSection: React.FC<EconomicMovementsSectionProps> = ({
    caseRecord,
    onChange
}) => {
    const { addToast } = useToast();
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [_catalog, _setCatalog] = useState<Movimiento[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [_isLoadingCatalog, _setIsLoadingCatalog] = useState(false);
    const [movToDeleteId, setMovToDeleteId] = useState<string | null>(null);
    const [isBulkDeleteModal, setIsBulkDeleteModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [prefixInfo, setPrefixInfo] = useState<{ id: string; code: string; description: string; departamento?: string } | null>(null);
    const [movimientosMap, setMovimientosMap] = useState<Map<string, Movimiento>>(new Map());
    const [predictiveCatalog, setPredictiveCatalog] = useState<Movimiento[]>([]);
    const [_prefixCatalogDetails, setPrefixCatalogDetails] = useState<PrefijoMovimiento[]>([]);

    // Keyboard-first Explorer State
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<'amount' | 'text'>('amount');
    const [error, setError] = useState<string | null>(null);
    const [editBuffer, setEditBuffer] = useState<Partial<MovimientoExpediente>>({});

    const movimientos = caseRecord.movimientos || [];

    // Load prefix info and catalog
    useEffect(() => {
        const loadInfo = async () => {
            try {
                const prefixCode = caseRecord.fileNumber.split('-')[0];
                const prefixData = await getPrefixByCode(prefixCode);

                // Prioritize the ID from the official prefix definition found by code
                const actualPrefixId = prefixData?.id || caseRecord.prefixId;

                if (prefixData) {
                    setPrefixInfo({
                        id: prefixData.id,
                        code: prefixData.code,
                        description: prefixData.description,
                        departamento: prefixData.departamento
                    });
                }

                if (!actualPrefixId) {
                    console.warn('Could not determine prefixId for case:', caseRecord.fileNumber);
                    return;
                }

                // 1. Load the Entire Catalog for this prefix
                const allCatalogMovs = await getMovimientos(actualPrefixId);

                // 2. Load the Template (Linkage/Overrides)
                const prefMovs = await getPrefijoMovimientos(actualPrefixId);
                setPrefixCatalogDetails(prefMovs);

                // 3. Merge: Catalog as base + Overrides from Template Link
                const enrichedDetails = allCatalogMovs
                    .filter(m => m.activo !== false) // Include those with 'activo: true' or missing 'activo' field
                    .map(m => {
                        const pm = prefMovs.find(p => p.movimientoId === m.id);
                        return {
                            ...m,
                            // Priority: Template Override > Catalog Default > 0
                            importePorDefecto: pm?.importePorDefecto || m.importePorDefecto || 0
                        };
                    });

                console.log('📦 Loaded predictive catalog:', enrichedDetails.length, 'movements');
                setPredictiveCatalog(enrichedDetails);
            } catch (error) {
                console.error('Error loading prefix/catalog info:', error);
            }
        };
        loadInfo();
    }, [caseRecord.prefixId, caseRecord.fileNumber]);

    // Ensure all current movements are in the map
    useEffect(() => {
        const loadMovimientosDetails = async () => {
            const actualPrefixId = caseRecord.prefixId || prefixInfo?.id;
            if (!actualPrefixId) return;

            const map = new Map<string, Movimiento>(movimientosMap);
            let changed = false;
            for (const mov of movimientos) {
                if (mov.movimientoId !== 'MANUAL' && !map.has(mov.movimientoId)) {
                    try {
                        const detail = await getMovimientoById(actualPrefixId, mov.movimientoId);
                        if (detail) {
                            map.set(mov.movimientoId, detail);
                            changed = true;
                        }
                    } catch (error) {
                        console.error(`Error loading movimiento ${mov.movimientoId}:`, error);
                    }
                }
            }
            if (changed) setMovimientosMap(map);
        };
        if (movimientos.length > 0) {
            loadMovimientosDetails();
        }
    }, [movimientos]);

    const allSortedMovs = useMemo(() => {
        return [...movimientos].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }, [movimientos]);

    const headerMovs = allSortedMovs.filter(m => (m as any).categoria === 'CABECERA' || (m as any).bloqueado);
    const operativeMovs = allSortedMovs.filter(m => (m as any).categoria !== 'CABECERA' && !(m as any).bloqueado);

    const handleSelectFromCatalog = (catalogMov: Movimiento) => {
        const maxOrder = movimientos.length > 0 ? Math.max(...movimientos.map(mov => mov.orden || 0)) : 0;
        const newId = `mov_${catalogMov.codigo}_${Date.now()}`;
        const newMov: MovimientoExpediente = {
            id: newId,
            expedienteId: caseRecord.fileNumber,
            movimientoId: catalogMov.id,
            orden: maxOrder + 1,
            nombreSnapshot: catalogMov.nombre,
            codigoSnapshot: catalogMov.codigo,
            naturalezaSnapshot: catalogMov.naturaleza,
            descripcionOverride: catalogMov.nombre,
            importe: catalogMov.importePorDefecto || 0,
            regimenIva: catalogMov.regimenIva || RegimenIVA.SUJETO,
            ivaPorcentaje: catalogMov.ivaPorDefecto || 21,
            estado: EstadoMovimiento.REALIZADO,
            facturable: catalogMov.naturaleza === Naturaleza.HONORARIO,
            fecha: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        onChange([...movimientos, newMov]);
        setIsAddingMode(false);
        setSearchTerm('');

        // Auto focus and start editing the newly added movement
        setActiveRowId(newId);

        const isConceptosVarios = catalogMov.nombre.trim().toUpperCase() === 'CONCEPTOS VARIOS';
        setEditingId(newId);
        setEditMode(isConceptosVarios ? 'text' : 'amount');
        setEditBuffer({
            importe: catalogMov.importePorDefecto || 0,
            descripcionOverride: catalogMov.nombre
        });
    };

    const filteredCatalog = useMemo(() => {
        let results = [...predictiveCatalog];
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            results = results.filter(m =>
                m.nombre.toLowerCase().includes(lower) ||
                m.codigo.toLowerCase().includes(lower)
            );
        }

        // Custom Sort: "CONCEPTOS VARIOS" always appears first if it exists
        return results.sort((a, b) => {
            const aName = a.nombre.trim().toUpperCase();
            const bName = b.nombre.trim().toUpperCase();

            const aIsSpecial = aName === 'CONCEPTOS VARIOS';
            const bIsSpecial = bName === 'CONCEPTOS VARIOS';

            if (aIsSpecial && !bIsSpecial) return -1;
            if (bIsSpecial && !aIsSpecial) return 1;

            return 0; // Maintain relative order for other items
        });
    }, [searchTerm, predictiveCatalog]);

    const handleActivateRow = (id: string) => {
        if (editingId) {
            // Save current edit before switching
            handleSaveEdit();
        }
        setActiveRowId(id);
    };

    const handleStartEdit = (id: string, mode: 'amount' | 'text' = 'amount') => {
        const mov = movimientos.find(m => m.id === id);
        if (!mov) return;

        const isConceptosVarios = (mov.descripcionOverride || mov.nombreSnapshot || '').trim().toUpperCase() === 'CONCEPTOS VARIOS';
        const startMode = isConceptosVarios ? 'text' : mode;

        setEditingId(id);
        setEditMode(startMode);
        setEditBuffer({
            importe: mov.importe,
            descripcionOverride: mov.descripcionOverride || mov.nombreSnapshot
        });
        setError(null);
    };

    const handleUpdateBuffer = (id: string, data: Partial<MovimientoExpediente>) => {
        if (id === editingId) {
            setEditBuffer(prev => ({ ...prev, ...data }));
        }
    };

    const handleSaveEdit = () => {
        if (!editingId) return;

        const mov = movimientos.find(m => m.id === editingId);
        if (!mov) return;

        // Validate
        const newAmount = editBuffer.importe ?? mov.importe;
        if (newAmount === undefined || newAmount === null || isNaN(newAmount) || newAmount < 0) {
            setError('El importe debe ser una cifra válida');
            return;
        }

        // Save
        const updated = movimientos.map(m =>
            m.id === editingId
                ? { ...m, ...editBuffer, updatedAt: new Date().toISOString() }
                : m
        );
        onChange(updated);

        setEditingId(null);
        setEditBuffer({});
        setError(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditBuffer({});
        setError(null);
    };

    const handleNavigate = (currentId: string, direction: 'up' | 'down' | 'next') => {
        const currentIndex = allSortedMovs.findIndex(m => m.id === currentId);
        if (currentIndex === -1) return;

        let nextIndex: number;
        if (direction === 'up') {
            nextIndex = Math.max(0, currentIndex - 1);
        } else if (direction === 'down' || direction === 'next') {
            nextIndex = currentIndex + 1;
        } else {
            return;
        }

        // Check if we're at the last row
        if (nextIndex >= allSortedMovs.length) {
            // We're done! Deactivate and show success
            setActiveRowId(null);
            setEditingId(null);
            setEditBuffer({});
            addToast('✅ Movimientos validados correctamente', 'success');
            return;
        }

        const nextMov = allSortedMovs[nextIndex];
        if (nextMov) {
            setActiveRowId(nextMov.id);
            if (direction === 'next') {
                // Auto-start editing the next row
                handleStartEdit(nextMov.id, 'amount');
            }
        }
    };

    const handleRemoveMovement = (id: string) => {
        setMovToDeleteId(id);
    };

    const handleBulkDelete = () => {
        setIsBulkDeleteModal(true);
    };

    const confirmDeleteMovement = () => {
        if (movToDeleteId) {
            onChange(movimientos.filter(m => m.id !== movToDeleteId));
            setMovToDeleteId(null);
            addToast('Movimiento eliminado', 'info');
        } else if (isBulkDeleteModal) {
            onChange(movimientos.filter(m => !selectedIds.has(m.id)));
            setSelectedIds(new Set());
            setIsBulkDeleteModal(false);
            addToast(`${selectedIds.size} movimientos eliminados`, 'info');
        }
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === operativeMovs.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(operativeMovs.map(m => m.id)));
        }
    };

    const totals = useMemo(() => {
        let honorarios = 0;
        let suplidos = 0;
        let vat = 0;

        movimientos.forEach(m => {
            const amt = roundToTwo(m.importe || 0);
            const movDetail = movimientosMap.get(m.movimientoId);

            const isManual = m.movimientoId === 'MANUAL';
            const naturaleza = isManual ? Naturaleza.HONORARIO : movDetail?.naturaleza;

            if (naturaleza === Naturaleza.HONORARIO) {
                honorarios = roundToTwo(honorarios + amt);
            } else if (naturaleza === Naturaleza.SUPLIDO) {
                suplidos = roundToTwo(suplidos + amt);
            }

            if (m.regimenIva === RegimenIVA.SUJETO && m.facturable) {
                vat = roundToTwo(vat + calculateIVA(amt, m.ivaPorcentaje || 21));
            }
        });

        const subtotal = roundToTwo(honorarios + suplidos);
        return { honorarios, suplidos, subtotal, vat, total: roundToTwo(subtotal + vat) };
    }, [movimientos, movimientosMap]);

    return (
        <div className="space-y-6">
            {prefixInfo && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
                    <Database className="w-5 h-5 text-sky-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-sky-900 leading-snug">
                            Plantilla: {prefixInfo.code} – {prefixInfo.description}
                        </p>
                        <p className="text-xs text-sky-600/80 mt-1">
                            {movimientos.length} movimientos operativos en total.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {headerMovs.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Lock size={12} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-500">Movimientos de Sistema</span>
                        </div>
                        <div className="space-y-2">
                            {headerMovs.map(m => (
                                <MovementRow
                                    key={m.id}
                                    mov={m}
                                    isHeader={true}
                                    isActive={activeRowId === m.id}
                                    isEditing={editingId === m.id}
                                    isSelected={selectedIds.has(m.id)}
                                    error={editingId === m.id ? (error || undefined) : undefined}
                                    onActivate={() => {
                                        if (editingId === m.id) return;
                                        if (activeRowId === m.id) handleStartEdit(m.id);
                                        else handleActivateRow(m.id);
                                    }}
                                    onDelete={() => handleRemoveMovement(m.id)}
                                    onUpdate={(data) => handleUpdateBuffer(m.id, data)}
                                    onSave={handleSaveEdit}
                                    onCancel={handleCancelEdit}
                                    onNavigate={(direction) => handleNavigate(m.id, direction)}
                                    onToggleSelect={() => toggleSelection(m.id)}
                                    editMode={editingId === m.id ? editMode : undefined}
                                    onUpdateMode={(mode) => setEditMode(mode)}
                                    editBuffer={editingId === m.id ? editBuffer : undefined}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center justify-between min-h-[40px]">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={12} className="text-slate-400" />
                                <span className="text-xs font-medium text-slate-500">Explorador de Movimientos</span>
                            </div>

                            {selectedIds.size > 0 && (
                                <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                                    <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {selectedIds.size} seleccionados
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-7 px-3 flex items-center gap-1.5 transition-all"
                                    >
                                        <Trash2 size={12} />
                                        Confirmar eliminación
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedIds(new Set())}
                                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 h-7 px-2 rounded-lg"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {operativeMovs.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleSelectAll}
                                    className={`text-[10px] font-bold uppercase tracking-wider transition-colors px-3 rounded-xl h-8 ${selectedIds.size === operativeMovs.length ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {selectedIds.size === operativeMovs.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                </Button>
                            )}
                            <div className="h-4 w-[1px] bg-slate-100 mx-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSummaryModal(true)}
                                className="text-xs font-medium text-slate-500 hover:bg-slate-50 rounded-xl px-3"
                            >
                                <Eye size={14} className="mr-1.5" />
                                Previsualizar
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAddingMode(true)}
                                className="text-xs font-medium text-sky-600 hover:bg-sky-50 rounded-xl px-3"
                            >
                                <Plus size={14} className="mr-1" />
                                Añadir Movimiento
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2 scroll-fade-bottom pb-4">
                        {operativeMovs.map(m => (
                            <MovementRow
                                key={m.id}
                                mov={m}
                                isHeader={false}
                                isActive={activeRowId === m.id}
                                isEditing={editingId === m.id}
                                isSelected={selectedIds.has(m.id)}
                                error={editingId === m.id ? (error ?? undefined) : undefined}
                                onActivate={() => {
                                    if (editingId === m.id) {
                                        // Already editing, do nothing
                                        return;
                                    }
                                    if (activeRowId === m.id) {
                                        // Double activation = start editing
                                        handleStartEdit(m.id);
                                    } else {
                                        // First activation = just activate
                                        handleActivateRow(m.id);
                                    }
                                }}
                                onDelete={() => handleRemoveMovement(m.id)}
                                onUpdate={(data) => handleUpdateBuffer(m.id, data)}
                                onSave={handleSaveEdit}
                                onCancel={handleCancelEdit}
                                onNavigate={(direction) => handleNavigate(m.id, direction)}
                                onToggleSelect={() => toggleSelection(m.id)}
                                editMode={editingId === m.id ? editMode : undefined}
                                onUpdateMode={(mode) => setEditMode(mode)}
                                editBuffer={editingId === m.id ? editBuffer : undefined}
                            />
                        ))}

                        {/* Add Movement Explorer */}
                        {isAddingMode && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="bg-white border-2 border-sky-200 rounded-3xl p-5 shadow-xl shadow-sky-500/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-sky-100 text-sky-600 rounded-lg">
                                                <Search size={14} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Añadir desde Catálogo</span>
                                        </div>
                                        <button
                                            onClick={() => { setIsAddingMode(false); setSearchTerm(''); }}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Buscar en el catálogo del prefijo (ej: Honorarios, Tasa...)"
                                            className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
                                        />
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    </div>

                                    <div className="scroll-fade-bottom">
                                        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                                            {filteredCatalog.length > 0 ? (
                                                filteredCatalog.map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => handleSelectFromCatalog(m)}
                                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-sky-50 border border-transparent hover:border-sky-100 transition-all text-left group"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700 group-hover:text-sky-700">{m.nombre}</span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${m.naturaleza === Naturaleza.HONORARIO ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-600'
                                                                    }`}>
                                                                    {m.naturaleza}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm font-black text-slate-600 tabular-nums">
                                                                {(m.importePorDefecto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                                            </span>
                                                            <Plus size={14} className="ml-2 text-sky-400 opacity-0 group-hover:opacity-100 transition-all inline-block -mt-1" />
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-xs text-slate-400 font-medium">No se han encontrado movimientos en el catálogo del prefijo</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Add Movement button at the bottom */}
                        {!editingId && !isAddingMode && (
                            <div className="pt-4 flex justify-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddingMode(true)}
                                    className="w-full !rounded-2xl border-dashed border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50/30 py-6 transition-all group"
                                >
                                    <Plus size={16} className="mr-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Añadir desde catálogo del prefijo</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!movToDeleteId || isBulkDeleteModal}
                onClose={() => {
                    setMovToDeleteId(null);
                    setIsBulkDeleteModal(false);
                }}
                onConfirm={confirmDeleteMovement}
                title={isBulkDeleteModal ? "Eliminar múltiples movimientos" : "Eliminar movimiento"}
                message={isBulkDeleteModal
                    ? `¿Estás seguro de que deseas eliminar los ${selectedIds.size} movimientos seleccionados?`
                    : "¿Estás seguro de que deseas eliminar este movimiento?"
                }
                confirmText="Confirmar eliminación"
                cancelText="Cancelar"
                variant="danger"
            />

            <EconomicSummaryModal
                isOpen={showSummaryModal}
                onClose={() => setShowSummaryModal(false)}
                totals={totals}
            />
        </div>
    );
};

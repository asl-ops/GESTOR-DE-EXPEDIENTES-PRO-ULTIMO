import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CaseRecord, getCaseStatusBadgeColor } from '../types';
import { useAppContext } from '../contexts/AppContext';
import {
    Printer,
    Copy,
    RotateCcw,
    ShieldCheck,
    Lock,
    Trash2,
    Eye,
    MoreHorizontal,
    FileText
} from 'lucide-react';
import { CopyAction } from './ui/ActionFeedback';

interface ColumnDef {
    id: string;
    label: string;
    minWidth: number;
    defaultWidth: number;
    align?: 'left' | 'center' | 'right';
}

interface ExpedienteListItemProps {
    caseRecord: CaseRecord;
    columnDefs: ColumnDef[];
    onSelectCase: (caseRecord: CaseRecord) => void;
    isSelected: boolean;
    onToggleSelection: (fileNumber: string) => void;
    className?: string;
    onPrint?: () => void;
    onDuplicate?: () => void;
    onReopen?: () => void;
    onMaintain?: () => void;
    onClose?: () => void;
    onDelete?: () => void;
    onPreview?: (caseRecord: CaseRecord) => void;
    onCreateProforma?: (caseRecord: CaseRecord) => void;
}

const ExpedienteListItem: React.FC<ExpedienteListItemProps> = ({
    caseRecord,
    columnDefs,
    onSelectCase,
    isSelected,
    onToggleSelection,
    className = '',
    onPrint,
    onDuplicate,
    onReopen,
    onMaintain,
    onClose,
    onDelete,
    onPreview,
    onCreateProforma
}) => {
    const { users } = useAppContext();
    const { fileNumber, status, createdAt, client, situation, closedAt, fileConfig, description } = caseRecord;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const responsibleName = useMemo(() => {
        if (!fileConfig?.responsibleUserId) return '—';
        const user = users.find(u => u.id === fileConfig.responsibleUserId);
        return user ? user.name : fileConfig.responsibleUserId;
    }, [users, fileConfig?.responsibleUserId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleAction = (e: React.MouseEvent, action?: () => void) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        if (action) action();
    };

    return (
        <tr
            className={`border-t app-divider hover:bg-[#f8fafc] cursor-pointer transition-colors group ${isSelected ? 'bg-sky-50/50 is-selected' : ''} ${className}`}
            onClick={() => onSelectCase(caseRecord)}
        >
            {columnDefs.map((col) => {
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                // Content Switch
                let content: React.ReactNode = null;
                let cellClass = `py-1.5 px-3 text-[13px] font-normal leading-tight truncate ${alignClass}`;

                switch (col.id) {
                    case 'select':
                        content = (
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelection(fileNumber)}
                                className="h-4 w-4 rounded border-slate-200 border-2 bg-transparent text-[#4c739a] checked:bg-[#4c739a] checked:border-[#4c739a] focus:ring-0 focus:ring-offset-0 focus:border-slate-200 focus:outline-none"
                            />
                        );
                        cellClass = `py-1.5 px-3 text-center`;
                        break;

                    case 'fileNumber':
                        content = (
                            <CopyAction text={fileNumber} duration={1500}>
                                <div className="flex items-center gap-2 hover:text-sky-600 transition-colors group/copy">
                                    <span className="font-mono">{fileNumber}</span>
                                    <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                                </div>
                            </CopyAction>
                        );
                        cellClass += " font-mono text-slate-700";
                        break;

                    case 'identifier':
                        content = caseRecord.clientSnapshot?.documento || client.nif || '—';
                        cellClass += " text-slate-700";
                        break;

                    case 'client':
                        const clientName = caseRecord.clientSnapshot?.nombre || client.nombre || `${client.firstName || ''} ${client.surnames || ''}`.trim() || 'Sin Titular';
                        content = <span title={clientName}>{clientName}</span>;
                        cellClass += " text-slate-700 font-medium";
                        break;

                    case 'totalAmount':
                        content = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(caseRecord.economicData?.totalAmount || 0);
                        cellClass += " text-slate-700 font-bold";
                        break;

                    case 'createdAt':
                        content = createdAt ? (isNaN(new Date(createdAt).getTime()) ? '—' : new Date(createdAt).toLocaleDateString('es-ES')) : '—';
                        cellClass += " text-slate-500 text-[11px] uppercase tracking-tight";
                        break;

                    case 'closedAt':
                        content = closedAt ? (isNaN(new Date(closedAt).getTime()) ? '—' : new Date(closedAt).toLocaleDateString('es-ES')) : '—';
                        cellClass += " text-slate-500 text-[11px] uppercase tracking-tight";
                        break;

                    case 'notes':
                        const noteText = description || (caseRecord as any).observations || (caseRecord as any).notes || '—';
                        content = <span title={noteText}>{noteText}</span>;
                        cellClass += " text-slate-500 italic";
                        break;

                    case 'actions':
                        content = (
                            <div className="relative flex justify-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(!isMenuOpen);
                                    }}
                                    className={`p-1 rounded-md transition-all duration-150 ${isMenuOpen ? 'bg-slate-200 text-slate-700 opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100'}`}
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {isMenuOpen && (
                                    <div
                                        ref={menuRef}
                                        className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={(e) => handleAction(e, () => onPreview?.(caseRecord))}
                                            className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Vista Previa
                                        </button>

                                        <button
                                            onClick={(e) => handleAction(e, onDuplicate)}
                                            className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-[#1380ec] flex items-center gap-2"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> Duplicar
                                        </button>

                                        {status === 'Cerrado' ? (
                                            <button
                                                onClick={(e) => handleAction(e, onReopen)}
                                                className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => handleAction(e, onMaintain)}
                                                    className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-sky-600 flex items-center gap-2"
                                                >
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Mantenimiento
                                                </button>
                                                <button
                                                    onClick={(e) => handleAction(e, onClose)}
                                                    className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2"
                                                >
                                                    <Lock className="w-3.5 h-3.5" /> Cerrar
                                                </button>
                                            </>
                                        )}

                                        {status === 'Cerrado' && (
                                            <button
                                                onClick={(e) => handleAction(e, () => onCreateProforma?.(caseRecord))}
                                                className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2"
                                            >
                                                <FileText className="w-3.5 h-3.5" /> Crear Proforma
                                            </button>
                                        )}

                                        <div className="h-px bg-slate-100 my-1" />

                                        <button
                                            onClick={(e) => handleAction(e, onPrint)}
                                            className="w-full text-left px-3 py-2 text-xs font-normal text-slate-600 hover:bg-slate-50 hover:text-slate-800 flex items-center gap-2"
                                        >
                                            <Printer className="w-3.5 h-3.5" /> Imprimir
                                        </button>

                                        <div className="h-px bg-slate-100 my-1" />

                                        <button
                                            onClick={(e) => handleAction(e, onDelete)}
                                            className="w-full text-left px-3 py-2 text-xs font-normal text-rose-500 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                        cellClass = `py-1.5 px-3 relative user-select-none`;
                        break;

                    case 'situation':
                        content = situation || 'Iniciado';
                        cellClass += " text-slate-400 text-[11px] italic";
                        break;

                    case 'status':
                        content = (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border border-transparent ${getCaseStatusBadgeColor(status)}`}>
                                {status}
                            </span>
                        );
                        break;

                    case 'responsible':
                        content = <span title={responsibleName}>{responsibleName}</span>;
                        cellClass += " text-slate-700 text-[11px] font-medium uppercase";
                        break;
                }

                return (
                    <td
                        key={col.id}
                        className={cellClass}
                        onClick={(col.id === 'select' || col.id === 'actions') ? (e) => e.stopPropagation() : undefined}
                    >
                        {content}
                    </td>
                );
            })}
        </tr>
    );
};

export default ExpedienteListItem;

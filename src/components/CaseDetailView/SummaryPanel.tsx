import React from 'react';
import { AttachedDocument, EconomicLineItem, Communication } from '../../types';
import { FileText, Euro, History, ArrowRight, Plus } from 'lucide-react';

interface SummaryPanelProps {
    attachments: AttachedDocument[];
    economicLines: EconomicLineItem[];
    communications: Communication[];
    onAddDocument?: () => void;
    onAddPayment?: () => void;
    onAddEvent?: () => void;
}

const SummarySection = ({
    title,
    icon: Icon,
    count,
    total,
    onViewAll,
    onAdd,
    children
}: {
    title: string;
    icon: any;
    count: number;
    total?: string;
    onViewAll?: () => void;
    onAdd?: () => void;
    children: React.ReactNode
}) => (
    <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] overflow-hidden transition-all hover:shadow-md">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-[#e5e7eb] flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon size={14} className="text-[#617589]" />
                <h4 className="text-sm font-bold text-[#111418]">{title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider border ${count > 0 ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-gray-200 text-gray-400'}`}>
                    {count}
                </span>
            </div>
            <div className="flex items-center gap-1">
                {total && <span className="text-sm font-bold text-[#111418] mr-2">{total}</span>}
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="p-1.5 hover:bg-[#1380ec] hover:text-white rounded-lg text-[#1380ec] transition-all"
                        title="Añadir nuevo"
                    >
                        <Plus size={16} strokeWidth={3} />
                    </button>
                )}
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="p-1.5 hover:bg-gray-200 rounded-lg text-[#617589] transition-all"
                        title="Ver todo"
                    >
                        <ArrowRight size={16} />
                    </button>
                )}
            </div>
        </div>
        <div className="p-0">
            {children}
        </div>
    </div>
);

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
    attachments,
    economicLines,
    communications,
    onAddDocument,
    onAddPayment,
    onAddEvent
}) => {
    const lastDocs = [...attachments].sort((a, b) => new Date(b.uploadedAt || Date.now()).getTime() - new Date(a.uploadedAt || Date.now()).getTime()).slice(0, 3);
    const lastPayments = [...economicLines].sort((a, b) => new Date(b.date || Date.now()).getTime() - new Date(a.date || Date.now()).getTime()).slice(0, 3);
    const lastComms = [...communications].sort((a, b) => new Date(b.date || Date.now()).getTime() - new Date(a.date || Date.now()).getTime()).slice(0, 3);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Documents Summary */}
            <SummarySection
                title="Docs"
                icon={FileText}
                count={attachments.length}
                onAdd={onAddDocument}
            >
                {lastDocs.length === 0 ? (
                    <div className="p-6 text-xs text-gray-400 text-center italic flex flex-col items-center gap-1">
                        <FileText size={20} className="opacity-20 mb-1" />
                        Sin documentos
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {lastDocs.map((doc, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50">
                                <span className="text-xs font-medium text-[#111418] truncate flex-1">{doc.name}</span>
                                <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                    {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </SummarySection>

            {/* Payments Summary */}
            <SummarySection
                title="Movimientos"
                icon={Euro}
                count={economicLines.length}
                onAdd={onAddPayment}
            >
                {lastPayments.length === 0 ? (
                    <div className="p-6 text-xs text-gray-400 text-center italic flex flex-col items-center gap-1">
                        <Euro size={20} className="opacity-20 mb-1" />
                        Sin movimientos
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {lastPayments.map((line, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50">
                                <span className="text-xs font-medium text-[#111418] truncate flex-1">{line.concept}</span>
                                <span className={`text-xs font-bold shrink-0 ml-2 ${line.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {line.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </SummarySection>

            {/* Communications/Events Summary */}
            <SummarySection
                title="Eventos"
                icon={History}
                count={communications.length}
                onAdd={onAddEvent}
            >
                {lastComms.length === 0 ? (
                    <div className="p-6 text-xs text-gray-400 text-center italic flex flex-col items-center gap-1">
                        <History size={20} className="opacity-20 mb-1" />
                        Sin eventos
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {lastComms.map((comm, i) => (
                            <div key={i} className="flex items-start gap-2 px-4 py-2 hover:bg-slate-50">
                                <div className="mt-1 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-xs text-[#111418] truncate">{comm.concept || comm.type || '—'}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(comm.date || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SummarySection>
        </div>
    );
};

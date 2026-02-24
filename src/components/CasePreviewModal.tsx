import React from 'react';
import { User, Briefcase, Car, CreditCard, MessageSquare, CheckSquare, ArrowRight } from 'lucide-react';
import { HeaderActions } from './ui/HeaderActions';
import { CaseRecord, getCaseStatusBadgeColor } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    caseRecord: CaseRecord;
    onOpen?: () => void; // Navigate to full record
}

const CasePreviewModal: React.FC<Props> = ({ isOpen, onClose, caseRecord, onOpen }) => {
    if (!isOpen) return null;

    const {
        fileNumber,
        client,
        clientSnapshot,
        vehicle,
        economicData,
        status,
        createdAt,
        closedAt,
        tasks = [],
        communications = []
    } = caseRecord;

    const clientName = clientSnapshot?.nombre || client.nombre || `${client.firstName || ''} ${client.surnames || ''}`.trim() || 'Sin Titular';
    const clientDoc = clientSnapshot?.documento || client.nif || '—';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col font-sans border border-white/20 select-text">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-none">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide leading-none mb-1">Vista Previa Expediente</h3>
                            <div className="text-[11px] font-mono text-slate-500 font-medium tracking-wide flex items-center gap-2">
                                {fileNumber}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest border ${getCaseStatusBadgeColor(status)}`}>
                                    {status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <HeaderActions
                        onPrint={() => window.print()}
                        onClose={onClose}
                    />
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Section 1: Client & Vehicle */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Client Card */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative group hover:border-indigo-100 transition-colors">
                            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-indigo-200 transition-colors">
                                <User size={18} />
                            </div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cliente</span>
                            <div className="font-semibold text-slate-900 text-base leading-snug pr-6">{clientName || 'Sin Titular'}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">{clientDoc || '—'}</div>
                            <div className="mt-3 flex flex-col gap-1 text-xs text-slate-600">
                                {client.phone && <div>{client.phone}</div>}
                                {client.email && <div className="truncate" title={client.email}>{client.email}</div>}
                            </div>
                        </div>

                        {/* Vehicle Card */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative group hover:border-indigo-100 transition-colors">
                            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-indigo-200 transition-colors">
                                <Car size={18} />
                            </div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Vehículo</span>
                            {vehicle?.brand || vehicle?.model ? (
                                <>
                                    <div className="font-semibold text-slate-900 text-base leading-snug pr-6">
                                        {vehicle.brand} {vehicle.model}
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono mt-1">{vehicle.vin || '—'}</div>
                                    <div className="mt-3 text-xs text-slate-600 bg-white inline-block px-2 py-1 rounded border border-slate-200 font-mono">
                                        {vehicle.year || '----'}
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-slate-400 italic py-4">Sin datos de vehículo</div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Economics */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <CreditCard size={14} className="text-slate-400" />
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Datos Económicos</h4>
                        </div>
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            {/* Empty State or Table */}
                            {!economicData?.lines || economicData.lines.length === 0 ? (
                                <div className="p-6 text-center bg-slate-50">
                                    <div className="text-xs text-slate-400 italic">No hay conceptos económicos registrados.</div>
                                    {economicData?.totalAmount > 0 && (
                                        <div className="mt-2 text-sm font-bold text-slate-900">
                                            Total: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(economicData.totalAmount)}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Concepto</th>
                                            <th className="px-4 py-3 text-right">Tipo</th>
                                            <th className="px-4 py-3 text-right">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {economicData.lines.map((line, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 text-slate-700 font-medium">{line.concept}</td>
                                                <td className="px-4 py-3 text-right text-slate-400 uppercase tracking-tighter text-[9px]">{line.type}</td>
                                                <td className="px-4 py-3 text-slate-900 font-mono text-right">
                                                    {line.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-indigo-50/30 text-slate-900 font-bold border-t border-indigo-100">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-widest text-[10px] text-indigo-900">Total Expediente</td>
                                            <td className="px-4 py-3 text-right text-indigo-700 font-mono text-sm">
                                                {economicData.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Tasks & Comms Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Tasks */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckSquare size={14} className="text-slate-400" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Tareas ({tasks.length})</h4>
                            </div>
                            <div className="space-y-2">
                                {tasks.length === 0 ? (
                                    <div className="text-xs text-slate-400 italic pl-1">Sin tareas pendientes.</div>
                                ) : (
                                    tasks.map(task => (
                                        <div key={task.id} className="flex gap-2 items-start p-2 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className={`mt-0.5 w-3 h-3 rounded-full border ${task.isCompleted ? 'bg-emerald-400 border-emerald-400' : 'bg-white border-slate-300'}`} />
                                            <span className={`text-xs ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                {task.text}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Communications */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare size={14} className="text-slate-400" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Comunicaciones  ({communications.length})</h4>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {communications.length === 0 ? (
                                    <div className="text-xs text-slate-400 italic pl-1">No hay comunicaciones registradas.</div>
                                ) : (
                                    communications.map(comm => (
                                        <div key={comm.id} className="text-xs p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                            <div className="font-mono text-[10px] text-slate-400 mb-0.5">
                                                {new Date(comm.date).toLocaleDateString()}
                                            </div>
                                            <div className="text-slate-700 font-medium">
                                                {comm.concept}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Meta */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                        <div>Creado: {new Date(createdAt).toLocaleString()}</div>
                        {closedAt && <div>Cerrado: {new Date(closedAt).toLocaleString()}</div>}
                    </div>

                </div>

                {/* Footer with Actions */}
                {onOpen && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-none">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-white"
                        >
                            Cerrar
                        </button>

                        <button
                            onClick={onOpen}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                            Abrir Expediente
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CasePreviewModal;

import React from 'react';
import { CaseRecord } from '../../types';

interface CasePrintViewProps {
    caseData: CaseRecord;
    fullFileNumber: string;
    managerName?: string;
}

export const CasePrintView: React.FC<CasePrintViewProps> = ({ caseData, fullFileNumber, managerName }) => {
    const { client, economicData, communications, description, clientSnapshot } = caseData;

    return (
        <div className="p-4 font-sans text-slate-900 bg-white w-full print-color-adjust">
            {/* Header */}
            <div className="flex justify-between items-baseline border-b-4 border-slate-900 pb-2 mb-6">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                    Expediente {fullFileNumber}
                </h1>
                <div className="relative">
                    {managerName && (
                        <div className="absolute bottom-full right-0 mb-1 flex items-baseline gap-4 whitespace-nowrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Responsable:</span>
                            <span className="text-sm font-medium text-slate-600">{managerName}</span>
                        </div>
                    )}
                    <div className="flex items-baseline gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Fecha Apertura:</span>
                        <span className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('es-ES')}</span>
                    </div>
                </div>
            </div>

            {/* 1. Datos del Cliente */}
            <div className="mb-8">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 bg-slate-50/50 p-6 rounded-xl border border-slate-100 print-color-adjust">
                    <div className="space-y-4">
                        <div>
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Nombre / Razón Social</span>
                            <p className="text-sm font-bold text-slate-800 uppercase">
                                {clientSnapshot?.nombre || client.nombre || `${client.firstName || ''} ${client.surnames || ''}`.trim() || 'Sin Titular'}
                            </p>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">NIF / NIE</span>
                            <p className="text-sm font-bold text-slate-800 truncate">
                                {client.nif || '—'}
                                <span className="ml-4 font-normal text-slate-400">
                                    <span className="font-semibold text-slate-500 mr-1.5">C/C</span>
                                    {clientSnapshot?.cuentaContable || ''}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Dirección Completa</span>
                            <p className="text-sm text-slate-700 leading-snug">
                                {client.address || '—'}<br />
                                {client.postalCode} {client.city} ({client.province})
                            </p>
                        </div>
                        <div className="flex gap-8">
                            <div>
                                <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Teléfono</span>
                                <p className="text-sm text-slate-700">{client.phone || '—'}</p>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Email</span>
                                <p className="text-sm text-slate-700">{client.email || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Observaciones (Compact Single Line) */}
            <div className="mb-4 break-inside-avoid">
                <div className={`bg-white px-6 py-3 border border-slate-200 rounded-xl italic text-sm truncate ${!description ? 'text-slate-400' : 'text-slate-700'}`}>
                    {description || 'Sin observaciones adicionales registradas.'}
                </div>
            </div>

            {/* 3. Datos Económicos (Side-by-side Detail & Summary) */}
            <div className="mb-8 break-inside-avoid">
                <div className="flex gap-6 items-start">
                    {/* Left: Detailed List */}
                    <div className="flex-[3] border border-slate-300 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-300 print-color-adjust">
                                <tr className="text-left text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                    <th className="px-6 py-2.5">Concepto</th>
                                    <th className="px-6 py-2.5 text-right w-24">Importe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-none">
                                {economicData.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-slate-400 italic text-center text-xs">Sin movimientos económicos registrados</td>
                                    </tr>
                                ) : (
                                    economicData.lines.map((line, idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-2">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-slate-700 font-medium text-xs shrink-0">{line.concept}</span>
                                                    <div className="flex-1 border-b border-dotted border-slate-200 mb-1"></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-2 text-right font-bold text-slate-900 text-xs align-bottom whitespace-nowrap w-32">
                                                {line.amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-900 print-color-adjust">
                                <tr>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 mr-4">Total Importe (IVA Incl.)</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-2xl font-black text-slate-900 whitespace-nowrap">
                                            {economicData.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Right: Summary Box */}
                    <div className="flex-1 bg-slate-50/50 border border-slate-200 rounded-xl p-5 print-color-adjust">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">Resumen</p>
                        <div className="space-y-3">
                            {/* Concepts */}
                            <div className="flex justify-between items-baseline gap-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase shrink-0">Honorarios</span>
                                <div className="flex-1 border-b border-dotted border-slate-200 mb-0.5"></div>
                                <span className="text-xs font-bold text-slate-700 w-20 text-right">
                                    {(economicData.lines
                                        .filter(l => l.concept?.toLowerCase().includes('honorarios') || l.concept?.toLowerCase().includes('gestión') || (l as any).type === 'honorario')
                                        .reduce((sum, l) => sum + (l.amount || 0), 0)
                                    ).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline gap-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase shrink-0">Tasas / Supl.</span>
                                <div className="flex-1 border-b border-dotted border-slate-200 mb-0.5"></div>
                                <span className="text-xs font-bold text-slate-700 w-20 text-right">
                                    {(economicData.lines
                                        .filter(l => !(l.concept?.toLowerCase().includes('honorarios') || l.concept?.toLowerCase().includes('gestión') || (l as any).type === 'honorario'))
                                        .reduce((sum, l) => sum + (l.amount || 0), 0)
                                    ).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline gap-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase shrink-0">IVA (21%)</span>
                                <div className="flex-1 border-b border-dotted border-slate-200 mb-0.5"></div>
                                <span className="text-xs font-bold text-slate-700 w-20 text-right">
                                    {((economicData.lines
                                        .filter(l => l.concept?.toLowerCase().includes('honorarios') || l.concept?.toLowerCase().includes('gestión') || (l as any).type === 'honorario')
                                        .reduce((sum, l) => sum + (l.amount || 0), 0)) * 0.21
                                    ).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </span>
                            </div>

                            {/* Total Line */}
                            <div className="flex justify-between items-baseline gap-2 pt-3 border-t border-slate-300 mt-1">
                                <span className="text-[10px] font-black text-slate-900 uppercase shrink-0">Total</span>
                                <div className="flex-1 border-b border-dotted border-slate-400 mb-0.5"></div>
                                <span className="text-sm font-black text-slate-900 w-24 text-right">
                                    {economicData.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Registro de Comunicaciones (Ultra-Compact Timeline) & Manual Annotations */}
            <div className="flex gap-4 items-stretch break-inside-avoid">
                {/* Communications Box */}
                <div className="shadow-sm rounded-xl border border-slate-200 bg-white overflow-hidden w-fit max-w-[60%] shrink-0">
                    <div className="min-h-full">
                        {([...communications].sort((a, b) => {
                            if (a.date !== b.date) return a.date.localeCompare(b.date);
                            return a.id.localeCompare(b.id);
                        })).map((comm, idx) => (
                            <div key={idx} className="flex items-start gap-8 px-6 py-1.5">
                                <div className="w-20 shrink-0">
                                    <span className="text-[10px] font-bold text-slate-400">{new Date(comm.date).toLocaleDateString('es-ES')}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-medium text-slate-700 leading-tight">{comm.concept}</p>
                                </div>
                            </div>
                        ))}
                        {communications.length === 0 && (
                            <div className="p-6 text-center text-xs italic text-slate-400">
                                No hay comunicaciones registradas para este expediente.
                            </div>
                        )}
                    </div>
                </div>

                {/* Manual Annotations Box (Dynamic width, constant lines) */}
                <div className="flex-1 rounded-xl border border-slate-100 bg-white/50 relative overflow-hidden"
                    style={{ backgroundImage: 'linear-gradient(to bottom, transparent 23px, #f1f5f9 24px)', backgroundSize: '100% 24px' }}>
                    <div className="absolute top-2 left-4">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Anotaciones manuales</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-slate-100 text-[8px] text-slate-400 text-center uppercase tracking-[0.4em]">
                Documento de Uso Interno — AGA Nexus v3.5
            </div>
        </div>
    );
};

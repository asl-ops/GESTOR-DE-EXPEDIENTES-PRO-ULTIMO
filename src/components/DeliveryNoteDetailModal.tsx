import React, { useState } from 'react';
import { Check, Trash2, Calendar, Copy } from 'lucide-react';
import { HeaderActions } from './ui/HeaderActions';
import { DeliveryNote } from '../types/billing';
import { useBilling } from '../hooks/useBilling';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';
import { CopyAction } from './ui/ActionFeedback';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    deliveryNote: DeliveryNote;
    onUpdate: () => void;
}

const DeliveryNoteDetailModal: React.FC<Props> = ({ isOpen, onClose, deliveryNote, onUpdate }) => {
    const { updateDeliveryNoteStatus } = useBilling();
    const [updating, setUpdating] = useState(false);

    // Confirmation modal
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    if (!isOpen) return null;

    const handleAction = async (newStatus: 'invoiced' | 'void') => {
        const isInvoiced = newStatus === 'invoiced';

        const confirmed = await confirm({
            title: isInvoiced ? '¿Marcar como facturado?' : '¿Anular albarán?',
            message: isInvoiced
                ? 'El albarán será marcado como facturado.'
                : 'El albarán será anulado.',
            description: isInvoiced
                ? 'Este albarán quedará registrado como facturado y no aparecerá en la lista de pendientes.'
                : 'El albarán será marcado como anulado y no podrá ser facturado.',
            confirmText: isInvoiced ? 'Marcar Facturado' : 'Anular',
            variant: isInvoiced ? 'success' : 'warning'
        });

        if (!confirmed) return;

        setUpdating(true);
        await updateDeliveryNoteStatus(deliveryNote.id, newStatus);
        setUpdating(false);
        onUpdate();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans border border-white/20">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Detalle de Albarán</h3>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">{deliveryNote.id}</div>
                    </div>
                    <HeaderActions
                        onPrimary={() => handleAction('invoiced')}
                        primaryIcon={Check}
                        primaryTooltip="Marcar como Facturado"
                        isPrimaryLoading={updating}
                        onClose={onClose}
                    />
                </div>

                {/* Body */}
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cliente</span>
                            <div className="font-semibold text-slate-900 text-lg">{deliveryNote.clientName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">
                                {deliveryNote.clientIdentity ? (
                                    <CopyAction text={deliveryNote.clientIdentity}>
                                        <div className="inline-flex items-center gap-1 group/copy">
                                            <span>{deliveryNote.clientIdentity}</span>
                                            <Copy size={11} className="text-slate-300 group-hover/copy:text-sky-500" />
                                        </div>
                                    </CopyAction>
                                ) : (
                                    'Sin documento'
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Expediente</span>
                            <div className="font-semibold text-indigo-600 text-lg">{deliveryNote.expedienteNumero}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1 flex items-center justify-end gap-1">
                                <Calendar size={12} />
                                {new Date(deliveryNote.closedAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Lines Table */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden mb-8">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="px-4 py-3 text-left">Concepto</th>
                                    <th className="px-4 py-3 text-right">Importe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {deliveryNote.lines.map((line, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3 text-slate-700">{line.concept}</td>
                                        <td className="px-4 py-3 text-slate-900 font-mono text-right">
                                            {line.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-indigo-50/30 text-slate-900 font-bold border-t border-indigo-100">
                                <tr>
                                    <td className="px-4 py-3 text-right uppercase tracking-widest text-[10px] text-indigo-900">Total</td>
                                    <td className="px-4 py-3 text-right text-indigo-700 font-mono text-sm">
                                        {deliveryNote.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Meta */}
                    <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                        <div>Creado: {new Date(deliveryNote.createdAt).toLocaleString()}</div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <button
                        onClick={() => handleAction('void')}
                        disabled={updating}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Anular
                    </button>
                </div>
            </div>

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

export default DeliveryNoteDetailModal;

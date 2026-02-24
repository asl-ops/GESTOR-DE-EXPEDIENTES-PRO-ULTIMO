import React, { useState } from 'react';
import { Trash2, Send, Lock, ShieldCheck, Check, FileText, Calendar } from 'lucide-react';
import { HeaderActions } from './ui/HeaderActions';
import { pdf } from '@react-pdf/renderer';
import { Proforma, ProformaStatus } from '../types/billing';
import { useProformas } from '../hooks/useProformas';
import { useCompanySettings } from '../hooks/useCompanySettings';
import ProformaPDFDocument from './ProformaPDFDocument';
import { useConfirmation, confirmVoid, confirmDelete } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    proforma: Proforma;
    onUpdate: () => void;
}

const statusLabels: Record<ProformaStatus, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
    sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-600' },
    accepted: { label: 'Aceptada', color: 'bg-emerald-100 text-emerald-600' },
    rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-600' },
    invoiced: { label: 'Facturada', color: 'bg-indigo-100 text-indigo-600' },
    void: { label: 'Anulada', color: 'bg-slate-200 text-slate-500' }
};

const ProformaDetailModal: React.FC<Props> = ({ isOpen, onClose, proforma, onUpdate }) => {
    const { updateProformaStatus, deleteProforma, issueProforma, loading } = useProformas();
    const { company } = useCompanySettings();
    const [updating, setUpdating] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Confirmation modal
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    if (!isOpen) return null;

    const handleStatusChange = async (newStatus: ProformaStatus) => {
        const actionLabels: Record<string, string> = {
            sent: 'enviar',
            accepted: 'aceptar',
            rejected: 'rechazar',
            invoiced: 'facturar',
            void: 'anular'
        };

        const actionDescriptions: Record<string, string> = {
            sent: 'La proforma será marcada como enviada al cliente.',
            accepted: 'La proforma será marcada como aceptada por el cliente.',
            rejected: 'La proforma será marcada como rechazada.',
            invoiced: 'Se creará una factura a partir de esta proforma.',
            void: 'La proforma será anulada y no tendrá validez.'
        };

        const confirmed = await confirm({
            title: `¿${actionLabels[newStatus].charAt(0).toUpperCase() + actionLabels[newStatus].slice(1)} proforma?`,
            message: `La proforma ${proforma.number || 'borrador'} será ${actionLabels[newStatus]}.`,
            description: actionDescriptions[newStatus],
            confirmText: actionLabels[newStatus].charAt(0).toUpperCase() + actionLabels[newStatus].slice(1),
            variant: newStatus === 'void' || newStatus === 'rejected' ? 'warning' : 'info'
        });

        if (!confirmed) return;

        setUpdating(true);
        await updateProformaStatus(proforma.id, newStatus);
        setUpdating(false);
        onUpdate();
    };

    const handleDelete = async () => {
        // Only allow hard delete for drafts
        if (proforma.status !== 'draft') {
            const confirmed = await confirm({
                ...confirmVoid('proforma'),
                message: `La proforma ${proforma.number} será anulada.`,
                description: 'Esta proforma ya ha sido emitida. Será marcada como anulada pero no se eliminará de la base de datos.'
            });

            if (!confirmed) return;

            setUpdating(true);
            await updateProformaStatus(proforma.id, 'void');
        } else {
            const confirmed = await confirm({
                ...confirmDelete('proforma'),
                message: 'La proforma borrador será eliminada permanentemente.',
                description: 'Esta acción no se puede deshacer. El borrador será eliminado de la base de datos.'
            });

            if (!confirmed) return;

            setUpdating(true);
            await deleteProforma(proforma.id, true);
        }
        setUpdating(false);
        onUpdate();
    };

    const handleIssue = async () => {
        const confirmed = await confirm({
            title: '¿Emitir proforma?',
            message: 'Se asignará un número oficial a esta proforma.',
            description: 'Una vez emitida, la proforma no podrá editarse. Solo podrás anularla o facturarla.',
            confirmText: 'Emitir Proforma',
            variant: 'info'
        });

        if (!confirmed) return;

        setUpdating(true);
        const result = await issueProforma(proforma.id);
        setUpdating(false);
        if (result.success) {
            onUpdate();
        }
    };

    const statusInfo = statusLabels[proforma.status];
    const isLocked = proforma.status !== 'draft';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans border border-white/20">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/30">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                {proforma.number ? `Proforma ${proforma.number}` : 'Proforma (Borrador)'}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">{proforma.id}</div>
                    </div>
                    <HeaderActions
                        onPrint={async () => {
                            setGeneratingPdf(true);
                            try {
                                const blob = await pdf(<ProformaPDFDocument proforma={proforma} company={company} />).toBlob();
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `proforma-${proforma.number || proforma.id.slice(0, 8)}.pdf`;
                                link.click();
                                URL.revokeObjectURL(url);
                            } finally {
                                setGeneratingPdf(false);
                            }
                        }}
                        onPrimary={
                            proforma.status === 'draft' ? handleIssue :
                                proforma.status === 'sent' ? () => handleStatusChange('accepted') :
                                    proforma.status === 'accepted' ? () => handleStatusChange('invoiced') :
                                        () => { }
                        }
                        primaryIcon={
                            proforma.status === 'draft' ? Send :
                                proforma.status === 'sent' ? Check :
                                    proforma.status === 'accepted' ? FileText :
                                        ShieldCheck
                        }
                        primaryTooltip={
                            proforma.status === 'draft' ? 'Emitir Proforma' :
                                proforma.status === 'sent' ? 'Aceptar Proforma' :
                                    proforma.status === 'accepted' ? 'Facturar Proforma' :
                                        'Proforma'
                        }
                        isPrimaryLoading={updating || loading || generatingPdf}
                        onClose={onClose}
                    />
                </div>

                {/* Body */}
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cliente</span>
                            {proforma.clientName ? (
                                <>
                                    <div className="font-semibold text-slate-900 text-lg">{proforma.clientName}</div>
                                    <div className="text-xs text-slate-500 font-mono mt-1">{proforma.clientIdentity || 'Sin documento'}</div>
                                </>
                            ) : (
                                <div className="text-slate-400 italic">Sin cliente asignado</div>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Expediente</span>
                            {proforma.caseNumber ? (
                                <div className="font-semibold text-indigo-600 text-lg">{proforma.caseNumber}</div>
                            ) : (
                                <div className="text-slate-400 italic">Sin expediente</div>
                            )}
                            <div className="text-xs text-slate-500 font-mono mt-1 flex items-center justify-end gap-1">
                                <Calendar size={12} />
                                {new Date(proforma.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Locked Banner */}
                    {isLocked && (
                        <div className="mb-6 px-4 py-3 bg-sky-50 border border-sky-100 rounded-lg flex items-center gap-3">
                            <Lock size={16} className="text-sky-500 shrink-0" />
                            <div>
                                <span className="text-sm text-sky-700">Proforma emitida: edición bloqueada</span>
                                {proforma.status === 'void' && (
                                    <span className="text-xs text-slate-500 block mt-0.5">Esta proforma ha sido anulada</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lines Table */}
                    <div className={`border border-slate-100 rounded-xl overflow-hidden mb-8 ${isLocked ? 'opacity-75' : ''}`}>
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="px-4 py-3 text-left">Concepto</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                                    <th className="px-4 py-3 text-right">Importe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {proforma.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                                            Sin líneas de detalle
                                        </td>
                                    </tr>
                                ) : (
                                    proforma.lines.map((line, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 text-slate-700">{line.concept}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono text-right">{line.quantity}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono text-right">
                                                {line.unitPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                            </td>
                                            <td className="px-4 py-3 text-slate-900 font-mono text-right">
                                                {line.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-amber-50/30 text-slate-900 font-bold border-t border-amber-100">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-widest text-[10px] text-amber-900">Total</td>
                                    <td className="px-4 py-3 text-right text-amber-700 font-mono text-sm">
                                        {proforma.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Notes */}
                    {proforma.notes && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Notas</span>
                            <p className="text-sm text-slate-600">{proforma.notes}</p>
                        </div>
                    )}

                    {/* Meta */}
                    <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                        <div>Creado: {new Date(proforma.createdAt).toLocaleString()}</div>
                        {proforma.updatedAt && (
                            <div>Actualizado: {new Date(proforma.updatedAt).toLocaleString()}</div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={updating}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Trash2 size={14} /> {proforma.status === 'draft' ? 'Eliminar' : 'Anular'}
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {proforma.status === 'sent' && (
                            <button
                                onClick={() => handleStatusChange('rejected')}
                                disabled={updating}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                                Rechazar
                            </button>
                        )}
                    </div>
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

export default ProformaDetailModal;

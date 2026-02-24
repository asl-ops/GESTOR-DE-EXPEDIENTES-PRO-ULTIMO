import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { archiveClient } from '@/services/clientService';
import { Client } from '@/types/client';
import {
    Lock,
    Eye,
    EyeOff,
    UserX,
    Shield,
    ChevronLeft,
    Archive,
    Info,
    CheckCircle2
} from 'lucide-react';
import ClientExplorer from './ClientExplorer';
import ConfirmationModal from './ConfirmationModal';

const ClientDeletion: React.FC = () => {
    const { appSettings } = useAppContext();
    const { addToast } = useToast();

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [_isDeleting, setIsDeleting] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [showFinalConfirm, setShowFinalConfirm] = useState(false);

    const handleArchiveInitiate = () => {
        if (!selectedClient) return;

        if (!password) {
            addToast('Introduce la contraseña de seguridad', 'warning');
            return;
        }

        const storedPassword = appSettings?.deletePassword || '1812';
        if (password !== storedPassword) {
            addToast('Contraseña de administrador incorrecta', 'error');
            setPassword('');
            return;
        }

        setShowFinalConfirm(true);
    };

    const handleArchiveConfirm = async () => {
        if (!selectedClient) return;

        setIsDeleting(true);
        try {
            await archiveClient(selectedClient.id, {
                motivo: motivo || 'Baja operativa solicitada',
                usuario: 'Administrador' // TODO: Get from auth context if available
            });

            addToast(`El cliente "${selectedClient.nombre}" ha sido movido al archivo correctamente`, 'success');

            // Reset
            setSelectedClient(null);
            setPassword('');
            setMotivo('');
            setShowFinalConfirm(false);
        } catch (error) {
            console.error('Error archiving client:', error);
            addToast('Error al archivar el cliente', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!selectedClient) {
        return (
            <div className="flex flex-col h-full gap-4">
                <div className="px-10 pt-8 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                <Archive className="w-4 h-4" />
                            </div>
                            Baja de Clientes
                        </h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            Busca y selecciona el cliente que deseas mover al archivo de bajas operativas.
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modo Seguro</span>
                    </div>
                </div>

                <div className="flex-1 min-h-0 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <ClientExplorer
                        embedded={true}
                        selectionMode={true}
                        onSelect={(client) => setSelectedClient(client)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-10 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Context Header */}
            <div className="mb-10 flex items-center justify-between">
                <button
                    onClick={() => { setSelectedClient(null); setPassword(''); setMotivo(''); }}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-600 transition-all group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Volver al buscador
                </button>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-2">
                        <Shield size={12} />
                        Baja Operativa (Reversible)
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
                {/* Header: Sober Style */}
                <div className="bg-slate-50/80 p-10 border-b border-slate-100 flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[30px] bg-white text-amber-500 flex items-center justify-center shadow-xl shadow-slate-200/50 border border-slate-100 shrink-0">
                        <Archive size={36} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Confirmación de Cierre</h2>
                        <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wider mt-1 leading-relaxed max-w-lg">
                            Esta acción moverá al cliente al archivo de bajas. Dejará de aparecer en la gestión activa pero sus datos históricos se conservarán íntegros.
                        </p>
                    </div>
                </div>

                <div className="p-10 space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Info Section */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente Seleccionado</label>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                        <UserX size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-black text-slate-800 tracking-tight truncate">{selectedClient.nombre}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {selectedClient.documento || 'Sin doc.'} • {selectedClient.tipo}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100 flex gap-4">
                                <Info className="text-amber-500 shrink-0 mt-1" size={18} />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Información importante</p>
                                    <p className="text-[10px] font-bold text-amber-700/70 leading-relaxed uppercase tracking-tight">
                                        El cliente podrá ser consultado y restaurado desde el Panel de Control {' > '} Clientes {' > '} Archivo de Bajas. No se borra ningún dato asociado.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Lock size={14} className="text-sky-500" />
                                    Validación de Seguridad
                                </label>
                                <div className="space-y-6">
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Introduce contraseña admin..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-sky-500 transition-all font-mono"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Motivo de la baja (Opcional)</label>
                                        <input
                                            type="text"
                                            value={motivo}
                                            onChange={(e) => setMotivo(e.target.value)}
                                            placeholder="Ej: Cese de actividad, finalización de contrato..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-sky-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => handleArchiveInitiate()}
                                    disabled={!password}
                                    className="flex-1 bg-amber-500 text-white px-8 py-4 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                                >
                                    <CheckCircle2 size={20} />
                                    Confirmar Baja
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showFinalConfirm}
                onClose={() => setShowFinalConfirm(false)}
                onConfirm={handleArchiveConfirm}
                title="¿Confirmar Baja Operativa?"
                message={`El cliente "${selectedClient.nombre}" dejará de estar disponible en la gestión diaria.`}
                description="Podrás recuperarlo en cualquier momento desde el Archivo de Bajas en Administración."
                confirmText="Archivar Cliente"
                variant="warning"
            />
        </div>
    );
};

export default ClientDeletion;

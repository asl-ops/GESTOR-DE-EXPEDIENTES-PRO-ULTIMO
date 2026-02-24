import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import {
    Archive,
    RotateCcw,
    Trash2,
    Search,
    User,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { CaseRecord, CaseStatus } from '@/types';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';

const Warehouse: React.FC = () => {
    const { caseHistory, saveCase, deleteCase, users } = useAppContext();
    const { addToast } = useToast();
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const deletedCases = useMemo(() => {
        return caseHistory.filter(c => c.status === ('Eliminado' as CaseStatus))
            .filter(c => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return c.fileNumber.toLowerCase().includes(query) ||
                    c.client.nif?.toLowerCase().includes(query) ||
                    (c.client.surnames || '').toLowerCase().includes(query) ||
                    (c.client.firstName || '').toLowerCase().includes(query);
            })
            .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    }, [caseHistory, searchQuery]);

    const totalPages = Math.ceil(deletedCases.length / pageSize);
    const paginatedCases = deletedCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleRestore = async (c: CaseRecord) => {
        try {
            await saveCase({
                ...c,
                status: 'Iniciado',
                updatedAt: new Date().toISOString()
            });
            addToast(`Expediente ${c.fileNumber} restaurado correctamente`, 'success');
        } catch (error) {
            addToast('Error al restaurar el expediente', 'error');
        }
    };

    const handlePermanentDelete = async (c: CaseRecord) => {
        const confirmed = await confirm({
            title: 'Eliminar expediente permanentemente',
            message: `¿Eliminar permanentemente el expediente ${c.fileNumber}?`,
            description: 'Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await deleteCase(c.fileNumber);
            addToast(`Expediente ${c.fileNumber} eliminado permanentemente`, 'success');
        } catch (error) {
            addToast('Error al eliminar permanentemente', 'error');
        }
    };

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex flex-col gap-1.5">
                <h2 className="text-slate-900 text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <Archive className="w-5 h-5" />
                    </div>
                    Almacén de Borrado
                </h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Expedientes eliminados temporalmente del flujo de trabajo</p>
            </div>

            <div className="relative group/search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within/search:text-rose-600" />
                <input
                    type="text"
                    placeholder="Buscar en el almacén por expediente, cliente o NIF..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-inner"
                />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                {paginatedCases.length > 0 ? (
                    paginatedCases.map((c) => (
                        <div key={c.fileNumber} className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center justify-between hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                    <Archive className="w-6 h-6 text-slate-300 group-hover:text-rose-500 transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-slate-900">{c.fileNumber}</span>
                                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest">{c.fileConfig.category}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                                        {c.client.surnames}, {c.client.firstName} • <span className="font-mono text-[10px]">{c.client.nif}</span>
                                    </p>
                                    <div className="flex items-center gap-4 pt-1">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3 h-3 text-slate-300" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">{users.find(u => u.id === c.fileConfig.responsibleUserId)?.name || 'Sin asignar'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-slate-300" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Eliminado el {new Date(c.updatedAt || '').toLocaleDateString('es-ES')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleRestore(c)}
                                    className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-all group/btn"
                                    title="Restaurar expediente"
                                >
                                    <RotateCcw className="w-5 h-5 group-hover/btn:rotate-[-45deg] transition-all" />
                                </button>
                                <button
                                    onClick={() => handlePermanentDelete(c)}
                                    className="p-3 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-all"
                                    title="Eliminar permanentemente"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-40">
                        <div className="size-24 rounded-[40px] bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                            <Archive className="w-10 h-10 text-slate-200" />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Almacén Vacío</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">No hay expedientes eliminados que coincidan con la búsqueda</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Mostrando página {currentPage} de {totalPages}</p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-amber-50 rounded-[32px] p-6 border border-amber-100 flex gap-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                    <h5 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Información de Auditoría</h5>
                    <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed tracking-tight">Los expedientes en el almacén conservan toda su información intacta (historial, documentos, económicos). Al restaurarlos, volverán a su estado anterior como "Iniciado".</p>
                </div>
            </div>
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

export default Warehouse;

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Lock,
    Trash2,
    X,
    UserPlus,
    Archive,
    Settings,
    ShieldAlert,
    RotateCcw
} from 'lucide-react';
import ExpedienteListItem from './ExpedienteListItem';
import { Button } from './ui/Button';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';

interface ResponsibleDashboardProps {
    onSelectCase: (fileNumber: string) => void;
}

const ResponsibleDashboard: React.FC<ResponsibleDashboardProps> = ({ onSelectCase }) => {
    const { caseHistory, users, saveMultipleCases, deleteCase, appSettings, updateSettings, currentUser } = useAppContext();
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedResponsible, setSelectedResponsible] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [situationFilter, setSituationFilter] = useState<string>('all');
    const [onlyUrgent, setOnlyUrgent] = useState(false);

    // Table Selection & Pagination
    const [selectedCases, setSelectedCases] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentView, setCurrentView] = useState<'dashboard' | 'warehouse' | 'settings'>('dashboard');
    const [newDeletePassword, setNewDeletePassword] = useState(appSettings?.deletePassword || '1812');
    const pageSize = 25;

    const isAdmin = currentUser?.role === 'admin';

    // Filter Logic
    const filteredCases = useMemo(() => {
        return caseHistory.filter(c => {
            // Dashboard view filters out 'Eliminado'
            if (currentView === 'dashboard' && c.status === 'Eliminado') return false;
            // Warehouse view only shows 'Eliminado'
            if (currentView === 'warehouse' && c.status !== 'Eliminado') return false;

            const matchesSearch = !searchQuery ||
                c.fileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.clientSnapshot?.nombre || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesResponsible = selectedResponsible === 'all' || c.fileConfig.responsibleUserId === selectedResponsible;
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            const matchesSituation = situationFilter === 'all' || (c.situation || 'Iniciado') === situationFilter;

            const isUrgent = c.situation === 'Detenido' || c.status === 'Urgente';
            const matchesUrgent = !onlyUrgent || isUrgent;

            return matchesSearch && matchesResponsible && matchesStatus && matchesSituation && matchesUrgent;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [caseHistory, searchQuery, selectedResponsible, statusFilter, situationFilter, onlyUrgent, currentView]);

    const paginatedCases = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCases.slice(start, start + pageSize);
    }, [filteredCases, currentPage]);

    const totalPages = Math.ceil(filteredCases.length / pageSize);

    // KPIs calculation
    const kpis = useMemo(() => {
        const assignedToMe = selectedResponsible === 'all' ? filteredCases : filteredCases.filter(c => c.fileConfig.responsibleUserId === selectedResponsible);
        return {
            total: assignedToMe.length,
            pendingDocs: assignedToMe.filter(c => c.status === 'Pendiente Documentación').length,
            inProgress: assignedToMe.filter(c => ['En Tramitación', 'Iniciado'].includes(c.status)).length,
            urgent: assignedToMe.filter(c => c.situation === 'Detenido' || c.status === 'Urgente').length
        };
    }, [filteredCases, selectedResponsible]);

    const handleClearFilters = () => {
        setSearchQuery(''); setSelectedResponsible('all'); setStatusFilter('all'); setSituationFilter('all'); setOnlyUrgent(false);
    };

    const handleBatchRestore = async () => {
        const casesToUpdate = caseHistory.filter(c => selectedCases.includes(c.fileNumber)).map(c => ({
            ...c, status: 'Iniciado', situation: 'Normal', updatedAt: new Date().toISOString()
        }));
        await saveMultipleCases(casesToUpdate);
        setSelectedCases([]);
    };

    const handleBatchPermanentDelete = async () => {
        const confirmed = await confirm({
            title: 'Borrado permanente',
            message: '¿Deseas eliminar permanentemente estos registros?',
            description: 'Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'danger'
        });
        if (!confirmed) return;
        for (const fileNumber of selectedCases) await deleteCase(fileNumber);
        setSelectedCases([]);
    };

    const handleUpdateDeletePassword = async () => {
        await updateSettings({ deletePassword: newDeletePassword });
        alert('Contraseña de eliminación actualizada correctamente.');
    };

    return (
        <div className="flex flex-1 overflow-hidden bg-white">
            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar">
                <div className="flex flex-col gap-6 p-10">

                    {/* Header Action Area */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-slate-900 text-3xl font-normal leading-tight tracking-tight">
                                {currentView === 'dashboard' ? 'Panel Responsable' : currentView === 'warehouse' ? 'Almacén de Borrado' : 'Ajustes de Administración'}
                            </h1>
                            <p className="text-[#4c739a] text-sm font-normal">
                                {currentView === 'dashboard' ? 'Gestiona tus expedientes asignados y realiza su seguimiento.' : currentView === 'warehouse' ? 'Expedientes eliminados temporalmente. Puedes restaurarlos o borrarlos permanentemente.' : 'Configuración de seguridad y parámetros del sistema.'}
                            </p>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                className={`px-4 py-2 rounded-lg text-xs font-normal uppercase tracking-widest transition-all ${currentView === 'dashboard' ? 'bg-white text-[#4c739a] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Panel
                            </button>
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => setCurrentView('warehouse')}
                                        className={`px-4 py-2 rounded-lg text-xs font-normal uppercase tracking-widest transition-all flex items-center gap-2 ${currentView === 'warehouse' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Archive className="w-4 h-4" /> Almacén
                                    </button>
                                    <button
                                        onClick={() => setCurrentView('settings')}
                                        className={`px-4 py-2 rounded-lg text-xs font-normal uppercase tracking-widest transition-all flex items-center gap-2 ${currentView === 'settings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Settings className="w-4 h-4" /> Ajustes
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {currentView === 'settings' ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Seguridad de Borrado</h3>
                                    <p className="text-sm text-slate-500">Configura la contraseña necesaria para mover expedientes al almacén.</p>
                                </div>
                            </div>

                            <div className="max-w-md">
                                <label className="block text-[10px] font-normal text-slate-400 uppercase tracking-widest mb-2 ml-4">Contraseña de Eliminación</label>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newDeletePassword}
                                        onChange={(e) => setNewDeletePassword(e.target.value)}
                                        className="flex-1 px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#4c739a] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-mono text-sm font-normal"
                                    />
                                    <Button
                                        onClick={handleUpdateDeletePassword}
                                        variant="primary"
                                        className="h-12 px-8"
                                    >
                                        Guardar
                                    </Button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-3 font-normal uppercase tracking-widest ml-4">Nota: Esta contraseña será requerida a todos los usuarios para borrar.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Controls Row */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex flex-col min-w-40 flex-1 max-w-[300px]">
                                    <select
                                        value={selectedResponsible}
                                        onChange={(e) => setSelectedResponsible(e.target.value)}
                                        className="block w-full px-4 h-12 border border-[#cfdbe7] rounded-lg bg-slate-50 text-[#0d141b] focus:outline-none focus:ring-0 focus:border-[#cfdbe7] text-base font-normal appearance-none bg-[image:--select-button-svg] bg-[position:right_16px_center] bg-no-repeat"
                                    >
                                        <option value="all">Cualquier Responsable</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 max-w-[480px]">
                                    <div className="relative w-full">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-[#4c739a]" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 h-12 border border-[#cfdbe7] rounded-lg bg-slate-50 text-[#0d141b] placeholder-[#4c739a] focus:outline-none focus:ring-0 focus:border-[#cfdbe7] text-sm font-normal"
                                            placeholder="Buscar por expediente, cliente, matrícula..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* KPI Cards (Only on Dashboard) */}
                            {currentView === 'dashboard' && (
                                <div>
                                    <h3 className="text-slate-900 text-sm font-normal uppercase tracking-widest mb-6 border-l-4 border-sky-400 pl-4">Métricas de Rendimiento</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Total asignados', value: kpis.total },
                                            { label: 'Pendiente documentación', value: kpis.pendingDocs },
                                            { label: 'En tramitación', value: kpis.inProgress },
                                            { label: 'Urgentes / Vencen pronto', value: kpis.urgent },
                                        ].map((kpi, idx) => (
                                            <div key={idx} className="flex flex-col gap-2 rounded-3xl p-6 border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group">
                                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-normal group-hover:text-[#4c739a] transition-colors">{kpi.label}</p>
                                                <p className="text-slate-900 text-2xl font-normal leading-tight tracking-tight">{kpi.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Table View */}
                            <div className="expedientes-table rounded-lg border border-[#cfdbe7] bg-slate-50 shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <th className="px-4 py-3 text-center w-12 app-label border-b app-divider">
                                                    <input
                                                        type="checkbox"
                                                        checked={paginatedCases.length > 0 && paginatedCases.every(c => selectedCases.includes(c.fileNumber))}
                                                        onChange={() => {
                                                            const ids = paginatedCases.map(c => c.fileNumber);
                                                            setSelectedCases(prev => ids.every(id => prev.includes(id)) ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
                                                        }}
                                                        className="h-5 w-5 rounded border-[#cfdbe7] border-2 bg-transparent text-[#4c739a] checked:bg-[#4c739a] checked:border-[#4c739a] focus:ring-0 focus:ring-offset-0 focus:border-[#cfdbe7] focus:outline-none"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left min-w-[140px] app-label border-b app-divider">Expediente</th>
                                                <th className="px-4 py-3 text-left min-w-[200px] app-label border-b app-divider">Cliente</th>
                                                <th className="px-4 py-3 text-left min-w-[140px] app-label border-b app-divider">Situación</th>
                                                <th className="px-4 py-3 text-left min-w-[140px] app-label border-b app-divider">Estado</th>
                                                <th className="px-4 py-3 text-left min-w-[140px] app-label border-b app-divider">Fecha Apertura</th>
                                                <th className="px-4 py-3 text-center w-20 app-label border-b app-divider">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {paginatedCases.map((c) => (
                                                <ExpedienteListItem
                                                    key={c.fileNumber}
                                                    caseRecord={c}
                                                    columnDefs={[]}
                                                    onSelectCase={(cr) => onSelectCase(cr.fileNumber)}
                                                    isSelected={selectedCases.includes(c.fileNumber)}
                                                    onToggleSelection={(id) => setSelectedCases(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Empty State */}
                    {paginatedCases.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-lg border border-dashed border-[#cfdbe7]">
                            <p className="text-[#4c739a] text-base font-normal">No se han encontrado expedientes asignados.</p>
                            <button onClick={handleClearFilters} className="mt-4 text-[#4c739a] font-normal text-sm hover:underline uppercase tracking-widest">Limpiar todos los filtros</button>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-2 py-4">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="flex size-10 items-center justify-center rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-slate-900 text-[10px] font-normal uppercase tracking-widest px-4">Página {currentPage} de {totalPages || 1}</span>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="flex size-10 items-center justify-center rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedCases.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#334e68] text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-8 border border-[#4c739a] z-50 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-3 pr-8 border-r border-[#4c739a]">
                            <span className="bg-[#4c739a] text-white size-7 rounded-full flex items-center justify-center text-xs font-normal">{selectedCases.length}</span>
                            <span className="text-[10px] font-normal uppercase tracking-widest">Seleccionados</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {currentView === 'warehouse' ? (
                                <>
                                    <button onClick={handleBatchRestore} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-[10px] font-normal uppercase tracking-widest text-emerald-300">
                                        <RotateCcw className="w-4 h-4" /> Restaurar
                                    </button>
                                    <button onClick={handleBatchPermanentDelete} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-[10px] font-normal uppercase tracking-widest text-rose-300">
                                        <Trash2 className="w-4 h-4" /> Borrado Permanentemente
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-[10px] font-normal uppercase tracking-widest text-sky-300">
                                        <UserPlus className="w-4 h-4" /> Reasignar
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-[10px] font-normal uppercase tracking-widest text-amber-300">
                                        <Lock className="w-4 h-4" /> Cerrar
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-[10px] font-normal uppercase tracking-widest text-rose-300">
                                        <Trash2 className="w-4 h-4" /> Borrar
                                    </button>
                                </>
                            )}
                            <button onClick={() => setSelectedCases([])} className="ml-4 size-8 flex items-center justify-center hover:bg-[#1a2533] rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
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

            {/* Sidebar Filters */}
            <aside className="w-[320px] border-l border-[#cfdbe7] hidden xl:flex flex-col bg-white overflow-y-auto no-scrollbar">
                <div className="p-10 flex flex-col gap-8">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-slate-900 text-[22px] font-normal leading-tight tracking-tight uppercase tracking-widest">Filtros</h2>
                        <p className="text-[#4c739a] text-sm font-normal">Ajusta la visibilidad de tus expedientes.</p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-400 text-[10px] font-normal uppercase tracking-widest ml-1">Estado</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full px-4 h-14 border border-[#cfdbe7] rounded-lg bg-slate-50 text-[#0d141b] focus:outline-none focus:ring-0 focus:border-[#cfdbe7] text-base font-normal appearance-none bg-[image:--select-button-svg] bg-[position:right_16px_center] bg-no-repeat"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="Iniciado">Iniciado</option>
                                <option value="En Tramitación">En Tramitación</option>
                                <option value="Pendiente Documentación">Pendiente Documentación</option>
                                <option value="Cerrado">Cerrado</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-slate-400 text-[10px] font-normal uppercase tracking-widest ml-1">Situación</label>
                            <select
                                value={situationFilter}
                                onChange={(e) => setSituationFilter(e.target.value)}
                                className="block w-full px-4 h-14 border border-[#cfdbe7] rounded-lg bg-slate-50 text-[#0d141b] focus:outline-none focus:ring-0 focus:border-[#cfdbe7] text-base font-normal appearance-none bg-[image:--select-button-svg] bg-[position:right_16px_center] bg-no-repeat"
                            >
                                <option value="all">Todas las situaciones</option>
                                <option value="Normal">Normal</option>
                                <option value="Urgente">Urgente</option>
                                <option value="Detenido">Detenido</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <span className="text-slate-600 text-[10px] font-normal uppercase tracking-widest">Solo urgentes</span>
                            <button
                                onClick={() => setOnlyUrgent(!onlyUrgent)}
                                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${onlyUrgent ? 'bg-[#4c739a]' : 'bg-[#e7edf3]'}`}
                            >
                                <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${onlyUrgent ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <Button
                        onClick={handleClearFilters}
                        variant="outline"
                        className="w-full h-12"
                    >
                        Limpiar filtros
                    </Button>
                </div>
            </aside>
        </div>
    );
};

export default ResponsibleDashboard;

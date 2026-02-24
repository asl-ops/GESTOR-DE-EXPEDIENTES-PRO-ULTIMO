
import React, { useState, useMemo } from 'react';
import { User, CaseRecord, Task } from '../types';
import { ClipboardListIcon, ArrowLeftIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';

interface AggregatedTask {
    task: Task;
    parentCase: CaseRecord;
}

const UserAvatar: React.FC<{ userId: string; users: User[] }> = ({ userId, users }) => {
    const user = users.find(u => u.id === userId);
    if (!user) return <div className="h-6 w-6 rounded-full bg-slate-300" title="Usuario desconocido"></div>;
    return (
        <span title={user.name} className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full text-white text-xs font-normal border-2 border-white shadow-sm transition-transform hover:scale-110 ${user.avatarColor}`}>{user.initials}</span>
    );
};

interface TasksDashboardProps {
    onUpdateTaskStatus: (fileNumber: string, taskId: string, isCompleted: boolean) => void;
    onGoToCase: (caseRecord: CaseRecord) => void;
    onReturnToDashboard: () => void;
}

const TasksDashboard: React.FC<TasksDashboardProps> = ({ onUpdateTaskStatus, onGoToCase, onReturnToDashboard }) => {
    const { caseHistory, users } = useAppContext();
    const [filterByUserId, setFilterByUserId] = useState<string>('all');

    const pendingTasks: AggregatedTask[] = useMemo(() => {
        const allPendingTasks: AggregatedTask[] = caseHistory.flatMap(c =>
            c.tasks?.filter(t => !t.isCompleted).map(t => ({ task: t, parentCase: c })) || []
        );

        const filtered = filterByUserId === 'all'
            ? allPendingTasks
            : allPendingTasks.filter(item => item.task.assignedToUserId === filterByUserId);

        return filtered.sort((a, b) => new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime());

    }, [caseHistory, filterByUserId]);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex items-center gap-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onReturnToDashboard}
                        title="Volver"
                    >
                        <ArrowLeftIcon className="size-5" />
                    </Button>
                    <div className="p-3 bg-sky-50 rounded-2xl text-[#4c739a]"><ClipboardListIcon /></div>
                    <div>
                        <h1 className="text-3xl font-normal text-slate-900 tracking-tight">Tareas Pendientes</h1>
                        <p className="text-[#4c739a] text-sm font-normal mt-1">Todas las tareas activas de todos los expedientes.</p>
                    </div>
                </header>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="app-label !text-slate-900 !tracking-widest">Tareas Pendientes</h2>
                            <span className="flex items-center justify-center size-6 rounded-full bg-sky-50 text-[#4c739a] text-[10px] font-normal">{pendingTasks.length}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <label htmlFor="user-filter" className="app-label-block !mb-0">Filtrar:</label>
                            <select id="user-filter" value={filterByUserId} onChange={(e) => setFilterByUserId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-4 pr-10 text-xs font-normal focus:ring-2 focus:ring-sky-50 transition-all">
                                <option value="all">Todos los usuarios</option>
                                {users.map(user => (<option key={user.id} value={user.id}>{user.name}</option>))}
                            </select>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50/50 space-y-4">
                        {pendingTasks.length > 0 ? (
                            pendingTasks.map(({ task, parentCase }) => (
                                <div
                                    key={task.id}
                                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-5 hover:shadow-md transition-all group cursor-pointer"
                                    onDoubleClick={() => onGoToCase(parentCase)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={task.isCompleted}
                                        onChange={(e) => onUpdateTaskStatus(parentCase.fileNumber, task.id, e.target.checked)}
                                        className="mt-1 h-6 w-6 rounded-lg border-slate-200 text-[#4c739a] focus:ring-[#4c739a] focus:ring-offset-0 cursor-pointer flex-shrink-0 transition-colors"
                                    />
                                    <div className="flex-grow pt-1">
                                        <p className="text-slate-800 text-sm font-normal leading-relaxed">{task.text}</p>
                                        <div className="text-[10px] text-slate-400 mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><span className="text-[#4c739a]/50 italic">Expediente:</span> <span className="text-slate-600">{parentCase.fileNumber}</span> <span className="text-slate-300">({parentCase.client.surnames})</span></span>
                                            <span className="flex items-center gap-1.5"><span className="text-[#4c739a]/50 italic">Creada:</span> <span className="text-slate-600">{new Date(task.createdAt).toLocaleDateString('es-ES')}</span></span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-3 pr-2">
                                        <UserAvatar userId={task.assignedToUserId} users={users} />
                                        <Button
                                            onClick={() => onGoToCase(parentCase)}
                                            variant="soft"
                                            size="sm"
                                        >
                                            Ver Exp.
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <div className="size-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <ClipboardListIcon />
                                </div>
                                <h3 className="text-lg font-normal text-slate-900 uppercase tracking-widest">¡Todo al día!</h3>
                                <p className="mt-2 text-slate-400 text-sm font-normal">No hay tareas pendientes con el filtro seleccionado.</p>
                            </div>
                        )}
                    </div>
                </div>
                <footer className="text-center mt-12 text-slate-400 text-[10px] font-normal uppercase tracking-widest"><p>&copy; {new Date().getFullYear()} Gestor de Expedientes Pro • Sistema de Tareas v3.2</p></footer>
            </div>
        </div>
    );
};

export default TasksDashboard;

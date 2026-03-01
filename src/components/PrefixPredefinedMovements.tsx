import React, { useEffect, useState } from 'react';
import { Database, GripVertical, Plus, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useConfirmation, confirmDelete } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';
import { EstadoMovimiento, Movimiento, PrefijoMovimiento } from '@/types';
import { getActiveMovimientos } from '@/services/movimientoService';
import {
    addPrefijoMovimiento,
    deletePrefijoMovimiento,
    getPrefijoMovimientos,
    reorderPrefijoMovimientos
} from '@/services/prefijoMovimientoService';

interface PrefixPredefinedMovementsProps {
    prefijoId: string;
}

const PrefixPredefinedMovements: React.FC<PrefixPredefinedMovementsProps> = ({ prefijoId }) => {
    const { addToast } = useToast();
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    const [tasks, setTasks] = useState<PrefijoMovimiento[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [movimientoCatalog, setMovimientoCatalog] = useState<Movimiento[]>([]);
    const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);
    const [dragOverTaskIndex, setDragOverTaskIndex] = useState<number | null>(null);

    const loadTasks = async () => {
        if (!prefijoId) return;
        setLoadingTasks(true);
        try {
            const movements = await getPrefijoMovimientos(prefijoId);
            setTasks(movements);
        } catch (error) {
            addToast('Error al cargar movimientos predefinidos', 'error');
            console.error(error);
        } finally {
            setLoadingTasks(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [prefijoId]);

    const persistTaskOrder = async (orderedTasks: PrefijoMovimiento[]) => {
        if (!prefijoId) return;
        await reorderPrefijoMovimientos(prefijoId, orderedTasks.map(t => t.id));
    };

    const handleAddTask = async () => {
        if (!prefijoId) {
            addToast('Error: Prefijo no cargado correctamente', 'error');
            return;
        }

        if (!movimientoCatalog.length) {
            const catalog = await getActiveMovimientos(prefijoId);
            setMovimientoCatalog(catalog);
        }
        setIsAddingTask(true);
    };

    const handleSelectMovimiento = async (movimiento: Movimiento) => {
        if (!prefijoId) {
            addToast('Error: Prefijo no cargado correctamente', 'error');
            return;
        }

        try {
            const newTask: Omit<PrefijoMovimiento, 'id'> = {
                prefijoId,
                movimientoId: movimiento.id,
                nombre: movimiento.nombre,
                orden: tasks.length + 1,
                importePorDefecto: 0,
                editableEnExpediente: true,
                estadoInicial: 'PENDIENTE' as EstadoMovimiento,
                obligatorio: false,
                categoria: 'OPERATIVO',
                bloqueado: false
            };

            const created = await addPrefijoMovimiento(newTask);
            const nextTasks = [...tasks, created].sort((a, b) => a.orden - b.orden);
            setTasks(nextTasks);
            setIsAddingTask(false);
            addToast('Movimiento añadido', 'success');
        } catch (error) {
            addToast('Error al añadir movimiento', 'error');
            console.error(error);
        }
    };

    const handleDeleteTask = async (task: PrefijoMovimiento) => {
        const confirmed = await confirm({
            ...confirmDelete('movimiento predefinido'),
            message: `¿Eliminar "${task.nombre}" de los movimientos predefinidos?`,
            description: 'El movimiento predefinido será eliminado de este prefijo.'
        });

        if (!confirmed) return;

        try {
            await deletePrefijoMovimiento(task.id);
            await loadTasks();
            addToast('Movimiento eliminado', 'success');
        } catch (error) {
            addToast('Error al eliminar movimiento', 'error');
            console.error(error);
        }
    };

    const handleMoveTask = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= tasks.length) return;

        const nextTasks = [...tasks];
        const task = nextTasks[index];
        const swapTask = nextTasks[targetIndex];

        if (task.categoria === 'OPERATIVO' && swapTask.categoria === 'CABECERA' && direction === 'up') {
            addToast('Los movimientos de sistema deben permanecer al principio', 'warning');
            return;
        }

        [nextTasks[index], nextTasks[targetIndex]] = [nextTasks[targetIndex], nextTasks[index]];
        setTasks(nextTasks);

        try {
            await persistTaskOrder(nextTasks);
        } catch (error) {
            addToast('Error al reordenar', 'error');
            await loadTasks();
        }
    };

    const handleTaskDrop = async (dropIndex: number) => {
        if (draggedTaskIndex === null || draggedTaskIndex === dropIndex) {
            setDraggedTaskIndex(null);
            setDragOverTaskIndex(null);
            return;
        }

        const nextTasks = [...tasks];
        const [draggedTask] = nextTasks.splice(draggedTaskIndex, 1);
        nextTasks.splice(dropIndex, 0, draggedTask);
        setTasks(nextTasks);
        setDraggedTaskIndex(null);
        setDragOverTaskIndex(null);

        try {
            await persistTaskOrder(nextTasks);
        } catch (error) {
            addToast('Error al reordenar', 'error');
            await loadTasks();
        }
    };

    return (
        <>
            <div className="bg-white rounded-[32px] border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                            Movimientos Predefinidos
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Se añadirán automáticamente al crear un expediente con este prefijo
                        </p>
                    </div>
                    <Button
                        onClick={handleAddTask}
                        icon={Plus}
                        size="sm"
                        variant="success"
                        disabled={!prefijoId}
                    >
                        Añadir Movimiento
                    </Button>
                </div>

                {loadingTasks ? (
                    <div className="text-center py-12 text-slate-400">
                        <Database className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
                        <p className="text-sm font-bold">Cargando movimientos predefinidos...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-bold">No hay movimientos predefinidos</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tasks.map((task, index) => {
                            const isDragOver = dragOverTaskIndex === index && draggedTaskIndex !== null;
                            const isDragging = draggedTaskIndex === index;

                            return (
                                <div
                                    key={task.id}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOverTaskIndex(index);
                                    }}
                                    onDrop={() => handleTaskDrop(index)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border group transition-[transform,box-shadow,border-color,background-color] duration-200 ${isDragging
                                            ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100 scale-[1.01]'
                                            : isDragOver
                                                ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100'
                                                : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            icon={ChevronUp}
                                            onClick={() => handleMoveTask(index, 'up')}
                                            disabled={index === 0}
                                            className="h-6 w-6 rounded-lg text-slate-400 hover:text-slate-700"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            icon={ChevronDown}
                                            onClick={() => handleMoveTask(index, 'down')}
                                            disabled={index === tasks.length - 1}
                                            className="h-6 w-6 rounded-lg text-slate-400 hover:text-slate-700"
                                        />
                                    </div>

                                    {/* Native draggable handle needs direct button element for consistent drag events */}
                                    <button
                                        type="button"
                                        draggable
                                        onDragStart={() => {
                                            setDraggedTaskIndex(index);
                                            setDragOverTaskIndex(index);
                                        }}
                                        onDragEnd={() => {
                                            setDraggedTaskIndex(null);
                                            setDragOverTaskIndex(null);
                                        }}
                                        className="p-1 text-slate-300 hover:text-sky-600 cursor-grab active:cursor-grabbing"
                                        title="Arrastrar para reordenar"
                                    >
                                        <GripVertical className="w-4 h-4" />
                                    </button>

                                    <div className="flex-1">
                                        <span className="text-sm font-bold text-slate-900">{task.nombre}</span>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        icon={Trash2}
                                        onClick={() => handleDeleteTask(task)}
                                        className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {isAddingTask && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-slate-50 rounded-[24px] border-2 border-sky-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Movimientos Disponibles</h4>
                                    <p className="text-xs text-slate-400 mt-1">Selecciona un movimiento para añadir a la lista</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    icon={X}
                                    onClick={() => setIsAddingTask(false)}
                                    className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-600"
                                    title="Cerrar"
                                />
                            </div>

                            {movimientoCatalog.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm font-bold">No hay movimientos disponibles en el catálogo</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                                    {movimientoCatalog.map(mov => (
                                        <button
                                            key={mov.id}
                                            onClick={() => handleSelectMovimiento(mov)}
                                            className="w-full text-left p-4 bg-white hover:bg-sky-50 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-bold text-slate-900 group-hover:text-sky-700">{mov.nombre}</span>
                                                    <span className="text-xs text-slate-400 ml-2">({mov.codigo})</span>
                                                </div>
                                                <Plus className="w-4 h-4 text-slate-300 group-hover:text-sky-600" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
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
        </>
    );
};

export default PrefixPredefinedMovements;

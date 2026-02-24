
import React, { useState } from 'react';
import { Task, User, FileConfig, AttachedDocument, Client } from '../types';
import { suggestTasks } from '../services/geminiService';
import TaskSuggestionModal from './TaskSuggestionModal';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import { CheckSquare, Sparkles, Plus, Trash2, RefreshCcw, Check, CheckCircle } from 'lucide-react';

interface TasksSectionProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  currentUser: User;
  caseResponsibleUserId: string;
  attachments: AttachedDocument[];
  fileConfig: FileConfig;
  client: Client;
}

const TasksSection: React.FC<TasksSectionProps> = ({ tasks = [], setTasks, users = [], currentUser, caseResponsibleUserId, attachments, fileConfig }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [assignedTo, setAssignedTo] = useState(caseResponsibleUserId);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      isCompleted: false,
      assignedToUserId: assignedTo,
      createdByUserId: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
    setAssignedTo(caseResponsibleUserId);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  const handleRemoveTask = (taskId: string) => {
    setTaskToDeleteId(taskId);
  };

  const confirmDeleteTask = () => {
    if (taskToDeleteId) {
      setTasks(prev => prev.filter(task => task.id !== taskToDeleteId));
      setTaskToDeleteId(null);
    }
  };

  const getCreationInfo = (task: Task) => {
    const creator = users.find(u => u.id === task.createdByUserId);
    const date = new Date(task.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    return `Creada por ${creator?.initials || '??'} el ${date}`;
  };

  const handleSuggestTasks = async () => {
    setIsSuggesting(true);
    try {
      const attachmentNames = attachments.map(a => a.name);
      const results = await suggestTasks(fileConfig.fileType, attachmentNames, tasks);
      if (results.length > 0) {
        setSuggestions(results);
      } else {
        addToast('La IA no encontró nuevas tareas que sugerir.', 'info');
      }
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddSuggestedTasks = (tasksToAdd: string[]) => {
    const newTasks: Task[] = tasksToAdd.map(text => ({
      id: `task-${Date.now()}-${Math.random()}`,
      text,
      isCompleted: false,
      assignedToUserId: caseResponsibleUserId,
      createdByUserId: currentUser.id,
      createdAt: new Date().toISOString(),
    }));
    setTasks(prev => [...newTasks, ...prev]);
    addToast(`${newTasks.length} tarea(s) sugerida(s) añadida(s).`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#111418] text-base font-bold flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-500" /> Tareas del Expediente
        </h3>
        <button
          onClick={handleSuggestTasks}
          disabled={isSuggesting}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50"
        >
          {isSuggesting ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Sugerir con IA
        </button>
      </div>

      <div className="bg-[#f8f9fa] border border-[#f0f2f4] rounded-2xl p-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <textarea
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              placeholder="¿Qué falta por hacer?..."
              className="w-full bg-white border border-[#dbe0e6] rounded-xl p-4 text-sm font-medium text-[#111418] outline-none focus:border-[#1380ec] transition-all resize-none h-20"
            />
          </div>
          <button
            onClick={handleAddTask}
            disabled={!newTaskText.trim()}
            className="w-12 h-12 flex items-center justify-center bg-[#1380ec] text-white rounded-xl hover:bg-blue-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-4 border-t border-[#f0f2f4] pt-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable:</span>
          <div className="flex items-center gap-2">
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="bg-transparent border-none p-0 text-xs font-bold text-[#111418] focus:ring-0 cursor-pointer"
            >
              {users?.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {tasks?.map(task => (
          <div key={task.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${task.isCompleted ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-[#f0f2f4] hover:shadow-sm'}`}>
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => handleToggleTask(task.id)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#dbe0e6] text-transparent hover:border-emerald-500'}`}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1">
                <p className={`text-sm font-bold ${task.isCompleted ? 'text-[#617589] line-through' : 'text-[#111418]'}`}>{task.text}</p>
                <p className="text-[10px] font-medium text-[#617589] uppercase tracking-tighter mt-0.5">{getCreationInfo(task)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div title={`Asignado a: ${users.find(u => u.id === task.assignedToUserId)?.name}`} className={`w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 uppercase border border-slate-200`}>
                {users.find(u => u.id === task.assignedToUserId)?.initials || '??'}
              </div>
              <button
                onClick={() => handleRemoveTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {tasks?.length === 0 && (
          <div className="py-12 border-2 border-dashed border-[#f0f2f4] rounded-2xl flex flex-col items-center justify-center space-y-3">
            <CheckCircle className="w-8 h-8 text-slate-200" />
            <p className="text-sm font-medium text-slate-400 italic">No hay tareas pendientes</p>
            <button onClick={() => setSuggestions([])} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">+ Crear Primera Tarea</button>
          </div>
        )}
      </div>

      <TaskSuggestionModal
        isOpen={!!suggestions}
        suggestions={suggestions || []}
        onClose={() => setSuggestions(null)}
        onAddTasks={handleAddSuggestedTasks}
      />

      <ConfirmationModal
        isOpen={!!taskToDeleteId}
        onClose={() => setTaskToDeleteId(null)}
        onConfirm={confirmDeleteTask}
        title="Eliminar tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default TasksSection;

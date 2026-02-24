import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, Plus, Trash2, ChevronDown, Check, Star, Globe, Lock, MoreVertical } from 'lucide-react';
import { useSavedViews } from '@/hooks/useSavedViews';
import { ViewType, SavedViewFilters, SavedView } from '@/types/savedView';
import { cn } from '@/utils/cn';
import * as LucideIcons from 'lucide-react';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from '@/components/ConfirmationModal';

interface SavedViewSelectorProps {
    viewType: ViewType;
    currentFilters: SavedViewFilters;
    onApplyFilters: (filters: SavedViewFilters, viewId: string) => void;
    className?: string;
}

export const SavedViewSelector: React.FC<SavedViewSelectorProps> = ({
    viewType,
    currentFilters,
    onApplyFilters,
    className
}) => {
    const {
        views,
        predefinedViews,
        activeViewId,
        loading,
        createView,
        deleteView,
        applyView,
        togglePin,
        togglePublic
    } = useSavedViews(viewType);

    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newViewName, setNewViewName] = useState('');
    const [showOptionsId, setShowOptionsId] = useState<string | null>(null);
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsSaving(false);
                setShowOptionsId(null);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleApply = async (view: SavedView) => {
        const filters = await applyView(view.id);
        if (filters) {
            onApplyFilters(filters, view.id);
            setIsOpen(false);
        }
    };

    const handleSaveCurrent = async () => {
        if (!newViewName.trim()) return;

        const result = await createView({
            name: newViewName,
            type: viewType,
            filters: currentFilters,
            isPublic: false
        });

        if (result) {
            setIsSaving(false);
            setNewViewName('');
            setIsOpen(false);
        }
    };

    const handleDeleteView = async (view: SavedView) => {
        const confirmed = await confirm({
            title: 'Eliminar vista',
            message: `¿Eliminar vista "${view.name}"?`,
            description: 'Se eliminará la configuración guardada de filtros y columnas.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'danger'
        });
        if (!confirmed) return;
        await deleteView(view.id);
    };

    const getIconComponent = (iconName: string = 'Bookmark') => {
        const Icon = (LucideIcons as any)[iconName] || Bookmark;
        return <Icon className="w-4 h-4" />;
    };

    const activeView = [...predefinedViews, ...views].find(v => v.id === activeViewId);

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {/* Main Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm hover:shadow-md active:scale-95 group",
                    activeViewId
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                )}
                title="Vistas guardadas y favoritos"
            >
                <Bookmark className={cn("w-4 h-4", activeViewId ? "text-indigo-600 fill-indigo-100" : "text-slate-400 group-hover:text-slate-500")} />
                <span className="text-xs font-bold uppercase tracking-wider truncate max-w-[120px]">
                    {activeView ? activeView.name : "Vistas"}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header: Save Current View */}
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        {isSaving ? (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newViewName}
                                    onChange={(e) => setNewViewName(e.target.value)}
                                    placeholder="Nombre de la vista..."
                                    className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveCurrent();
                                        if (e.key === 'Escape') setIsSaving(false);
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveCurrent}
                                        disabled={!newViewName.trim()}
                                        className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => setIsSaving(false)}
                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSaving(true)}
                                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all text-xs font-bold uppercase tracking-wider"
                            >
                                <Plus className="w-4 h-4" />
                                Guardar vista actual
                            </button>
                        )}
                    </div>

                    {/* List of Views */}
                    <div className="max-h-80 overflow-y-auto no-scrollbar py-2">
                        {/* Predefined Views Section */}
                        {predefinedViews.length > 0 && (
                            <div className="mb-2">
                                <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Predefinidas
                                </div>
                                {predefinedViews.map(view => (
                                    <div
                                        key={view.id}
                                        className={cn(
                                            "group flex items-center justify-between px-4 py-2 cursor-pointer transition-colors",
                                            activeViewId === view.id ? "bg-indigo-50" : "hover:bg-slate-50"
                                        )}
                                        onClick={() => handleApply(view)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={cn(
                                                "p-1.5 rounded-lg",
                                                view.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                                    view.color === 'red' ? "bg-red-50 text-red-600" :
                                                        view.color === 'amber' ? "bg-amber-50 text-amber-600" :
                                                            "bg-indigo-50 text-indigo-600"
                                            )}>
                                                {getIconComponent(view.icon)}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className={cn(
                                                    "text-sm",
                                                    activeViewId === view.id ? "font-semibold text-indigo-700" : "text-slate-700 font-normal"
                                                )}>
                                                    {view.name}
                                                </span>
                                                {view.description && (
                                                    <span className="text-[10px] text-slate-400 truncate">
                                                        {view.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {activeViewId === view.id && <Check className="w-4 h-4 text-indigo-600" />}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* User Views Section */}
                        <div>
                            <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                                Mis Vistas
                                {loading && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500" />}
                            </div>

                            {views.length === 0 && !loading ? (
                                <div className="px-5 py-4 text-xs text-slate-400 italic text-center">
                                    No tienes vistas guardadas
                                </div>
                            ) : (
                                views.map(view => (
                                    <div
                                        key={view.id}
                                        className={cn(
                                            "group flex items-center justify-between px-4 py-2 cursor-pointer transition-colors relative",
                                            activeViewId === view.id ? "bg-indigo-50" : "hover:bg-slate-50"
                                        )}
                                        onClick={() => handleApply(view)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={cn(
                                                "p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors",
                                                view.isPinned && "bg-amber-50 text-amber-600"
                                            )}>
                                                {view.isPinned ? <Star className="w-4 h-4 fill-amber-400" /> : <Bookmark className="w-4 h-4" />}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <span className={cn(
                                                    "text-sm",
                                                    activeViewId === view.id ? "font-semibold text-indigo-700" : "text-slate-700 font-normal"
                                                )}>
                                                    {view.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(view.updatedAt).toLocaleDateString()}
                                                    </span>
                                                    {view.isPublic && <Globe className="w-2.5 h-2.5 text-slate-300" />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {activeViewId === view.id && <Check className="w-4 h-4 text-indigo-600 mr-1" />}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowOptionsId(showOptionsId === view.id ? null : view.id);
                                                }}
                                                className="p-1 rounded-md hover:bg-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Options Context Menu */}
                                        {showOptionsId === view.id && (
                                            <div
                                                className="absolute right-4 top-10 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => {
                                                        togglePin(view.id);
                                                        setShowOptionsId(null);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    {view.isPinned ? <Star size={14} className="text-slate-400" /> : <Star size={14} className="text-amber-500 fill-amber-100" />}
                                                    {view.isPinned ? "Desfijar" : "Fijar vista"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        togglePublic(view.id, !view.isPublic);
                                                        setShowOptionsId(null);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    {view.isPublic ? <Lock size={14} /> : <Globe size={14} />}
                                                    {view.isPublic ? "Hacer privada" : "Hacer pública"}
                                                </button>
                                                <div className="h-px bg-slate-50 my-1" />
                                                <button
                                                    onClick={async () => {
                                                        await handleDeleteView(view);
                                                        setShowOptionsId(null);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                    Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
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

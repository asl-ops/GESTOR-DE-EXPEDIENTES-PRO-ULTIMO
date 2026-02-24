
import React, { useState, useEffect, useMemo } from 'react';
import {
    Users,
    UserCheck,
    Briefcase,
    AlertCircle,
    Clock,
    Mail,
    Phone,
    MapPin,
    Plus,
    Trash2,
    Filter,
    FileText,
    Pencil,
    RefreshCw,
    Search
} from 'lucide-react';
import { Client } from '@/types/client';
import { ClientList, ClientListFilter } from '@/types/clientList';
import { getUserClientLists, saveClientList, deleteClientList } from '@/services/clientListService';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { ActionFeedback } from './ui/ActionFeedback';
import ClientListEditorModal from './ClientListEditorModal';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';

interface ClientListManagerPanelProps {
    onSelectView: (viewId: string, filters: ClientListFilter, fields?: any[]) => void;
    currentViewId: string;
    filteredClients: Client[];
    caseCounts: Record<string, number>;
}

const SYSTEM_LISTS: ClientList[] = [
    { id: 'all', name: 'Todos', filters: {}, isSystem: true },
    { id: 'detected', name: 'Detectados (Auto)', filters: { detectedAuto: true }, isSystem: true },
    { id: 'with_cases', name: 'Con Expedientes', filters: { hasExpedientes: true }, isSystem: true },
    { id: 'no_cases', name: 'Sin Expedientes', filters: { hasExpedientes: false }, isSystem: true },
    { id: 'recent', name: 'Activos (7 días)', filters: { activeLastDays: 7 }, isSystem: true },
    { id: 'no_contact', name: 'Sin contacto', filters: { missingContact: true }, isSystem: true },
    { id: 'incomplete_address', name: 'Domicilio incompleto', filters: { incompleteAddress: true }, isSystem: true },
    { id: 'created_30', name: 'Creados últimos 30 días', filters: { createdLastDays: 30 }, isSystem: true },
    { id: 'recent_obs', name: 'Con observaciones recientes', filters: { recentObservationsDays: 30 }, isSystem: true },
];

const ClientListManagerPanel: React.FC<ClientListManagerPanelProps> = ({
    onSelectView,
    currentViewId,
    filteredClients,
    caseCounts: _caseCounts
}) => {
    const { currentUser } = useAppContext();
    const { addToast } = useToast();
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    const [activeTab, setActiveTab] = useState<'system' | 'user'>('system');
    const [filterSearch, setFilterSearch] = useState('');
    const [userLists, setUserLists] = useState<ClientList[]>([]);
    const [loading, setLoading] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingList, setEditingList] = useState<ClientList | undefined>(undefined);
    const [showEmailFeedback, setShowEmailFeedback] = useState(false);
    const [showPhoneFeedback, setShowPhoneFeedback] = useState(false);

    const loadUserLists = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const lists = await getUserClientLists(currentUser.id);
            setUserLists(lists);
        } catch (error) {
            console.error("Error loading lists:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserLists();
    }, [currentUser]);

    const filteredSystemLists = useMemo(() => {
        return SYSTEM_LISTS.filter(l => l.name.toLowerCase().includes(filterSearch.toLowerCase()));
    }, [filterSearch]);

    const filteredUserLists = useMemo(() => {
        return userLists.filter(l => l.name.toLowerCase().includes(filterSearch.toLowerCase()));
    }, [filterSearch, userLists]);

    // Handlers
    const handleSaveList = async (listData: any) => {
        if (!currentUser) return;
        try {
            const newList: ClientList = {
                ...listData,
                id: listData.id || crypto.randomUUID(),
                userId: currentUser.id,
                updatedAt: new Date().toISOString(),
                createdAt: listData.createdAt || new Date().toISOString(),
            };
            await saveClientList(newList);
            await loadUserLists();
            setIsEditorOpen(false);
            addToast('Listado guardado correctamente', 'success');
        } catch (error) {
            addToast('Error al guardar el listado', 'error');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        const confirmed = await confirm({
            title: 'Eliminar listado',
            message: '¿Seguro que deseas eliminar este listado?',
            description: 'Se eliminará la vista guardada y sus filtros asociados.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await deleteClientList(id, currentUser.id);
            await loadUserLists();
            addToast('Listado eliminado', 'info');
        } catch (error) {
            addToast('Error al eliminar el listado', 'error');
        }
    };

    const openNewListModal = () => {
        setEditingList(undefined);
        setIsEditorOpen(true);
    };

    const openEditListModal = (list: ClientList, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingList(list);
        setIsEditorOpen(true);
    };

    const copyEmails = () => {
        const emails = filteredClients.map(c => c.email).filter(Boolean).join(', ');
        if (!emails) return addToast('No hay emails para copiar', 'warning');
        navigator.clipboard.writeText(emails).then(() => {
            setShowEmailFeedback(true);
        });
    };

    const copyPhones = () => {
        const phones = filteredClients.map(c => c.telefono).filter(Boolean).join(', ');
        if (!phones) return addToast('No hay teléfonos para copiar', 'warning');
        navigator.clipboard.writeText(phones).then(() => {
            setShowPhoneFeedback(true);
        });
    };

    const renderListIcon = (id: string, active: boolean) => {
        const props = { size: 16, className: active ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600 transition-colors' };
        switch (id) {
            case 'all': return <Users {...props} />;
            case 'detected': return <UserCheck {...props} />;
            case 'with_cases': return <Briefcase {...props} />;
            case 'no_cases': return <AlertCircle {...props} />;
            case 'recent': return <Clock {...props} />;
            case 'no_contact': return <Phone {...props} />;
            case 'incomplete_address': return <MapPin {...props} />;
            case 'created_30': return <Clock {...props} />;
            case 'recent_obs': return <FileText {...props} />;
            default: return <Filter {...props} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden font-sans">
            {/* Nav Tabs */}
            <div className="flex border-b border-slate-100 shrink-0">
                <button
                    onClick={() => setActiveTab('system')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'system' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Sistema
                    {activeTab === 'system' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />}
                </button>
                <button
                    onClick={() => setActiveTab('user')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'user' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Mis Listas
                    {activeTab === 'user' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />}
                </button>
            </div>

            {/* Local Nav Search */}
            <div className="p-4 shrink-0">
                <div className="relative group/navsearch">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/navsearch:text-sky-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar listado..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-200 transition-all"
                    />
                </div>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
                {activeTab === 'system' ? (
                    filteredSystemLists.map(list => {
                        const isActive = currentViewId === list.id;
                        return (
                            <button
                                key={list.id}
                                onClick={() => onSelectView(list.id, list.filters)}
                                className={`w-full group flex items-center justify-between px-3 py-3 rounded-xl transition-all relative overflow-hidden ${isActive
                                    ? 'bg-sky-50/60 text-sky-700'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-sky-500 rounded-r-full" />
                                )}
                                <div className="flex items-center gap-3">
                                    {renderListIcon(list.id, isActive)}
                                    <span className={`text-[13px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{list.name}</span>
                                </div>
                                {isActive && (
                                    <div className="size-1.5 rounded-full bg-sky-400 shadow-sm" />
                                )}
                            </button>
                        );
                    })
                ) : (
                    <>
                        <button
                            onClick={openNewListModal}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50/50 transition-all text-sm mb-3"
                        >
                            <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                                <Plus size={16} />
                            </div>
                            <span className="font-bold uppercase text-[9px] tracking-widest">Crear Listado</span>
                        </button>

                        {loading ? (
                            <div className="text-center py-8 text-slate-300">
                                <RefreshCw className="animate-spin inline-block" size={20} />
                            </div>
                        ) : filteredUserLists.length === 0 ? (
                            <div className="py-12 text-center px-6">
                                <Filter className="size-8 text-slate-100 mx-auto mb-3" />
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">Sin resultados</p>
                            </div>
                        ) : (
                            filteredUserLists.map(list => {
                                const isActive = currentViewId === list.id;
                                return (
                                    <div
                                        key={list.id}
                                        onClick={() => onSelectView(list.id, list.filters, list.fields)}
                                        className={`group px-3 py-3 rounded-xl cursor-pointer flex items-center justify-between transition-all relative overflow-hidden ${isActive ? 'bg-sky-50/60 text-sky-900' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'}`}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-sky-500 rounded-r-full" />
                                        )}
                                        <div className="flex items-center gap-3 truncate max-w-[170px]">
                                            {renderListIcon(list.id, isActive)}
                                            <span className={`text-[13px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{list.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => openEditListModal(list, e)}
                                                className="size-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-sky-600 transition-all"
                                                title="Editar"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(list.id, e)}
                                                className="size-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </>
                )}
            </div>

            {/* Discreet Secondary Nav Actions */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-50 mt-auto">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Utilidades de Lista</span>
                    <span className="text-[9px] font-bold text-sky-600/50 uppercase tracking-widest">{filteredClients.length} items</span>
                </div>

                <div className="space-y-2">
                    <ActionFeedback label="Emails copiados" active={showEmailFeedback} onClose={() => setShowEmailFeedback(false)} color="sky">
                        <button
                            onClick={copyEmails}
                            disabled={filteredClients.length === 0}
                            className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-sky-600 transition-all text-xs disabled:opacity-30 group"
                        >
                            <div className="size-7 rounded-lg border border-slate-100 bg-white flex items-center justify-center group-hover:border-sky-100 group-hover:shadow-sm transition-all">
                                <Mail size={12} />
                            </div>
                            <span className="font-medium tracking-tight">Copiar Emails</span>
                        </button>
                    </ActionFeedback>

                    <ActionFeedback label="Teléfonos copiados" active={showPhoneFeedback} onClose={() => setShowPhoneFeedback(false)} color="emerald">
                        <button
                            onClick={copyPhones}
                            disabled={filteredClients.length === 0}
                            className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-sky-600 transition-all text-xs disabled:opacity-30 group"
                        >
                            <div className="size-7 rounded-lg border border-slate-100 bg-white flex items-center justify-center group-hover:border-sky-100 group-hover:shadow-sm transition-all">
                                <Phone size={12} />
                            </div>
                            <span className="font-medium tracking-tight">Copiar Teléfonos</span>
                        </button>
                    </ActionFeedback>
                </div>
            </div>

            {/* Editor Modal */}
            {isEditorOpen && (
                <ClientListEditorModal
                    onClose={() => setIsEditorOpen(false)}
                    onSave={handleSaveList}
                    initialData={editingList}
                />
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

export default ClientListManagerPanel;

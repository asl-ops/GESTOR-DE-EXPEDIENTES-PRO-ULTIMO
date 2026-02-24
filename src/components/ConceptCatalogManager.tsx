import React, { useState, useEffect } from 'react';
import { ConceptCatalog, LineType } from '@/types';
import { getConcepts, saveConcept, createConcept, deleteConcept } from '@/services/conceptService';
import { useToast } from '@/hooks/useToast';
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    Info,
    LayoutList,
    Layers,
    ChevronRight,
    Search
} from 'lucide-react';
import { Button } from './ui/Button';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';

const ConceptCatalogManager: React.FC = () => {
    const { addToast } = useToast();
    const [concepts, setConcepts] = useState<ConceptCatalog[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    // Form state
    const [formName, setFormName] = useState('');
    const [formCategory, setFormCategory] = useState<LineType>('honorario');

    useEffect(() => {
        loadConcepts();
    }, []);

    const loadConcepts = async () => {
        setLoading(true);
        try {
            const data = await getConcepts();
            setConcepts(data);
        } catch (error) {
            addToast('Error al cargar conceptos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formName.trim()) {
            addToast('Nombre obligatorio', 'error');
            return;
        }
        try {
            await createConcept(formName.trim(), formCategory);
            addToast('Concepto creado', 'success');
            setFormName('');
            setFormCategory('honorario');
            setIsCreating(false);
            await loadConcepts();
        } catch (error) {
            addToast('Error al crear concepto', 'error');
        }
    };

    const handleEdit = (concept: ConceptCatalog) => {
        setEditingId(concept.id);
        setFormName(concept.name);
        setFormCategory(concept.category);
    };

    const handleSave = async (conceptId: string) => {
        if (!formName.trim()) {
            addToast('Nombre obligatorio', 'error');
            return;
        }
        try {
            const concept = concepts.find(c => c.id === conceptId);
            if (!concept) return;
            await saveConcept({ ...concept, name: formName.trim(), category: formCategory });
            addToast('Actualizado', 'success');
            setEditingId(null);
            await loadConcepts();
        } catch (error) {
            addToast('Error al guardar', 'error');
        }
    };

    const handleDelete = async (conceptId: string) => {
        const confirmed = await confirm({
            title: 'Desactivar concepto',
            message: '¿Desactivar este concepto?',
            description: 'El concepto dejará de aparecer como activo en nuevas operaciones.',
            confirmText: 'Desactivar',
            cancelText: 'Cancelar',
            variant: 'warning'
        });
        if (!confirmed) return;
        try {
            await deleteConcept(conceptId);
            addToast('Desactivado', 'success');
            await loadConcepts();
        } catch (error) {
            addToast('Error al desactivar', 'error');
        }
    };

    const filteredConcepts = concepts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 font-black animate-pulse uppercase tracking-widest text-[10px]">Cargando Catálogo...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Context Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm border border-indigo-100">
                        <LayoutList className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Catálogo de Conceptos</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Defina las partidas de honorarios y suplidos</p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    variant="create"
                    size="lg"
                    icon={Plus}
                >
                    Nuevo Concepto
                </Button>
            </div>

            {/* Creation Card */}
            {isCreating && (
                <div className="bg-white rounded-[32px] border-2 border-indigo-100 p-8 shadow-xl shadow-indigo-500/5 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center"><Plus className="w-4 h-4" /></div>
                            Registrar Nuevo Concepto
                        </h3>
                        <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-indigo-50 rounded-xl transition-all text-slate-400"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre del Concepto</label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="ej. Honorarios Gestión Tráfico"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Categoría Económica</label>
                            <div className="flex bg-slate-100 p-1.5 rounded-[22px] gap-2">
                                <button
                                    onClick={() => setFormCategory('honorario')}
                                    className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${formCategory === 'honorario' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >Honorario</button>
                                <button
                                    onClick={() => setFormCategory('suplido')}
                                    className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${formCategory === 'suplido' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >Suplido</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreating(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            icon={Save}
                        >
                            Guardar y Activar
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Listing Area */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                {/* Internal Search */}
                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3 pl-2">
                        <Search className="w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Buscar concepto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-500 outline-none w-64 placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pr-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {concepts.length} Conceptos activos
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-slate-50/20">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 w-1/2">Nombre del Servicio</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Tipo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredConcepts.map((concept) => (
                                <tr key={concept.id} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="px-8 py-5">
                                        {editingId === concept.id ? (
                                            <input
                                                type="text"
                                                value={formName}
                                                onChange={(e) => setFormName(e.target.value)}
                                                className="w-full bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all font-sans"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    <Layers className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{concept.name}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        {editingId === concept.id ? (
                                            <select
                                                value={formCategory}
                                                onChange={(e) => setFormCategory(e.target.value as LineType)}
                                                className="bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                            >
                                                <option value="suplido">Suplido</option>
                                                <option value="honorario">Honorario</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-flex px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ring-1 ring-inset ${concept.category === 'suplido'
                                                ? 'bg-sky-50 text-sky-700 ring-sky-200'
                                                : 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                                                }`}>
                                                {concept.category}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${concept.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${concept.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {concept.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        {editingId === concept.id ? (
                                            <div className="flex justify-end gap-2 animate-in zoom-in-90">
                                                <button onClick={() => handleSave(concept.id)} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-90"><Save className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingId(null)} className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all active:scale-90"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(concept)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(concept.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"><Trash2 className="w-4 h-4" /></button>
                                                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-300 transition-colors ml-2" />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredConcepts.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center justify-center">
                            <Info className="w-12 h-12 text-slate-100 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No se encontraron conceptos</p>
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Prueba con otros términos de búsqueda</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Honorarios Sujetos a IVA</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Suplidos (Gtos. Reembolsables)</span>
                        </div>
                    </div>
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

export default ConceptCatalogManager;

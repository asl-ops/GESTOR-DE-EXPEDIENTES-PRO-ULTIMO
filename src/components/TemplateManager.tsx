import React, { useState, useEffect } from 'react';
import { MandateTemplate, PrefixConfig } from '@/types';
import {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    replaceTemplateFile
} from '@/services/templateService';
import { getPrefixes } from '@/services/prefixService';
import { Button } from './ui/Button';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import {
    Trash2,
    Edit2,
    X,
    Download,
    RefreshCw,
    FileCheck,
    UploadCloud,
    Eye,
    Plus,
    Copy,
    FileText,
    Save,
    Calendar
} from 'lucide-react';
import { CopyAction } from './ui/ActionFeedback';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';

const TemplateManager: React.FC = () => {
    const { currentUser } = useAppContext();
    const { addToast } = useToast();
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    const [templates, setTemplates] = useState<MandateTemplate[]>([]);
    const [prefixes, setPrefixes] = useState<PrefixConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [selectedPrefix, setSelectedPrefix] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Replace file state
    const [replacingFileId, setReplacingFileId] = useState<string | null>(null);
    const [replacementFile, setReplacementFile] = useState<File | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [templatesData, prefixesData] = await Promise.all([getTemplates(), getPrefixes()]);
            setTemplates(templatesData);
            setPrefixes(prefixesData.filter(p => p.isActive));
        } catch (error) {
            addToast('Error al cargar plantillas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                addToast('Solo se permiten archivos DOCX', 'error');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !templateName || !currentUser) {
            addToast('Complete los campos requeridos', 'error');
            return;
        }
        setUploading(true);
        try {
            await createTemplate(templateName, selectedFile, currentUser.id, selectedPrefix || undefined, templateDescription || undefined);
            addToast('Plantilla subida', 'success');
            setTemplateName(''); setTemplateDescription(''); setSelectedPrefix(''); setSelectedFile(null); setShowUploadForm(false);
            await loadData();
        } catch (error: any) {
            addToast(`Error: ${error.message}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveEdit = async (templateId: string) => {
        try {
            await updateTemplate(templateId, { name: editName, description: editDescription });
            addToast('Plantilla actualizada', 'success');
            setEditingId(null);
            await loadData();
        } catch (error) {
            addToast('Error al actualizar', 'error');
        }
    };

    const handleDelete = async (templateId: string) => {
        const confirmed = await confirm({
            title: 'Desactivar plantilla',
            message: '¿Desactivar esta plantilla?',
            description: 'La plantilla quedará inactiva y no se ofrecerá para nuevos mandatos.',
            confirmText: 'Desactivar',
            cancelText: 'Cancelar',
            variant: 'warning'
        });
        if (!confirmed) return;
        try {
            await deleteTemplate(templateId);
            addToast('Desactivada', 'success');
            await loadData();
        } catch (error) {
            addToast('Error al desactivar', 'error');
        }
    };

    const handleDownload = (template: MandateTemplate) => {
        const link = document.createElement('a');
        link.href = template.fileUrl;
        link.download = template.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast(`Descargando ${template.fileName}...`, 'info');
    };

    const handleEdit = (template: MandateTemplate) => {
        setEditingId(template.id);
        setEditName(template.name);
        setEditDescription(template.description || '');
    };

    const handleReplaceFile = (id: string) => {
        setReplacingFileId(id);
    };

    const handleReplacementFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setReplacementFile(file);
    };

    const handleConfirmReplacement = async () => {
        if (!replacingFileId || !replacementFile) return;
        setUploading(true);
        try {
            await replaceTemplateFile(replacingFileId, replacementFile);
            addToast('Archivo actualizado', 'success');
            setReplacingFileId(null); setReplacementFile(null);
            await loadData();
        } catch (error: any) {
            addToast(`Error: ${error.message}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    const getPrefixName = (prefixId?: string) => {
        if (!prefixId) return 'Global';
        const prefix = prefixes.find(p => p.id === prefixId);
        return prefix ? prefix.code : prefixId;
    };

    if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 font-black animate-pulse uppercase tracking-widest text-[10px]">Cargando Plantillas...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-sky-50 rounded-2xl text-sky-600 shadow-sm border border-sky-100">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Plantillas de Mandatos</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Gestión de archivos DOCX autorrellenables</p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    variant="primary"
                    icon={Plus}
                >
                    Nueva Plantilla
                </Button>
            </div>

            {/* Upload Form Card */}
            {showUploadForm && (
                <div className="bg-white rounded-[32px] border-2 border-sky-100 p-8 shadow-xl shadow-sky-500/5 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center"><UploadCloud className="w-4 h-4" /></div>
                            Subir Nueva Plantilla Corporativa
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowUploadForm(false)}
                            className="text-slate-400"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre descriptivo</label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="ej. Mandato de Representación GMAT"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descripción (opcional)</label>
                                <textarea
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-inner resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Vincular a Prefijo</label>
                                <div className="relative">
                                    <select
                                        value={selectedPrefix}
                                        onChange={(e) => setSelectedPrefix(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-inner appearance-none cursor-pointer"
                                    >
                                        <option value="">Global (disponible siempre)</option>
                                        {prefixes.map(p => <option key={p.id} value={p.id}>{p.code} · {p.description}</option>)}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <Save className="w-4 h-4 rotate-180" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Archivo DOCX</label>
                                <div className="relative group/upload">
                                    <input
                                        type="file"
                                        accept=".docx"
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${selectedFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 group-hover/upload:border-sky-200 group-hover/upload:bg-sky-50/30'}`}>
                                        {selectedFile ? (
                                            <>
                                                <FileCheck className="w-8 h-8 text-emerald-500 mb-2" />
                                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{selectedFile.name}</p>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-8 h-8 text-slate-200 mb-2 group-hover/upload:text-sky-400" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/upload:text-sky-600">Click o arrastra para subir .docx</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setShowUploadForm(false)}
                            className="text-slate-400"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleUpload}
                            isLoading={uploading}
                            disabled={!selectedFile || !templateName}
                            icon={Save}
                        >
                            Procesar y Guardar
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Listings */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {templates.map(template => (
                    <div key={template.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all -translate-y-4 group-hover:translate-y-0">
                            <div className="flex gap-2">
                                <button onClick={() => handleDownload(template)} className="p-3 bg-white text-sky-600 rounded-2xl shadow-xl border border-sky-50 hover:bg-sky-600 hover:text-white transition-all"><Download className="w-5 h-5" /></button>
                                <button onClick={() => handleEdit(template)} className="p-3 bg-white text-slate-400 rounded-2xl shadow-xl border border-slate-50 hover:bg-slate-900 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                                <button onClick={() => handleDelete(template.id)} className="p-3 bg-white text-rose-500 rounded-2xl shadow-xl border border-rose-50 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="w-20 h-20 rounded-[28px] bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                <FileText className="w-10 h-10" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${template.prefixId ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {template.prefixId ? getPrefixName(template.prefixId) : 'Uso Global'}
                                    </span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${template.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`}></div>
                                </div>

                                {editingId === template.id ? (
                                    <div className="space-y-4 pr-10">
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-sky-500 rounded-xl px-4 py-2 text-sm font-black text-slate-900 outline-none"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase">Cancelar</button>
                                            <button onClick={() => handleSaveEdit(template.id)} className="p-2 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Aplicar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="text-base font-black text-slate-900 group-hover:text-sky-600 transition-colors uppercase tracking-tight truncate">{template.name}</h4>
                                        <p className="text-xs font-semibold text-slate-400 mt-1 line-clamp-1">{template.description || 'Sin descripción adicional'}</p>
                                    </>
                                )}

                                <div className="mt-6 flex items-center gap-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> 28 Dic 2025</div>
                                    <div className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> 16.5 KB</div>
                                </div>
                            </div>
                        </div>

                        {/* Replace File Logic - Sub-action */}
                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                <FileCheck className="w-3.5 h-3.5" /> {template.fileName}
                            </div>
                            <button
                                onClick={() => handleReplaceFile(template.id)}
                                className="flex items-center gap-2 text-[9px] font-black text-sky-600 uppercase tracking-widest hover:bg-sky-50 px-4 py-2 rounded-xl transition-all"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Actualizar Binario
                            </button>
                        </div>

                        {replacingFileId === template.id && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Reemplazar archivo .docx para "{template.name}"</h3>
                                <div className="w-full max-w-sm space-y-4">
                                    <input type="file" accept=".docx" onChange={handleReplacementFileSelect} className="w-full border-2 border-dashed border-sky-200 rounded-3xl p-10 text-xs font-bold text-center text-sky-600 bg-sky-50/20" />
                                    <div className="flex gap-2">
                                        <button onClick={() => { setReplacingFileId(null); setReplacementFile(null); }} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                                        <button onClick={handleConfirmReplacement} disabled={!replacementFile || uploading} className="flex-1 py-3 bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-sky-600/20">
                                            {uploading ? 'Subiendo...' : 'Confirmar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Guide Section */}
            <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-sky-500 rounded-2xl"><Eye className="w-6 h-6" /></div>
                            <h4 className="text-xl font-black uppercase tracking-tight">Variables del Motor de Combinación</h4>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                            Utilice estas claves exactas con el formato <span className="text-sky-400 font-mono">{`{{VARIABLE}}`}</span> dentro de sus documentos Word. El sistema las sustituirá automáticamente durante la firma.
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {['CLIENT_FULL_NAME', 'CLIENT_NIF', 'CLIENT_ADDRESS', 'GESTOR_NAME', 'GESTOR_DNI', 'VEHICLE_VIN', 'ASUNTO', 'CURRENT_DATE'].map(v => (
                                <CopyAction key={v} text={`{{${v}}}`} label={`Copiado`}>
                                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono text-sky-300 flex items-center justify-between group hover:bg-white/10 transition-all cursor-copy">
                                        {v}
                                        <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-all" />
                                    </div>
                                </CopyAction>
                            ))}
                        </div>
                    </div>
                    <div className="w-48 h-48 bg-white/5 rounded-[40px] border border-white/10 flex flex-col items-center justify-center gap-3 p-8 shrink-0">
                        <FileText className="w-12 h-12 text-sky-400" />
                        <span className="text-[10px] font-black uppercase text-center tracking-widest leading-tight">Motor v2.4 Activo</span>
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

export default TemplateManager;

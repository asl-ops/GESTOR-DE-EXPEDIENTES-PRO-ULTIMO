import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/Button';
import { AttachedDocument } from '../types';
import {
  X,
  Upload,
  Trash2,
  Clipboard,
  Cloud,
  CloudOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Search,
  Eye,
  RefreshCcw,
  Edit2,
  Tag,
  Calendar
} from 'lucide-react';
import { uploadFileToCloud } from '../services/cloudStorageService';
import { useToast } from '../hooks/useToast';
import { useAppContext } from '../contexts/AppContext';
import ConfirmationModal from './ConfirmationModal';

interface AttachedDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: AttachedDocument[];
  setAttachments: React.Dispatch<React.SetStateAction<AttachedDocument[]>>;
  onAddDocuments: (files: File[]) => void;
  fileNumber: string;
}

const AttachedDocumentsModal: React.FC<AttachedDocumentsModalProps> = ({
  isOpen, onClose, attachments, setAttachments, onAddDocuments, fileNumber
}) => {
  const { appSettings } = useAppContext();
  const { addToast } = useToast();

  const [isDragging, setIsDragging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fullSavePath, setFullSavePath] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: '', category: '' });
  const [docToDeleteId, setDocToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && appSettings) {
      const path = appSettings.generalSavePath.endsWith('\\') ? appSettings.generalSavePath : `${appSettings.generalSavePath}\\`;
      setFullSavePath(`${path}${fileNumber}\\`);
    }
  }, [isOpen, appSettings, fileNumber]);

  const handleSync = async () => {
    const localFiles = attachments.filter(doc => doc.status === 'local' && doc.file);
    if (localFiles.length === 0) { addToast('Todo sincronizado.', 'info'); return; }

    setIsSyncing(true);
    addToast(`Sincronizando ${localFiles.length} documentos...`, 'info');

    setAttachments(prev => prev.map(doc => doc.status === 'local' ? { ...doc, status: 'uploading' } : doc));

    const uploadPromises = localFiles.map(doc =>
      uploadFileToCloud(doc.file!, fileNumber)
        .then(downloadURL => ({ id: doc.id, status: 'synced' as const, url: downloadURL }))
        .catch(() => ({ id: doc.id, status: 'error' as const, url: undefined }))
    );

    const results = await Promise.allSettled(uploadPromises);

    setAttachments(prev => {
      const newAttachments = [...prev];
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { id, status, url } = result.value;
          const index = newAttachments.findIndex(d => d.id === id);
          if (index !== -1) { newAttachments[index] = { ...newAttachments[index], status, url }; }
        }
      });
      return newAttachments;
    });

    setIsSyncing(false);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'synced').length;
    if (successCount === localFiles.length) addToast('Sincronización completada.', 'success');
    else addToast(`${successCount}/${localFiles.length} docs sincronizados.`, 'warning');
  };

  const handleRemoveDocument = (docId: string) => {
    setDocToDeleteId(docId);
  };

  const confirmDeleteDocument = () => {
    if (docToDeleteId) {
      setAttachments(prev => prev.filter(d => d.id !== docToDeleteId));
      setDocToDeleteId(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) onAddDocuments(Array.from(e.dataTransfer.files));
  }, [onAddDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) onAddDocuments(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(fullSavePath)
      .then(() => addToast('Ruta copiada.', 'success'))
      .catch(() => addToast('Error al copiar.', 'error'));
  };

  const handleStartEdit = (doc: AttachedDocument) => {
    setEditingId(doc.id);
    setEditForm({
      description: doc.description || '',
      category: doc.category || ''
    });
  };

  const handleSaveEdit = (docId: string) => {
    setAttachments(prev => prev.map(d =>
      d.id === docId ? { ...d, description: editForm.description, category: editForm.category } : d
    ));
    setEditingId(null);
    addToast('Información actualizada.', 'success');
  };

  const filteredAttachments = attachments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'svg'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-indigo-500" />;
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-500" />;
    return <FileIcon className="w-5 h-5 text-slate-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-200 rounded-2xl text-slate-600 shadow-sm"><Upload className="w-6 h-6" /></div>
            <div>
              <h3 className="text-xl font-normal text-slate-900">Repositorio Documental</h3>
              <p className="text-[10px] font-normal text-[#4c739a] uppercase tracking-widest">Sincronización Cloud Activada</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        {/* Search & Stats */}
        <div className="px-8 py-2 flex items-center justify-between shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción o categoría..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {filteredAttachments.length} {filteredAttachments.length === 1 ? 'Documento' : 'Documentos'}
          </p>
        </div>

        {/* Upload Zone */}
        <div className="p-8 pb-4 shrink-0">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative group border-2 border-dashed rounded-[32px] p-6 transition-all duration-300 flex flex-col items-center justify-center gap-2 ${isDragging
              ? 'border-sky-500 bg-sky-50/50 scale-[0.99] shadow-inner'
              : 'border-slate-200 hover:border-sky-200 hover:bg-slate-50/20'
              }`}
          >
            <div className={`p-3 rounded-2xl transition-all duration-300 ${isDragging ? 'bg-sky-500 text-white scale-110 shadow-lg shadow-sky-200' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-sky-500 group-hover:shadow-sm'}`}>
              {isDragging ? <Cloud className="w-6 h-6 animate-bounce" /> : <Upload className="w-6 h-6" />}
            </div>
            <div className="text-center">
              <p className="text-xs font-normal text-slate-700">Arrastra archivos para vincular al expediente</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Upload}
              className="mt-1"
            >
              Examinar Equipo
              <input type="file" multiple className="sr-only" onChange={handleFileChange} />
            </Button>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-8">
          {filteredAttachments.length > 0 ? (
            <div className="bg-slate-50/50 rounded-[32px] border border-slate-100/50 overflow-hidden">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-white/50 sticky top-0 backdrop-blur-sm z-10 transition-all">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Info Documento</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Atributos / Gestión</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Estado</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/30">
                  {filteredAttachments.map((doc) => (
                    <tr key={doc.id} className="group hover:bg-white transition-all">
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:border-sky-100 group-hover:scale-105 transition-all shrink-0">
                            {getFileIcon(doc.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                            <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400 uppercase tracking-tighter font-medium">
                              <span className="flex items-center gap-1"><RefreshCcw className="w-2.5 h-2.5" /> {formatFileSize(doc.size)}</span>
                              <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('es-ES') : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        {editingId === doc.id ? (
                          <div className="space-y-2 animate-in slide-in-from-left-2 duration-200">
                            <input
                              type="text"
                              placeholder="Categoría (ej: DGT, Factura...)"
                              className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-sky-500/20"
                              value={editForm.category}
                              onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                            />
                            <textarea
                              placeholder="Descripción breve del documento..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-sky-500/20 h-16 resize-none"
                              value={editForm.description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingId(null)}
                                className="text-slate-400"
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleSaveEdit(doc.id)}
                              >
                                Guardar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-[200px]">
                            {doc.category ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest mb-1.5">
                                <Tag className="w-2.5 h-2.5" /> {doc.category}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-300 italic block mb-1.5">Sin categoría</span>
                            )}
                            <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed italic">
                              {doc.description || 'Sin descripción adicional...'}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center align-top">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ring-inset transition-all mt-1">
                          {doc.status === 'local' && (
                            <span className="flex items-center gap-2 text-[9px] font-bold text-amber-600 uppercase tracking-widest italic animate-in fade-in zoom-in">
                              <CloudOff className="w-3.5 h-3.5" /> Local
                            </span>
                          )}
                          {doc.status === 'uploading' && (
                            <span className="flex items-center gap-2 text-[9px] font-bold text-sky-600 uppercase tracking-widest animate-pulse">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo
                            </span>
                          )}
                          {doc.status === 'synced' && (
                            <span className="flex items-center gap-2 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Cloud
                            </span>
                          )}
                          {doc.status === 'error' && (
                            <span className="flex items-center gap-2 text-[9px] font-bold text-rose-600 uppercase tracking-widest">
                              <AlertCircle className="w-3.5 h-3.5" /> Error
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="size-8 p-0"
                                title="Ver documento"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => handleStartEdit(doc)}
                            title="Editar descripción/categoría"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="size-8 p-0 hover:text-rose-600 hover:border-rose-200"
                            onClick={() => handleRemoveDocument(doc.id)}
                            title="Eliminar de expediente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-300">
              <div className="p-6 bg-slate-50 rounded-[40px] mb-6">
                <FileIcon className="w-16 h-16 opacity-20" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Bandeja de Ficheros Vacía</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-2">Vinca documentos para tenerlos organizados</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-6 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="text-[9px] font-normal text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Ruta Sugerida Back-Office</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden ring-1 ring-slate-100">
                <input
                  type="text"
                  value={fullSavePath}
                  readOnly
                  className="flex-1 bg-transparent px-4 py-2 text-[10px] font-normal text-slate-500 outline-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPath}
                  className="rounded-none border-l border-slate-100 h-9"
                >
                  <Clipboard className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-slate-400"
              >
                Cerrar
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSync}
                isLoading={isSyncing}
                disabled={filteredAttachments.filter(d => d.status === 'local').length === 0}
                icon={RefreshCcw}
              >
                Consolidar Archivo Digital
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!docToDeleteId}
        onClose={() => setDocToDeleteId(null)}
        onConfirm={confirmDeleteDocument}
        title="Eliminar documento"
        message="¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default AttachedDocumentsModal;
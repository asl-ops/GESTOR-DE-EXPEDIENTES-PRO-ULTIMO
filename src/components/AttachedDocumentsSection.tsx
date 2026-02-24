import React from 'react';
import { PaperClipIcon } from './icons';
import { AttachedDocument } from '../types';
import { Plus, FolderOpen } from 'lucide-react';

interface AttachedDocumentsSectionProps {
  attachments: AttachedDocument[];
  onOpen: () => void;
  onAddDocuments?: (files: File[]) => void;
}

const AttachedDocumentsSection: React.FC<AttachedDocumentsSectionProps> = ({
  attachments,
  onOpen,
  onAddDocuments
}) => {
  const handleFileClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAddDocuments) {
      onAddDocuments(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-sky-200 transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300">
              <PaperClipIcon />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Documentos Adjuntos</h2>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Archivo Digital del Expediente</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-sky-600 transition-all" title="Vincular archivos rápida">
              <Plus className="w-5 h-5" />
              <input type="file" multiple className="sr-only" onChange={handleFileClick} />
            </label>
            <button
              onClick={onOpen}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-sky-600 transition-all"
              title="Abrir Repositorio Documental"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
          </div>
        </div>

        {attachments.length > 0 ? (
          <div className="space-y-3">
            <div className="border-t border-slate-50 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archivos recientes</span>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">{attachments.length} total</span>
              </div>
              <div className="space-y-1.5 max-h-[120px] overflow-hidden relative">
                {attachments.slice(-3).reverse().map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 group/item cursor-pointer" onClick={onOpen}>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/item:bg-sky-400"></div>
                    <p className="text-[11px] text-slate-600 truncate flex-1 group-hover/item:text-slate-900">{doc.name}</p>
                    <span className="text-[9px] text-slate-300 font-mono">{doc.category || 'Doc'}</span>
                  </div>
                ))}
                {attachments.length > 3 && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                )}
              </div>
            </div>

            <button
              onClick={onOpen}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
            >
              Consultar Expediente Digital
            </button>
          </div>
        ) : (
          <div
            onClick={onOpen}
            className="border-2 border-dashed border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50/50 hover:border-sky-100 transition-all"
          >
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Bandeja Vacía</p>
            <span className="text-[9px] text-slate-300 text-center leading-tight">Haz clic para añadir los primeros documentos asociados</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachedDocumentsSection;
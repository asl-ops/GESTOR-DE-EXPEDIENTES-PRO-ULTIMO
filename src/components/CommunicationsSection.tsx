import React, { useState, useRef, useMemo } from 'react';
import { Communication, User } from '../types/index';
import { FileText, Trash2, Plus, Copy, Check } from 'lucide-react';
import { Button } from './ui/Button';
import ConfirmationModal from './ConfirmationModal';

interface CommunicationsSectionProps {
  communications: Communication[];
  setCommunications: React.Dispatch<React.SetStateAction<Communication[]>>;
  currentUser: User;
  users?: User[];
}

const CommunicationsSection: React.FC<CommunicationsSectionProps> = ({
  communications,
  setCommunications,
  currentUser
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [commFecha, setCommFecha] = useState(today);
  const [commDescripcion, setCommDescripcion] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [commToDeleteId, setCommToDeleteId] = useState<string | null>(null);
  const commTextRef = useRef<HTMLTextAreaElement | null>(null);

  const handleCommTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommDescripcion(e.target.value);
    // Auto-resize logic
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const createNewEntry = () => {
    const concept = commDescripcion.trim();
    if (!concept) return;

    const newLine: Communication = {
      id: `comm-${Date.now()}`,
      date: commFecha || today,
      timestamp: new Date().toISOString(),
      concept: concept,
      authorUserId: currentUser.id,
    };

    setCommunications(prev => [...prev, newLine]);
    setCommDescripcion('');
    // Reset textarea height
    if (commTextRef.current) {
      commTextRef.current.style.height = "auto";
    }
  };

  const handleRemoveLine = (id: string) => {
    setCommToDeleteId(id);
  };

  const confirmDelete = () => {
    if (commToDeleteId) {
      setCommunications(prev => prev.filter(comm => comm.id !== commToDeleteId));
      setCommToDeleteId(null);
    }
  };

  const handleCopyComm = (comm: Communication, idx: number) => {
    navigator.clipboard.writeText(comm.concept).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const sortedCommunications = useMemo(() => {
    const list = [...communications];
    list.sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      return sortDir === "asc" ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    });
    return list;
  }, [communications, sortDir]);

  // Helper Styles
  const labelStyle = "app-label-block";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="app-section-header">
        <FileText size={14} className="text-sky-500 opacity-70" />
        <h4 className="app-section-title">Registro de Comunicaciones</h4>
      </div>

      {/* Entry Form - Structured like Client observations */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_160px] gap-3 bg-[#f8fafc] p-4 rounded border border-[#e2e8f0] items-stretch">
        <div className="flex flex-col">
          <label className={labelStyle}>Fecha</label>
          <input
            type="date"
            value={commFecha}
            onChange={(e) => setCommFecha(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-[#cfdbe7] text-xs font-normal text-[#4c739a] focus:border-[#1380ec] outline-none transition-all rounded"
          />
        </div>

        <div className="flex flex-col">
          <label className={labelStyle}>Descripción de la comunicación</label>
          <textarea
            ref={commTextRef}
            value={commDescripcion}
            onChange={handleCommTextChange}
            placeholder="Escriba aquí la comunicación o nota..."
            className="w-full px-3 py-2 bg-white border border-[#cfdbe7] text-sm font-normal text-[#4c739a] focus:border-[#1380ec] outline-none transition-all resize-none rounded overflow-hidden leading-5"
            style={{ minHeight: '40px' }}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-normal text-transparent uppercase select-none mb-1 block">.</label>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 rounded-xl w-full"
            onClick={createNewEntry}
            disabled={!commDescripcion.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir
          </Button>
        </div>
      </div>

      {/* List - Table like format from Clients */}
      <div className="border border-[#e2e8f0] rounded overflow-hidden shadow-sm bg-white">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 bg-[#f1f5f9] p-3 text-[10px] font-medium uppercase tracking-widest text-[#4c739a]">
          <button
            type="button"
            className="flex items-center gap-1 whitespace-nowrap px-2 hover:text-[#1380ec] transition-colors"
            onClick={() => setSortDir(d => (d === "asc" ? "desc" : "asc"))}
          >
            Fecha <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>
          </button>

          <div className="px-2">Descripción</div>

          <div className="whitespace-nowrap px-4 text-center border-l border-slate-200 ml-2">Acciones</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#f1f5f9] max-h-80 overflow-y-auto custom-scrollbar">
          {sortedCommunications.length === 0 ? (
            <div className="p-12 text-center italic">
              <p className="text-sm font-normal text-slate-400">Sin comunicaciones registradas.</p>
              <p className="text-xs text-slate-300 mt-1">Escribe y pulsa Añadir para crear la primera entrada</p>
            </div>
          ) : (
            sortedCommunications.map((comm, idx) => (
              <div
                key={comm.id}
                className="grid grid-cols-[auto_1fr_auto] items-start gap-2 p-3 text-xs group hover:bg-slate-50 transition-colors"
              >
                {/* Date */}
                <div
                  className="whitespace-nowrap px-2 font-medium text-[#4c739a] pt-1"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {new Date(comm.date).toLocaleDateString('es-ES')}
                </div>

                {/* Description */}
                <div className="font-medium text-slate-700 whitespace-pre-wrap leading-relaxed px-2 pt-1">
                  {comm.concept}
                </div>

                {/* Actions */}
                <div className="whitespace-nowrap px-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyComm(comm, idx)}
                    className="text-slate-400 hover:text-blue-600 transition-all p-1.5 rounded hover:bg-blue-50"
                    title="Copiar al portapapeles"
                  >
                    {copiedIdx === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(comm.id)}
                    className="text-slate-400 hover:text-rose-500 transition-all p-1.5 rounded hover:bg-rose-50"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!commToDeleteId}
        onClose={() => setCommToDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar comunicación"
        message="¿Estás seguro de que deseas eliminar este registro de comunicación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default CommunicationsSection;
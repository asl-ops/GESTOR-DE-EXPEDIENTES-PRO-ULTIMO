
import React from 'react';
import { CaseRecord } from '../types';
import { XMarkIcon, ArrowDownTrayIcon } from './icons';
import { generateHermesSolicitudesXml } from '../services/xmlService';
import { useToast } from '../hooks/useToast';
import { useAppContext } from '../contexts/AppContext';

interface HermesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseRecord: CaseRecord;
}

const HermesConfigModal: React.FC<HermesConfigModalProps> = ({ isOpen, onClose, caseRecord }) => {
  const { addToast } = useToast();
  const { appSettings } = useAppContext();
  const { fileNumber, client } = caseRecord;

  if (!isOpen) return null;

  const handleGenerateAndDownload = () => {
    if (!client.nif) {
      addToast('El cliente debe tener un NIF para generar el fichero.', 'error');
      return;
    }
    try {
      const fileContent = generateHermesSolicitudesXml(caseRecord, appSettings?.agency);
      const blob = new Blob([fileContent], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HERMES_SOLICITUD_${fileNumber}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Fichero XML para Hermes generado con éxito.', 'success');
    } catch (error) {
      console.error("Error generating Hermes XML:", error);
      addToast('Error al generar el fichero XML.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Exportar para Hermes</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <XMarkIcon />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Generar Fichero de Importación</h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Esto generará un fichero <code className="bg-slate-200/80 text-sky-800 text-xs px-1.5 py-0.5 rounded font-mono font-medium">.xml</code> con los datos de este expediente, listo para importar en la Plataforma Hermes.
                La estructura y formato del fichero siguen las especificaciones oficiales para la matriculación de vehículos.
              </p>

              <div className="pt-2">
                <button
                  onClick={handleGenerateAndDownload}
                  disabled={!client.nif}
                  className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center shadow-lg shadow-sky-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed group"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
                  <span className="ml-2.5">Generar y Descargar Fichero</span>
                </button>
                {!client.nif && (
                  <div className="flex items-center justify-center mt-4 text-red-500 bg-red-50 py-2 px-3 rounded-lg border border-red-100 animate-pulse">
                    <span className="text-xs font-medium">Se requiere un NIF de cliente para generar el fichero.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HermesConfigModal;
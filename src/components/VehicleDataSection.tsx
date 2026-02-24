import React, { useState, useCallback } from 'react';
import { Vehicle } from '../types';
import { extractVehicleDataFromImage } from '../services/geminiService';
import { Scan, Zap, Loader2, Car, Copy, FileText } from 'lucide-react';
import { CopyAction } from './ui/ActionFeedback';
import { useToast } from '../hooks/useToast';
import SavedVehiclesModal from './SavedVehiclesModal';
import SmartDatePicker from './ui/SmartDatePicker';

interface VehicleDataSectionProps {
  vehicle: Vehicle;
  setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>;
  fileType: string;
  onBatchProcess: (files: File[]) => void;
  isBatchProcessing: boolean;
  onDocumentProcessed: (file: File) => void;
  onGenerateMandate?: () => void;
  onIntegrateHermes?: () => void;
}

const VehicleDataSection: React.FC<VehicleDataSectionProps> = ({
  vehicle, setVehicle, fileType, onBatchProcess, isBatchProcessing,
  onDocumentProcessed, onGenerateMandate, onIntegrateHermes
}) => {
  const { addToast } = useToast();
  const [isLoadingOcr, setIsLoadingOcr] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isMultipleMode = fileType === 'Matriculación Múltiple (mismo titular)';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicle(prev => ({ ...prev, [name]: value }));
  };

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setIsLoadingOcr(true);
    try {
      const extractedData = await extractVehicleDataFromImage(file);
      setVehicle(prev => ({
        ...prev,
        vin: extractedData.vin || prev.vin,
        brand: extractedData.brand || prev.brand,
        model: extractedData.model || prev.model,
        year: extractedData.year || prev.year,
        engineSize: extractedData.engineSize || prev.engineSize,
        fuelType: extractedData.fuelType || prev.fuelType,
      }));
      onDocumentProcessed(file);
      addToast('Datos de la ficha técnica extraídos.', 'success');
    } catch (err: any) {
      addToast(err.message.includes('API Key') ? err.message : 'Error al procesar la ficha técnica.', 'error');
      console.error(err);
    } finally {
      setIsLoadingOcr(false);
    }
  }, [setVehicle, onDocumentProcessed, addToast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (isMultipleMode) onBatchProcess(Array.from(files));
    else processFile(files[0]);
    event.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;
    const validFiles = Array.from(droppedFiles).filter((file: File) => file.type.startsWith('image/') || file.type === 'application/pdf');
    if (validFiles.length === 0) { addToast('Por favor, suelta archivos de imagen o PDF.', 'warning'); return; }
    if (isMultipleMode) onBatchProcess(validFiles);
    else processFile(validFiles[0]);
  };


  const handleSelectAndClose = (selectedVehicle: Vehicle) => {
    setVehicle(selectedVehicle);
    setIsModalOpen(false);
  };

  const isProcessing = isMultipleMode ? isBatchProcessing : isLoadingOcr;


  const [showTechnical, setShowTechnical] = useState(false);

  // Helper for technical inputs
  const TechnicalInput = ({ label, name, placeholder = '', className = '' }: { label: string, name: keyof Vehicle, placeholder?: string, className?: string }) => (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      <input
        type="text"
        name={name}
        value={vehicle[name] as string || ''}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-10 bg-slate-50 border-none rounded-lg px-3 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-50 transition-all outline-none"
      />
    </div>
  );

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-md transition-all duration-300 relative border-2 ${isDragging ? 'border-sky-500 border-dashed' : 'border-transparent'}`}
      onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
    >
      <div className="flex items-center mb-6">
        <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
          <Car size={20} />
        </div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest ml-3">Datos del Vehículo</h2>
      </div>
      {isDragging && <div className="absolute inset-0 bg-sky-100 bg-opacity-50 flex items-center justify-center rounded-xl pointer-events-none z-10"><p className="text-lg font-semibold text-sky-700">{isMultipleMode ? 'Suelta las fichas técnicas aquí' : 'Suelta la ficha técnica aquí'}</p></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {/* Fila 1: VIN + Matrícula */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Nº de Bastidor (VIN)</label>
          <div className="relative group/vin">
            <input
              type="text"
              name="vin"
              value={vehicle.vin}
              onChange={handleChange}
              className="w-full h-11 bg-slate-50 border-none rounded-xl pl-4 pr-12 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all outline-none"
            />
            <CopyAction text={vehicle.vin}>
              <div
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                title="Copiar VIN"
              >
                <Copy size={16} />
              </div>
            </CopyAction>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Matrícula actual</label>
          <input
            type="text"
            name="plate"
            value={vehicle.plate || ''}
            onChange={handleChange}
            placeholder="0000XXX"
            className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all outline-none uppercase font-mono tracking-widest"
          />
        </div>

        {/* Fila 2: Marca + Modelo */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Marca</label>
          <input
            type="text"
            name="brand"
            value={vehicle.brand}
            onChange={handleChange}
            className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Modelo</label>
          <input
            type="text"
            name="model"
            value={vehicle.model}
            onChange={handleChange}
            className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all outline-none"
          />
        </div>

        {/* Fila 3: Fecha + Combustible */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha Matriculación</label>
          <SmartDatePicker
            value={vehicle.year}
            onChange={(val) => setVehicle(prev => ({ ...prev, year: val }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo de combustible</label>
          <select
            name="fuelType"
            value={vehicle.fuelType}
            onChange={(e) => handleChange(e as any)}
            className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all outline-none appearance-none"
          >
            <option value="">Seleccionar...</option>
            <option value="gasolina">Gasolina</option>
            <option value="diésel">Diésel</option>
            <option value="híbrido">Híbrido</option>
            <option value="eléctrico">Eléctrico</option>
            <option value="GLP">GLP</option>
            <option value="GNC">GNC</option>
          </select>
        </div>

        {/* Fila 4: Potencia + Emisiones */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Potencia (kW/CV)</label>
          <input
            type="text"
            name="power"
            value={vehicle.power || ''}
            onChange={handleChange}
            className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Emisiones CO₂ (g/km)</label>
          <input
            type="text"
            name="emissions"
            value={vehicle.emissions || ''}
            onChange={handleChange}
            className="w-full h-11 bg-slate-50 border-none rounded-xl px-4 text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all outline-none"
          />
        </div>
      </div>

      {/* Advanced Technical Data Toggle */}
      <div className="mt-8 border-t border-slate-100 pt-4">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-sky-600 transition-colors uppercase tracking-wider"
        >
          <Zap size={14} className={showTechnical ? 'text-sky-500 fill-sky-500' : ''} />
          Datos Técnicos Avanzados (Ficha Técnica)
        </button>

        {showTechnical && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 animate-in fade-in slide-in-from-top-2 duration-300">

            {/* Bloque 1: Clasificación */}
            <div className="md:col-span-3 pb-2 border-b border-slate-50 mb-2">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Clasificación y Homologación</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <TechnicalInput label="Clasificación (CL)" name="classCode" placeholder="2011" />
                <TechnicalInput label="Tipo (J)" name="type" placeholder="20" />
                <TechnicalInput label="Carrocería (J.2)" name="bodywork" placeholder="BA" />
                <TechnicalInput label="Cat. Homologación" name="euroCategory" placeholder="N1" />
                <TechnicalInput label="Nº Homologación (K)" name="homologationNumber" className="md:col-span-2" />

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha Homologación</label>
                  <SmartDatePicker
                    value={vehicle.homologationDate || ''}
                    onChange={(val) => setVehicle(prev => ({ ...prev, homologationDate: val }))}
                  />
                </div>
              </div>
            </div>

            {/* Bloque 2: Masas y Dimensiones */}
            <div className="md:col-span-3 pb-2 border-b border-slate-50 mb-2">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Masas y Dimensiones</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <TechnicalInput label="Tara (G)" name="tara" placeholder="kg" />
                <TechnicalInput label="Masa Orden Marcha" name="massInOrder" placeholder="kg" />
                <TechnicalInput label="MMA (F.2)" name="mma" placeholder="kg" />
                <TechnicalInput label="MMTA (F.1)" name="technicalMma" placeholder="kg" />

                <TechnicalInput label="Longitud" name="length" placeholder="mm" />
                <TechnicalInput label="Anchura" name="width" placeholder="mm" />
                <TechnicalInput label="Altura" name="height" placeholder="mm" />
                <TechnicalInput label="Distancia Ejes" name="wheelbase" placeholder="mm" />
              </div>
            </div>

            {/* Bloque 3: ITV e Inspección */}
            <div className="md:col-span-3">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Datos ITV</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <TechnicalInput label="Código ITV" name="itvCode" placeholder="BA02" />
                <TechnicalInput label="Nº Serie ITV" name="itvSerialNumber" />
                <TechnicalInput label="Potencia Neta (P.2)" name="maxNetPower" placeholder="kW" />
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Válidez ITV</label>
                  <SmartDatePicker
                    value={vehicle.itvExpiration || ''}
                    onChange={(val) => setVehicle(prev => ({ ...prev, itvExpiration: val }))}
                  />
                </div>
              </div>
            </div>

            {/* Bloque 4: Checkboxes */}
            <div className="md:col-span-3 flex gap-6 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={vehicle.isImported} onChange={(e) => setVehicle(prev => ({ ...prev, isImported: e.target.checked }))} className="rounded text-sky-600 focus:ring-sky-500" />
                <span className="text-xs font-bold text-slate-600 uppercase">Vehículo Importado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={vehicle.isUsed} onChange={(e) => setVehicle(prev => ({ ...prev, isUsed: e.target.checked }))} className="rounded text-sky-600 focus:ring-sky-500" />
                <span className="text-xs font-bold text-slate-600 uppercase">Vehículo Usado</span>
              </label>
            </div>

          </div>
        )}
      </div>
      <div className="mt-6 border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-4">
        <label title="Leer datos desde Ficha Técnica" className="flex-1 relative cursor-pointer group">
          <div className="h-11 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Scan size={18} />}
            <span className="text-[11px] uppercase tracking-wider">
              {isProcessing ? 'Procesando...' : 'Ficha Técnica (OCR)'}
            </span>
          </div>
          <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" disabled={isProcessing} multiple={isMultipleMode} />
        </label>

        <button
          onClick={onGenerateMandate}
          className="flex-1 h-11 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
        >
          <FileText size={18} />
          <span className="text-[11px] uppercase tracking-wider">Generar Mandato</span>
        </button>

        <button
          onClick={onIntegrateHermes || (() => addToast('Integración HERMES-DGT próximamente', 'info'))}
          className="flex-1 h-11 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
        >
          <Zap size={18} />
          <span className="text-[11px] uppercase tracking-wider">Integración HERMES-DGT</span>
        </button>
      </div>
      <SavedVehiclesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleSelectAndClose} />
    </div>
  );
};

export default VehicleDataSection;
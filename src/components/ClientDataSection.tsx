import React, { useState, useCallback } from 'react';
import { Client } from '../types';
import type { Client as ClientV2 } from '@/types/client';
import { extractDataFromImage } from '../services/geminiService';
import { UserIcon, OcrIcon, SpinnerIcon } from './icons';
import { ClientTypeahead } from './ClientTypeahead';
import { useToast } from '../hooks/useToast';

interface ClientDataSectionProps {
  client: Client;
  setClient: React.Dispatch<React.SetStateAction<Client>>;
  onDocumentProcessed: (file: File) => void;
  // 🆕 Nuevos props para cliente centralizado
  clienteId?: string | null;
  setClienteId?: (id: string | null) => void;
  clientSnapshot?: {
    nombre: string;
    documento?: string;
    telefono?: string;
    email?: string;
    cuentaContable?: string;
  } | null;
  setClientSnapshot?: (snapshot: {
    nombre: string;
    documento?: string;
    telefono?: string;
    email?: string;
    cuentaContable?: string;
  } | null) => void;
}

const ClientDataSection: React.FC<ClientDataSectionProps> = ({
  client: _client,  // Mantenido para compatibilidad con props del padre
  setClient,
  onDocumentProcessed,
  clienteId,
  setClienteId,
  clientSnapshot,
  setClientSnapshot,
}) => {
  const { addToast } = useToast();
  const [isLoadingOcr, setIsLoadingOcr] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Determinar el label para ClientTypeahead
  const selectedClientLabel = clientSnapshot
    ? `${clientSnapshot.nombre}${clientSnapshot.documento ? ' · ' + clientSnapshot.documento : ''}`
    : '';

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return;
      setIsLoadingOcr(true);
      try {
        const extractedData = await extractDataFromImage(file);
        setClient((prev) => ({
          ...prev,
          surnames: extractedData.surnames || prev.surnames,
          firstName: extractedData.firstName || prev.firstName,
          nif: extractedData.nif || prev.nif,
          address: extractedData.address || prev.address,
          city: extractedData.city || prev.city,
          province: extractedData.province || prev.province,
          postalCode: extractedData.postalCode || prev.postalCode,
        }));
        onDocumentProcessed(file);
        addToast('Datos extraídos del documento.', 'success');
      } catch (err: any) {
        addToast(
          err.message.includes('API Key') ? err.message : 'Error al procesar el documento.',
          'error'
        );
        console.error(err);
      } finally {
        setIsLoadingOcr(false);
      }
    },
    [setClient, onDocumentProcessed, addToast]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      processFile(file);
    } else {
      addToast('Por favor, suelta un archivo de imagen o PDF.', 'warning');
    }
  };

  const handleSelectClient = (selectedClient: ClientV2) => {
    // Actualizar clienteId + snapshot (sistema nuevo)
    if (setClienteId && setClientSnapshot) {
      setClienteId(selectedClient.id);
      setClientSnapshot({
        nombre: selectedClient.nombre,
        documento: selectedClient.documento || null,
        telefono: selectedClient.telefono || null,
        email: selectedClient.email || null,
        cuentaContable: selectedClient.cuentaContable || null,
      } as any);
    }

    // También actualizar el objeto client antiguo para compatibilidad
    setClient((prev) => ({
      ...prev,
      id: selectedClient.id,
      nif: selectedClient.documento || '',
      nombre: selectedClient.nombre,
      // We keep these for backward compatibility where some components still use them
      surnames: selectedClient.surnames || selectedClient.nombre,
      firstName: selectedClient.firstName || '',
      phone: selectedClient.telefono || '',
      email: selectedClient.email || '',
      // Mantener campos actuales si no hay datos
      address: prev.address,
      city: prev.city,
      province: prev.province,
      postalCode: prev.postalCode,
    }));

    addToast(`Cliente "${selectedClient.nombre}" seleccionado`, 'success');
  };

  const handleClearClient = () => {
    // Limpiar clienteId + snapshot
    if (setClienteId && setClientSnapshot) {
      setClienteId(null);
      setClientSnapshot(null);
    }

    // También limpiar el objeto client antiguo
    setClient({
      id: '',
      nombre: '',
      surnames: '',
      firstName: '',
      nif: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
      email: '',
    });

    addToast('Cliente limpiado', 'info');
  };

  return (
    <div
      className={`relative bg-white p-6 rounded-xl shadow-md transition-all duration-300 border-2 ${isDragging ? 'border-sky-500 border-dashed' : 'border-transparent'
        }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center mb-6">
        <UserIcon />
        <h2 className="text-xl font-bold text-slate-900 ml-3">Datos del Cliente</h2>
      </div>

      {isDragging && (
        <div className="absolute inset-0 bg-sky-100 bg-opacity-50 flex items-center justify-center rounded-xl pointer-events-none z-10">
          <p className="text-lg font-semibold text-sky-700">Suelta el documento aquí</p>
        </div>
      )}

      {/* 🆕 NUEVO: ClientTypeahead para selección de clientes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Buscar Cliente
          <span className="ml-2 text-xs text-slate-500">(Escribe para buscar por nombre o documento)</span>
        </label>
        <ClientTypeahead
          valueClientId={clienteId || null}
          valueLabel={selectedClientLabel}
          placeholder="Escribe el nombre o documento del cliente..."
          onSelect={handleSelectClient}
          onClear={handleClearClient}
          enableQuickCreate={true}
          limit={10}
        />
      </div>

      {/* Mostrar datos del cliente seleccionado (solo lectura) */}
      {clientSnapshot && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-slate-600">Nombre:</span>
              <span className="ml-2 text-slate-900">{clientSnapshot.nombre}</span>
            </div>
            {clientSnapshot.documento && (
              <div>
                <span className="font-medium text-slate-600">Documento:</span>
                <span className="ml-2 text-slate-900">{clientSnapshot.documento}</span>
              </div>
            )}
            {clientSnapshot.telefono && (
              <div>
                <span className="font-medium text-slate-600">Teléfono:</span>
                <span className="ml-2 text-slate-900">{clientSnapshot.telefono}</span>
              </div>
            )}
            {clientSnapshot.email && (
              <div>
                <span className="font-medium text-slate-600">Email:</span>
                <span className="ml-2 text-slate-900">{clientSnapshot.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OCR para extracción rápida (mantener para casos donde no existe el cliente) */}
      <div className="mt-6 border-t border-slate-200 pt-6">
        <p className="text-sm text-slate-600 mb-3">
          O extrae datos de un DNI/NIE/CIF escaneado:
        </p>
        <label
          title="Leer datos desde DNI/CIF"
          className="cursor-pointer bg-sky-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-sky-700 transition-colors w-full sm:w-auto"
        >
          {isLoadingOcr ? <SpinnerIcon /> : <OcrIcon />}
          <span className="ml-2 text-sm">{isLoadingOcr ? 'Procesando...' : 'Leer OCR'}</span>
          <input
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            disabled={isLoadingOcr}
          />
        </label>
        <p className="text-xs text-slate-500 mt-2">
          Sube una imagen del documento para extraer los datos automáticamente
        </p>
      </div>
    </div>
  );
};

export default ClientDataSection;
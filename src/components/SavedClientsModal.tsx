
import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { XMarkIcon } from './icons';
import { Button } from './ui/Button';

interface SavedClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSelect: (client: Client) => void;
}

const SavedClientsModal: React.FC<SavedClientsModalProps> = ({ isOpen, onClose, clients, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const filteredClients = clients.filter(client => {
    const fullName = (client.nombre || `${client.firstName || ''} ${client.surnames || ''}`).toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    return fullName.includes(searchTermLower) || (client.nif || '').toLowerCase().includes(searchTermLower);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4 overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-50 flex-shrink-0">
          <h3 className="app-section-title !text-base !mb-0">Seleccionar Cliente Guardado</h3>
          <button onClick={handleClose} className="text-slate-300 hover:text-slate-600 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="px-8 py-6 flex-shrink-0 bg-slate-50/30">
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos o Identificador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-normal text-slate-700 shadow-sm focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto max-h-80">
          <ul className="divide-y divide-slate-200">
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <li
                  key={client.id}
                  onClick={() => onSelect(client)}
                  className="px-8 py-5 hover:bg-slate-50 cursor-pointer transition-colors duration-150 border-b border-slate-50 last:border-b-0"
                >
                  <p className="text-sm font-normal text-slate-800 uppercase tracking-tight">{client.nombre || `${client.surnames || ''}${client.firstName ? `, ${client.firstName}` : ''}`.trim() || 'Sin Titular'}</p>
                  <div className="app-label !text-slate-400 !lowercase mt-1">
                    <span>{client.nif}</span>
                    <span className="mx-2 opacity-30">|</span>
                    <span>{[client.address, client.city, client.province].filter(Boolean).join(', ')}</span>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-center text-slate-500 p-4">
                {clients.length === 0
                  ? 'No hay clientes guardados.'
                  : 'No se encontraron clientes con ese criterio.'
                }
              </p>
            )}
          </ul>
        </div>
        <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex justify-end">
          <Button variant="ghost" onClick={handleClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

export default SavedClientsModal;
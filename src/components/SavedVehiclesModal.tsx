import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { XMarkIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';

interface SavedVehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (vehicle: Vehicle) => void;
}

const SavedVehiclesModal: React.FC<SavedVehiclesModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { savedVehicles } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const filteredVehicles = savedVehicles.filter(vehicle => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      vehicle.vin.toLowerCase().includes(searchTermLower) ||
      vehicle.brand.toLowerCase().includes(searchTermLower) ||
      vehicle.model.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900">Seleccionar Vehículo Guardado</h3>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon /></button>
        </div>
        <div className="mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder="Buscar por VIN, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto max-h-80">
          <ul className="divide-y divide-slate-200">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map(vehicle => (
                <li
                  key={vehicle.id}
                  onClick={() => onSelect(vehicle)}
                  className="p-4 hover:bg-slate-100 cursor-pointer transition-colors duration-150 rounded-lg"
                >
                  <p className="font-semibold text-slate-800">{vehicle.brand} {vehicle.model}</p>
                  <p className="text-sm text-slate-600 font-mono">{vehicle.vin}</p>
                </li>
              ))
            ) : (
              <p className="text-center text-slate-500 p-4">
                {savedVehicles.length === 0
                  ? 'No hay vehículos guardados.'
                  : 'No se encontraron vehículos con ese criterio.'
                }
              </p>
            )}
          </ul>
        </div>
        <div className="mt-6 flex justify-end flex-shrink-0">
          <Button variant="ghost" onClick={handleClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

export default SavedVehiclesModal;
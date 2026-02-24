import React, { useState } from 'react';
import { Administrator, Client } from '../types';
import { XMarkIcon, PlusIcon, TrashIcon, UserIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';

interface AdministratorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
    onUpdateClient: (updatedClient: Client) => void;
}

const AdministratorsModal: React.FC<AdministratorsModalProps> = ({
    isOpen,
    onClose,
    client,
    onUpdateClient,
}) => {
    const { savedClients } = useAppContext();
    const [newAdmin, setNewAdmin] = useState<Partial<Administrator>>({
        firstName: '',
        surnames: '',
        nif: '',
        position: 'Administrador'
    });
    const [isAdding, setIsAdding] = useState(false);
    const [suggestions, setSuggestions] = useState<Client[]>([]);

    if (!isOpen) return null;

    const calculateDniLetter = (dniNumbers: string): string => {
        if (dniNumbers.length !== 8) return '';
        return 'TRWAGMYFPDXBNJZSQVHLCKE'[parseInt(dniNumbers, 10) % 23];
    };

    const handleNifChange = (value: string) => {
        let processedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

        // Auto-calcular letra si se introducen 8 números
        if (/^\d{8}$/.test(processedValue)) {
            const letter = calculateDniLetter(processedValue);
            processedValue = `${processedValue}-${letter}`;
        } else if (/^\d{8}-$/.test(processedValue)) {
            // Si el usuario borra la letra pero deja el guion, recalcular
            const numbers = processedValue.substring(0, 8);
            const letter = calculateDniLetter(numbers);
            processedValue = `${numbers}-${letter}`;
        }

        setNewAdmin(prev => ({ ...prev, nif: processedValue }));

        // Lógica predictiva (buscar en clientes guardados)
        if (processedValue.length > 2) {
            const lowerCaseValue = processedValue.toLowerCase();
            const filtered = savedClients.filter(c =>
                (c.nif || '').toLowerCase().startsWith(lowerCaseValue)
            );
            setSuggestions(filtered.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion: Client) => {
        setNewAdmin({
            firstName: suggestion.firstName,
            surnames: suggestion.surnames,
            nif: suggestion.nif,
            position: 'Administrador'
        });
        setSuggestions([]);
    };

    const handleAddAdmin = () => {
        if (!newAdmin.firstName || !newAdmin.nif) return;

        // Validación final del NIF antes de añadir
        const nifRegex = /^\d{8}-[A-Z]$/;
        if (nifRegex.test(newAdmin.nif)) {
            const numbers = newAdmin.nif.split('-')[0];
            const letter = newAdmin.nif.split('-')[1];
            const correctLetter = calculateDniLetter(numbers);
            if (letter !== correctLetter) {
                alert(`El NIF introducido es incorrecto. La letra debería ser ${correctLetter}.`);
                return;
            }
        }

        const fullName = `${newAdmin.surnames || ''}, ${newAdmin.firstName || ''}`.trim();
        const admin: Administrator = {
            id: Date.now().toString(),
            nombre: fullName,
            firstName: newAdmin.firstName!,
            surnames: newAdmin.surnames || '',
            nif: newAdmin.nif,
            position: newAdmin.position || 'Administrador'
        };

        const updatedAdministrators = [...(client.administrators || []), admin];
        onUpdateClient({ ...client, administrators: updatedAdministrators });

        // Reset form
        setNewAdmin({ firstName: '', surnames: '', nif: '', position: 'Administrador' });
        setIsAdding(false);
    };

    const handleDeleteAdmin = (adminId: string) => {
        const updatedAdministrators = (client.administrators || []).filter(a => a.id !== adminId);
        onUpdateClient({ ...client, administrators: updatedAdministrators });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <UserIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Administradores</h3>
                            <p className="text-sm text-slate-500">Gestión de representantes legales para {client.firstName} {client.surnames}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* Lista de Administradores */}
                    <div className="space-y-4 mb-8">
                        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Administradores Registrados</h4>

                        {(!client.administrators || client.administrators.length === 0) && (
                            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                <p className="text-slate-500">No hay administradores registrados.</p>
                            </div>
                        )}

                        {client.administrators?.map((admin) => (
                            <div key={admin.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                        {(admin.firstName || '').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{admin.firstName} {admin.surnames}</p>
                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-600">DNI: {admin.nif}</span>
                                            <span>{admin.position}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar administrador"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Formulario de Añadir */}
                    {isAdding ? (
                        <div className="bg-slate-50 p-5 rounded-lg border border-indigo-100 animate-fadeIn">
                            <h4 className="text-sm font-bold text-indigo-900 mb-4">Nuevo Administrador</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="relative">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">DNI/NIE *</label>
                                    <input
                                        type="text"
                                        value={newAdmin.nif}
                                        onChange={e => handleNifChange(e.target.value)}
                                        onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                                        placeholder="12345678X"
                                    />
                                    {suggestions.length > 0 && (
                                        <ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                            {suggestions.map(s => (
                                                <li
                                                    key={s.id}
                                                    onMouseDown={() => handleSuggestionClick(s)}
                                                    className="p-2 hover:bg-indigo-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                                                >
                                                    <div className="font-bold text-slate-800">{s.nif}</div>
                                                    <div className="text-slate-500 text-xs">{s.firstName} {s.surnames}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={newAdmin.firstName}
                                        onChange={e => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nombre"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Apellidos</label>
                                    <input
                                        type="text"
                                        value={newAdmin.surnames}
                                        onChange={e => setNewAdmin({ ...newAdmin, surnames: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Apellidos"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Cargo</label>
                                    <input
                                        type="text"
                                        value={newAdmin.position}
                                        onChange={e => setNewAdmin({ ...newAdmin, position: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Ej: Administrador Único"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddAdmin}
                                    disabled={!newAdmin.firstName || !newAdmin.nif}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar Administrador
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-600 font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Añadir Nuevo Administrador
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdministratorsModal;

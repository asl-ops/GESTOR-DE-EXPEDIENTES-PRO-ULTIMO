
import React, { useState, useEffect } from 'react';
import { X, Check, ArrowUp, ArrowDown } from 'lucide-react';
import type { ClientList, ClientListField } from '@/types/clientList';

interface ClientListEditorModalProps {
    onClose: () => void;
    onSave: (list: Partial<ClientList>) => void;
    initialData?: ClientList;
}

const AVAILABLE_FIELDS: ClientListField[] = [
    { id: 'documento', label: 'Identificador (DNI/NIF)', visible: true },
    { id: 'nombre', label: 'Nombre Completo / Razón Social', visible: true },
    { id: 'emailPrincipal', label: 'Email Principal', visible: true },
    { id: 'telefonoPrincipal', label: 'Teléfono Principal', visible: true },
    { id: 'poblacion', label: 'Población', visible: true },
    { id: 'provincia', label: 'Provincia', visible: true },
    { id: 'numExpedientes', label: 'Nº Expedientes', visible: true },
    { id: 'fechaUltimaActividad', label: 'Fecha Última Actividad', visible: true },
];

const ClientListEditorModal: React.FC<ClientListEditorModalProps> = ({ onClose, onSave, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [fields, setFields] = useState<ClientListField[]>([]);

    useEffect(() => {
        if (initialData?.fields && initialData.fields.length > 0) {
            // Merge existing fields with any new available fields (if schema changes)
            // For now, trust the saved fields but ensure all available fields are present in the UI
            const savedIds = new Set(initialData.fields.map(f => f.id));
            const missing = AVAILABLE_FIELDS.filter(f => !savedIds.has(f.id)).map(f => ({ ...f, visible: false }));
            setFields([...initialData.fields, ...missing]);
        } else {
            // Default: All fields visible in default order
            setFields(AVAILABLE_FIELDS);
        }
    }, [initialData]);

    const handleFieldToggle = (id: string) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, visible: !f.visible } : f));
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...fields];
        if (direction === 'up' && index > 0) {
            [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
        } else if (direction === 'down' && index < newFields.length - 1) {
            [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
        }
        setFields(newFields);
    };

    const handleSave = () => {
        if (!name.trim()) return;

        // Filter out fields? No, keep all but mark visible
        // Actually, user might want to save the order of everything?
        // Let's save the full array as configured.

        onSave({
            ...initialData,
            name: name.trim(),
            fields: fields
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">
                        {initialData ? 'Editar Lista' : 'Nueva Lista Personalizada'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Nombre de la lista
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Clientes VIP, Sin Email..."
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                        />
                    </div>

                    {/* Fields Configuration */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                            Campos a incluir (Columnas)
                        </label>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden max-h-[300px] overflow-y-auto">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-white transition-colors group ${!field.visible ? 'opacity-50' : ''}`}
                                >
                                    {/* Reorder Handles - Only active if visible? No, always allow reorder */}
                                    <div className="flex flex-col gap-0.5 text-slate-300">
                                        <button
                                            onClick={() => moveField(index, 'up')}
                                            disabled={index === 0}
                                            className="hover:text-sky-500 disabled:opacity-0 transition-colors"
                                        >
                                            <ArrowUp size={10} />
                                        </button>
                                        <button
                                            onClick={() => moveField(index, 'down')}
                                            disabled={index === fields.length - 1}
                                            className="hover:text-sky-500 disabled:opacity-0 transition-colors"
                                        >
                                            <ArrowDown size={10} />
                                        </button>
                                    </div>

                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        id={`field-${field.id}`}
                                        checked={field.visible}
                                        onChange={() => handleFieldToggle(field.id)}
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500/30 cursor-pointer"
                                    />

                                    <label htmlFor={`field-${field.id}`} className="flex-1 text-sm font-medium text-slate-700 cursor-pointer select-none">
                                        {field.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">
                            Usa las flechas para ordenar las columnas en el export.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="px-6 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-lg shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Check size={16} />
                        Guardar Lista
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientListEditorModal;

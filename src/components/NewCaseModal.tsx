import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';
import { FileCategory } from '../types';
import { getSettings, getNextFileNumber } from '../services/firestoreService';
import { Button } from './ui/Button';

interface NewCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (category: FileCategory, subType?: string) => void;
}

const NewCaseModal: React.FC<NewCaseModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [selectedCategory, setSelectedCategory] = useState<FileCategory>('GE-MAT');
    const [selectedSubType, setSelectedSubType] = useState<string>('');
    const [fileTypes, setFileTypes] = useState<Record<FileCategory, string[]>>({
        'GE-MAT': [],
        'FI-TRI': [],
        'FI-CONTA': []
    });

    const [nextFileNumber, setNextFileNumber] = useState<string>('');

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getSettings();
            if (settings && settings.fileTypes) {
                setFileTypes(settings.fileTypes);
                // Set default subtype for the initial category
                if (settings.fileTypes['GE-MAT'] && settings.fileTypes['GE-MAT'].length > 0) {
                    setSelectedSubType(settings.fileTypes['GE-MAT'][0]);
                }
            }
        };
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    useEffect(() => {
        // Update subtype when category changes
        if (fileTypes[selectedCategory] && fileTypes[selectedCategory].length > 0) {
            setSelectedSubType(fileTypes[selectedCategory][0]);
        } else {
            setSelectedSubType('');
        }

        // Fetch next file number
        const fetchNextNumber = async () => {
            const num = await getNextFileNumber(selectedCategory);
            setNextFileNumber(num);
        };
        fetchNextNumber();
    }, [selectedCategory, fileTypes]);

    if (!isOpen) return null;

    const handleCreate = () => {
        onCreate(selectedCategory, selectedSubType);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
                <div className="bg-white px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="app-section-title !text-base !mb-0">Nuevo Expediente</h3>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="app-label-block">
                            Categoría del Expediente
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as FileCategory)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none transition-shadow"
                        >
                            <option value="GE-MAT">Gestión Matriculación (GE-MAT)</option>
                            <option value="FI-TRI">Fiscal Tributario (FI-TRI)</option>
                            <option value="FI-CONTA">Fiscal Contable (FI-CONTA)</option>
                        </select>
                    </div>

                    <div>
                        <label className="app-label-block">
                            Tipo Específico
                        </label>
                        <select
                            value={selectedSubType}
                            onChange={(e) => setSelectedSubType(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none transition-shadow"
                            disabled={!fileTypes[selectedCategory] || fileTypes[selectedCategory].length === 0}
                        >
                            {fileTypes[selectedCategory]?.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-sky-50/50 text-sky-800 p-4 rounded-xl border border-sky-100 flex justify-between items-center">
                        <span className="app-label !text-sky-600 !tracking-tight">Se asignará el número:</span>
                        <span className="text-xl font-normal text-sky-900 font-mono">{nextFileNumber || '...'}</span>
                    </div>
                </div>

                <div className="bg-white px-8 py-5 border-t border-slate-50 flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleCreate}
                    >
                        Crear expediente
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewCaseModal;

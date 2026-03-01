import React, { useState, useEffect } from 'react';
import { PrefixConfig } from '@/types';
import { getAllPrefixes, savePrefix } from '@/services/prefixService';
import { useToast } from '@/hooks/useToast';
import {
    ArrowLeft,
    Save,
    Zap
} from 'lucide-react';
import MovimientoCatalogManager from './MovimientoCatalogManager';
import { Button } from '@/components/ui/Button';
import PrefixPredefinedMovements from './PrefixPredefinedMovements';

interface PrefixEditorProps {
    embedded?: boolean;
}

const PrefixEditor: React.FC<PrefixEditorProps> = ({ embedded = false }) => {
    // Parse prefixId from hash
    const getPrefixIdFromHash = () => {
        const hash = window.location.hash;
        const match = hash.match(/\/config\/prefix\/([^\/\?]+)/);
        return match ? match[1] : null;
    };

    const prefixId = getPrefixIdFromHash();
    const navigateBack = () => {
        window.location.hash = '/config?category=internas&tab=prefixes';
    };

    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'numbering' | 'concepts' | 'tasks'>('general');

    // Form state
    const [formId, setFormId] = useState('');
    const [formCode, setFormCode] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formLastNumber, setFormLastNumber] = useState<number>(0);
    const [originalLastNumber, setOriginalLastNumber] = useState<number>(0);
    const [formIsActive, setFormIsActive] = useState(true);
    const [numberingUnlocked, setNumberingUnlocked] = useState(false);
    const [numberingPassword, setNumberingPassword] = useState('');

    useEffect(() => {
        if (prefixId) {
            loadPrefix(prefixId);
        }
    }, [prefixId]);

    const loadPrefix = async (id: string) => {
        setLoading(true);
        try {
            const prefixes = await getAllPrefixes();
            const prefix = prefixes.find(p => p.id === id);

            if (!prefix) {
                addToast('Prefijo no encontrado', 'error');
                navigateBack();
                return;
            }

            setFormId(prefix.id);
            setFormCode(prefix.code);
            setFormDescription(prefix.description);
            setFormLastNumber(prefix.ultimoNumeroAsignado || 0);
            setOriginalLastNumber(prefix.ultimoNumeroAsignado || 0);
            setFormIsActive(prefix.isActive);
            setNumberingUnlocked(false);
            setNumberingPassword('');

        } catch (error) {
            addToast('Error al cargar el prefijo', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formCode.trim() || !formDescription.trim()) {
            addToast('Código y descripción son obligatorios', 'error');
            return;
        }
        if (formLastNumber !== originalLastNumber && !numberingUnlocked) {
            addToast('Para modificar el último número asignado debes desbloquear con contraseña.', 'warning');
            setActiveTab('numbering');
            return;
        }

        setSaving(true);
        try {
            const prefixData: PrefixConfig = {
                id: formId,
                code: formCode.toUpperCase().trim(),
                description: formDescription.trim(),
                isActive: formIsActive,
                lines: [],
                ultimoNumeroAsignado: formLastNumber,
                numberLength: 4,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await savePrefix(prefixData);
            addToast('Prefijo guardado correctamente', 'success');
            navigateBack();
        } catch (error) {
            addToast('Error al guardar el prefijo', 'error');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleUnlockNumbering = () => {
        if (numberingPassword === '1812') {
            setNumberingUnlocked(true);
            addToast('Numeración desbloqueada para edición', 'success');
            return;
        }
        addToast('Contraseña incorrecta', 'error');
    };


    if (loading) {
        return (
            <div className={`flex items-center justify-center ${embedded ? 'h-full min-h-[320px]' : 'h-screen bg-slate-50'}`}>
                <div className="flex flex-col items-center gap-4">
                    <Zap className="w-12 h-12 text-sky-400 animate-pulse" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={embedded ? 'h-full flex flex-col' : 'min-h-screen bg-slate-50'}>
                {/* Header */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                    <div className={embedded ? 'px-4 py-6' : 'max-w-7xl mx-auto px-8 py-6'}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={navigateBack}
                                    className="p-3 hover:bg-slate-100 rounded-2xl transition-all group"
                                    title="Volver a Administración"
                                >
                                    <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                        Configuración de Prefijo
                                    </h1>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {formCode} • {formDescription}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleSave}
                                isLoading={saving}
                                icon={Save}
                                className="!bg-sky-600 hover:!bg-sky-700"
                            >
                                Guardar Cambios
                            </Button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mt-6 border-b border-slate-100">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'general'
                                    ? 'border-sky-500 text-sky-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Datos Generales
                            </button>
                            <button
                                onClick={() => setActiveTab('numbering')}
                                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'numbering'
                                    ? 'border-sky-500 text-sky-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Numeración
                            </button>
                            <button
                                onClick={() => setActiveTab('concepts')}
                                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'concepts'
                                    ? 'border-sky-500 text-sky-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Catálogo de Movimientos
                            </button>
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'tasks'
                                    ? 'border-sky-500 text-sky-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Movimientos Predefinidos
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className={embedded ? 'px-4 py-6' : 'max-w-7xl mx-auto px-8 py-8'}>
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-6">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
                                        Información Básica
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                                                Código del Prefijo
                                            </label>
                                            <input
                                                type="text"
                                                value={formCode}
                                                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:border-sky-500 focus:bg-white transition-all outline-none"
                                                placeholder="FITRI"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                                                Descripción / Trámite
                                            </label>
                                            <input
                                                type="text"
                                                value={formDescription}
                                                onChange={(e) => setFormDescription(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:border-sky-500 focus:bg-white transition-all outline-none"
                                                placeholder="Departamento Fiscal"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">
                                        Estado de Uso
                                    </h3>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setFormIsActive(true)}
                                            className={`flex-1 px-6 py-4 rounded-2xl border-2 transition-all ${formIsActive
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${formIsActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                <span className="text-xs font-black uppercase tracking-widest">Activo</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setFormIsActive(false)}
                                            className={`flex-1 px-6 py-4 rounded-2xl border-2 transition-all ${!formIsActive
                                                ? 'bg-slate-100 border-slate-200 text-slate-700'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${!formIsActive ? 'bg-slate-500' : 'bg-slate-300'}`} />
                                                <span className="text-xs font-black uppercase tracking-widest">Inactivo</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Numbering Tab */}
                    {activeTab === 'numbering' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-white rounded-[32px] border border-slate-200 p-8">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                                    Control de Numeración
                                </h3>
                                <div className="max-w-md">
                                    <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                            Contraseña de desbloqueo
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={numberingPassword}
                                                onChange={(e) => setNumberingPassword(e.target.value)}
                                                placeholder="Introducir contraseña"
                                                className="flex-1 px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:border-sky-500 focus:bg-white transition-all outline-none"
                                            />
                                            <Button
                                                onClick={handleUnlockNumbering}
                                                className="!bg-sky-600 hover:!bg-sky-700"
                                            >
                                                Desbloquear
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-bold">
                                            {numberingUnlocked ? 'Edición habilitada' : 'Edición bloqueada'}
                                        </p>
                                    </div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                                        Último Número Asignado
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={String(formLastNumber)}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[^\d]/g, '');
                                            setFormLastNumber(sanitized === '' ? 0 : parseInt(sanitized, 10));
                                        }}
                                        disabled={!numberingUnlocked}
                                        className={`w-full px-4 py-3 rounded-2xl text-2xl font-black outline-none transition-all ${numberingUnlocked
                                            ? 'bg-white border-2 border-slate-200 focus:border-sky-500 text-slate-900'
                                            : 'bg-slate-100 border-2 border-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        El próximo expediente será: <span className="font-bold text-slate-600">{formCode}-{String(formLastNumber + 1).padStart(4, '0')}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Concepts Tab */}
                    {activeTab === 'concepts' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden">
                                <MovimientoCatalogManager
                                    initialPrefixId={formId}
                                    hidePrefixSelector={true}
                                    embedded={true}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tasks Tab */}
                    {activeTab === 'tasks' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <PrefixPredefinedMovements prefijoId={formId} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PrefixEditor;

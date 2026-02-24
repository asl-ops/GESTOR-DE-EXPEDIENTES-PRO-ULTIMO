import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { UITheme, DEFAULT_THEME } from '@/types';
import { Save, RotateCcw, Palette, Type, Layout, CheckCircle2 } from 'lucide-react';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';

const ThemeManager: React.FC = () => {
    const { appSettings, updateSettings, currentUser } = useAppContext();
    const [theme, setTheme] = useState<UITheme>(appSettings?.uiTheme || DEFAULT_THEME);
    const [isSaved, setIsSaved] = useState(false);
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    useEffect(() => {
        if (appSettings?.uiTheme) {
            setTheme(appSettings.uiTheme);
        }
    }, [appSettings?.uiTheme]);

    const isAdmin = currentUser?.role === 'admin';

    const handleChange = (field: keyof UITheme, value: any) => {
        setTheme(prev => ({ ...prev, [field]: value }));
        setIsSaved(false);
    };

    const handleSave = async () => {
        try {
            await updateSettings({ uiTheme: theme });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const handleReset = async () => {
        const confirmed = await confirm({
            title: 'Restaurar apariencia',
            message: '¿Restaurar los colores y estilos por defecto?',
            description: 'Se perderán los cambios visuales no guardados.',
            confirmText: 'Restaurar',
            cancelText: 'Cancelar',
            variant: 'warning'
        });
        if (!confirmed) return;
        setTheme(DEFAULT_THEME);
        setIsSaved(false);
    };

    if (!isAdmin) {
        return (
            <div className="p-8 text-center bg-slate-50 rounded-[40px] border border-slate-100">
                <Palette className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Acceso Restringido</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Solo los administradores pueden modificar la apariencia global del sistema.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><Palette className="w-4 h-4" /></div>
                        Ajustes de Apariencia Corporativa
                    </h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Personaliza la identidad visual de la plataforma</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Restaurar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-3 active:scale-95 ${isSaved
                                ? 'bg-emerald-500 text-white shadow-emerald-200'
                                : 'bg-slate-900 text-white shadow-slate-200 hover:bg-sky-600'
                            }`}
                    >
                        {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {isSaved ? 'DATOS GUARDADOS' : 'GUARDAR TEMA'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                {/* Colores */}
                <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Palette className="w-3 h-3" /> Colores Principales
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Acento Corporativo (Azul Tenue)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={theme.corporateAccent}
                                    onChange={(e) => handleChange('corporateAccent', e.target.value)}
                                    className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={theme.corporateAccent}
                                    onChange={(e) => handleChange('corporateAccent', e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-sm font-black text-slate-700 outline-none focus:border-sky-500 font-mono shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Color de Etiquetas</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={theme.labelTextColor}
                                    onChange={(e) => handleChange('labelTextColor', e.target.value)}
                                    className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={theme.labelTextColor}
                                    onChange={(e) => handleChange('labelTextColor', e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-sm font-black text-slate-700 outline-none focus:border-sky-500 font-mono shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Color de Valores</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={theme.valueTextColor}
                                    onChange={(e) => handleChange('valueTextColor', e.target.value)}
                                    className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={theme.valueTextColor}
                                    onChange={(e) => handleChange('valueTextColor', e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-sm font-black text-slate-700 outline-none focus:border-sky-500 font-mono shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tipografía */}
                <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Type className="w-3 h-3" /> Tipografía y Pesos
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Peso de Etiquetas</label>
                            <select
                                value={theme.labelWeight}
                                onChange={(e) => handleChange('labelWeight', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-sm font-black text-slate-700 outline-none focus:border-sky-500 shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="font-normal">Fino (Normal)</option>
                                <option value="font-medium">Medio</option>
                                <option value="font-semibold">Semi-Negrita</option>
                                <option value="font-bold">Negrita (Bold)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Peso de Valores</label>
                            <select
                                value={theme.valueWeight}
                                onChange={(e) => handleChange('valueWeight', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-sm font-black text-slate-700 outline-none focus:border-sky-500 shadow-inner appearance-none cursor-pointer"
                            >
                                <option value="font-normal">Fino (Normal)</option>
                                <option value="font-medium">Medio</option>
                                <option value="font-semibold">Semi-Negrita</option>
                                <option value="font-bold">Negrita (Bold)</option>
                            </select>
                        </div>
                    </div>

                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-4">
                        <Layout className="w-3 h-3" /> Separadores y Navegación
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Grosor Indicador Activo ({theme.activeTabIndicatorHeight}px)</label>
                            <input
                                type="range"
                                min="1"
                                max="6"
                                step="1"
                                value={theme.activeTabIndicatorHeight}
                                onChange={(e) => handleChange('activeTabIndicatorHeight', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="p-10 bg-slate-50/50 rounded-[40px] border border-slate-100 space-y-8">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Previsualización en tiempo real</h4>

                <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-200/50 space-y-8">
                    <div className="flex gap-8 border-b border-slate-100 pb-0 overflow-x-auto no-scrollbar">
                        <button className="app-tab app-tab-active border-b-[var(--active-tab-indicator-height)]">Pestaña Activa</button>
                        <button className="app-tab">Pestaña Inactiva</button>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <span className="label-corporate">Ejemplo Etiqueta</span>
                            <span className="field-corporate block">Ejemplo de valor cargado</span>
                        </div>
                        <div className="space-y-1">
                            <span className="label-corporate">Número Expediente</span>
                            <span className="field-corporate block">MAT-2024-00124</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="section-title">SECCIÓN DE EJEMPLO</h3>
                        <p className="text-[10px] text-slate-400 italic">Los cambios se aplican globalmente al guardar.</p>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={confirmationState.isOpen}
                onClose={closeConfirmation}
                onConfirm={confirmationState.onConfirm}
                title={confirmationState.title}
                message={confirmationState.message}
                description={confirmationState.description}
                confirmText={confirmationState.confirmText}
                cancelText={confirmationState.cancelText}
                variant={confirmationState.variant}
            />
        </div>
    );
};

export default ThemeManager;

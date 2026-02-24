import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { MandatarioConfig } from '@/types/mandate';
import {
    Save,
    User,
    Building2,
    MapPin,
    CheckCircle2,
    RotateCcw,
    Hexagon,
    ShieldCheck,
    Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const MandateConfiguration: React.FC = () => {
    const { appSettings, updateSettings } = useAppContext();
    const { addToast } = useToast();

    const [mandatarioConfig, setMandatarioConfig] = useState<MandatarioConfig>({
        nombre_1: '',
        dni_1: '',
        col_1: '',
        nombre_2: '',
        dni_2: '',
        col_2: '',
        colegio: '',
        despacho: '',
        domicilio: {
            poblacion: '',
            calle: '',
            numero: '',
            cp: '',
        },
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (appSettings?.mandatarioConfig) {
            setMandatarioConfig(appSettings.mandatarioConfig);
        }
    }, [appSettings]);

    const handleChange = (field: string, value: string) => {
        if (field.startsWith('domicilio.')) {
            const domicilioField = field.split('.')[1];
            setMandatarioConfig(prev => ({
                ...prev,
                domicilio: { ...prev.domicilio, [domicilioField]: value },
            }));
        } else {
            setMandatarioConfig(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings({ mandatarioConfig });
            addToast('Configuración de mandatos guardada', 'success');
        } catch (error) {
            addToast('Error al guardar configuración', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Intro Header */}
            <div className="max-w-3xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shadow-sm border border-amber-100">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Configuración de Mandatarios</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Definición legal de figuras intervinientes</p>
                    </div>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Establezca los datos del gestor administrativo que se inyectarán dinámicamente en los documentos PDF generados. Esta información es crítica para la validez legal de los mandatos.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Gestor Principal Card */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <User className="w-24 h-24 text-slate-900" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[14px] bg-slate-900 text-white flex items-center justify-center font-black">1</div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Titular / Gestor Principal</h3>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Completo del Gestor</label>
                            <input
                                type="text"
                                value={mandatarioConfig.nombre_1}
                                onChange={(e) => handleChange('nombre_1', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-sans"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">NIF / NIE</label>
                                <input
                                    type="text"
                                    value={mandatarioConfig.dni_1}
                                    onChange={(e) => handleChange('dni_1', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nº Colegiado</label>
                                <input
                                    type="text"
                                    value={mandatarioConfig.col_1}
                                    onChange={(e) => handleChange('col_1', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gestor Secundario Card */}
                <div className="bg-slate-50 rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group opacity-80 hover:opacity-100 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[14px] bg-slate-400 text-white flex items-center justify-center font-black">2</div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Colaborador / Gestor Secundario</h3>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Completo (Opcional)</label>
                            <input
                                type="text"
                                value={mandatarioConfig.nombre_2 || ''}
                                onChange={(e) => handleChange('nombre_2', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-500 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">NIF / NIE</label>
                                <input
                                    type="text"
                                    value={mandatarioConfig.dni_2 || ''}
                                    onChange={(e) => handleChange('dni_2', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-500 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nº Colegiado</label>
                                <input
                                    type="text"
                                    value={mandatarioConfig.col_2 || ''}
                                    onChange={(e) => handleChange('col_2', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-500 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Despacho & Colegio Card */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-10 relative overflow-hidden group">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <Building2 className="w-6 h-6 text-indigo-500" />
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Identidad del Despacho</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Colegio Oficial de Gestores</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={mandatarioConfig.colegio}
                                    onChange={(e) => handleChange('colegio', e.target.value)}
                                    placeholder="ej. Colegio Oficial de Madrid"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                                />
                                <Hexagon className="w-5 h-5 text-slate-200 absolute left-6 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Razón Social del Despacho</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={mandatarioConfig.despacho}
                                    onChange={(e) => handleChange('despacho', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                                />
                                <Briefcase className="w-5 h-5 text-slate-200 absolute left-6 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Domicilio Fiscal Card */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-10 relative overflow-hidden group">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <MapPin className="w-6 h-6 text-emerald-500" />
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Domicilio Operativo</h3>
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Calle / Vía / Plaza</label>
                                <input
                                    type="text"
                                    value={mandatarioConfig.domicilio.calle}
                                    onChange={(e) => handleChange('domicilio.calle', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nº / Bloque</label>
                                <input
                                    type="text"
                                    value={mandatarioConfig.domicilio.numero}
                                    onChange={(e) => handleChange('domicilio.numero', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner text-center"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Código Postal</label>
                                <input
                                    type="text"
                                    value={mandatarioConfig.domicilio.cp}
                                    onChange={(e) => handleChange('domicilio.cp', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Población / Ciudad</label>
                                <input
                                    type="text"
                                    value={mandatarioConfig.domicilio.poblacion}
                                    onChange={(e) => handleChange('domicilio.poblacion', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-between p-10 bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-base font-black uppercase tracking-tight">Sincronización Legal Activa</h4>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Todos los cambios se aplicarán instantáneamente a los nuevos mandatos</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-500 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-3 relative z-10 disabled:opacity-50"
                >
                    {isSaving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isSaving ? 'Consolidando...' : 'Fijar Configuración'}
                </button>
            </div>
        </div>
    );
};

export default MandateConfiguration;

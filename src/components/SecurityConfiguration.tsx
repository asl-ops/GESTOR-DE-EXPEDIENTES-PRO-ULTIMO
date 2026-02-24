import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import {
    ShieldCheck,
    Lock,
    Eye,
    EyeOff,
    Save,
    AlertTriangle,
    Key
} from 'lucide-react';

const SecurityConfiguration: React.FC = () => {
    const { appSettings, updateSettings } = useAppContext();
    const { addToast } = useToast();
    const [password, setPassword] = useState(appSettings?.deletePassword || '1812');
    const [showPassword, setShowPassword] = useState(false);

    const handleSave = async () => {
        if (!password) {
            addToast('La contraseña no puede estar vacía', 'error');
            return;
        }
        try {
            await updateSettings({ deletePassword: password });
            addToast('Configuración de seguridad actualizada', 'success');
        } catch (error) {
            addToast('Error al actualizar la seguridad', 'error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Lock className="w-4 h-4" /></div>
                    Seguridad y Control de Acceso
                </h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Configura las barreras de seguridad para acciones críticas del sistema.</p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Password Input */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Contraseña de Borrado y Administración</label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Introduce la contraseña..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm font-mono"
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="px-4 mt-2 text-[8px] font-bold text-slate-400 uppercase tracking-tight">Esta contraseña protege el acceso a este panel y la eliminación de expedientes.</p>
                    </div>

                    {/* Protection Level Card */}
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Key size={60} className="text-indigo-600" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-indigo-600" /> Nivel de Protección: Alto
                            </h4>
                            <p className="text-[9px] font-medium text-indigo-700/70 leading-relaxed uppercase tracking-widest">
                                Introduce la contraseña de seguridad para acceder al panel de control global.
                            </p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        className="w-full bg-white border-2 border-indigo-200 text-indigo-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Save className="w-5 h-5" /> Guardar Nueva Contraseña
                    </button>
                </div>

                {/* Right Column - Security Warnings */}
                <div className="space-y-6 bg-rose-50/50 rounded-3xl p-8 border border-rose-100">
                    <div className="flex items-center gap-3 text-rose-600 mb-4">
                        <AlertTriangle size={20} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Aviso de Seguridad</h4>
                    </div>
                    <ul className="space-y-4">
                        {[
                            'No comparta esta contraseña con usuarios no autorizados.',
                            'La contraseña por defecto (1812) debe ser cambiada tras la instalación.',
                            'El cambio de contraseña es instantáneo para todos los terminales.',
                            'Si olvida la contraseña, contacte con el soporte técnico.'
                        ].map((text, i) => (
                            <li key={i} className="flex gap-3 text-[9px] font-black text-rose-900/60 uppercase tracking-tighter leading-tight">
                                <span className="size-1.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SecurityConfiguration;

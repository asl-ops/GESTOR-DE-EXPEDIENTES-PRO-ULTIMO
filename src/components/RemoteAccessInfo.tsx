import React from 'react';
import { X, Copy } from 'lucide-react';
import { CopyAction } from './ui/ActionFeedback';

interface RemoteAccessInfoProps {
    isOpen: boolean;
    onClose: () => void;
}

const RemoteAccessInfo: React.FC<RemoteAccessInfoProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const localIp = window.location.hostname;
    const port = window.location.port || '80';
    const remoteUrl = `http://${localIp}:${port}`;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                            <Copy size={16} />
                        </div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Acceso Remoto</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Paso 1: Iniciar Modo Red</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Cierra el servidor actual (<code className="bg-slate-100 px-1 rounded text-slate-800">Ctrl+C</code>) y ejecútalo con este comando:
                        </p>
                        <div className="relative group/cmd">
                            <div className="bg-slate-900 text-sky-400 p-4 rounded-2xl font-mono text-[11px] shadow-inner">
                                <code>npm run dev -- --host</code>
                            </div>
                            <div className="absolute top-2 right-2">
                                <CopyAction text="npm run dev -- --host">
                                    <button className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                        <Copy size={14} />
                                    </button>
                                </CopyAction>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Paso 2: Conectar Dispositivo</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Abre el navegador en tu otro equipo e introduce esta dirección. Ambos deben estar en la <strong className="text-slate-700">misma red Wi-Fi</strong>.
                        </p>
                        <div className="relative group/url">
                            <div className="bg-sky-50/50 border border-sky-100 p-4 rounded-2xl font-mono text-[11px] text-sky-700 shadow-sm">
                                <code>{remoteUrl}</code>
                            </div>
                            <div className="absolute top-2 right-2">
                                <CopyAction text={remoteUrl}>
                                    <button className="p-2 text-sky-400 hover:text-sky-600 hover:bg-white rounded-xl transition-all">
                                        <Copy size={14} />
                                    </button>
                                </CopyAction>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                        <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                            <strong className="uppercase mr-1">Nota:</strong> Si no carga, verifica la dirección IPv4 en la configuración de red de tu sistema operativo.
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RemoteAccessInfo;

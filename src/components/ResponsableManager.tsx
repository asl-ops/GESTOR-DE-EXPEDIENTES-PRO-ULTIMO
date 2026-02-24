import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { PrefixConfig, Movimiento } from '@/types';
import { getAllPrefixes, deletePrefix } from '@/services/prefixService';
import { getMovimientos, softDeleteMovimiento } from '@/services/movimientoService';
import {
    Trash2,
    AlertTriangle,
    Lock,
    Shield,
    ChevronDown,
    Search,
    CheckCircle2,
    Eye,
    EyeOff,
    Calculator,
    Zap,
    Folder,
    FolderOpen
} from 'lucide-react';
import { useConfirmation, confirmDelete } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';
import { Button } from './ui/Button';

const ResponsableManager: React.FC = () => {
    const { appSettings } = useAppContext();
    const { addToast } = useToast();
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    // Authentication State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Data State
    const [prefixes, setPrefixes] = useState<PrefixConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedPrefixId, setExpandedPrefixId] = useState<string | null>(null);
    const [prefixMovements, setPrefixMovements] = useState<Record<string, Movimiento[]>>({});
    const [movLoadingPrefixId, setMovLoadingPrefixId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            loadPrefixes();
        }
    }, [isAuthenticated]);

    const loadPrefixes = async () => {
        setLoading(true);
        try {
            const data = await getAllPrefixes();
            setPrefixes(data);
        } catch (error) {
            addToast('Error al cargar prefijos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const togglePrefix = async (prefixId: string) => {
        if (expandedPrefixId === prefixId) {
            setExpandedPrefixId(null);
            return;
        }

        setExpandedPrefixId(prefixId);

        // Cache movements if not already loaded or reload them
        setMovLoadingPrefixId(prefixId);
        try {
            const data = await getMovimientos(prefixId);
            const activeMovements = data.filter(m => m.activo !== false);
            setPrefixMovements(prev => ({ ...prev, [prefixId]: activeMovements }));
        } catch (error) {
            addToast('Error al cargar movimientos', 'error');
        } finally {
            setMovLoadingPrefixId(null);
        }
    };

    const handleAuthenticate = () => {
        const storedPassword = appSettings?.deletePassword || '1812';
        if (password === storedPassword) {
            setIsAuthenticated(true);
            addToast('Acceso autorizado', 'success');
        } else {
            addToast('Contraseña incorrecta', 'error');
            setPassword('');
        }
    };

    const handleDeleteMovement = async (prefixId: string, mov: Movimiento) => {
        const confirmed = await confirm({
            ...confirmDelete('movimiento'),
            message: `¿Estás seguro de que deseas eliminar el movimiento "${mov.nombre}" (${mov.codigo})?`,
            description: 'Esta acción desactivará el movimiento. Si ha sido utilizado en facturación, sus datos persistirán para integridad histórica.'
        });

        if (!confirmed) return;

        try {
            await softDeleteMovimiento(prefixId, mov.id);
            addToast('Movimiento eliminado correctamente', 'success');

            // Refresh movements for this prefix
            const data = await getMovimientos(prefixId);
            const activeMovements = data.filter(m => m.activo !== false);
            setPrefixMovements(prev => ({ ...prev, [prefixId]: activeMovements }));
        } catch (error: any) {
            addToast(error.message || 'Error al eliminar movimiento', 'error');
        }
    };

    const handleDeletePrefix = async (prefix: PrefixConfig) => {
        const movementsCount = prefixMovements[prefix.id]?.length || 0;

        // Enforce order: Check if there are active movements
        // If not loaded yet, we should probably warn or force load
        if (movementsCount > 0) {
            addToast('No se puede eliminar un prefijo que aún tiene movimientos asociados. Elimine primero todos los movimientos.', 'error');
            return;
        }

        const confirmed = await confirm({
            ...confirmDelete('prefijo'),
            message: `¿Estás seguro de que deseas eliminar permanentemente el prefijo "${prefix.code}"?`,
            description: 'Esta acción es irreversible y solo se permite si el prefijo no tiene movimientos activos asociados.'
        });

        if (!confirmed) return;

        try {
            await deletePrefix(prefix.id);
            addToast('Prefijo eliminado correctamente', 'success');
            setExpandedPrefixId(null);
            loadPrefixes();
        } catch (error: any) {
            addToast(error.message || 'Error al eliminar prefijo', 'error');
        }
    };

    const filteredPrefixes = prefixes.filter(p =>
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 animate-in fade-in duration-700">
                <div className="max-w-md w-full bg-white rounded-[48px] border border-slate-200 shadow-2xl p-12 text-center space-y-8">
                    <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[32px] flex items-center justify-center mx-auto shadow-lg shadow-rose-100 border border-rose-100 rotate-3 animate-pulse">
                        <Lock size={36} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Zona de Responsable</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Acceso Restringido • Requiere Validación</p>
                    </div>

                    <div className="space-y-4 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Contraseña de Seguridad</label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                                placeholder="••••"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 text-xl font-black text-slate-700 outline-none focus:border-rose-500 transition-all text-center tracking-[0.5em] font-mono shadow-inner"
                                autoFocus
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        onClick={handleAuthenticate}
                        className="w-full !rounded-[24px] !py-6 !bg-slate-900 hover:!bg-rose-600 !text-white !font-black !text-xs !uppercase !tracking-[0.2em] shadow-xl shadow-slate-200"
                        icon={Shield}
                    >
                        Validar Identidad
                    </Button>

                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                        ESTA SECCIÓN PERMITE LA ELIMINACIÓN DE DATOS SENSIBLES.<br />ACTÚE CON PRECAUCIÓN.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#fcfdfe] overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-10 py-8 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm border border-rose-100">
                        <Lock className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Explorador de Bajas</h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Borrado Seguro de Prefijos y Movimientos</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Acreditado</span>
                    </div>
                </div>
            </div>

            {/* Main Content: Single Column Explorer */}
            <div className="flex-1 flex flex-col overflow-hidden p-8 gap-6 max-w-5xl mx-auto w-full">
                {/* Search Bar */}
                <div className="relative group shrink-0">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="BUSCAR PREFIJO O CONCEPTO..."
                        className="w-full bg-white border-2 border-slate-100 rounded-[28px] pl-16 pr-8 py-5 text-sm font-black text-slate-700 placeholder-slate-300 outline-none focus:border-rose-200 focus:shadow-xl focus:shadow-rose-500/5 transition-all uppercase tracking-widest"
                    />
                </div>

                {/* Explorer List */}
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-3 pb-20">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Zap className="w-12 h-12 text-rose-200 animate-pulse" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Cargando Catálogo...</p>
                        </div>
                    )}

                    {!loading && filteredPrefixes.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-slate-100 rounded-[48px] opacity-40">
                            <Search size={48} className="text-slate-200 mb-6" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No se encontraron resultados</p>
                        </div>
                    )}

                    {filteredPrefixes.map((prefix) => {
                        const isExpanded = expandedPrefixId === prefix.id;
                        const moves = prefixMovements[prefix.id] || [];
                        const isListLoading = movLoadingPrefixId === prefix.id;

                        return (
                            <div
                                key={prefix.id}
                                className={`bg-white border-2 rounded-[32px] transition-all overflow-hidden ${isExpanded ? 'border-rose-200 shadow-xl shadow-rose-500/5' : 'border-slate-50 hover:border-slate-200 shadow-sm'}`}
                            >
                                {/* Prefix Header Row */}
                                <div
                                    className={`flex items-center gap-6 p-6 cursor-pointer transition-colors ${isExpanded ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}
                                    onClick={() => togglePrefix(prefix.id)}
                                >
                                    {/* Icon / Toggle */}
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400 group-hover:bg-white'}`}>
                                        {isExpanded ? <FolderOpen size={24} /> : <Folder size={24} />}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-base font-black uppercase tracking-tight ${isExpanded ? 'text-rose-900' : prefix.isActive === false ? 'text-slate-400 italic' : 'text-slate-900'}`}>{prefix.code}</span>
                                            {isExpanded && (
                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[8px] font-black uppercase tracking-widest border border-rose-200">
                                                    Abierto
                                                </span>
                                            )}
                                            {prefix.isActive === false && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest border border-slate-200">
                                                    Baja Técnica
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight truncate mt-0.5">{prefix.description}</p>
                                    </div>

                                    {/* Stats (Hidden when expanded to focus on actions) */}
                                    {!isExpanded && (
                                        <div className="flex items-center gap-6 px-6 border-x border-slate-100 hidden sm:flex">
                                            <div className="text-center">
                                                <span className="block text-[10px] font-black text-slate-900 tracking-tighter tabular-nums">?</span>
                                                <span className="block text-[8px] font-bold text-slate-300 uppercase">Movs</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-[10px] font-black text-slate-900 tracking-tighter tabular-nums">{prefix.ultimoNumeroAsignado || 0}</span>
                                                <span className="block text-[8px] font-bold text-slate-300 uppercase">Últ. Núm</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Column */}
                                    <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-4 px-6 border-r border-slate-100 hidden sm:flex">
                                            <div className="text-center min-w-[40px]">
                                                <span className={`block text-[10px] font-black tracking-tighter tabular-nums ${moves.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {isListLoading ? '...' : moves.length}
                                                </span>
                                                <span className="block text-[8px] font-bold text-slate-300 uppercase">Movs</span>
                                            </div>
                                            <div className="text-center min-w-[50px]">
                                                <span className="block text-[10px] font-black text-slate-900 tracking-tighter tabular-nums">{prefix.ultimoNumeroAsignado || 0}</span>
                                                <span className="block text-[8px] font-bold text-slate-300 uppercase">Últ. Núm</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeletePrefix(prefix)}
                                            className={`size-12 rounded-2xl flex items-center justify-center transition-all ${moves.length > 0 ? 'bg-slate-50 text-slate-200 cursor-not-allowed border border-slate-100' : 'bg-white text-rose-500 border border-rose-100 hover:bg-rose-600 hover:text-white shadow-sm'}`}
                                            title={moves.length > 0 ? "Elimine primero los movimientos" : "Eliminar Prefijo"}
                                            disabled={moves.length > 0}
                                        >
                                            <Trash2 size={20} />
                                        </button>

                                        <div className={`p-2 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-rose-400' : 'text-slate-300 group-hover:text-slate-500'}`}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content: Movements */}
                                {isExpanded && (
                                    <div className="border-t border-rose-100 bg-white/50 px-8 py-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="space-y-0.5">
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                    <Calculator size={12} className="text-rose-500" />
                                                    Catálogo de Movimientos Asociados
                                                </h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Debe estar vacío para permitir el borrado del prefijo</p>
                                            </div>

                                            {moves.length > 0 && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
                                                    <AlertTriangle size={12} className="animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{moves.length} ACTIVOS</span>
                                                </div>
                                            )}
                                        </div>

                                        {isListLoading ? (
                                            <div className="flex items-center justify-center py-12 gap-3">
                                                <Zap size={16} className="text-rose-400 animate-pulse" />
                                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Escaneando...</span>
                                            </div>
                                        ) : moves.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 bg-emerald-50/30 border-2 border-dashed border-emerald-100 rounded-[32px] text-center">
                                                <CheckCircle2 size={24} className="text-emerald-500 mb-2" />
                                                <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">SIN MOVIMIENTOS ACTIVOS</p>
                                                <p className="text-[9px] text-emerald-600/70 font-bold uppercase tracking-tight mt-1">Este prefijo ya es apto para su eliminación definitiva</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2">
                                                {moves.map(mov => (
                                                    <div
                                                        key={mov.id}
                                                        className="group flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-rose-200 hover:shadow-md transition-all"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] font-black group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                                                            {mov.codigo.substring(0, 3)}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{mov.nombre}</span>
                                                                <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[7px] font-black tracking-widest">
                                                                    {mov.codigo}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className={`text-[8px] font-black uppercase tracking-widest ${mov.naturaleza === 'HONORARIO' ? 'text-sky-600' : 'text-amber-600'}`}>
                                                                    {mov.naturaleza}
                                                                </span>
                                                                <div className="w-0.5 h-0.5 rounded-full bg-slate-200" />
                                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                                                                    IVA {mov.ivaPorDefecto || 21}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => handleDeleteMovement(prefix.id, mov)}
                                                            className="size-10 rounded-xl text-slate-300 hover:bg-rose-600 hover:text-white border border-slate-50 hover:border-rose-500 transition-all flex items-center justify-center"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Confirmation Modal */}
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

export default ResponsableManager;

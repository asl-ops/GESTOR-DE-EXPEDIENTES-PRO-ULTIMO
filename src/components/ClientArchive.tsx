import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { searchClients, restoreClient } from '@/services/clientService';
import { Client } from '@/types/client';
import {
    Archive,
    Search,
    RefreshCw,
    UserCheck,
    Calendar,
    User,
    Info,
    Eye
} from 'lucide-react';
import { Button } from './ui/Button';
import PaginationControls, { PageSize } from './PaginationControls';
import ClientPreviewModal from './ClientPreviewModal';

const ClientArchive: React.FC = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Client[]>([]);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [params, setParams] = useState({
        q: '',
        limit: 10 as PageSize,
        offset: 0,
        estado: 'BAJA' as const
    });

    const [previewClient, setPreviewClient] = useState<Client | null>(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    const loadClients = async () => {
        setLoading(true);
        try {
            const results = await searchClients(params);
            setItems(results.items);
            setTotal(results.total);
        } catch (error) {
            addToast('Error al cargar clientes archivados', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, [params]);

    const handleSearch = () => {
        setParams(prev => ({ ...prev, q: searchTerm, offset: 0 }));
    };

    const handleRestore = async (client: Client) => {
        try {
            await restoreClient(client.id);
            addToast(`Cliente "${client.nombre}" restaurado correctamente`, 'success');
            loadClients();
        } catch (error) {
            addToast('Error al restaurar el cliente', 'error');
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 p-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Archive className="w-4 h-4" />
                        </div>
                        Archivo de Clientes Dados de Baja
                    </h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        Historial de clientes inactivos. Puedes consultar sus datos o restaurarlos si vuelven a operar.
                    </p>
                </div>
            </div>

            {/* Búsqueda */}
            <div className="shrink-0 bg-white rounded-2xl border border-slate-100 p-2 flex gap-2 items-center shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar en el archivo (Nombre, documento, teléfono...)"
                        className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
                    />
                </div>
                <Button onClick={handleSearch} variant="secondary" className="rounded-xl px-6">
                    Buscar
                </Button>
            </div>

            {/* Tabla */}
            <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Identificador</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Nombre / Razón Social</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Fecha de Baja</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Motivo / Notas</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <RefreshCw className="w-8 h-8 text-slate-200 animate-spin mx-auto mb-4" />
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando archivo...</span>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <Archive className="w-8 h-8 text-slate-100 mx-auto mb-4" />
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay clientes en el archivo</span>
                                    </td>
                                </tr>
                            ) : items.map((client) => (
                                <tr key={client.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <span className="text-[11px] font-black text-slate-400 font-mono tracking-tighter">
                                            {client.documento || '---'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-700 group-hover:text-sky-600 transition-colors tracking-tight">
                                                {client.nombre}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                {client.tipo}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar size={12} className="text-slate-300" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                {client.fechaBaja ? new Date(client.fechaBaja).toLocaleDateString() : '---'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 max-w-xs">
                                        <div className="flex flex-col gap-1">
                                            {client.motivoBaja && (
                                                <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 leading-tight">
                                                    <Info size={10} className="text-sky-400 shrink-0" />
                                                    {client.motivoBaja}
                                                </span>
                                            )}
                                            {client.usuarioBaja && (
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <User size={8} />
                                                    Baja por: {client.usuarioBaja}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setPreviewClient(client); setPreviewModalOpen(true); }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all"
                                                title="Ver Ficha"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRestore(client)}
                                                className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-[9px] font-black uppercase tracking-widest hover:bg-sky-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                            >
                                                <UserCheck size={14} /> Restaurar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/50">
                    <PaginationControls
                        currentPage={Math.floor(params.offset / (params.limit === 'all' ? (total || 1) : params.limit)) + 1}
                        totalPages={params.limit === 'all' ? 1 : Math.ceil(total / (params.limit as number))}
                        pageSize={params.limit}
                        totalItems={total}
                        onPageChange={(page) => setParams(p => ({ ...p, offset: (page - 1) * (p.limit === 'all' ? total : (p.limit as number)) }))}
                        onPageSizeChange={(size) => setParams(p => ({ ...p, limit: size, offset: 0 }))}
                    />
                </div>
            </div>

            {/* Modals */}
            {previewClient && (
                <ClientPreviewModal
                    isOpen={previewModalOpen}
                    onClose={() => setPreviewModalOpen(false)}
                    client={previewClient}
                    caseCount={0}
                    onEdit={() => {
                        addToast('No se puede editar un cliente dado de baja. Restáuralo primero.', 'warning');
                    }}
                />
            )}
        </div>
    );
};

export default ClientArchive;

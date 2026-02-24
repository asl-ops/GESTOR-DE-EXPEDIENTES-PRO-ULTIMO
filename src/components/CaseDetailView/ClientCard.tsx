import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Check, Building2, UserCircle2, Eye, Archive } from 'lucide-react';
import { useHashRouter } from '../../hooks/useHashRouter';
import { Client } from '../../types';

interface ClientCardProps {
    client: Client;
    setClient: (c: Client) => void;
    savedClients: Client[];
    clientSnapshot?: {
        nombre: string;
        documento?: string;
        telefono?: string;
        email?: string;
    } | null;
    clienteId?: string | null;
    onViewClient?: (id: string) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, setClient, savedClients, clientSnapshot, clienteId, onViewClient }) => {
    const { navigateTo } = useHashRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync input with current client summary when selection matches or reset if empty
    useEffect(() => {
        if (client.documento || client.nif) {
            const label = `${client.firstName} ${client.surnames}`.trim();
            setSearchTerm(label || client.documento || client.nif || '');
        } else {
            setSearchTerm('');
        }
    }, [client]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredClients = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        if (!q || q.length < 2) return [];

        return savedClients.filter(c => {
            const fullName = `${c.firstName || ''} ${c.surnames || ''}`.toLowerCase();
            const documento = (c.documento || '').toLowerCase();
            const nif = (c.nif || '').toLowerCase();
            return fullName.includes(q) || documento.includes(q) || nif.includes(q);
        }).slice(0, 8);
    }, [searchTerm, savedClients]);

    const handleSelectClient = (selected: Client) => {
        setClient(selected);
        setShowResults(false);
        // Focus is lost to signify selection
        inputRef.current?.blur();
    };

    const isLegalEntity = (nif: string): boolean => {
        if (!nif) return false;
        const firstChar = nif.charAt(0).toUpperCase();
        return /^[ABCDEFGHJNPQRSUVW]/.test(firstChar);
    };

    return (
        <div ref={wrapperRef} className="relative group">
            {/* Main Container */}
            <div
                className={`bg-white rounded-3xl p-8 border border-slate-100 transition-all duration-300 shadow-sm hover:shadow-md ${client.nif ? 'border-sky-100 bg-sky-50/10' : 'bg-white'
                    }`}
            >
                {/* Search Input Container - Only show if not linked or user wants to change */}
                {!(client.nif || clienteId || clientSnapshot) && (
                    <div className="relative">
                        <div className="relative group/input">
                            <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${showResults ? 'text-[#4c739a]' : 'text-slate-300'
                                }`} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                                placeholder="Buscar por Nombre, Razón Social o Identificador..."
                                className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-12 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-sky-50 transition-all outline-none"
                            />
                        </div>

                        {/* Results Dropdown */}
                        {showResults && searchTerm.length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                {filteredClients.length > 0 ? (
                                    <div className="p-2">
                                        <div className="px-4 py-2 mb-1">
                                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Resultados encontrados</span>
                                        </div>
                                        {filteredClients.map(c => (
                                            <button
                                                key={c.id || Math.random()}
                                                onClick={() => handleSelectClient(c)}
                                                className="w-full group/item flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-2xl transition-all text-left mb-1 last:mb-0"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover/item:bg-[#4c739a] group-hover/item:text-white transition-all shadow-sm">
                                                        {isLegalEntity(c.nif || c.documento || '') ? <Building2 size={18} /> : <UserCircle2 size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-normal text-slate-900 mb-1 group-hover/item:text-[#4c739a] transition-colors">
                                                            {c.firstName} {c.surnames}
                                                        </p>
                                                        <p className="text-[10px] font-normal text-slate-400 font-mono tracking-widest uppercase">
                                                            {c.documento || c.nif}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="size-8 rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 group-hover/item:bg-[#4c739a] transition-all">
                                                    <Check size={16} className="text-white" strokeWidth={2} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50/50">
                                        <div className="mx-auto size-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-3">
                                            <Search size={20} />
                                        </div>
                                        <p className="text-sm font-normal text-slate-500">No se encontraron clientes</p>
                                        <p className="text-xs text-slate-400 mt-1">Intenta con otro nombre o documento</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Client Details (Visible when selected or snapshot available) */}
                {(client.documento || client.nif || (clientSnapshot && clientSnapshot.nombre)) && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {client.estado === 'BAJA' && (
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 rounded-2xl border border-amber-100/50">
                                <Archive size={14} className="text-amber-500" />
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                                    Cliente dado de baja operativo
                                </span>
                            </div>
                        )}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <span className="text-[9px] font-normal text-slate-400 uppercase tracking-widest block">Nombre / Razón Social</span>
                                <p className="text-sm font-semibold text-slate-900 uppercase">
                                    {client.nombre || clientSnapshot?.nombre || `${client.firstName || ''} ${client.surnames || ''}`.trim() || 'Sin Titular'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block">Identificador</span>
                                <div className="flex items-center gap-2">
                                    <p
                                        onClick={() => {
                                            const id = client.id || clienteId;
                                            if (id && onViewClient) onViewClient(id);
                                        }}
                                        className={`text-sm font-normal text-slate-900 font-mono tracking-widest uppercase truncate ${(client.id || clienteId) ? 'cursor-pointer hover:text-sky-600 transition-colors' : ''}`}
                                    >
                                        {client.documento || client.nif || clientSnapshot?.documento || 'No especificado'}
                                    </p>
                                    {(client.id || clienteId) && (
                                        <button
                                            onClick={() => {
                                                const id = client.id || clienteId;
                                                if (id) {
                                                    if (onViewClient) onViewClient(id);
                                                    else navigateTo(`/clients/${id}`);
                                                }
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                                            title="Ver ficha de cliente"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block">Contacto</span>
                                <p className="text-sm font-normal text-[#4c739a] truncate">
                                    {client.phone || clientSnapshot?.telefono || client.email || clientSnapshot?.email || 'Sin datos de contacto'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientCard;

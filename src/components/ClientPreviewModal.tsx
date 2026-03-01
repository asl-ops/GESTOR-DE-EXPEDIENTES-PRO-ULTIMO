import React from 'react';
import { User, Phone, Mail, MapPin, ExternalLink, Wallet, History, AlertCircle, FileText, Copy } from 'lucide-react';
import { HeaderActions } from './ui/HeaderActions';
import type { Client } from '@/types/client';
import { CopyAction } from './ui/ActionFeedback';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
    caseCount?: number;
    onEdit?: () => void; // Open full editor
}

const ClientPreviewModal: React.FC<Props> = ({ isOpen, onClose, client, caseCount = 0, onEdit }) => {
    if (!isOpen) return null;

    const formatAddress = (dom?: any) => {
        if (!dom) return null;
        const parts = [
            dom.sigla,
            dom.via,
            dom.numero ? `nº ${dom.numero}` : '',
            dom.piso ? `${dom.piso}º` : '',
            dom.puerta ? dom.puerta : '',
            dom.poblacion,
            dom.provincia ? `(${dom.provincia})` : '',
            dom.cp
        ].filter(Boolean);

        if (parts.length === 0) return null;
        return parts.join(' ');
    };

    const fiscalAddress = formatAddress(client.domicilioFiscal) || client.direccion || '—';
    const contactAddress = client.domicilioContactoIgualFiscal ? fiscalAddress : formatAddress(client.domicilioContacto) || '—';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col font-sans border border-white/20 select-text">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-none">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm text-sky-600">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide leading-none mb-1">Vista Previa Cliente</h3>
                            <div className="text-[11px] font-mono text-slate-500 font-medium tracking-wide flex items-center gap-2">
                                {client.documento ? (
                                    <CopyAction text={client.documento}>
                                        <div className="inline-flex items-center gap-1 group/copy">
                                            <span>{client.documento}</span>
                                            <Copy size={12} className="text-slate-300 group-hover/copy:text-sky-500" />
                                        </div>
                                    </CopyAction>
                                ) : (
                                    'Sin Identificador'
                                )}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest border ${client.estado === 'ACTIVO' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'
                                    }`}>
                                    {client.estado || 'ACTIVO'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <HeaderActions
                        onPrint={() => window.print()}
                        onClose={onClose}
                    />
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">

                    {/* Section 1: Core Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Data */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <History size={14} className="text-slate-400" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Información General</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                    <div className="font-semibold text-slate-900 text-lg leading-tight mb-1">{client.nombre}</div>
                                    <div className="text-xs text-sky-600 font-medium mb-4">{client.tipo || 'PARTICULAR'}</div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/60">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Identificador</span>
                                            {client.documento ? (
                                                <CopyAction text={client.documento}>
                                                    <div className="inline-flex items-center gap-1 group/copy">
                                                        <span className="text-xs font-mono text-slate-700">{client.documento}</span>
                                                        <Copy size={11} className="text-slate-300 group-hover/copy:text-sky-500" />
                                                    </div>
                                                </CopyAction>
                                            ) : (
                                                <span className="text-xs font-mono text-slate-700">—</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">NIF/CIF</span>
                                            {client.nif ? (
                                                <CopyAction text={client.nif}>
                                                    <div className="inline-flex items-center gap-1 group/copy">
                                                        <span className="text-xs font-mono text-slate-700">{client.nif}</span>
                                                        <Copy size={11} className="text-slate-300 group-hover/copy:text-sky-500" />
                                                    </div>
                                                </CopyAction>
                                            ) : (
                                                <span className="text-xs font-mono text-slate-700">—</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 px-4 py-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <FileText size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">Expedientes Totales</div>
                                        <div className="text-base font-bold text-indigo-700">{caseCount}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Data */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Phone size={14} className="text-slate-400" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Contacto</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                        <Phone size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Teléfonos</div>
                                        <div className="text-sm font-medium text-slate-700">{client.telefono || '—'}</div>
                                        {client.telefonos && client.telefonos.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {client.telefonos.map((t, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500">{t.label}: {t.value}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                                        <Mail size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Correos Electrónicos</div>
                                        <div className="text-sm font-medium text-slate-700 break-all">{client.email || '—'}</div>
                                        {client.emails && client.emails.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {client.emails.map((e, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500">{e.label}: {e.value}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Addresses */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={14} className="text-slate-400" />
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Direcciones</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50">
                                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Domicilio Fiscal</span>
                                <p className="text-xs text-slate-600 leading-relaxed">{fiscalAddress}</p>
                            </div>
                            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50">
                                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Domicilio de Envío/Contacto</span>
                                <p className="text-xs text-slate-600 leading-relaxed">{contactAddress}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Financial Info */}
                    {(client.iban || client.cuentaContable || client.bancoCobro) && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Wallet size={14} className="text-slate-400" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Datos Económicos y Facturación</h4>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Cuenta Contable</span>
                                            <span className="text-lg font-mono tracking-wider text-slate-800">{client.cuentaContable || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">IBAN de Cobro</span>
                                            <span className="text-sm font-mono tracking-widest text-slate-700">{client.iban ? client.iban.replace(/(.{4})/g, '$1 ') : '—'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex gap-6">
                                            <div>
                                                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Banco Entidad</span>
                                                <span className="text-sm font-mono text-slate-700">{client.bancoCobro || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Forma de Cobro</span>
                                                <span className="text-sm font-medium text-slate-700">{client.formaCobroId || '—'}</span>
                                            </div>
                                        </div>
                                        {client.bancoRemesa && (
                                            <div>
                                                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Banco Remesa</span>
                                                <span className="text-sm font-mono text-slate-700">{client.bancoRemesa}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section 4: Observations */}
                    {client.observaciones && client.observaciones.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle size={14} className="text-slate-400" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Histórico de Observaciones</h4>
                            </div>
                            <div className="space-y-3">
                                {client.observaciones.map((obs, idx) => (
                                    <div key={idx} className="p-4 bg-amber-50/30 border border-amber-100 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{new Date(obs.fecha).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 italic">"{obs.descripcion}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer / Meta */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                        <div>ID Sistema: {client.id}</div>
                        <div>Última actualización: {new Date(client.updatedAt || '').toLocaleString()}</div>
                    </div>

                </div>

                {/* Footer with Actions */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-none">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-white"
                    >
                        Cerrar
                    </button>

                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                            Editar Ficha Completa
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientPreviewModal;

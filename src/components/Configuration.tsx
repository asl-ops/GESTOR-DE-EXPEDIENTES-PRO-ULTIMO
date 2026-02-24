import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AgencyData, EconomicTemplates, TemplateEconomicLineItem, DEFAULT_CASE_STATUSES } from '@/types';
import {
    Save,
    Plus,
    Trash2,
    Building,
    Euro,
    Settings,
    CreditCard,
    ChevronRight,
    Zap,
    ArrowUpRight,
    CircleDashed,
    Shield,
    Palette,
    Users,
    Briefcase,
    Receipt,
    Settings2,
    ArrowLeft,
    Calculator,
    Archive,
    Lock,
    ShieldAlert,
    Upload,
    FileText
} from 'lucide-react';
import PrefixManagement from './PrefixManagement';
import TemplateManager from './TemplateManager';
import BajarExpedientes from './BajarExpedientes';
import MandateConfiguration from './MandateConfiguration';
import ThemeManager from './ThemeManager';
import Warehouse from './Warehouse';
import SecurityConfiguration from './SecurityConfiguration';
import PaymentMethodManager from './PaymentMethodManager';
import MovimientoCatalogManager from './MovimientoCatalogManager';
import ClientDeletion from './ClientDeletion';
import ResponsableManager from './ResponsableManager';
import { ClientImporter } from './ClientImporter';
import ClientArchive from './ClientArchive';
import PrefixEditor from './PrefixEditor';
import { useToast } from '@/hooks/useToast';
import { BackToHubButton } from './ui/BackToHubButton';

const Configuration: React.FC = () => {
    const { appSettings, economicTemplates, updateSettings, updateEconomicTemplates, users } = useAppContext();
    const { addToast } = useToast();

    const [agency, setAgency] = useState<AgencyData>({
        name: '', cif: '', address: '', managerName: '', managerColegiado: '', managerDni: ''
    });

    const [templates, setTemplates] = useState<EconomicTemplates>({});
    const { category, tab } = (() => {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.split('?')[1] || '');
        return {
            category: params.get('category'),
            tab: params.get('tab')
        };
    })();

    const [activeCategory, setActiveCategory] = useState<string>(category || 'despacho');
    const [activeTab, setActiveTab] = useState<string>(tab || 'agency');
    const [selectedTemplateType, setSelectedTemplateType] = useState<string>('GE-MAT');
    const isPrefixEditorRoute = /#\/config\/prefix\/[^/?#]+/.test(window.location.hash);

    useEffect(() => {
        if (appSettings?.agency) setAgency(appSettings.agency);
    }, [appSettings]);

    useEffect(() => {
        if (category) setActiveCategory(category);
        if (tab) setActiveTab(tab);
    }, [category, tab]);

    useEffect(() => {
        if (isPrefixEditorRoute) {
            setActiveCategory('internas');
            setActiveTab('prefixes');
        }
    }, [isPrefixEditorRoute]);

    useEffect(() => {
        if (economicTemplates) setTemplates(economicTemplates);
    }, [economicTemplates]);

    const handleAgencyChange = (field: keyof AgencyData, value: string) => {
        setAgency(prev => ({ ...prev, [field]: value }));
    };

    const saveAgency = async () => {
        try {
            await updateSettings({ agency });
            addToast('Datos del despacho actualizados', 'success');
        } catch (error) {
            addToast('Error al guardar datos', 'error');
        }
    };

    const handleTemplateChange = (type: string, index: number, field: keyof TemplateEconomicLineItem, value: any) => {
        setTemplates(prev => {
            const newTemplates = { ...prev };
            const lines = [...(newTemplates[type] || [])];
            lines[index] = { ...lines[index], [field]: value };
            newTemplates[type] = lines;
            return newTemplates;
        });
    };

    const addTemplateLine = (type: string) => {
        setTemplates(prev => {
            const newTemplates = { ...prev };
            const lines = [...(newTemplates[type] || [])];
            lines.push({ concept: 'Nuevo Concepto', amount: 0, included: true });
            newTemplates[type] = lines;
            return newTemplates;
        });
    };

    const removeTemplateLine = (type: string, index: number) => {
        setTemplates(prev => {
            const newTemplates = { ...prev };
            const lines = [...(newTemplates[type] || [])];
            lines.splice(index, 1);
            newTemplates[type] = lines;
            return newTemplates;
        });
    };

    const saveTemplates = async () => {
        try {
            await updateEconomicTemplates(templates);
            addToast('Modelos económicos actualizados', 'success');
        } catch (error) {
            addToast('Error al guardar modelos', 'error');
        }
    };

    const categories = [
        {
            id: 'despacho', label: 'Despacho', icon: Building, color: 'sky', description: 'Ajustes globales y apariencia', items: [
                { id: 'agency', label: 'Datos Generales', icon: Building },
                { id: 'appearance', label: 'Apariencia', icon: Palette },
                { id: 'security', label: 'Seguridad', icon: Lock }
            ]
        },
        {
            id: 'clients',
            label: 'Clientes',
            icon: Users,
            color: 'blue',
            description: 'Configuración de contactos',
            items: [
                { id: 'client-import', label: 'Importación de Clientes', icon: Upload },
                { id: 'client-deletion', label: 'Baja de Clientes', icon: Trash2 },
                { id: 'client-archive', label: 'Archivo de Bajas', icon: Archive }
            ]
        },
        {
            id: 'internas',
            label: 'Gestión Interna',
            icon: Settings2,
            color: 'rose',
            description: 'Expedientes, documentos y facturación',
            items: [
                { id: 'expedientes', label: 'Expedientes', icon: Briefcase },
                { id: 'albaranes', label: 'Albaranes', icon: Receipt },
                { id: 'proformas', label: 'Proformas', icon: FileText },
                { id: 'facturas', label: 'Facturación', icon: Euro },
                { id: 'responsable', label: 'Responsable', icon: ShieldAlert }
            ]
        },
    ] as const;

    const currentCategory = categories.find(c => c.id === activeCategory);

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden p-8 gap-8 animate-in fade-in duration-1000">
            {/* Header Section */}
            <div className="shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white border-2 border-slate-200 rounded-[22px] flex items-center justify-center text-slate-600 shadow-sm rotate-3">
                        <Settings className="w-8 h-8 animate-[spin_10s_linear_infinite]" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Panel de Control</h1>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Configuración Administrativa y Operativa</p>
                        </div>
                        <BackToHubButton />
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Sistema en Línea</span>
                </div>
            </div>

            {/* Main Content Container with Sidebar Tabs */}
            <div className="flex-1 flex gap-8 min-h-0">
                {/* Vertical Sidebar Tabs */}
                <div className="w-80 shrink-0 space-y-3 overflow-y-auto no-scrollbar pr-2 pb-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 mb-4">Módulos del Sistema</p>
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <div key={cat.id} className="space-y-1">
                                <button
                                    onClick={() => {
                                        setActiveCategory(cat.id);
                                        // Don't auto-select first item - let the landing page show
                                        setActiveTab(cat.id);
                                    }}
                                    className={`w-full group flex items-center gap-4 p-4 rounded-[28px] transition-all duration-300 relative cursor-pointer z-10 ${isActive ? 'bg-white shadow-xl shadow-slate-200/50 border border-slate-50' : 'hover:bg-slate-100/50'}`}
                                >
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? `bg-${cat.color}-50 text-${cat.color}-600 border-2 border-${cat.color}-200` : 'bg-slate-50 text-slate-300 group-hover:text-slate-500'}`}>
                                        <cat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <span className={`block text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{cat.label}</span>
                                        <span className="block text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5 mt-0.5 leading-tight">{cat.description}</span>
                                    </div>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />}
                                </button>

                                {isActive && cat.items.length > 1 && (
                                    <div className="ml-14 flex flex-col gap-1 py-2 animate-in slide-in-from-top-2 duration-300">
                                        {cat.items.map(item => {
                                            // Determine if this sub-item is active based on the current tab
                                            const isSubItemActive = item.id === 'agency'
                                                ? ['agency'].includes(activeTab)
                                                : item.id === 'appearance'
                                                    ? ['appearance'].includes(activeTab)
                                                    : item.id === 'security'
                                                        ? ['security'].includes(activeTab)
                                                        : item.id === 'client-import'
                                                            ? ['client-import'].includes(activeTab)
                                                            : item.id === 'client-deletion'
                                                                ? ['client-deletion'].includes(activeTab)
                                                                : item.id === 'expedientes'
                                                                    ? ['expedientes', 'movimientos', 'prefixes', 'templates', 'mandate', 'warehouse', 'bajar'].includes(activeTab)
                                                                    : item.id === 'facturas'
                                                                        ? ['facturas', 'payment-methods'].includes(activeTab)
                                                                        : item.id === 'albaranes'
                                                                            ? ['albaranes'].includes(activeTab)
                                                                            : item.id === 'proformas'
                                                                                ? ['proformas'].includes(activeTab)
                                                                                : activeTab === item.id;

                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setActiveCategory(cat.id);
                                                        setActiveTab(item.id);
                                                    }}
                                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSubItemActive ? 'text-sky-600 bg-sky-50/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <item.icon className={`w-3.5 h-3.5 ${isSubItemActive ? 'text-sky-500' : 'text-slate-300'}`} />
                                                    {item.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-[48px] border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden flex flex-col relative">
                    <div className={`${['client-deletion', 'client-archive'].includes(activeTab) ? 'p-0' : 'p-10'} flex-1 overflow-y-auto custom-scrollbar relative z-10`}>
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            {activeTab === 'agency' && (
                                <div className="space-y-12">
                                    <div className="max-w-2xl">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><Building className="w-4 h-4" /></div>
                                            Datos del Despacho Profesional
                                        </h3>
                                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Información fiscal y comercial que aparecerá en facturas y comunicaciones oficiales.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                        <div className="space-y-8">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Comercial / Fiscal</label>
                                                <input
                                                    type="text"
                                                    value={agency.name}
                                                    onChange={(e) => handleAgencyChange('name', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CIF / NIF Entidad</label>
                                                <input
                                                    type="text"
                                                    value={agency.cif}
                                                    onChange={(e) => handleAgencyChange('cif', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-mono shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Dirección Social Completa</label>
                                                <textarea
                                                    value={agency.address}
                                                    onChange={(e) => handleAgencyChange('address', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-inner resize-none"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-8 p-10 bg-slate-50/50 rounded-[40px] border border-slate-100">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Shield className="w-5 h-5 text-indigo-500" />
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Responsable Legal</h4>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre y Apellidos</label>
                                                    <input
                                                        type="text"
                                                        value={agency.managerName}
                                                        onChange={(e) => handleAgencyChange('managerName', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-500 transition-all"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nº Colegiado</label>
                                                        <input
                                                            type="text"
                                                            value={agency.managerColegiado}
                                                            onChange={(e) => handleAgencyChange('managerColegiado', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">DNI Responsable</label>
                                                        <input
                                                            type="text"
                                                            value={agency.managerDni}
                                                            onChange={(e) => handleAgencyChange('managerDni', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 outline-none focus:border-indigo-500 transition-all font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Default responsible config */}
                                    <div className="max-w-2xl bg-indigo-50/50 rounded-[40px] p-10 border border-indigo-100/50">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Shield className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Configuración Operativa</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Comportamiento por defecto del sistema</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Gestor por defecto para nuevos expedientes</label>
                                            <div className="relative group">
                                                <select
                                                    value={appSettings?.defaultResponsibleId || ''}
                                                    onChange={(e) => updateSettings({ defaultResponsibleId: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="">Ninguno (Asignación manual)</option>
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight className="w-4 h-4 text-slate-300 absolute right-6 top-1/2 -translate-y-1/2 rotate-90" />
                                            </div>
                                            <p className="px-4 mt-2 text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">Este usuario se asignará automáticamente al crear un expediente si el usuario actual no es el gestor principal.</p>
                                        </div>

                                        <div className="space-y-1.5 mt-8 border-t border-indigo-100/30 pt-8">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Estado inicial por defecto</label>
                                            <div className="relative group">
                                                <select
                                                    value={appSettings?.defaultInitialStatus || 'En Tramitación'}
                                                    onChange={(e) => updateSettings({ defaultInitialStatus: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                                >
                                                    {(appSettings?.caseStatuses || DEFAULT_CASE_STATUSES).map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight className="w-4 h-4 text-slate-300 absolute right-6 top-1/2 -translate-y-1/2 rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 flex justify-end">
                                        <button
                                            onClick={saveAgency}
                                            className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-sky-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-3"
                                        >
                                            <Save className="w-5 h-5" /> Consolidar Datos
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Despacho Module Selection Cards */}
                            {activeCategory === 'despacho' && activeTab === 'despacho' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><Building className="w-4 h-4" /></div>
                                            Configuración del Despacho
                                        </h3>
                                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Ajustes globales, apariencia y seguridad del sistema</p>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                        <button onClick={() => setActiveTab('agency')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Building className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Datos Generales</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Información fiscal y comercial del despacho</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-sky-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>

                                        <button onClick={() => setActiveTab('appearance')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Palette className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Apariencia</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Personalización visual y temas del sistema</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-purple-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>

                                        <button onClick={() => setActiveTab('security')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Lock className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Seguridad</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Control de acceso y protección de datos</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-red-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Clientes Module Selection Cards */}
                            {activeCategory === 'clients' && activeTab === 'clients' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="w-4 h-4" /></div>
                                            Configuración de Clientes
                                        </h3>
                                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Gestión de contactos, importación y mantenimiento</p>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
                                        <button onClick={() => setActiveTab('client-import')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Upload className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Importación de Clientes</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Carga masiva desde Excel y migración de datos</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>

                                        <button onClick={() => setActiveTab('client-deletion')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Trash2 className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Baja de Clientes</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Cese de actividad operativa y archivado</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-orange-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>

                                        <button onClick={() => setActiveTab('client-archive')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-slate-200 hover:shadow-xl hover:shadow-slate-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Archive className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Archivo de Bajas</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Histórico de clientes inactivos y recuperación</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-slate-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Gestión Interna Module Selection Cards */}
                            {activeCategory === 'internas' && activeTab === 'internas' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Settings2 className="w-4 h-4" /></div>
                                            Gestión Interna
                                        </h3>
                                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Gestión operativa, administrativa y documental</p>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
                                        <button onClick={() => setActiveTab('expedientes')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Briefcase className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Expedientes</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Catálogos, prefijos, plantillas y gestión de bajas</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>

                                        <button onClick={() => setActiveTab('albaranes')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Receipt className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Albaranes</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Gestión de notas de entrega y servicios realizados</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-amber-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>

                                        <button onClick={() => setActiveTab('proformas')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <FileText className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Proformas</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Presupuestos previos y borradores de facturación</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-orange-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>

                                        <button onClick={() => setActiveTab('facturas')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <Euro className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Facturación</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Configuración de series, impuestos y cobros</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>

                                        <button onClick={() => setActiveTab('responsable')} className="group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 active:scale-95 text-left relative overflow-hidden">
                                            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                                <ShieldAlert className="w-7 h-7" />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Responsable</h4>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">Borrado seguro de catálogos y prefijos</p>
                                            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-rose-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Expedientes submenu with cards */}
                            {activeCategory === 'internas' && activeTab === 'expedientes' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Briefcase className="w-4 h-4" /></div>
                                                Configuración de Expedientes
                                            </h3>
                                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Catálogos, prefijos, plantillas, almacén y bajas</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab(activeCategory)}
                                            className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Volver a Gestión Interna
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <button onClick={() => setActiveTab('movimientos')} className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-3 text-left">
                                            <Calculator className="w-5 h-5" /> Catálogo de Movimientos
                                        </button>
                                        <button onClick={() => setActiveTab('prefixes')} className="bg-white border-2 border-sky-200 text-sky-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-sky-50 hover:border-sky-300 transition-all shadow-sm active:scale-95 flex items-center gap-3 text-left">
                                            <Shield className="w-5 h-5" /> Prefijos
                                        </button>
                                        <button onClick={() => setActiveTab('templates')} className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-3 text-left">
                                            <FileText className="w-5 h-5" /> Plantillas DOCX
                                        </button>
                                        <button onClick={() => setActiveTab('mandate')} className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-3 text-left">
                                            <Zap className="w-5 h-5" /> Mandatos
                                        </button>
                                        <button onClick={() => setActiveTab('warehouse')} className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-3 text-left">
                                            <Archive className="w-5 h-5" /> Almacén de Bajas
                                        </button>
                                        <button onClick={() => setActiveTab('bajar')} className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-3 text-left">
                                            <Trash2 className="w-5 h-5" /> Bajas
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeCategory === 'internas' && activeTab === 'prefixes' && (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setActiveTab('expedientes')}
                                        className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver a Expedientes
                                    </button>
                                    {isPrefixEditorRoute ? <PrefixEditor embedded={true} /> : <PrefixManagement />}
                                </div>
                            )}

                            {activeCategory === 'internas' && activeTab === 'templates' && (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setActiveTab('expedientes')}
                                        className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver a Expedientes
                                    </button>
                                    <TemplateManager />
                                </div>
                            )}

                            {activeCategory === 'internas' && activeTab === 'bajar' && (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setActiveTab('expedientes')}
                                        className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver a Expedientes
                                    </button>
                                    <BajarExpedientes />
                                </div>
                            )}

                            {activeCategory === 'internas' && activeTab === 'mandate' && (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setActiveTab('expedientes')}
                                        className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver a Expedientes
                                    </button>
                                    <MandateConfiguration />
                                </div>
                            )}

                            {activeCategory === 'despacho' && activeTab === 'appearance' && <ThemeManager />}

                            {activeCategory === 'internas' && activeTab === 'responsable' && (
                                <div className="space-y-6 h-full flex flex-col">
                                    <button
                                        onClick={() => setActiveTab('internas')}
                                        className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2 shrink-0 w-fit"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver a Gestión Interna
                                    </button>
                                    <div className="flex-1 min-h-0 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                        <ResponsableManager />
                                    </div>
                                </div>
                            )}

                            {activeCategory === 'internas' && activeTab === 'warehouse' && (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setActiveTab('expedientes')}
                                        className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver a Expedientes
                                    </button>
                                    <Warehouse />
                                </div>
                            )}

                            {activeCategory === 'despacho' && activeTab === 'security' && <SecurityConfiguration />}

                            {/* Facturación submenu with cards */}
                            {activeCategory === 'internas' && activeTab === 'facturas' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Euro className="w-4 h-4" /></div>
                                                Configuración de Facturación
                                            </h3>
                                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Serie numérica, impuestos y formas de cobro</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab(activeCategory)}
                                            className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Volver a Gestión Interna
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <button onClick={() => setActiveTab('payment-methods')} className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-3 text-left">
                                            <CreditCard className="w-5 h-5" /> Formas de Cobro
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeCategory === 'internas' && activeTab === 'payment-methods' && (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setActiveTab('facturas')}
                                        className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver a Facturación
                                    </button>
                                    <PaymentMethodManager />
                                </div>
                            )}

                            {activeCategory === 'internas' && activeTab === 'movimientos' && (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setActiveTab('expedientes')}
                                        className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Volver a Expedientes
                                    </button>
                                    <MovimientoCatalogManager />
                                </div>
                            )}



                            {activeCategory === 'clients' && activeTab === 'client-import' && <ClientImporter />}
                            {activeCategory === 'clients' && activeTab === 'client-deletion' && <ClientDeletion />}
                            {activeCategory === 'clients' && activeTab === 'client-archive' && <ClientArchive />}

                            {activeCategory === 'internas' && activeTab === 'albaranes' && (
                                <div className="flex flex-col items-center justify-center h-full py-20 animate-in zoom-in-95 duration-500">
                                    <div className="w-full flex justify-start mb-10 pl-6">
                                        <button
                                            onClick={() => setActiveTab(activeCategory)}
                                            className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Volver a Gestión Interna
                                        </button>
                                    </div>
                                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                        <Receipt className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Módulo en Desarrollo</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs text-center leading-relaxed">
                                        Estamos trabajando para integrar las opciones de personalización de albaranes en este panel.
                                    </p>
                                </div>
                            )}

                            {activeCategory === 'internas' && activeTab === 'proformas' && (
                                <div className="flex flex-col items-center justify-center h-full py-20 animate-in zoom-in-95 duration-500">
                                    <div className="w-full flex justify-start mb-10 pl-6">
                                        <button
                                            onClick={() => setActiveTab(activeCategory)}
                                            className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Volver a Gestión Interna
                                        </button>
                                    </div>
                                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                        <FileText className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Módulo en Desarrollo</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs text-center leading-relaxed">
                                        Estamos trabajando para integrar las opciones de personalización de proformas en este panel.
                                    </p>
                                </div>
                            )}

                            {/* Placeholders for new sections */}
                            {((activeCategory === 'clients' && activeTab !== 'client-deletion' && activeTab !== 'client-import')) && (
                                <div className="flex flex-col items-center justify-center h-full py-20 animate-in zoom-in-95 duration-500">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                        {currentCategory?.icon && <currentCategory.icon className="w-10 h-10" />}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Módulo en Desarrollo</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs text-center leading-relaxed">
                                        Estamos trabajando para integrar las opciones de personalización de {currentCategory?.label.toLowerCase()} en este panel.
                                    </p>
                                    <div className="mt-8 flex gap-2">
                                        {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-100"></div>)}
                                    </div>
                                </div>
                            )}

                            {false && activeTab === 'economics' && (
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Euro className="w-4 h-4" /></div>
                                                Modelos Económicos por Servicio
                                            </h3>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configure los conceptos e importes por defecto</p>
                                        </div>
                                        <div className="relative group/sel">
                                            <select
                                                value={selectedTemplateType}
                                                onChange={(e) => setSelectedTemplateType(e.target.value)}
                                                className="bg-slate-900 text-white border-none rounded-2xl pl-8 pr-14 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/10 transition-all appearance-none cursor-pointer shadow-xl shadow-slate-200 min-w-[200px]"
                                            >
                                                {Object.keys(templates).map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="w-4 h-4 text-white/50 absolute right-6 top-1/2 -translate-y-1/2 rotate-90" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {(templates[selectedTemplateType] || []).map((line, index) => (
                                            <div key={index} className="group flex items-center gap-8 p-3 pl-8 bg-slate-50/50 rounded-[28px] border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-100 hover:-translate-y-0.5">
                                                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                                                    <span className="text-[10px] font-black">{index + 1}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={line.concept}
                                                        onChange={(e) => handleTemplateChange(selectedTemplateType, index, 'concept', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-900 outline-none placeholder:text-slate-300"
                                                        placeholder="Nombre del concepto económico..."
                                                    />
                                                </div>
                                                <div className="w-48 flex items-center gap-4">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            value={line.amount}
                                                            onChange={(e) => handleTemplateChange(selectedTemplateType, index, 'amount', parseFloat(e.target.value))}
                                                            className="w-full bg-white border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-black text-slate-900 shadow-inner outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                                                        />
                                                        <Euro className="w-3.5 h-3.5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                                    </div>
                                                    <button
                                                        onClick={() => removeTemplateLine(selectedTemplateType, index)}
                                                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {(!templates[selectedTemplateType] || templates[selectedTemplateType].length === 0) && (
                                            <div className="p-20 text-center border-4 border-dashed border-slate-50 rounded-[40px] flex flex-col items-center justify-center group">
                                                <div className="p-6 bg-slate-50 rounded-[32px] group-hover:animate-bounce transition-all">
                                                    <CircleDashed className="w-12 h-12 text-slate-200" />
                                                </div>
                                                <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-[10px] mt-6">Arquitectura de Costes Vacía</p>
                                                <p className="text-slate-200 font-bold uppercase tracking-widest text-[8px] mt-1">Inicie la configuración pulsando el botón de adición</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-10 border-t border-slate-50 flex items-center justify-between">
                                        <button
                                            onClick={() => addTemplateLine(selectedTemplateType)}
                                            className="text-slate-900 hover:bg-slate-100 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95"
                                        >
                                            <Plus className="w-5 h-5" /> Expandir Modelo
                                        </button>
                                        <button
                                            onClick={saveTemplates}
                                            className="bg-emerald-500 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center gap-3"
                                        >
                                            <Save className="w-5 h-5" /> Sincronizar Modelo
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Area Background Accents */}
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-slate-50 rounded-full blur-[80px] -z-10"></div>
                </div>
            </div>
        </div>
    );
};

export default Configuration;

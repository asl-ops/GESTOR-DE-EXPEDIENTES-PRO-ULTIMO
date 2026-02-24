import React, { useState } from 'react';
import {
    Users,
    Briefcase,
    Receipt,
    FileText,
    Euro,
    BarChart3,
    Settings,
    ArrowUpRight,
    LayoutGrid,
    Lock
} from 'lucide-react';
import { setViewMode } from '../services/viewModeService';
import SecureConfirmationModal from './SecureConfirmationModal';
import { useAppContext } from '../contexts/AppContext';

interface NavigationCard {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    hoverColor: string;
    route: string;
}

const navigationCards: NavigationCard[] = [
    {
        id: 'clientes',
        title: 'Clientes',
        subtitle: 'Gestión de contactos y relaciones',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        hoverColor: 'hover:border-blue-200 hover:shadow-blue-500/5',
        route: '/clients'  // Changed from /clientes
    },
    {
        id: 'expedientes',
        title: 'Expedientes',
        subtitle: 'Catálogo de casos y documentación',
        icon: Briefcase,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        hoverColor: 'hover:border-indigo-200 hover:shadow-indigo-500/5',
        route: '/'  // Dashboard shows cases
    },
    {
        id: 'albaranes',
        title: 'Albaranes',
        subtitle: 'Notas de entrega y servicios realizados',
        icon: Receipt,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        hoverColor: 'hover:border-amber-200 hover:shadow-amber-500/5',
        route: '/billing'  // No specific route, use billing
    },
    {
        id: 'proformas',
        title: 'Proformas',
        subtitle: 'Presupuestos previos y borradores',
        icon: FileText,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        hoverColor: 'hover:border-orange-200 hover:shadow-orange-500/5',
        route: '/proformas'
    },
    {
        id: 'facturacion',
        title: 'Facturación',
        subtitle: 'Gestión de facturas y cobros',
        icon: Euro,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        hoverColor: 'hover:border-emerald-200 hover:shadow-emerald-500/5',
        route: '/invoices'  // Changed from /facturas
    },
    {
        id: 'economico',
        title: 'Económico',
        subtitle: 'Análisis financiero y reportes',
        icon: BarChart3,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        hoverColor: 'hover:border-purple-200 hover:shadow-purple-500/5',
        route: '/economico'
    },
    {
        id: 'administracion',
        title: 'Administración',
        subtitle: 'Configuración del sistema',
        icon: Settings,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        hoverColor: 'hover:border-slate-200 hover:shadow-slate-500/5',
        route: '/config'  // Changed from /administracion
    },
    {
        id: 'responsable',
        title: 'Responsable',
        subtitle: 'Borrado seguro de catálogos',
        icon: Lock,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        hoverColor: 'hover:border-rose-200 hover:shadow-rose-500/5',
        route: '/responsible'
    }
];

export const MainNavigationHub: React.FC = () => {
    const { appSettings } = useAppContext();
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [pendingRoute, setPendingRoute] = useState<string | null>(null);

    const handleCardClick = (card: NavigationCard) => {
        // Check if this is the admin route
        if (card.id === 'administracion' || card.id === 'responsable') {
            // Show authentication modal
            setPendingRoute(card.route);
            setIsAdminModalOpen(true);
        } else {
            // Navigate directly for non-admin routes
            navigateToRoute(card.route);
        }
    };

    const navigateToRoute = (route: string) => {
        // Switch to menu mode to allow navigation to specific modules
        setViewMode('menu');

        // Navigate to the route
        window.location.hash = `#${route}`;

        // Reload to apply the view mode change
        window.location.reload();
    };

    const handleAdminConfirm = () => {
        setIsAdminModalOpen(false);
        if (pendingRoute) {
            navigateToRoute(pendingRoute);
            setPendingRoute(null);
        }
    };

    const handleAdminCancel = () => {
        setIsAdminModalOpen(false);
        setPendingRoute(null);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12 animate-in fade-in duration-500">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-[28px] flex items-center justify-center shadow-lg shadow-sky-500/20 rotate-3">
                            <LayoutGrid className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                                Panel de Navegación
                            </h1>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-1">
                                Acceso rápido a todos los módulos del sistema
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {navigationCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <button
                                key={card.id}
                                onClick={() => handleCardClick(card)}
                                className={`group flex flex-col p-8 bg-white border-2 border-slate-100 rounded-[32px] transition-all hover:shadow-xl active:scale-95 text-left relative overflow-hidden ${card.hoverColor} animate-in fade-in slide-in-from-bottom-4 zoom-in-95`}
                                style={{
                                    animationDelay: `${index * 60}ms`,
                                    animationDuration: '300ms',
                                    animationFillMode: 'backwards'
                                }}
                            >
                                {/* Icon */}
                                <div className={`w-16 h-16 ${card.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-8 h-8 ${card.color} transition-transform duration-300 group-hover:rotate-3`} />
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-widest mb-2">
                                    {card.title}
                                </h3>

                                {/* Subtitle */}
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">
                                    {card.subtitle}
                                </p>

                                {/* Arrow Icon */}
                                <ArrowUpRight className={`absolute top-8 right-8 w-5 h-5 text-slate-200 ${card.color.replace('text-', 'group-hover:text-')} group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300`} />

                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-white/5 group-hover:via-white/0 group-hover:to-transparent transition-all duration-500 pointer-events-none rounded-[32px]"></div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer Hint */}
                <div className="mt-12 text-center animate-in fade-in duration-1000 delay-500">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        Puedes cambiar a vista de menú usando el selector en la cabecera
                    </p>
                </div>
            </div>

            {/* Admin Authentication Modal */}
            <SecureConfirmationModal
                isOpen={isAdminModalOpen}
                onClose={handleAdminCancel}
                onConfirm={handleAdminConfirm}
                title="Acceso Administrativo"
                message="Introduce la contraseña de seguridad para acceder al panel de control global."
                requirePassword={true}
                correctPassword={appSettings?.deletePassword || '1812'}
            />
        </div>
    );
};

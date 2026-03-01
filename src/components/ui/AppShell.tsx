

import React, { ReactNode } from 'react';
import {
    Settings,
    Sparkles,
    Cpu
} from 'lucide-react';
import appIcon from '@/assets/icono-as.png';
import { useAppContext } from '../../contexts/AppContext';
import SecureConfirmationModal from '../SecureConfirmationModal';
import { useHashRouter } from '../../hooks/useHashRouter';
import { ViewModeToggle } from './ViewModeToggle';
import { GlobalSearchModal } from '../GlobalSearchModal';
import { setViewMode } from '../../services/viewModeService';
import { MODULE_NAV_ITEMS, navigateToModule } from '@/utils/moduleNavigation';

interface AppShellProps {
    children: ReactNode;
    title?: string;
    onOpenThemeSettings?: () => void;
}

const APP_NAV_ITEMS = [
    ...MODULE_NAV_ITEMS,
    { id: 'economico', label: 'Económico', path: '/economico' },
    { id: 'config', label: 'Administración', path: '/config' },
];

const AppShell: React.FC<AppShellProps> = ({ children, onOpenThemeSettings }) => {
    const { currentView, navigateTo } = useHashRouter();
    const { appSettings } = useAppContext();
    const [isAdminModalOpen, setIsAdminModalOpen] = React.useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);

    // Ctrl+K / Cmd+K keyboard shortcut for search
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchModalOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleNavClick = (item: typeof APP_NAV_ITEMS[0]) => {
        if (item.id === 'config') {
            setIsAdminModalOpen(true);
        } else {
            navigateToModule(item.path);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-slate-50 group/design-root font-sans" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
            <div className="layout-container flex h-full grow flex-col">
                {/* Modern Header with Top Navigation */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7edf3] px-10 py-3 bg-white shrink-0 sticky top-0 z-50">
                    <div className="flex items-center gap-8 text-[#0d141b]">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('/')}>
                            <img
                                src={appIcon}
                                alt="AGA Nexus"
                                className="size-8 object-cover rounded-full transition-transform group-hover:scale-110"
                            />
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-xl border border-white shadow-sm">
                                    <div className="flex items-baseline">
                                        <span className="text-slate-600 font-bold tracking-[0.12em] text-[11px] mr-2 uppercase leading-none">
                                            AGA
                                        </span>
                                        <span className="text-slate-500 font-semibold tracking-tight text-lg leading-none bg-gradient-to-r from-slate-600 to-slate-400 bg-clip-text text-transparent">
                                            Nexus
                                        </span>
                                    </div>

                                    <div className="mx-3 w-[1px] h-3 bg-slate-200" />

                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                                        <Cpu size={10} className="text-[#0071E3] opacity-70" />
                                        <span className="text-[9px] font-mono font-bold text-slate-400 tracking-tighter">
                                            V 27.02/20
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 ml-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        System Ready
                                    </span>
                                </div>
                            </div>
                        </div>
                        <nav className="hidden md:flex items-center gap-9">
                            {APP_NAV_ITEMS.map((item, idx) => {
                                const isActive = currentView === item.id || (item.id === 'dashboard' && currentView === 'detail');
                                return (
                                    <button
                                        key={`${item.id}-${idx}`}
                                        onClick={() => handleNavClick(item)}
                                        className={`group flex items-center gap-2 rounded-xl border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-all duration-200 ${isActive
                                            ? 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200 text-sky-700 shadow-sm'
                                            : 'bg-transparent border-transparent text-slate-500 hover:bg-sky-50/70 hover:border-sky-100 hover:text-sky-700'
                                            }`}
                                    >
                                        {item.id === 'config' && (
                                            <Settings className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-sky-600'}`} />
                                        )}
                                        <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex flex-1 justify-end gap-4 items-center">
                        <ViewModeToggle />

                        {onOpenThemeSettings && (
                            <button
                                onClick={onOpenThemeSettings}
                                title="Ajustes Visuales"
                                className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all border border-transparent hover:border-sky-100"
                            >
                                <Sparkles size={18} />
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>

                <SecureConfirmationModal
                    isOpen={isAdminModalOpen}
                    onClose={() => setIsAdminModalOpen(false)}
                    onConfirm={() => {
                        setIsAdminModalOpen(false);
                        setViewMode('menu');
                        navigateTo('/config');
                    }}
                    title="Acceso Administrativo"
                    message="Introduce la contraseña de seguridad para acceder al panel de control global."
                    requirePassword={true}
                    correctPassword={appSettings?.deletePassword || '1812'}
                />

                <GlobalSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                />
            </div>
        </div>
    );
};

export default AppShell;

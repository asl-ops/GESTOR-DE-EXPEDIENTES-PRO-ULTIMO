

import React, { ReactNode } from 'react';
import {
    Settings,
    Sparkles
} from 'lucide-react';
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

    const navItems = [
        ...MODULE_NAV_ITEMS,
        { id: 'economico', label: 'Económico', path: '/economico' },
        { id: 'config', label: 'Administración', path: '/config' },
    ];

    const handleNavClick = (item: typeof navItems[0]) => {
        if (item.id === 'config') {
            setIsAdminModalOpen(true);
        } else {
            navigateToModule(item.path);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-slate-50 group/design-root overflow-x-hidden font-sans" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
            <div className="layout-container flex h-full grow flex-col">
                {/* Modern Header with Top Navigation */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7edf3] px-10 py-3 bg-white shrink-0 sticky top-0 z-50">
                    <div className="flex items-center gap-8 text-[#0d141b]">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('/')}>
                            <div className="size-8 text-sky-600 transition-transform group-hover:scale-110">
                                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor"></path>
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-slate-900 text-xl font-normal tracking-tight leading-none">Expedientes Pro</h2>
                                <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">V 24.02/20</span>
                            </div>
                        </div>
                        <nav className="hidden md:flex items-center gap-9">
                            {navItems.map((item, idx) => {
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
                <main className="flex-1 overflow-y-auto">
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

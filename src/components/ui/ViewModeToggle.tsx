import React, { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { getViewMode, setViewMode, ViewMode, VIEW_MODE_CHANGED_EVENT } from '../../services/viewModeService';

interface ViewModeToggleProps {
    onChange?: (mode: ViewMode) => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = React.memo(({ onChange }) => {
    const [viewMode, setViewModeState] = useState<ViewMode>(getViewMode());
    const [isHovering, setIsHovering] = useState<'menu' | 'cards' | null>(null);

    React.useEffect(() => {
        const syncViewMode = (event: Event) => {
            const customEvent = event as CustomEvent<ViewMode>;
            if (customEvent.detail === 'menu' || customEvent.detail === 'cards') {
                setViewModeState(customEvent.detail);
                return;
            }
            setViewModeState(getViewMode());
        };

        window.addEventListener(VIEW_MODE_CHANGED_EVENT, syncViewMode as EventListener);
        window.addEventListener('storage', syncViewMode as EventListener);
        return () => {
            window.removeEventListener(VIEW_MODE_CHANGED_EVENT, syncViewMode as EventListener);
            window.removeEventListener('storage', syncViewMode as EventListener);
        };
    }, []);

    const handleToggle = (mode: ViewMode) => {
        if (mode === viewMode) return; // Don't toggle if already in this mode

        setViewMode(mode);
        setViewModeState(mode);
        onChange?.(mode);

        // When switching to cards mode, navigate to home to show the hub
        if (mode === 'cards') {
            window.location.hash = '#/';
        }

        // No hard reload: App listens to view mode changes and re-renders instantly.
    };

    return (
        <div className="relative flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
            {/* Menu/List View Button */}
            <button
                onClick={() => handleToggle('menu')}
                onMouseEnter={() => setIsHovering('menu')}
                onMouseLeave={() => setIsHovering(null)}
                className={`
                    group relative flex items-center gap-2 px-4 py-2.5 rounded-lg
                    transition-all duration-300 ease-out
                    ${viewMode === 'menu'
                        ? 'bg-white shadow-md scale-105 z-10'
                        : 'hover:bg-white/50 hover:scale-102 active:scale-95'
                    }
                `}
                title="Vista Compacta"
            >
                <List
                    className={`
                        w-5 h-5 transition-all duration-300
                        ${viewMode === 'menu'
                            ? 'text-slate-700 scale-110'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }
                    `}
                />
                <span
                    className={`
                        text-xs font-bold uppercase tracking-wider transition-all duration-300
                        ${viewMode === 'menu'
                            ? 'text-slate-900'
                            : 'text-slate-500 group-hover:text-slate-700'
                        }
                    `}
                >
                    Lista
                </span>

                {/* Tooltip */}
                {isHovering === 'menu' && viewMode !== 'menu' && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-medium rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        Vista Compacta
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                    </div>
                )}
            </button>

            {/* Cards/Grid View Button */}
            <button
                onClick={() => handleToggle('cards')}
                onMouseEnter={() => setIsHovering('cards')}
                onMouseLeave={() => setIsHovering(null)}
                className={`
                    group relative flex items-center gap-2 px-4 py-2.5 rounded-lg
                    transition-all duration-300 ease-out
                    ${viewMode === 'cards'
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/25 scale-105 z-10'
                        : 'hover:bg-white/50 hover:scale-102 active:scale-95'
                    }
                `}
                title="Vista Detallada"
            >
                <LayoutGrid
                    className={`
                        w-5 h-5 transition-all duration-300
                        ${viewMode === 'cards'
                            ? 'text-white scale-110'
                            : 'text-slate-400 group-hover:text-sky-600'
                        }
                    `}
                />
                <span
                    className={`
                        text-xs font-bold uppercase tracking-wider transition-all duration-300
                        ${viewMode === 'cards'
                            ? 'text-white'
                            : 'text-slate-500 group-hover:text-sky-700'
                        }
                    `}
                >
                    Tarjetas
                </span>

                {/* Tooltip */}
                {isHovering === 'cards' && viewMode !== 'cards' && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-medium rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        Vista Detallada
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                    </div>
                )}
            </button>
        </div>
    );
});

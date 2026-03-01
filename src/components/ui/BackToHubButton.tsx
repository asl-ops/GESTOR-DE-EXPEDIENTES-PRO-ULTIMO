import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { setViewMode } from '../../services/viewModeService';

export const BackToHubButton: React.FC = () => {
    const handleBackToHub = () => {
        // Switch to cards mode
        setViewMode('cards');

        // Navigate to home
        window.location.hash = '#/';
    };

    return (
        <div className="relative group">
            <button
                onClick={handleBackToHub}
                aria-label="Panel Principal"
                className="flex items-center justify-center w-11 h-11 bg-[#FAFAFA] border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 hover:bg-[#EBF5FF] hover:border-[#B2D7FF] hover:scale-105 active:scale-95"
                title="Volver al panel de navegación"
            >
                <div className="relative">
                    <LayoutGrid
                        size={20}
                        className="text-slate-600 group-hover:text-[#0071E3] transition-colors duration-300"
                    />
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#0071E3] scale-0 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_8px_rgba(0,113,227,0.4)]" />
                </div>
            </button>

            <div className="pointer-events-none absolute top-full mt-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300 shadow-xl z-50 whitespace-nowrap tracking-wider">
                ORIGEN
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
            </div>
        </div>
    );
};

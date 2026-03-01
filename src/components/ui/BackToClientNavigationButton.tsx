import React from 'react';
import { Undo2 } from 'lucide-react';

interface BackToClientNavigationButtonProps {
    onClick: () => void;
    tooltip?: string;
    ariaLabel?: string;
}

export const BackToClientNavigationButton: React.FC<BackToClientNavigationButtonProps> = ({
    onClick,
    tooltip = 'VOLVER',
    ariaLabel = 'Volver a cliente'
}) => {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                aria-label={ariaLabel}
                className="relative flex items-center justify-center w-11 h-11 bg-[#FAFAFA] border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 hover:bg-[#EBF5FF] hover:border-[#B2D7FF] hover:-translate-x-1 active:scale-95"
                title="Volver a navegación por cliente"
            >
                <Undo2 size={20} className="text-slate-600 group-hover:text-[#0071E3] transition-colors duration-300" />
            </button>
            <span className="pointer-events-none absolute top-full mt-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300 shadow-xl z-50 whitespace-nowrap tracking-wider">
                {tooltip}
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
            </span>
        </div>
    );
};


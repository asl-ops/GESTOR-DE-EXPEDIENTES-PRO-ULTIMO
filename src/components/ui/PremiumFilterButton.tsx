import React from 'react';

interface PremiumFilterButtonProps {
    isActive: boolean;
    onClick: () => void;
    tooltip?: string;
    className?: string;
}

export const PremiumFilterButton: React.FC<PremiumFilterButtonProps> = ({
    isActive,
    onClick,
    tooltip = 'Filtrar expedientes',
    className = ''
}) => {
    return (
        <div className={`relative group ${className}`}>
            <button
                onClick={onClick}
                aria-label="Filtros"
                title="Abrir panel de filtros"
                className={`relative flex items-center justify-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border w-[52px] h-[52px] ${
                    isActive
                        ? 'bg-[#EBF5FF] border-[#B2D7FF] shadow-sm scale-105'
                        : 'bg-[#FAFAFA] border-slate-200 hover:border-slate-300 hover:bg-white shadow-sm'
                }`}
            >
                <div className="relative w-7 h-7 flex items-center justify-center">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`w-full h-full transition-all duration-500 ease-out ${isActive ? 'rotate-90' : ''}`}
                    >
                        <path
                            d="M3 7h18"
                            className={`transition-all duration-300 ${isActive ? 'text-[#0071E3] opacity-30' : 'text-[#0071E3] opacity-100'}`}
                        />
                        <path
                            d="M3 12h12"
                            className={`transition-all duration-300 ${isActive ? 'text-[#0071E3] opacity-30' : 'text-[#0071E3] opacity-100'}`}
                        />
                        <path
                            d="M3 17h18"
                            className={`transition-all duration-300 ${isActive ? 'text-[#0071E3] opacity-30' : 'text-[#0071E3] opacity-100'}`}
                        />
                        <circle
                            cx={isActive ? '18' : '17'}
                            cy="12"
                            r="3.5"
                            className="text-[#0071E3]"
                            fill="currentColor"
                            fillOpacity={isActive ? '0.2' : '0'}
                        />
                    </svg>
                </div>
            </button>

            {!isActive && (
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50 whitespace-nowrap">
                    {tooltip}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
            )}
        </div>
    );
};


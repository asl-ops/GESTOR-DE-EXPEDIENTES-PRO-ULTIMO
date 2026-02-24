import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { setViewMode } from '../../services/viewModeService';

export const BackToHubButton: React.FC = () => {
    const handleBackToHub = () => {
        // Switch to cards mode
        setViewMode('cards');

        // Navigate to home
        window.location.hash = '#/';

        // Reload to apply the view mode change
        window.location.reload();
    };

    return (
        <button
            onClick={handleBackToHub}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 hover:border-sky-300 transition-all shadow-sm hover:shadow-md active:scale-95 group"
            title="Volver al panel de navegación"
        >
            <LayoutGrid className="w-4 h-4 text-sky-600 group-hover:text-sky-700 transition-colors" />
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                Panel Principal
            </span>
        </button>
    );
};

import React from 'react';
import { Filter, PanelLeftOpen } from 'lucide-react';

interface CollapsibleSidePanelProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    hasActiveFilters?: boolean;
    expandedWidth?: number;
    collapsedWidth?: number;
    tooltipExpand?: string;
    tooltipCollapse?: string;
    tooltipActive?: string;
    children: React.ReactNode;
}

/**
 * CollapsibleSidePanel - Reusable wrapper for collapsible filter panels
 * Used in Expedientes, Facturación, and Proformas for consistent UX
 */
const CollapsibleSidePanel: React.FC<CollapsibleSidePanelProps> = ({
    isCollapsed,
    onToggleCollapse,
    hasActiveFilters = false,
    expandedWidth = 320,
    collapsedWidth = 48,
    tooltipExpand = "Expandir filtros",
    tooltipActive = "Hay filtros aplicados",
    children
}) => {
    // Collapsed State - Rail View
    if (isCollapsed) {
        return (
            <div
                className="flex flex-col items-center py-6 px-2 bg-white border-r border-slate-100 h-full transition-[width] duration-200 ease-in-out"
                style={{ width: collapsedWidth }}
            >
                <button
                    onClick={onToggleCollapse}
                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title={tooltipExpand}
                    aria-label={tooltipExpand}
                    aria-expanded="false"
                >
                    <PanelLeftOpen className="w-5 h-5" />
                </button>
                <div
                    className="mt-4 text-slate-300 relative"
                    title={hasActiveFilters ? tooltipActive : undefined}
                >
                    <Filter className="w-4 h-4" />
                    {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-500 rounded-full" />
                    )}
                </div>
            </div>
        );
    }

    // Expanded State - Full Panel
    return (
        <div
            className="flex flex-col h-full bg-white font-sans overflow-hidden border-r border-slate-100 transition-[width] duration-200 ease-in-out"
            style={{ width: expandedWidth }}
        >
            {children}
        </div>
    );
};

export default CollapsibleSidePanel;

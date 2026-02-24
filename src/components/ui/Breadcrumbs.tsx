import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface BreadcrumbItem {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
    showHome?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    items,
    className,
    showHome = true
}) => {
    const handleClick = (item: BreadcrumbItem, e: React.MouseEvent) => {
        if (item.onClick) {
            e.preventDefault();
            item.onClick();
        } else if (item.href) {
            e.preventDefault();
            window.location.hash = item.href;
        }
    };

    return (
        <nav
            className={cn(
                "flex items-center gap-2 text-sm",
                className
            )}
            aria-label="Breadcrumb"
        >
            {/* Home icon (optional) */}
            {showHome && (
                <>
                    <button
                        onClick={() => window.location.hash = '/'}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors group"
                        aria-label="Inicio"
                    >
                        <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    {items.length > 0 && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    )}
                </>
            )}

            {/* Breadcrumb items */}
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const Icon = item.icon;

                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        )}

                        {isLast ? (
                            // Last item - not clickable
                            <span
                                className="flex items-center gap-1.5 font-semibold text-slate-900 uppercase tracking-wider text-xs"
                                aria-current="page"
                            >
                                {Icon && <Icon className="w-4 h-4" />}
                                {item.label}
                            </span>
                        ) : (
                            // Clickable items
                            <button
                                onClick={(e) => handleClick(item, e)}
                                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors font-medium uppercase tracking-wider text-xs group"
                            >
                                {Icon && <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                {item.label}
                            </button>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

export interface HermesMenuItem {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    color?: 'default' | 'danger' | 'sky' | 'indigo' | 'emerald';
}

interface HermesMenuProps {
    trigger: React.ReactNode;
    items: HermesMenuItem[];
    align?: 'left' | 'right';
    className?: string;
    width?: string;
}

export const HermesMenu: React.FC<HermesMenuProps> = ({
    trigger,
    items,
    align = 'right',
    className,
    width = 'w-48'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside or escape
    useEffect(() => {
        const handleEvents = (e: MouseEvent | KeyboardEvent) => {
            if (isOpen) {
                if (e instanceof MouseEvent && containerRef.current && !containerRef.current.contains(e.target as Node)) {
                    setIsOpen(false);
                }
                if (e instanceof KeyboardEvent && e.key === 'Escape') {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleEvents);
        document.addEventListener('keydown', handleEvents);
        return () => {
            document.removeEventListener('mousedown', handleEvents);
            document.removeEventListener('keydown', handleEvents);
        };
    }, [isOpen]);

    const colorStyles = {
        default: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        sky: "text-slate-600 hover:bg-sky-50 hover:text-sky-600",
        indigo: "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600",
        emerald: "text-slate-600 hover:bg-emerald-50 hover:text-emerald-600",
        danger: "text-red-500 hover:bg-red-50 hover:text-red-600",
    };

    return (
        <div className={cn("relative inline-block", className)} ref={containerRef}>
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="cursor-pointer"
            >
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={cn(
                        "absolute top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-200",
                        align === 'right' ? "right-0" : "left-0",
                        width
                    )}
                >
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                item.onClick();
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98]",
                                colorStyles[item.color || 'default']
                            )}
                        >
                            {item.icon && <item.icon size={16} strokeWidth={2.5} />}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

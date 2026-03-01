import React from 'react';
import { Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ColumnSelectorOption {
    id: string;
    label: string;
    locked?: boolean;
}

interface ColumnSelectorMenuProps {
    title?: string;
    options: ColumnSelectorOption[];
    visibleIds: string[];
    onToggle: (id: string) => void;
    className?: string;
    iconOnly?: boolean;
}

export const ColumnSelectorMenu: React.FC<ColumnSelectorMenuProps> = ({
    title = 'Columnas',
    options,
    visibleIds,
    onToggle,
    className,
    iconOnly = false
}) => {
    const [open, setOpen] = React.useState(false);
    const rootRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const visibleSet = new Set(visibleIds);

    return (
        <div ref={rootRef} className={`relative ${className || ''}`}>
            {iconOnly ? (
                <div className="relative group">
                    <Button
                        variant={open ? 'soft' : 'ghost'}
                        size="icon"
                        icon={Columns3}
                        onClick={() => setOpen(v => !v)}
                        aria-label={title}
                        title={title}
                        className={open ? 'border border-sky-200 !text-sky-700' : '!text-slate-500 hover:!text-sky-700'}
                    />
                    <span className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow text-[10px] font-bold uppercase tracking-wider text-slate-700 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all z-20">
                        {title}
                    </span>
                </div>
            ) : (
                <Button
                    variant={open ? 'soft' : 'ghost'}
                    size="sm"
                    icon={Columns3}
                    onClick={() => setOpen(v => !v)}
                    className={open ? 'border border-sky-200 !text-sky-700' : '!text-slate-500 hover:!text-sky-700'}
                >
                    {title}
                </Button>
            )}

            {open && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-2xl z-[9999] p-2">
                    {options.map((option) => {
                        const checked = visibleSet.has(option.id) || !!option.locked;
                        return (
                            <label
                                key={option.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs uppercase tracking-wider ${
                                    option.locked ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={option.locked}
                                    onChange={() => onToggle(option.id)}
                                    className="h-4 w-4 rounded border-slate-200 border-2 bg-transparent text-[#4c739a] checked:bg-[#4c739a] checked:border-[#4c739a] focus:ring-0 focus:ring-offset-0 focus:border-slate-200 focus:outline-none"
                                />
                                <span>{option.label}</span>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

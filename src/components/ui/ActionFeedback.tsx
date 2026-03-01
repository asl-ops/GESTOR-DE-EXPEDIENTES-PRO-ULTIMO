import React, { useState, useEffect } from 'react';
import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ActionFeedbackProps {
    children: React.ReactNode;
    label: string;
    icon?: LucideIcon;
    color?: 'sky' | 'indigo' | 'emerald' | 'rose';
    active?: boolean;
    onClose?: () => void;
    duration?: number;
    trigger?: 'manual' | 'click';
}

export const ActionFeedback: React.FC<ActionFeedbackProps> = ({
    children,
    label,
    icon: Icon = Check,
    color = 'sky',
    active: externalActive,
    onClose,
    duration = 1300,
    trigger = 'manual'
}) => {
    const [internalActive, setInternalActive] = useState(false);
    const active = trigger === 'manual' ? externalActive : internalActive;

    useEffect(() => {
        if (active) {
            const timer = setTimeout(() => {
                if (trigger === 'manual') onClose?.();
                else setInternalActive(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [active, duration, onClose, trigger]);

    const config = {
        sky: {
            iconBg: "bg-sky-50",
            iconText: "text-sky-600"
        },
        indigo: {
            iconBg: "bg-indigo-50",
            iconText: "text-indigo-600"
        },
        emerald: {
            iconBg: "bg-emerald-50",
            iconText: "text-emerald-600"
        },
        rose: {
            iconBg: "bg-rose-50",
            iconText: "text-rose-600"
        }
    };

    const style = config[color];

    return (
        <div className="relative inline-block">
            <div onClick={() => trigger === 'click' && setInternalActive(true)}>
                {children}
            </div>

            {active && (
                <div
                    className={cn(
                        "absolute top-full right-0 mt-3 whitespace-nowrap z-[100] origin-top-right",
                        "bg-white border border-sky-200 shadow-2xl rounded-2xl px-3.5 py-3",
                        "transition-all duration-300 transform scale-100 opacity-100 animate-in fade-in zoom-in-95"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <div className={cn("size-6 rounded-full flex items-center justify-center ring-2 ring-sky-200/60", style.iconBg, style.iconText)}>
                            <Icon size={14} strokeWidth={3} />
                        </div>
                        <span className="text-[11px] font-black text-sky-700 uppercase tracking-widest leading-none">
                            {label}
                        </span>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-[-6px] right-2 size-3 bg-white border-l border-t border-slate-100 rotate-45" />
                </div>
            )}
        </div>
    );
};

interface CopyActionProps {
    text: string;
    children: React.ReactNode;
    color?: 'sky' | 'indigo' | 'emerald' | 'rose';
    label?: string;
    duration?: number;
}

export const CopyAction: React.FC<CopyActionProps> = ({
    text,
    children,
    color = 'sky',
    label = 'Copiado',
    duration = 1100
}) => {
    const [active, setActive] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setActive(true);
        });
    };

    return (
        <ActionFeedback
            active={active}
            onClose={() => setActive(false)}
            label={label}
            color={color}
            duration={Math.max(duration, 1500)}
        >
            <div
                onClick={handleCopy}
                className={cn(
                    "cursor-pointer rounded-md transition-all duration-200",
                    active && "bg-sky-50 ring-2 ring-sky-300/70 px-1"
                )}
            >
                {children}
            </div>
        </ActionFeedback>
    );
};

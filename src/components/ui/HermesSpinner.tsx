import React from 'react';
import { cn } from '@/utils/cn';

interface HermesSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    label?: string;
}

export const HermesSpinner: React.FC<HermesSpinnerProps> = ({
    size = 'md',
    className,
    label
}) => {
    const sizeClasses = {
        sm: 'size-4 border-2',
        md: 'size-8 border-2',
        lg: 'size-12 border-3',
        xl: 'size-16 border-4'
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <div className="relative">
                {/* Outer Ring (Subtle) */}
                <div className={cn(
                    "rounded-full border-slate-100",
                    sizeClasses[size]
                )} />

                {/* Active Spinner Segment */}
                <div className={cn(
                    "absolute top-0 left-0 rounded-full border-transparent border-t-sky-600 animate-spin",
                    sizeClasses[size]
                )} />

                {/* Center Glow (Premium touch) */}
                <div className={cn(
                    "absolute inset-0 rounded-full bg-sky-500/5 blur-xl animate-pulse",
                    size === 'sm' ? 'hidden' : ''
                )} />
            </div>

            {label && (
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">
                    {label}
                </p>
            )}
        </div>
    );
};

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'danger' | 'success' | 'soft' | 'create';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
    icon?: LucideIcon | React.ComponentType<any>;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', icon: Icon, iconPosition = 'left', isLoading, children, disabled, ...props }, ref) => {

        const variants = {
            primary: 'bg-sky-600 text-white hover:bg-sky-700 shadow-lg shadow-sky-500/20 active:scale-[0.98] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:opacity-100 disabled:cursor-not-allowed',
            secondary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-[0.98]',
            outline: 'bg-transparent border-2 border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]',
            ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200',
            glass: 'bg-white/70 backdrop-blur-md border border-white/20 text-slate-700 shadow-sm hover:bg-white/90 active:scale-[0.98]',
            danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 active:scale-[0.98]',
            success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-[0.98]',
            soft: 'bg-blue-50/60 border border-blue-200 text-blue-700 hover:bg-blue-100/80 hover:border-blue-300 shadow-sm active:scale-[0.98]',
            create: 'bg-blue-50/40 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-sm active:scale-[0.98]',
        };

        const sizes = {
            sm: 'px-3 h-8 text-[10px] rounded-lg gap-1.5',
            md: 'px-5 h-10 text-[11px] rounded-xl gap-2',
            lg: 'px-8 h-12 text-xs rounded-2xl gap-2.5',
            xl: 'px-10 h-14 text-sm rounded-[20px] gap-3',
            icon: 'size-10 rounded-xl items-center justify-center',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex items-center justify-center font-normal uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none select-none',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="size-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                    <>
                        {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} />}
                        {children}
                        {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} />}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

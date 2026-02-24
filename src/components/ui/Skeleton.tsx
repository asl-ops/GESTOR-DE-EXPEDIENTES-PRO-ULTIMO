import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'shimmer' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    animation = 'shimmer'
}) => {
    const baseClasses = 'bg-slate-100/50 overflow-hidden relative';

    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-xl'
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-[wave_1.5s_ease-in-out_infinite]',
        shimmer: '', // Handled as an overlay below
        none: ''
    };

    const style: React.CSSProperties = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || undefined
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        >
            {animation === 'shimmer' && (
                <div className="absolute inset-0 animate-hermes-shimmer" />
            )}
        </div>
    );
};

// Skeleton presets for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white border-2 border-slate-100 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center gap-4 mb-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
            </div>
        </div>
        <div className="space-y-2">
            <Skeleton width="100%" height={12} />
            <Skeleton width="90%" height={12} />
            <Skeleton width="75%" height={12} />
        </div>
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({
    rows = 5,
    className = ''
}) => (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${className}`}>
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-4">
            <div className="flex gap-4">
                <Skeleton width="25%" height={14} />
                <Skeleton width="20%" height={14} />
                <Skeleton width="15%" height={14} />
                <Skeleton width="20%" height={14} />
                <Skeleton width="15%" height={14} />
            </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4">
                    <div className="flex gap-4 items-center">
                        <Skeleton width="25%" height={12} />
                        <Skeleton width="20%" height={12} />
                        <Skeleton width="15%" height={12} />
                        <Skeleton width="20%" height={12} />
                        <Skeleton width="15%" height={12} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
    items = 3,
    className = ''
}) => (
    <div className={`space-y-3 ${className}`}>
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton width="70%" height={14} />
                    <Skeleton width="40%" height={10} />
                </div>
                <Skeleton variant="rounded" width={80} height={32} />
            </div>
        ))}
    </div>
);

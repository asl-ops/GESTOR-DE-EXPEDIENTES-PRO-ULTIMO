import React from 'react';
import { Printer, X, ArrowLeft, LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface HeaderActionsProps {
    onPrint?: () => void;
    onPrimary?: () => void;
    primaryIcon?: LucideIcon;
    primaryLabel?: string;
    primaryTooltip?: string;
    onBack?: () => void;
    onClose?: () => void;
    isPrimaryLoading?: boolean;
    primaryDisabled?: boolean;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
    onPrint,
    onPrimary,
    primaryIcon: PrimaryIcon,
    primaryLabel,
    primaryTooltip,
    onBack,
    onClose,
    isPrimaryLoading,
    primaryDisabled
}) => {
    return (
        <div className="flex items-center gap-2">
            {/* 1. Imprimir (Opcional) */}
            {onPrint && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrint}
                    title="Imprimir"
                    className="text-slate-400 hover:text-slate-600"
                >
                    <Printer size={18} />
                </Button>
            )}

            {onPrint && <div className="w-px h-6 bg-slate-100 mx-1" />}

            {/* 2. Acción Principal (Oscura) - Condicional */}
            {onPrimary && PrimaryIcon && (
                <Button
                    variant="primary"
                    size={primaryLabel ? 'md' : 'icon'}
                    onClick={onPrimary}
                    isLoading={isPrimaryLoading}
                    disabled={primaryDisabled}
                    title={primaryTooltip}
                    className={primaryLabel ? 'px-5' : undefined}
                >
                    <PrimaryIcon size={20} />
                    {primaryLabel}
                </Button>
            )}

            {/* 3. Volver (Claro) */}
            {onBack && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onBack}
                    title="Volver"
                >
                    <ArrowLeft size={18} />
                </Button>
            )}

            {/* 4. Cerrar (X) (Claro) */}
            {onClose && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onClose}
                    title="Cerrar"
                    className="hover:border-red-100 hover:text-red-500 hover:bg-red-50/30"
                >
                    <X size={18} />
                </Button>
            )}
        </div>
    );
};

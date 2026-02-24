import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface SaveSuccessAnimationProps {
    message?: string;
    onComplete?: () => void;
    duration?: number;
}

export const SaveSuccessAnimation: React.FC<SaveSuccessAnimationProps> = ({
    message = 'Guardado correctamente',
    onComplete,
    duration = 2000
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-8 right-8 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-emerald-200 rounded-2xl shadow-xl shadow-emerald-500/10">
                {/* Animated Checkmark */}
                <div className="relative w-8 h-8">
                    {/* Circle background with scale animation */}
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-in zoom-in-0 duration-300" />

                    {/* Checkmark with draw animation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Check
                            className="w-5 h-5 text-white animate-in zoom-in-50 duration-300 delay-150"
                            strokeWidth={3}
                        />
                    </div>

                    {/* Ripple effect */}
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                </div>

                {/* Message */}
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{message}</span>
                    <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Operación exitosa</span>
                </div>
            </div>
        </div>
    );
};

// Hook para usar el componente fácilmente
export const useSaveSuccess = () => {
    const [showSuccess, setShowSuccess] = useState(false);
    const [message, setMessage] = useState<string | undefined>();

    const triggerSuccess = (msg?: string) => {
        setMessage(msg);
        setShowSuccess(true);
    };

    const SuccessComponent = showSuccess ? (
        <SaveSuccessAnimation
            message={message}
            onComplete={() => setShowSuccess(false)}
        />
    ) : null;

    return { triggerSuccess, SuccessComponent };
};

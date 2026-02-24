import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { ExclamationTriangleIcon } from './icons';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface SecureConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password?: string) => void;
    title: string;
    message: string;
    requirePassword?: boolean;
    correctPassword?: string;
}

const SecureConfirmationModal: React.FC<SecureConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    requirePassword = false,
    correctPassword = ''
}) => {
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const passwordInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setPasswordInput('');
            setError(null);
            setShowPassword(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const focusTimer = window.setTimeout(() => {
            if (requirePassword) {
                passwordInputRef.current?.focus();
                return;
            }
            const proceedBtn = document.getElementById('secure-confirm-proceed');
            (proceedBtn as HTMLButtonElement | null)?.focus();
        }, 0);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key === 'Enter') {
                const target = event.target as HTMLElement | null;
                const targetTag = target?.tagName;
                const isTextInput = targetTag === 'INPUT' && (target as HTMLInputElement).type !== 'checkbox';
                const isOtherInteractive = targetTag === 'BUTTON' || targetTag === 'SELECT' || targetTag === 'TEXTAREA';
                if (!isTextInput && isOtherInteractive) return;
                event.preventDefault();
                handleConfirm();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, requirePassword, onClose, passwordInput, correctPassword]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (requirePassword) {
            if (passwordInput === correctPassword) {
                onConfirm(passwordInput);
            } else {
                setError('Contraseña incorrecta');
            }
        } else {
            onConfirm();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-1 px-1 bg-red-600"></div>
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="size-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-6">
                        {requirePassword ? <ShieldCheck className="w-8 h-8" /> : <ExclamationTriangleIcon />}
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-3">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">{message}</p>

                    {requirePassword && (
                        <div className="w-full mb-6">
                            <label className="block text-left text-xs font-black uppercase tracking-wider text-slate-400 mb-2 ml-1">
                                Confirmar con Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    ref={passwordInputRef}
                                    type={showPassword ? "text" : "password"}
                                    autoFocus
                                    value={passwordInput}
                                    onChange={(e) => {
                                        setPasswordInput(e.target.value);
                                        setError(null);
                                    }}
                                    className={`w-full px-4 h-12 bg-slate-50 border ${error ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-[#1380ec] focus:ring-4 focus:ring-blue-50'} rounded-xl transition-all outline-none font-medium`}
                                    placeholder="Introduce la contraseña..."
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {error && (
                                <p className="text-red-500 text-xs font-bold mt-2 text-left ml-1 flex items-center gap-1">
                                    <ExclamationTriangleIcon size={14} /> {error}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 w-full">
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="md"
                            className="flex-1 bg-slate-100/50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            variant="danger"
                            size="md"
                            id="secure-confirm-proceed"
                            className="flex-1"
                        >
                            Proceder
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecureConfirmationModal;

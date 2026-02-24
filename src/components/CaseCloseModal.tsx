import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/Button';
import { ExclamationTriangleIcon } from './icons';

interface CaseCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: { createAlbaran: boolean; createProforma: boolean }) => void;
    selectedCasesCount: number;
}

const CaseCloseModal: React.FC<CaseCloseModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    selectedCasesCount
}) => {
    const [createAlbaran, setCreateAlbaran] = useState(false);
    const [createProforma, setCreateProforma] = useState(false);
    const [showError, setShowError] = useState(false);
    const firstOptionRef = useRef<HTMLInputElement | null>(null);

    const handleConfirm = () => {
        if (!createAlbaran && !createProforma) {
            setShowError(true);
            return;
        }
        setShowError(false);
        onConfirm({ createAlbaran, createProforma });
        // Reset state after confirm
        setCreateAlbaran(false);
        setCreateProforma(false);
    };

    const handleClose = () => {
        setShowError(false);
        setCreateAlbaran(false);
        setCreateProforma(false);
        onClose();
    };

    const isConfirmDisabled = !createAlbaran && !createProforma;

    useEffect(() => {
        if (!isOpen) return;

        const focusTimer = window.setTimeout(() => {
            firstOptionRef.current?.focus();
        }, 0);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                handleClose();
                return;
            }

            if (event.key === 'Enter') {
                const target = event.target as HTMLElement | null;
                const targetTag = target?.tagName;
                const isInteractiveTarget = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT';
                if (isInteractiveTarget) return;

                event.preventDefault();
                handleConfirm();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, createAlbaran, createProforma, handleClose, handleConfirm]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-10">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="size-16 flex items-center justify-center rounded-2xl mb-6 bg-sky-50 text-sky-500">
                            <ExclamationTriangleIcon />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">Cierre de expedientes</h3>
                        <p className="text-sm font-normal text-slate-500 mt-3 leading-relaxed">
                            {selectedCasesCount > 0
                                ? `¿Cerrar ${selectedCasesCount} expediente${selectedCasesCount > 1 ? 's' : ''}?`
                                : '¿Cerrar expedientes?'}
                        </p>
                    </div>

                    {/* Opciones obligatorias */}
                    <div className="mb-6 space-y-3">
                        <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all cursor-pointer group">
                            <input
                                ref={firstOptionRef}
                                type="checkbox"
                                checked={createAlbaran}
                                onChange={(e) => {
                                    setCreateAlbaran(e.target.checked);
                                    if (e.target.checked || createProforma) setShowError(false);
                                }}
                                className="size-5 rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-sky-700 transition-colors">
                                Crear albarán
                            </span>
                        </label>

                        <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={createProforma}
                                onChange={(e) => {
                                    setCreateProforma(e.target.checked);
                                    if (e.target.checked || createAlbaran) setShowError(false);
                                }}
                                className="size-5 rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-sky-700 transition-colors">
                                Crear factura proforma
                            </span>
                        </label>
                    </div>

                    {/* Mensaje de error */}
                    {showError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-medium text-red-600 text-center">
                                Selecciona al menos una opción para continuar.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleConfirm}
                            variant="primary"
                            size="xl"
                            disabled={isConfirmDisabled}
                            className={isConfirmDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            CONFIRMAR
                        </Button>

                        <Button
                            onClick={handleClose}
                            variant="ghost"
                            size="md"
                            className="text-slate-400"
                        >
                            CANCELAR
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseCloseModal;

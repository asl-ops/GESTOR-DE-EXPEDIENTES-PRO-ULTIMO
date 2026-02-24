import React from 'react';
import { AlertTriangle, CheckCircle, Info, Trash2, X, AlertCircle } from 'lucide-react';

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success' | 'primary';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  description?: string; // Descripción adicional del impacto
  confirmText?: string;
  cancelText?: string;
  secondaryAction?: () => void;
  secondaryText?: string;
  variant?: ConfirmationVariant;
  icon?: React.ReactNode; // Icono personalizado opcional
  loading?: boolean; // Estado de carga durante la confirmación
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  secondaryAction,
  secondaryText,
  title,
  message,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  icon,
  loading = false
}) => {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const confirmButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const handleConfirm = React.useCallback(async () => {
    if (isConfirming || loading) return;
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error en confirmación:', error);
    } finally {
      setIsConfirming(false);
    }
  }, [isConfirming, loading, onConfirm, onClose]);

  const handleSecondary = () => {
    if (secondaryAction) {
      secondaryAction();
      onClose();
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const focusTimer = window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isConfirming && !loading) {
          onClose();
        }
      }

      if (event.key === 'Enter') {
        const target = event.target as HTMLElement | null;
        const targetTag = target?.tagName;
        const isInteractiveTarget = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT';
        if (isInteractiveTarget) return;

        event.preventDefault();
        void handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isConfirming, loading, onClose, handleConfirm]);

  if (!isOpen) return null;

  // Configuración de variantes
  const variantConfig = {
    danger: {
      icon: icon || <Trash2 className="w-6 h-6" />,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600',
      buttonText: 'text-white',
      borderColor: 'border-red-100'
    },
    warning: {
      icon: icon || <AlertTriangle className="w-6 h-6" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      buttonBg: 'bg-amber-500 hover:bg-amber-600',
      buttonText: 'text-white',
      borderColor: 'border-amber-100'
    },
    info: {
      icon: icon || <Info className="w-6 h-6" />,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-500',
      buttonBg: 'bg-sky-500 hover:bg-sky-600',
      buttonText: 'text-white',
      borderColor: 'border-sky-100'
    },
    success: {
      icon: icon || <CheckCircle className="w-6 h-6" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      buttonBg: 'bg-emerald-500 hover:bg-emerald-600',
      buttonText: 'text-white',
      borderColor: 'border-emerald-100'
    },
    primary: {
      icon: icon || <Info className="w-6 h-6" />,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-500',
      buttonBg: 'bg-sky-600 hover:bg-sky-700',
      buttonText: 'text-white',
      borderColor: 'border-sky-100'
    }
  };

  const config = variantConfig[variant] || variantConfig.danger;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con icono */}
        <div className="relative">
          <div className={`absolute top-0 left-0 right-0 h-1 ${config.buttonBg}`} />
          <div className="p-8 pb-6">
            <div className="flex items-start gap-4">
              {/* Icono */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.iconBg} ${config.iconColor} flex items-center justify-center`}>
                {config.icon}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {message}
                </p>
                {description && (
                  <div className={`mt-3 p-3 rounded-lg border ${config.borderColor} bg-slate-50/50`}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"
                disabled={isConfirming || loading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-8 pb-8 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Botón Cancelar */}
            <button
              onClick={onClose}
              disabled={isConfirming || loading}
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {cancelText}
            </button>

            {/* Botón Acción Secundaria (Salir sin guardar) */}
            {secondaryAction && (
              <button
                onClick={handleSecondary}
                disabled={isConfirming || loading}
                className="flex-1 h-11 px-4 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 text-sm font-medium text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {secondaryText}
              </button>
            )}

            {/* Botón Confirmar */}
            <button
              ref={confirmButtonRef}
              onClick={handleConfirm}
              disabled={isConfirming || loading}
              className={`flex-1 h-11 px-4 rounded-xl ${config.buttonBg} ${config.buttonText} text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-2`}
            >
              {(isConfirming || loading) && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

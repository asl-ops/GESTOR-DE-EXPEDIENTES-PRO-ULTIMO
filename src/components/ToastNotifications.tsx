import React, { useEffect } from 'react';
import { ToastMessage } from '../types';
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 2200);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const config = {
    success: {
      icon: <Check className="w-4 h-4" />,
      color: "text-emerald-500",
      bg: "bg-emerald-50/50",
      label: "Éxito"
    },
    error: {
      icon: <AlertCircle className="w-4 h-4" />,
      color: "text-rose-500",
      bg: "bg-rose-50/50",
      label: "Error"
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "text-amber-500",
      bg: "bg-amber-50/50",
      label: "Aviso"
    },
    info: {
      icon: <Info className="w-4 h-4" />,
      color: "text-sky-500",
      bg: "bg-sky-50/50",
      label: "Información"
    }
  };

  const style = config[toast.type] || config.info;

  return (
    <div
      className={cn(
        "group pointer-events-auto flex items-center gap-4 px-5 py-4 w-full max-w-sm",
        "bg-white/95 backdrop-blur-lg border border-slate-100 shadow-2xl rounded-[20px]",
        "transition-all duration-300 transform animate-in fade-in slide-in-from-right-4"
      )}
    >
      <div className={cn("flex-shrink-0 size-8 rounded-full flex items-center justify-center", style.bg, style.color)}>
        {style.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
          {style.label}
        </p>
        <p className="text-[13px] font-medium text-slate-600 leading-tight truncate">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 size-6 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, setToasts }) => {
  const handleDismiss = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <div
      aria-live="assertive"
      className="fixed top-6 right-6 flex flex-col items-end space-y-3 z-[9999] pointer-events-none sm:top-10 sm:right-10"
    >
      {toasts.slice(-2).map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
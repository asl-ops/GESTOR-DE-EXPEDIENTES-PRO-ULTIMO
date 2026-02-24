import { useToast } from './useToast';
import { useCallback } from 'react';

/**
 * Hook de Feedback Semántico (Política Hermes)
 * 
 * Sigue el principio de "Anunciar y Confiar":
 * - toast: Para acciones importantes, confirmaciones de éxito o errores críticos.
 * - announce: Alias para toast.info, comunica estados del sistema.
 */
export const useFeedback = () => {
    const { addToast } = useToast();

    const success = useCallback((message: string) => {
        addToast(message, 'success');
    }, [addToast]);

    const error = useCallback((message: string) => {
        addToast(message, 'error');
    }, [addToast]);

    const warn = useCallback((message: string) => {
        addToast(message, 'warning');
    }, [addToast]);

    const info = useCallback((message: string) => {
        addToast(message, 'info');
    }, [addToast]);

    return {
        toast: {
            success,
            error,
            warn,
            info,
            announce: info
        },
        // Nota: El feedback local (micro-acciones) se maneja mediante 
        // los componentes CopyAction y ActionFeedback directamente en la UI.
    };
};

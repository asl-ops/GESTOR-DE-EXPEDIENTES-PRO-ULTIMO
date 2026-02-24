import { useState, useCallback } from 'react';
import type { ConfirmationVariant } from '../components/ConfirmationModal';

interface ConfirmOptions {
    title: string;
    message: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    icon?: React.ReactNode;
}

interface ConfirmationState extends ConfirmOptions {
    isOpen: boolean;
    onConfirm: () => void | Promise<void>;
}

export const useConfirmation = () => {
    const [state, setState] = useState<ConfirmationState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'danger'
    });

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                ...options,
                isOpen: true,
                variant: options.variant || 'danger',
                onConfirm: async () => {
                    setState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                }
            });
        });
    }, []);

    const close = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        confirmationState: state,
        confirm,
        closeConfirmation: close
    };
};

// Funciones helper para casos comunes
export const confirmDelete = (itemName: string, description?: string) => ({
    title: `¿Eliminar ${itemName}?`,
    message: `Esta acción no se puede deshacer.`,
    description: description || `El ${itemName} será eliminado permanentemente de la base de datos.`,
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    variant: 'danger' as ConfirmationVariant
});

export const confirmClose = (itemName: string, description?: string) => ({
    title: `¿Cerrar ${itemName}?`,
    message: `¿Estás seguro de que deseas cerrar este ${itemName}?`,
    description: description || `El ${itemName} será marcado como cerrado y no podrá modificarse.`,
    confirmText: 'Cerrar',
    cancelText: 'Cancelar',
    variant: 'warning' as ConfirmationVariant
});

export const confirmVoid = (itemName: string, description?: string) => ({
    title: `¿Anular ${itemName}?`,
    message: `Esta acción marcará el documento como anulado.`,
    description: description || `El ${itemName} será anulado y no tendrá validez legal.`,
    confirmText: 'Anular',
    cancelText: 'Cancelar',
    variant: 'warning' as ConfirmationVariant
});

export const confirmDeactivate = (itemName: string, description?: string) => ({
    title: `¿Desactivar ${itemName}?`,
    message: `El ${itemName} será marcado como inactivo.`,
    description: description || `Podrás reactivarlo más tarde si es necesario.`,
    confirmText: 'Desactivar',
    cancelText: 'Cancelar',
    variant: 'warning' as ConfirmationVariant
});

export const confirmSave = (itemName: string, description?: string) => ({
    title: `¿Guardar cambios?`,
    message: `Los cambios en ${itemName} serán guardados.`,
    description,
    confirmText: 'Guardar',
    cancelText: 'Cancelar',
    variant: 'info' as ConfirmationVariant
});

import { useState, useEffect, useCallback } from 'react';
import { SavedView, SavedViewCreate, SavedViewUpdate, ViewType } from '@/types/savedView';
import SavedViewService from '@/services/savedViewService';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from './useToast';

/**
 * Hook para gestionar vistas guardadas (filtros guardados)
 */
export const useSavedViews = (viewType: ViewType) => {
    const { currentUser } = useAppContext();
    const { addToast } = useToast();

    const [views, setViews] = useState<SavedView[]>([]);
    const [predefinedViews, setPredefinedViews] = useState<SavedView[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);

    // Cargar vistas al montar
    useEffect(() => {
        if (!currentUser) return;

        loadViews();

        // En expedientes trabajamos solo con filtros y vistas del usuario.
        // Ocultamos las predefinidas del sistema (activos, urgentes, documentación, etc.).
        const predef = viewType === 'cases'
            ? []
            : SavedViewService.getPredefinedViews(viewType, currentUser.id);
        setPredefinedViews(predef);
    }, [currentUser, viewType]);

    // Suscripción en tiempo real (opcional)
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = SavedViewService.subscribeToUserViews(
            currentUser.id,
            viewType,
            (updatedViews) => {
                setViews(updatedViews);
            }
        );

        return () => unsubscribe();
    }, [currentUser, viewType]);

    /**
     * Cargar todas las vistas del usuario
     */
    const loadViews = useCallback(async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            const userViews = await SavedViewService.getUserViews(currentUser.id, viewType);
            setViews(userViews);
        } catch (error) {
            console.error('Error loading saved views:', error);
            addToast('Error al cargar vistas guardadas', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentUser, viewType, addToast]);

    /**
     * Crear nueva vista
     */
    const createView = useCallback(async (viewData: SavedViewCreate): Promise<SavedView | null> => {
        if (!currentUser) return null;

        try {
            const newView = await SavedViewService.createView(
                viewData,
                currentUser.id,
                currentUser.name
            );

            addToast(`Vista "${newView.name}" creada`, 'success');
            await loadViews();
            return newView;
        } catch (error) {
            console.error('Error creating view:', error);
            addToast('Error al crear vista', 'error');
            return null;
        }
    }, [currentUser, addToast, loadViews]);

    /**
     * Actualizar vista existente
     */
    const updateView = useCallback(async (
        viewId: string,
        updates: SavedViewUpdate
    ): Promise<boolean> => {
        if (!currentUser) return false;

        try {
            await SavedViewService.updateView(viewId, updates, currentUser.id);
            addToast('Vista actualizada', 'success');
            await loadViews();
            return true;
        } catch (error: any) {
            console.error('Error updating view:', error);
            addToast(error.message || 'Error al actualizar vista', 'error');
            return false;
        }
    }, [currentUser, addToast, loadViews]);

    /**
     * Eliminar vista
     */
    const deleteView = useCallback(async (viewId: string): Promise<boolean> => {
        if (!currentUser) return false;

        try {
            await SavedViewService.deleteView(viewId, currentUser.id);
            addToast('Vista eliminada', 'success');

            if (activeViewId === viewId) {
                setActiveViewId(null);
            }

            await loadViews();
            return true;
        } catch (error: any) {
            console.error('Error deleting view:', error);
            addToast(error.message || 'Error al eliminar vista', 'error');
            return false;
        }
    }, [currentUser, activeViewId, addToast, loadViews]);

    /**
     * Aplicar una vista (registrar uso y devolver filtros)
     */
    const applyView = useCallback(async (viewId: string) => {
        // Buscar en vistas guardadas
        let view = views.find(v => v.id === viewId);

        // Si no está, buscar en predefinidas
        if (!view) {
            view = predefinedViews.find(v => v.id === viewId);
        }

        if (!view) {
            addToast('Vista no encontrada', 'error');
            return null;
        }

        // Registrar uso (solo para vistas guardadas)
        if (!viewId.startsWith('preset-')) {
            await SavedViewService.recordViewUsage(viewId);
        }

        setActiveViewId(viewId);
        return view.filters;
    }, [views, predefinedViews, addToast]);

    /**
     * Compartir vista con usuarios
     */
    const shareView = useCallback(async (
        viewId: string,
        userIds: string[]
    ): Promise<boolean> => {
        if (!currentUser) return false;

        try {
            await SavedViewService.shareView(viewId, userIds, currentUser.id);
            addToast('Vista compartida', 'success');
            await loadViews();
            return true;
        } catch (error: any) {
            console.error('Error sharing view:', error);
            addToast(error.message || 'Error al compartir vista', 'error');
            return false;
        }
    }, [currentUser, addToast, loadViews]);

    /**
     * Hacer vista pública/privada
     */
    const togglePublic = useCallback(async (
        viewId: string,
        isPublic: boolean
    ): Promise<boolean> => {
        if (!currentUser) return false;

        try {
            await SavedViewService.makeViewPublic(viewId, isPublic, currentUser.id);
            addToast(isPublic ? 'Vista ahora es pública' : 'Vista ahora es privada', 'success');
            await loadViews();
            return true;
        } catch (error: any) {
            console.error('Error toggling public:', error);
            addToast(error.message || 'Error al cambiar visibilidad', 'error');
            return false;
        }
    }, [currentUser, addToast, loadViews]);

    /**
     * Duplicar vista
     */
    const duplicateView = useCallback(async (viewId: string): Promise<SavedView | null> => {
        if (!currentUser) return null;

        try {
            const newView = await SavedViewService.duplicateView(
                viewId,
                currentUser.id,
                currentUser.name
            );

            addToast(`Vista duplicada como "${newView.name}"`, 'success');
            await loadViews();
            return newView;
        } catch (error: any) {
            console.error('Error duplicating view:', error);
            addToast(error.message || 'Error al duplicar vista', 'error');
            return null;
        }
    }, [currentUser, addToast, loadViews]);

    /**
     * Fijar/desfijar vista
     */
    const togglePin = useCallback(async (viewId: string): Promise<boolean> => {
        const view = views.find(v => v.id === viewId);
        if (!view) return false;

        return updateView(viewId, { isPinned: !view.isPinned });
    }, [views, updateView]);

    /**
     * Limpiar vista activa
     */
    const clearActiveView = useCallback(() => {
        setActiveViewId(null);
    }, []);

    /**
     * Obtener vista activa
     */
    const getActiveView = useCallback((): SavedView | null => {
        if (!activeViewId) return null;

        return views.find(v => v.id === activeViewId) ||
            predefinedViews.find(v => v.id === activeViewId) ||
            null;
    }, [activeViewId, views, predefinedViews]);

    return {
        // Estado
        views,
        predefinedViews,
        allViews: [...predefinedViews, ...views],
        loading,
        activeViewId,
        activeView: getActiveView(),

        // Acciones
        createView,
        updateView,
        deleteView,
        applyView,
        shareView,
        togglePublic,
        duplicateView,
        togglePin,
        clearActiveView,
        loadViews
    };
};

export default useSavedViews;

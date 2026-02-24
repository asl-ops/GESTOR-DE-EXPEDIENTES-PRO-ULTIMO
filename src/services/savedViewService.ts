import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    increment
} from 'firebase/firestore';
import { db } from './firebase';
import {
    SavedView,
    SavedViewCreate,
    SavedViewUpdate,
    ViewType,
    PREDEFINED_VIEWS
} from '@/types/savedView';

const COLLECTION_NAME = 'savedViews';

/**
 * Servicio para gestionar vistas guardadas (filtros guardados)
 */
export class SavedViewService {
    /**
     * Crear una nueva vista guardada
     */
    static async createView(
        viewData: SavedViewCreate,
        userId: string,
        userName?: string
    ): Promise<SavedView> {
        const now = new Date().toISOString();

        const newView: Omit<SavedView, 'id'> = {
            ...viewData,
            createdBy: userId,
            createdByName: userName,
            createdAt: now,
            updatedAt: now,
            isShared: viewData.isShared || false,
            isPublic: viewData.isPublic || false,
            isPinned: false,
            usageCount: 0
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), newView);

        return {
            id: docRef.id,
            ...newView
        };
    }

    /**
     * Obtener todas las vistas de un usuario (propias + compartidas + públicas)
     */
    static async getUserViews(userId: string, type?: ViewType): Promise<SavedView[]> {
        const views: SavedView[] = [];

        // 1. Vistas propias del usuario
        let q = query(
            collection(db, COLLECTION_NAME),
            where('createdBy', '==', userId)
        );

        if (type) {
            q = query(q, where('type', '==', type));
        }

        const ownSnapshot = await getDocs(q);
        ownSnapshot.forEach(doc => {
            views.push({ id: doc.id, ...doc.data() } as SavedView);
        });

        // 2. Vistas compartidas con el usuario
        let sharedQuery = query(
            collection(db, COLLECTION_NAME),
            where('sharedWith', 'array-contains', userId)
        );

        if (type) {
            sharedQuery = query(sharedQuery, where('type', '==', type));
        }

        const sharedSnapshot = await getDocs(sharedQuery);
        sharedSnapshot.forEach(doc => {
            views.push({ id: doc.id, ...doc.data() } as SavedView);
        });

        // 3. Vistas públicas (excluyendo las que ya tenemos)
        let publicQuery = query(
            collection(db, COLLECTION_NAME),
            where('isPublic', '==', true)
        );

        if (type) {
            publicQuery = query(publicQuery, where('type', '==', type));
        }

        const publicSnapshot = await getDocs(publicQuery);
        const existingIds = new Set(views.map(v => v.id));

        publicSnapshot.forEach(doc => {
            if (!existingIds.has(doc.id)) {
                views.push({ id: doc.id, ...doc.data() } as SavedView);
            }
        });

        // Ordenar por: pinned > order > usageCount > name
        return views.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            if (a.order !== b.order) return (a.order || 999) - (b.order || 999);
            if (a.usageCount !== b.usageCount) return (b.usageCount || 0) - (a.usageCount || 0);
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Obtener vistas predefinidas del sistema
     */
    static getPredefinedViews(type: ViewType, userId?: string): SavedView[] {
        const views = PREDEFINED_VIEWS[type] || [];

        // Añadir userId a filtros que lo requieran
        return views.map(view => {
            if (view.filters.status === 'Abierto' && userId) {
                return {
                    ...view,
                    filters: {
                        ...view.filters,
                        responsibleId: userId
                    }
                };
            }

            // Calcular fechas dinámicas para "este mes"
            if (view.id.includes('pending') && view.type === 'invoices') {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                return {
                    ...view,
                    filters: {
                        ...view.filters,
                        startDate: firstDay.toISOString().split('T')[0],
                        endDate: lastDay.toISOString().split('T')[0]
                    }
                };
            }

            return view;
        });
    }

    /**
     * Obtener una vista por ID
     */
    static async getView(viewId: string): Promise<SavedView | null> {
        const docRef = doc(db, COLLECTION_NAME, viewId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as SavedView;
        }

        return null;
    }

    /**
     * Actualizar una vista
     */
    static async updateView(
        viewId: string,
        updates: SavedViewUpdate,
        userId: string
    ): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, viewId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Vista no encontrada');
        }

        const view = docSnap.data() as SavedView;

        // Verificar permisos
        if (view.createdBy !== userId) {
            throw new Error('No tienes permisos para editar esta vista');
        }

        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Eliminar una vista
     */
    static async deleteView(viewId: string, userId: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, viewId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Vista no encontrada');
        }

        const view = docSnap.data() as SavedView;

        // Verificar permisos
        if (view.createdBy !== userId) {
            throw new Error('No tienes permisos para eliminar esta vista');
        }

        await deleteDoc(docRef);
    }

    /**
     * Registrar uso de una vista (incrementar contador)
     */
    static async recordViewUsage(viewId: string): Promise<void> {
        // Solo para vistas guardadas, no predefinidas
        if (viewId.startsWith('preset-')) return;

        const docRef = doc(db, COLLECTION_NAME, viewId);
        await updateDoc(docRef, {
            usageCount: increment(1),
            lastUsedAt: new Date().toISOString()
        });
    }

    /**
     * Compartir vista con usuarios específicos
     */
    static async shareView(
        viewId: string,
        userIds: string[],
        currentUserId: string
    ): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, viewId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Vista no encontrada');
        }

        const view = docSnap.data() as SavedView;

        if (view.createdBy !== currentUserId) {
            throw new Error('No tienes permisos para compartir esta vista');
        }

        await updateDoc(docRef, {
            isShared: true,
            sharedWith: userIds,
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Hacer vista pública
     */
    static async makeViewPublic(
        viewId: string,
        isPublic: boolean,
        currentUserId: string
    ): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, viewId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Vista no encontrada');
        }

        const view = docSnap.data() as SavedView;

        if (view.createdBy !== currentUserId) {
            throw new Error('No tienes permisos para modificar esta vista');
        }

        await updateDoc(docRef, {
            isPublic,
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Suscripción en tiempo real a las vistas del usuario
     */
    static subscribeToUserViews(
        userId: string,
        type: ViewType,
        callback: (views: SavedView[]) => void
    ): () => void {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('createdBy', '==', userId),
            where('type', '==', type)
        );

        return onSnapshot(q, (snapshot) => {
            const views: SavedView[] = [];
            snapshot.forEach(doc => {
                views.push({ id: doc.id, ...doc.data() } as SavedView);
            });
            callback(views);
        });
    }

    /**
     * Duplicar una vista (crear copia)
     */
    static async duplicateView(
        viewId: string,
        userId: string,
        userName?: string
    ): Promise<SavedView> {
        const view = await this.getView(viewId);

        if (!view) {
            throw new Error('Vista no encontrada');
        }

        const newViewData: SavedViewCreate = {
            name: `${view.name} (Copia)`,
            description: view.description,
            type: view.type,
            filters: { ...view.filters },
            icon: view.icon,
            color: view.color,
            isShared: false,
            isPublic: false
        };

        return this.createView(newViewData, userId, userName);
    }
}

export default SavedViewService;

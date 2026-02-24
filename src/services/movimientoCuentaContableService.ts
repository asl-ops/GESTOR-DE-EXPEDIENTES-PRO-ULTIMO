import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where
} from 'firebase/firestore';
import { db } from './firebase';
import { MovimientoCuentaContable } from '../types';

const COLLECTION_NAME = 'movimientoCuentasContables';

/**
 * Get all cuentas contables for a movimiento
 */
export async function getCuentasContablesByMovimiento(movimientoId: string): Promise<MovimientoCuentaContable[]> {
    try {
        const q = query(collection(db, COLLECTION_NAME), where('movimientoId', '==', movimientoId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as MovimientoCuentaContable));
    } catch (error) {
        console.error('Error getting cuentas contables:', error);
        throw error;
    }
}

/**
 * Get a single cuenta contable by ID
 */
export async function getCuentaContableById(id: string): Promise<MovimientoCuentaContable | null> {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            } as MovimientoCuentaContable;
        }
        return null;
    } catch (error) {
        console.error('Error getting cuenta contable:', error);
        throw error;
    }
}

/**
 * Add a cuenta contable to a movimiento
 */
export async function addCuentaContable(
    data: Omit<MovimientoCuentaContable, 'id'>
): Promise<MovimientoCuentaContable> {
    try {
        // Check for duplicate rol for same movimiento
        const existing = await getCuentasContablesByMovimiento(data.movimientoId);
        const hasDuplicateRol = existing.some(c => c.rol === data.rol);

        if (hasDuplicateRol) {
            throw new Error(`Ya existe una cuenta con el rol "${data.rol}" para este movimiento`);
        }

        const docRef = await addDoc(collection(db, COLLECTION_NAME), data);

        return {
            id: docRef.id,
            ...data
        };
    } catch (error) {
        console.error('Error adding cuenta contable:', error);
        throw error;
    }
}

/**
 * Update a cuenta contable
 */
export async function updateCuentaContable(
    id: string,
    data: Partial<Omit<MovimientoCuentaContable, 'id'>>
): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error('Error updating cuenta contable:', error);
        throw error;
    }
}

/**
 * Delete a cuenta contable
 */
export async function deleteCuentaContable(id: string): Promise<void> {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting cuenta contable:', error);
        throw error;
    }
}

/**
 * Set all cuentas contables for a movimiento (replaces existing)
 */
export async function setCuentasContables(
    movimientoId: string,
    cuentas: Array<Omit<MovimientoCuentaContable, 'id' | 'movimientoId'>>
): Promise<void> {
    try {
        // Delete existing cuentas
        const existing = await getCuentasContablesByMovimiento(movimientoId);
        await Promise.all(existing.map(c => deleteCuentaContable(c.id)));

        // Add new cuentas
        await Promise.all(
            cuentas.map(cuenta =>
                addCuentaContable({ ...cuenta, movimientoId })
            )
        );
    } catch (error) {
        console.error('Error setting cuentas contables:', error);
        throw error;
    }
}

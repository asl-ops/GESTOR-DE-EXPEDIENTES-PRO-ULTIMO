
import { db } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { PaymentMethod, PaymentMethodCreateInput } from '@/types/paymentMethod';

const paymentMethodsCollection = collection(db, 'payment_methods');

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    const q = query(paymentMethodsCollection, orderBy('orden', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
};

export const subscribeToPaymentMethods = (callback: (methods: PaymentMethod[]) => void) => {
    const q = query(paymentMethodsCollection, orderBy('orden', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
        callback(methods);
    });
};

export const savePaymentMethod = async (method: Partial<PaymentMethod>): Promise<void> => {
    const id = method.id || crypto.randomUUID();
    const docRef = doc(db, 'payment_methods', id);
    const now = new Date().toISOString();

    const data = {
        ...method,
        id,
        updatedAt: now,
        createdAt: method.createdAt || now
    };

    await setDoc(docRef, data, { merge: true });
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
    const docRef = doc(db, 'payment_methods', id);
    await deleteDoc(docRef);
};

/**
 * Seed initial payment methods if collection is empty
 */
export const seedPaymentMethods = async () => {
    const existing = await getPaymentMethods();
    if (existing.length > 0) return;

    const initialMethods: PaymentMethodCreateInput[] = [
        { codigo: 1, nombre: 'Contado', activo: true, orden: 1 },
        { codigo: 2, nombre: 'Reembolso', activo: true, orden: 2 },
        { codigo: 3, nombre: 'Bizum', activo: true, orden: 3 },
    ];

    for (const method of initialMethods) {
        await savePaymentMethod(method);
    }
};

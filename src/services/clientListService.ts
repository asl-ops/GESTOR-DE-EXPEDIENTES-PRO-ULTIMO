
import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where
} from 'firebase/firestore';
import { ClientList } from '@/types/clientList';

const COLLECTION_NAME = 'clientLists';

export async function getUserClientLists(userId: string): Promise<ClientList[]> {
    if (!userId) return [];
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as ClientList))
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching user client lists:", error);
        // Fallback to localStorage if Firebase fails or for offline mode
        const local = localStorage.getItem(`clientLists_${userId}`);
        return local ? JSON.parse(local) : [];
    }
}

export async function saveClientList(list: ClientList): Promise<void> {
    if (!list.userId) return;
    try {
        const docRef = doc(db, COLLECTION_NAME, list.id);
        await setDoc(docRef, list, { merge: true });

        // Sync to local as backup
        if (list.userId) {
            const current = await getUserClientLists(list.userId);
            const index = current.findIndex(l => l.id === list.id);
            if (index >= 0) current[index] = list;
            else current.push(list);
            localStorage.setItem(`clientLists_${list.userId}`, JSON.stringify(current));
        }
    } catch (error) {
        console.error("Error saving client list:", error);
        if (list.userId) {
            const local = localStorage.getItem(`clientLists_${list.userId}`);
            const current: ClientList[] = local ? JSON.parse(local) : [];
            const index = current.findIndex(l => l.id === list.id);
            if (index >= 0) current[index] = list;
            else current.push(list);
            localStorage.setItem(`clientLists_${list.userId}`, JSON.stringify(current));
        }
    }
}

export async function deleteClientList(listId: string, userId: string): Promise<void> {
    if (!userId) return;
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, listId));

        const local = localStorage.getItem(`clientLists_${userId}`);
        if (local) {
            const current: ClientList[] = JSON.parse(local);
            const filtered = current.filter(l => l.id !== listId);
            localStorage.setItem(`clientLists_${userId}`, JSON.stringify(filtered));
        }
    } catch (error) {
        console.error("Error deleting client list:", error);
    }
}

import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Draft, CaseRecord } from '@/types';

const DRAFTS_COLLECTION = 'drafts';

/**
 * Save a draft of case data
 */
export const saveDraft = async (
    fileNumber: string,
    userId: string,
    data: Partial<CaseRecord>,
    autoSaved: boolean = true
): Promise<void> => {
    try {
        const draftId = `${userId}_${fileNumber}`;
        const draft: Draft = {
            id: draftId,
            fileNumber,
            userId,
            data,
            lastSaved: new Date().toISOString(),
            autoSaved,
            version: Date.now()
        };

        await setDoc(doc(db, DRAFTS_COLLECTION, draftId), draft);
    } catch (error) {
        console.error('Error saving draft:', error);
        throw error;
    }
};

/**
 * Get draft for a specific case and user
 */
export const getDraft = async (fileNumber: string, userId: string): Promise<Draft | null> => {
    try {
        const draftsRef = collection(db, DRAFTS_COLLECTION);
        const q = query(
            draftsRef,
            where('fileNumber', '==', fileNumber),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const drafts = snapshot.docs
            .map(doc => doc.data() as Draft)
            .sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());

        return drafts[0];
    } catch (error) {
        console.error('Error getting draft:', error);
        return null;
    }
};

/**
 * Delete draft after successful save
 */
export const deleteDraft = async (fileNumber: string, userId: string): Promise<void> => {
    try {
        const draftId = `${userId}_${fileNumber}`;
        await deleteDoc(doc(db, DRAFTS_COLLECTION, draftId));
    } catch (error) {
        console.error('Error deleting draft:', error);
    }
};

/**
 * Get all drafts for a user
 */
export const listUserDrafts = async (userId: string): Promise<Draft[]> => {
    try {
        const draftsRef = collection(db, DRAFTS_COLLECTION);
        const q = query(
            draftsRef,
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => doc.data() as Draft)
            .sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());
    } catch (error) {
        console.error('Error listing drafts:', error);
        return [];
    }
};

/**
 * Check if draft exists and is newer than last save
 */
export const hasDraft = async (fileNumber: string, userId: string, lastSavedTime?: string): Promise<boolean> => {
    try {
        const draft = await getDraft(fileNumber, userId);
        if (!draft) return false;

        if (lastSavedTime) {
            return new Date(draft.lastSaved) > new Date(lastSavedTime);
        }

        return true;
    } catch (error) {
        console.error('Error checking draft:', error);
        return false;
    }
};

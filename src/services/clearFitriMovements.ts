/**
 * ADMINISTRATIVE UTILITY: Clear Predefined Movements for FITRI Prefix
 * 
 * This script deletes ALL predefined movements associated with the FITRI prefix.
 * Use this to reset the prefix configuration and start fresh.
 * 
 * IMPORTANT: This action is irreversible. Make sure you have a backup if needed.
 */

import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'prefijoMovimientos';
const FITRI_PREFIX_ID = 'prefix_FITRI';

/**
 * Delete all predefined movements for the FITRI prefix
 * @returns Number of movements deleted
 */
export async function clearFitriPredefinedMovements(): Promise<number> {
    console.log('🗑️ Starting deletion of FITRI predefined movements...');

    try {
        // Query all movements for FITRI prefix
        const q = query(
            collection(db, COLLECTION_NAME),
            where('prefijoId', '==', FITRI_PREFIX_ID)
        );

        const querySnapshot = await getDocs(q);
        console.log(`📋 Found ${querySnapshot.size} movements to delete`);

        if (querySnapshot.empty) {
            console.log('✅ No movements found. Nothing to delete.');
            return 0;
        }

        // Delete each movement
        let deletedCount = 0;
        const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
            const movementData = docSnapshot.data();
            console.log(`🗑️ Deleting: ${movementData.nombre} (${docSnapshot.id})`);
            await deleteDoc(doc(db, COLLECTION_NAME, docSnapshot.id));
            deletedCount++;
        });

        await Promise.all(deletePromises);

        console.log(`✅ Successfully deleted ${deletedCount} predefined movements from FITRI prefix`);
        return deletedCount;

    } catch (error) {
        console.error('❌ Error deleting FITRI predefined movements:', error);
        throw error;
    }
}

/**
 * BROWSER CONSOLE USAGE:
 * 
 * 1. Open browser console (F12)
 * 2. Navigate to the Prefix Editor for FITRI
 * 3. Run this command:
 * 
 *    import('./services/clearFitriMovements').then(m => m.clearFitriPredefinedMovements())
 * 
 * Or add a button in the UI that calls this function.
 */

// Export for use in other modules
export default clearFitriPredefinedMovements;

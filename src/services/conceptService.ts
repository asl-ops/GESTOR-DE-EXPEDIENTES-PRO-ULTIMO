import { collection, doc, getDocs, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { ConceptCatalog, LineType } from '@/types';

const CONCEPTS_COLLECTION = 'concepts';

/**
 * Get all concepts from the catalog
 */
export const getConcepts = async (): Promise<ConceptCatalog[]> => {
    try {
        const conceptsRef = collection(db, CONCEPTS_COLLECTION);
        const q = query(conceptsRef, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ConceptCatalog));
    } catch (error) {
        console.error('Error getting concepts:', error);
        return [];
    }
};

/**
 * Get only active concepts
 */
export const getActiveConcepts = async (): Promise<ConceptCatalog[]> => {
    try {
        const conceptsRef = collection(db, CONCEPTS_COLLECTION);
        const q = query(
            conceptsRef,
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ConceptCatalog))
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error getting active concepts:', error);
        return [];
    }
};

/**
 * Get concepts by type (suplido or honorario)
 */
export const getConceptsByType = async (type: LineType): Promise<ConceptCatalog[]> => {
    try {
        const conceptsRef = collection(db, CONCEPTS_COLLECTION);
        const q = query(
            conceptsRef,
            where('category', '==', type),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ConceptCatalog))
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error getting concepts by type:', error);
        return [];
    }
};

/**
 * Get a single concept by ID
 */
export const getConceptById = async (conceptId: string): Promise<ConceptCatalog | null> => {
    try {
        const concepts = await getConcepts();
        return concepts.find(c => c.id === conceptId) || null;
    } catch (error) {
        console.error('Error getting concept by ID:', error);
        return null;
    }
};

/**
 * Save or update a concept
 */
export const saveConcept = async (concept: ConceptCatalog): Promise<void> => {
    try {
        const conceptRef = doc(db, CONCEPTS_COLLECTION, concept.id);
        await setDoc(conceptRef, {
            ...concept,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving concept:', error);
        throw new Error('No se pudo guardar el concepto. Verifica tu conexión.');
    }
};

/**
 * Delete a concept (soft delete by setting isActive to false)
 */
export const deleteConcept = async (conceptId: string): Promise<void> => {
    try {
        const concept = await getConceptById(conceptId);
        if (!concept) {
            throw new Error('Concepto no encontrado');
        }

        // Soft delete: just mark as inactive
        await saveConcept({
            ...concept,
            isActive: false
        });
    } catch (error) {
        console.error('Error deleting concept:', error);
        throw new Error('No se pudo eliminar el concepto.');
    }
};

/**
 * Create a new concept
 */
export const createConcept = async (
    name: string,
    category: LineType
): Promise<ConceptCatalog> => {
    const newConcept: ConceptCatalog = {
        id: `concept_${Date.now()}`,
        name,
        category,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await saveConcept(newConcept);
    return newConcept;
};

/**
 * Initialize default concepts if none exist
 */
export const initializeDefaultConcepts = async (): Promise<void> => {
    try {
        const existing = await getConcepts();
        if (existing.length > 0) {
            return; // Already initialized
        }

        // Default suplidos
        const defaultSuplidos = [
            'Notaría',
            'Registro',
            'Tasas DGT',
            'Impuesto de Matriculación',
            'Gestoría Administrativa'
        ];

        // Default honorarios
        const defaultHonorarios = [
            'Honorarios Gestoría',
            'Honorarios Tramitación',
            'Honorarios Asesoramiento'
        ];

        // Create all defaults
        for (const name of defaultSuplidos) {
            await createConcept(name, 'suplido');
        }

        for (const name of defaultHonorarios) {
            await createConcept(name, 'honorario');
        }

        console.log('Default concepts initialized successfully');
    } catch (error) {
        console.error('Error initializing default concepts:', error);
    }
};

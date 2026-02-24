import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { MandateTemplate } from '@/types';

const TEMPLATES_COLLECTION = 'mandateTemplates';
const TEMPLATES_STORAGE_PATH = 'mandate-templates';

/**
 * Upload template file to Firebase Storage
 */
export const uploadTemplateFile = async (file: File): Promise<string> => {
    try {
        console.log('[TemplateService] Starting file upload...', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });

        // Verificar que Firebase Storage está configurado
        if (!storage) {
            throw new Error('Firebase Storage no está inicializado');
        }

        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storagePath = `${TEMPLATES_STORAGE_PATH}/${fileName}`;

        console.log('[TemplateService] Creating storage reference:', storagePath);
        const storageRef = ref(storage, storagePath);

        console.log('[TemplateService] Uploading file...');
        const uploadResult = await uploadBytes(storageRef, file);
        console.log('[TemplateService] Upload successful:', uploadResult.metadata.fullPath);

        console.log('[TemplateService] Getting download URL...');
        const downloadURL = await getDownloadURL(storageRef);
        console.log('[TemplateService] Download URL obtained:', downloadURL);

        return downloadURL;
    } catch (error: any) {
        console.error('[TemplateService] Error uploading template file:', error);
        console.error('[TemplateService] Error details:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse
        });

        // Proporcionar mensajes de error más descriptivos
        if (error.code === 'storage/unauthorized') {
            throw new Error('No tienes permisos para subir archivos. Verifica las reglas de Firebase Storage.');
        } else if (error.code === 'storage/canceled') {
            throw new Error('La subida fue cancelada.');
        } else if (error.code === 'storage/unknown') {
            throw new Error('Error desconocido de Firebase Storage. Verifica tu configuración.');
        } else if (error.code === 'storage/retry-limit-exceeded') {
            throw new Error('Tiempo de espera agotado. Verifica tu conexión a Internet.');
        } else if (error.message?.includes('Firebase Storage')) {
            throw error;
        }

        throw new Error(`Error al subir archivo: ${error.message || 'Error desconocido'}`);
    }
};

/**
 * Create a new mandate template
 */
export const createTemplate = async (
    name: string,
    file: File,
    userId: string,
    prefixId?: string,
    description?: string
): Promise<MandateTemplate> => {
    try {
        const fileUrl = await uploadTemplateFile(file);

        // Extract variables from template (simplified - in production, parse DOCX)
        const commonVariables = [
            'CLIENT_FULL_NAME', 'CLIENT_NIF', 'CLIENT_ADDRESS',
            'GESTOR_NAME', 'GESTOR_DNI', 'GESTOR_COLEGIADO_NUM',
            'GESTOR_DESPACHO', 'GESTOR_DESPACHO_DIRECCION',
            'CURRENT_CITY', 'CURRENT_DAY', 'CURRENT_MONTH', 'CURRENT_YEAR',
            'ASUNTO', 'VEHICLE_VIN', 'VEHICLE_BRAND', 'VEHICLE_MODEL'
        ];

        const template: MandateTemplate = {
            id: `template_${Date.now()}`,
            name,
            description,
            prefixId,
            fileUrl,
            fileName: file.name,
            variables: commonVariables,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId
        };

        await setDoc(doc(db, TEMPLATES_COLLECTION, template.id), template);
        return template;
    } catch (error) {
        console.error('Error creating template:', error);
        throw error;
    }
};

/**
 * Get all templates
 */
export const getTemplates = async (): Promise<MandateTemplate[]> => {
    try {
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(templatesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data() as MandateTemplate);
    } catch (error) {
        console.error('Error getting templates:', error);
        return [];
    }
};

/**
 * Get active templates
 */
export const getActiveTemplates = async (): Promise<MandateTemplate[]> => {
    try {
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(
            templatesRef,
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs
            .map(doc => doc.data() as MandateTemplate)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error('Error getting active templates:', error);
        return [];
    }
};

/**
 * Get template by prefix
 */
export const getTemplateByPrefix = async (prefixId: string): Promise<MandateTemplate | null> => {
    try {
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(
            templatesRef,
            where('prefixId', '==', prefixId),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Try to get global template
            return getGlobalTemplate();
        }

        const templates = snapshot.docs
            .map(doc => doc.data() as MandateTemplate)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return templates[0];
    } catch (error) {
        console.error('Error getting template by prefix:', error);
        return null;
    }
};

/**
 * Get global template (no prefix)
 */
export const getGlobalTemplate = async (): Promise<MandateTemplate | null> => {
    try {
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(
            templatesRef,
            where('prefixId', '==', null),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const templates = snapshot.docs
            .map(doc => doc.data() as MandateTemplate)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return templates[0];
    } catch (error) {
        console.error('Error getting global template:', error);
        return null;
    }
};

/**
 * Update template
 */
export const updateTemplate = async (
    templateId: string,
    updates: Partial<MandateTemplate>
): Promise<void> => {
    try {
        const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
        await setDoc(templateRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating template:', error);
        throw error;
    }
};

/**
 * Replace template file with a new one
 */
export const replaceTemplateFile = async (
    templateId: string,
    newFile: File
): Promise<void> => {
    try {
        console.log('[TemplateService] Replacing file for template:', templateId);

        // Upload new file
        const newFileUrl = await uploadTemplateFile(newFile);

        // Update template with new file info
        await updateTemplate(templateId, {
            fileUrl: newFileUrl,
            fileName: newFile.name
        });

        console.log('[TemplateService] File replaced successfully');
    } catch (error) {
        console.error('Error replacing template file:', error);
        throw error;
    }
};

/**
 * Delete template (soft delete)
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
    try {
        await updateTemplate(templateId, { isActive: false });
    } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
};

/**
 * Permanently delete template and file
 */
export const permanentlyDeleteTemplate = async (template: MandateTemplate): Promise<void> => {
    try {
        // Delete from Firestore
        await deleteDoc(doc(db, TEMPLATES_COLLECTION, template.id));

        // Delete from Storage
        const storageRef = ref(storage, template.fileUrl);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error permanently deleting template:', error);
        throw error;
    }
};

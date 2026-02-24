import { useState, useCallback } from 'react';
import { db } from '../services/firebase';
import {
    collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc,
    onSnapshot, limit, runTransaction
} from 'firebase/firestore';
import { Proforma, ProformaStatus } from '../types/billing';
import { useToast } from './useToast';

export const useProformas = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    /**
     * Create a new draft proforma
     */
    const createProforma = useCallback(async (data?: Partial<Omit<Proforma, 'id'>>) => {
        setLoading(true);
        try {
            const proforma: Omit<Proforma, 'id'> = {
                clientId: data?.clientId || null,
                clientName: data?.clientName || undefined,
                clientIdentity: data?.clientIdentity || undefined,
                caseId: data?.caseId || null,
                caseNumber: data?.caseNumber || undefined,
                createdAt: new Date().toISOString(),
                status: 'draft',
                lines: data?.lines || [],
                subtotal: data?.subtotal || 0,
                vatTotal: data?.vatTotal || 0,
                total: data?.total || 0,
                notes: data?.notes || ''
            };

            const docRef = await addDoc(collection(db, 'proformas'), proforma);
            addToast('Proforma creada correctamente', 'success');
            return { id: docRef.id, ...proforma } as Proforma;
        } catch (error) {
            console.error('[Proformas] Error creating proforma:', error);
            addToast('Error al crear proforma', 'error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    /**
     * Update a proforma
     */
    const updateProforma = useCallback(async (id: string, data: Partial<Proforma>) => {
        try {
            const ref = doc(db, 'proformas', id);
            await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() });
            addToast('Proforma actualizada', 'success');
            return true;
        } catch (error) {
            console.error('[Proformas] Error updating proforma:', error);
            addToast('Error al actualizar proforma', 'error');
            return false;
        }
    }, [addToast]);

    /**
     * Update proforma status
     */
    const updateProformaStatus = useCallback(async (id: string, status: ProformaStatus) => {
        try {
            const ref = doc(db, 'proformas', id);
            await updateDoc(ref, { status, updatedAt: new Date().toISOString() });

            const statusLabels: Record<ProformaStatus, string> = {
                draft: 'borrador',
                sent: 'enviada',
                accepted: 'aceptada',
                rejected: 'rechazada',
                invoiced: 'facturada',
                void: 'anulada'
            };
            addToast(`Proforma marcada como ${statusLabels[status]}`, 'success');
            return true;
        } catch (error) {
            console.error('[Proformas] Error updating status:', error);
            addToast('Error al actualizar estado', 'error');
            return false;
        }
    }, [addToast]);

    /**
     * Delete a proforma (soft delete via status = 'void' or hard delete for drafts)
     */
    const deleteProforma = useCallback(async (id: string, hardDelete: boolean = false) => {
        try {
            if (hardDelete) {
                await deleteDoc(doc(db, 'proformas', id));
                addToast('Proforma eliminada', 'success');
            } else {
                await updateProformaStatus(id, 'void');
            }
            return true;
        } catch (error) {
            console.error('[Proformas] Error deleting proforma:', error);
            addToast('Error al eliminar proforma', 'error');
            return false;
        }
    }, [updateProformaStatus, addToast]);

    /**
     * Subscribe to proformas (realtime) - excludes voided
     */
    const subscribeToProformas = useCallback((callback: (proformas: Proforma[]) => void) => {
        // Query all non-void proformas, limit 200, sort in memory
        const q = query(
            collection(db, 'proformas'),
            where('status', '!=', 'void'),
            limit(200)
        );

        return onSnapshot(q, (snapshot) => {
            const proformas = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Proforma));

            // Sort by createdAt descending (in memory to avoid index)
            proformas.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

            callback(proformas);
        }, (error) => {
            console.error('[Proformas] Realtime subscription error:', error);
            addToast('Error de conexión en Proformas', 'error');
        });
    }, [addToast]);

    /**
     * Get a single proforma by ID (one-time fetch)
     */
    const getProformaById = useCallback(async (id: string): Promise<Proforma | null> => {
        try {
            const snapshot = await getDocs(query(collection(db, 'proformas'), where('__name__', '==', id)));
            if (!snapshot.empty) {
                return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Proforma;
            }
            return null;
        } catch (error) {
            console.error('[Proformas] Error fetching proforma:', error);
            return null;
        }
    }, []);

    /**
     * Check if a draft proforma already exists for a case
     */
    const checkDraftExistsForCase = useCallback(async (caseId: string): Promise<boolean> => {
        try {
            const q = query(
                collection(db, 'proformas'),
                where('caseId', '==', caseId),
                where('status', '==', 'draft'),
                limit(1)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('[Proformas] Error checking draft:', error);
            return false;
        }
    }, []);

    /**
     * Create a proforma from a closed case, copying client and economic data
     */
    const createProformaFromCase = useCallback(async (caseRecord: any): Promise<Proforma | null> => {
        if (!caseRecord || !caseRecord.fileNumber) {
            addToast('Expediente inválido', 'error');
            return null;
        }

        setLoading(true);
        try {
            // Check for existing draft
            const hasDraft = await checkDraftExistsForCase(caseRecord.fileNumber);
            if (hasDraft) {
                const proceed = window.confirm(
                    'Ya existe una proforma en borrador para este expediente. ¿Crear otra igualmente?'
                );
                if (!proceed) {
                    setLoading(false);
                    return null;
                }
            }

            // Extract economic lines with IVA inference
            const economicLines = caseRecord.economicData?.lines || [];
            const proformaLines = economicLines.map((line: any) => {
                const concept = line.concept || line.descripcion || 'Concepto';
                const amount = Number(line.amount) || Number(line.importe) || 0;

                // IVA inference based on concept
                let vatRate = 21; // Default
                const conceptLower = concept.toLowerCase();
                if (conceptLower.includes('tasa') || conceptLower.includes('impuesto') || conceptLower.includes('tributo')) {
                    vatRate = 0;
                }

                const vatAmount = amount * (vatRate / 100);

                return {
                    concept,
                    quantity: 1,
                    unitPrice: amount,
                    amount,
                    vatRate,
                    vatAmount
                };
            });

            // Calculate totals
            const subtotal = proformaLines.reduce((sum: number, l: any) => sum + l.amount, 0);
            const vatTotal = proformaLines.reduce((sum: number, l: any) => sum + (l.vatAmount || 0), 0);
            const total = subtotal + vatTotal;

            // Extract client data
            const clientName = caseRecord.clientSnapshot?.nombre ||
                caseRecord.clientSnapshot?.razonSocial ||
                (caseRecord.client ? `${caseRecord.client.firstName || ''} ${caseRecord.client.surnames || ''}`.trim() : undefined);
            const clientIdentity = caseRecord.clientSnapshot?.documento ||
                caseRecord.clientSnapshot?.nif ||
                caseRecord.client?.nif;

            // Create proforma
            const proforma: Omit<Proforma, 'id'> = {
                clientId: caseRecord.clienteId || caseRecord.client?.id || null,
                clientName,
                clientIdentity,
                caseId: caseRecord.fileNumber,
                caseNumber: caseRecord.fileNumber,
                createdAt: new Date().toISOString(),
                status: 'draft',
                lines: proformaLines,
                subtotal,
                vatTotal,
                total,
                notes: `Generada desde expediente ${caseRecord.fileNumber}`
            };

            const docRef = await addDoc(collection(db, 'proformas'), proforma);
            addToast('Proforma creada desde expediente', 'success');
            return { id: docRef.id, ...proforma } as Proforma;
        } catch (error) {
            console.error('[Proformas] Error creating from case:', error);
            addToast('Error al crear proforma desde expediente', 'error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [addToast, checkDraftExistsForCase]);

    /**
     * Issue a proforma (draft → sent) with automatic sequential numbering
     * Uses Firestore transaction for concurrency safety
     */
    const issueProforma = useCallback(async (proformaId: string): Promise<{ success: boolean; number?: string }> => {
        setLoading(true);
        try {
            const result = await runTransaction(db, async (transaction) => {
                // 1. Read the proforma
                const proformaRef = doc(db, 'proformas', proformaId);
                const proformaSnap = await transaction.get(proformaRef);

                if (!proformaSnap.exists()) {
                    throw new Error('Proforma no encontrada');
                }

                const proformaData = proformaSnap.data();

                // 2. Validate status
                if (proformaData.status !== 'draft') {
                    throw new Error('Solo se pueden emitir proformas en borrador');
                }

                // 3. Get current year
                const year = new Date().getFullYear();
                const counterDocId = `proformas-${year}`;
                const counterRef = doc(db, 'counters', counterDocId);
                const counterSnap = await transaction.get(counterRef);

                // 4. Calculate next sequence
                let nextSequence = 1;
                if (counterSnap.exists()) {
                    nextSequence = (counterSnap.data().current || 0) + 1;
                }

                // 5. Update counter
                transaction.set(counterRef, { current: nextSequence }, { merge: true });

                // 6. Build number with padding
                const paddedSequence = String(nextSequence).padStart(6, '0');
                const number = `PF-${year}-${paddedSequence}`;

                // 7. Update proforma
                transaction.update(proformaRef, {
                    status: 'sent',
                    number,
                    sequence: nextSequence,
                    year,
                    sentAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                return { number, sequence: nextSequence };
            });

            addToast(`Proforma emitida: ${result.number}`, 'success');
            return { success: true, number: result.number };
        } catch (error: any) {
            console.error('[Proformas] Error issuing proforma:', error);
            addToast(error.message || 'Error al emitir proforma', 'error');
            return { success: false };
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    return {
        createProforma,
        createProformaFromCase,
        updateProforma,
        updateProformaStatus,
        issueProforma,
        deleteProforma,
        subscribeToProformas,
        getProformaById,
        checkDraftExistsForCase,
        loading
    };
};

import { useState, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, onSnapshot, limit } from 'firebase/firestore';
import { DeliveryNote, DeliveryNoteStatus } from '../types/billing';
import { useToast } from './useToast';

export const useBilling = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const createDeliveryNote = useCallback(async (note: Omit<DeliveryNote, 'id'>) => {
        setLoading(true);
        try {
            // Check for duplicates
            const q = query(
                collection(db, 'deliveryNotes'),
                where('expedienteId', '==', note.expedienteId),
                where('status', '!=', 'void')
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                // Filter out void manually if compound query fails (though '!=' 'void' should work if single field)
                // Actually '!=' requires index sometimes. Let's safey query.
                // Re-check logic: "un expediente cerrado no puede generar dos albaranes (a menos que se anule/elimine el anterior)"
                // Ideally we query by expedienteId and check status in memory or simple query.
                const validNote = snapshot.docs.find(d => d.data().status !== 'void');
                if (validNote) {
                    addToast('Ya existe un albarán activo para este expediente.', 'warning');
                    return null;
                }
            }

            const docRef = await addDoc(collection(db, 'deliveryNotes'), note);
            addToast('Albarán creado correctamente', 'success');
            return docRef.id;
        } catch (error) {
            console.error(error);
            addToast('Error al crear albarán', 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    const getPendingDeliveryNotes = useCallback(async () => {
        setLoading(true);
        try {
            // Simple query: all notes (in MVP we can filter in memory if volume is low, or composite index)
            // Ideally: where('status', '==', 'pending')
            const q = query(collection(db, 'deliveryNotes'), where('status', '==', 'pending'));
            const snapshot = await getDocs(q);
            const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DeliveryNote));

            // Sort in memory for MVP to avoid complex index creation prompt
            notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return notes;
        } catch (error) {
            console.error(error);
            addToast('Error al cargar albaranes', 'error');
            return [];
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    const getDeliveryNoteByExpediente = useCallback(async (expedienteId: string) => {
        try {
            const q = query(
                collection(db, 'deliveryNotes'),
                where('expedienteId', '==', expedienteId),
                where('status', '!=', 'void')
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DeliveryNote;
            }
            return null;
        } catch (error) {
            console.error("Error fetching delivery note by case", error);
            return null;
        }
    }, []);

    const updateDeliveryNoteStatus = useCallback(async (id: string, status: DeliveryNoteStatus) => {
        try {
            const ref = doc(db, 'deliveryNotes', id);
            await updateDoc(ref, { status });
            addToast(`Albarán ${status === 'invoiced' ? 'facturado' : 'anulado'} correctamente`, 'success');
        } catch (error) {
            console.error(error);
            addToast('Error al actualizar estado', 'error');
        }
    }, [addToast]);

    const createDeliveryNoteFromCase = useCallback(async (caseRecord: any) => {
        if (!caseRecord || !caseRecord.fileNumber) return false;

        try {
            // STRATEGY: Query by ID only to avoid composite index requirements.
            // We check status in memory.
            const q = query(
                collection(db, 'deliveryNotes'),
                where('expedienteId', '==', caseRecord.fileNumber)
            );

            const snapshot = await getDocs(q);

            // Check for duplicates in memory
            const activeNote = snapshot.docs.find(d => {
                const data = d.data();
                return data.status === 'pending' || data.status === 'invoiced';
            });

            if (activeNote) {
                console.log(`[Billing] Duplicate prevented: active note ${activeNote.id} is ${activeNote.data().status}`);
                return false;
            }

            let lines: any[] = [];
            let subtotal = 0;
            let vatTotal = 0;
            const movimientos = caseRecord.movimientos || [];

            if (movimientos.length > 0) {
                // Filter only ACTIVE (REALIZADO) movements
                const activeMovs = movimientos.filter((m: any) => m.estado === 'REALIZADO');

                lines = activeMovs.map((m: any) => {
                    const amount = m.importe || 0;
                    const isSuplido = m.subcategoriaSuplido !== undefined || m.regimenIva === 'NO_SUJETO';

                    // Honorarios logic
                    let lineVatAmount = 0;
                    if (!isSuplido && m.regimenIva === 'SUJETO') {
                        lineVatAmount = Math.round((amount * (m.ivaPorcentaje || 21) / 100) * 100) / 100;
                    }

                    return {
                        concept: isSuplido ? `Suplido: ${m.descripcionOverride}` : m.descripcionOverride,
                        amount: amount,
                        vatRate: isSuplido ? 0 : (m.ivaPorcentaje || 21),
                        vatAmount: lineVatAmount,
                        isSuplido: isSuplido,
                        subcategoriaSuplido: m.subcategoriaSuplido
                    };
                });

                subtotal = lines.reduce((acc, l) => acc + l.amount, 0);
                vatTotal = lines.reduce((acc, l) => acc + l.vatAmount, 0);
            } else {
                // FALLBACK to legacy economicData.lines
                subtotal = caseRecord.economicData?.totalAmount || 0;
                lines = (caseRecord.economicData?.lines || []).map((l: any) => ({
                    concept: l.concept,
                    amount: l.amount,
                    vatRate: 21,
                    vatAmount: 0 // In legacy we didn't calculate fine-grained VAT in the albarán creation
                }));

                if (lines.length === 0 && subtotal > 0) {
                    lines.push({ concept: 'Servicios Jurídicos / Gestión', amount: subtotal, vatRate: 21, vatAmount: Math.round((subtotal * 0.21) * 100) / 100 });
                    vatTotal = Math.round((subtotal * 0.21) * 100) / 100;
                }
            }

            const total = Math.round((subtotal + vatTotal) * 100) / 100;

            const note: Omit<DeliveryNote, 'id'> = {
                clientId: caseRecord.client.id,
                clientName: caseRecord.clientSnapshot?.nombre || `${caseRecord.client.firstName} ${caseRecord.client.surnames}`,
                clientIdentity: caseRecord.clientSnapshot?.documento || caseRecord.client.nif,
                expedienteId: caseRecord.fileNumber,
                expedienteNumero: caseRecord.fileNumber,
                closedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                status: 'pending',
                lines,
                subtotal,
                vatTotal,
                total: total
            };

            await addDoc(collection(db, 'deliveryNotes'), note);
            console.log(`[Billing] Delivery note created for case: ${caseRecord.fileNumber}`);
            return true;
        } catch (error) {
            console.error('[Billing] Error auto-creating delivery note:', error);
            // We do not show toast here to avoid spamming in batch operations.
            // The caller (Dashboard) handles user feedback.
            return false;
        }
    }, [addToast]);

    const subscribeToPendingNotes = useCallback((callback: (notes: DeliveryNote[]) => void) => {
        // OPTIMAL QUERY (Requires Index): 
        // where('status', '==', 'pending'), orderBy('createdAt', 'desc')

        // CURRENT STRATEGY (No Index): 
        // Query by Status only + Limit 200 + Sort in Memory
        const q = query(
            collection(db, 'deliveryNotes'),
            where('status', '==', 'pending'),
            limit(200)
        );

        return onSnapshot(q, (snapshot) => {
            const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DeliveryNote));

            // Sort in memory (Handle strings or Firestore Timestamps)
            notes.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

            if (snapshot.size >= 200) {
                // Warning only once/debounced ideally, but here safe enough
                console.warn('[Billing] Limit of 200 pending notes reached.');
            }

            callback(notes);
        }, (error) => {
            console.error('[Billing] Realtime subscription error:', error);
            addToast('Error de conexión en Facturación', 'error');
        });
    }, [addToast]);

    return {
        createDeliveryNote,
        createDeliveryNoteFromCase,
        getPendingDeliveryNotes,
        getDeliveryNoteByExpediente,
        updateDeliveryNoteStatus,
        subscribeToPendingNotes,
        loading
    };
};

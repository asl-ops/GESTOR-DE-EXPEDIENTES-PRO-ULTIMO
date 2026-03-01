import { useState, useCallback } from 'react';
import { db } from '../services/firebase';
import {
    collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc,
    onSnapshot, limit, runTransaction
} from 'firebase/firestore';
import { Invoice, DeliveryNote } from '../types/billing';
import { useToast } from './useToast';
import { getClientById } from '../services/clientService';
import { getPaymentMethods } from '../services/paymentMethodService';

export const useInvoices = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    /**
     * Create a draft invoice from a delivery note
     */
    const createInvoiceFromDeliveryNote = useCallback(async (deliveryNote: DeliveryNote): Promise<Invoice | null> => {
        setLoading(true);
        try {
            // Convert delivery note lines to invoice lines
            const invoiceLines = deliveryNote.lines.map(line => ({
                concept: line.concept,
                quantity: 1,
                unitPrice: line.amount,
                amount: line.amount,
                vatRate: line.vatRate || 21,
                vatAmount: line.vatAmount || (line.amount * ((line.vatRate || 21) / 100))
            }));

            // Fetch client to get default payment method
            const client = await getClientById(deliveryNote.clientId);
            const pMethods = await getPaymentMethods();
            const clientPaymentMethod = pMethods.find(m => m.id === client?.formaCobroId);

            const invoice: Omit<Invoice, 'id'> = {
                status: 'draft',
                createdAt: new Date().toISOString(),
                deliveryNoteId: deliveryNote.id,
                expedienteId: deliveryNote.expedienteId,
                expedienteNumero: deliveryNote.expedienteNumero,
                clientId: deliveryNote.clientId,
                clientName: deliveryNote.clientName,
                clientIdentity: deliveryNote.clientIdentity,
                lines: invoiceLines,
                subtotal: deliveryNote.subtotal,
                vatTotal: deliveryNote.vatTotal,
                total: deliveryNote.total,
                formaCobroId: client?.formaCobroId || '',
                paymentMethod: clientPaymentMethod?.nombre || '',
                notes: `Generada desde albarán de expediente ${deliveryNote.expedienteNumero}`
            };

            const docRef = await addDoc(collection(db, 'invoices'), invoice);
            addToast('Factura creada en borrador', 'success');
            return { id: docRef.id, ...invoice } as Invoice;
        } catch (error) {
            console.error('[Invoices] Error creating from delivery note:', error);
            addToast('Error al crear factura', 'error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    /**
     * Issue an invoice (draft → issued) with automatic sequential numbering
     * Uses Firestore transaction for concurrency safety
     */
    const issueInvoice = useCallback(async (invoiceId: string): Promise<{ success: boolean; number?: string }> => {
        setLoading(true);
        try {
            const result = await runTransaction(db, async (transaction) => {
                // 1. Read the invoice
                const invoiceRef = doc(db, 'invoices', invoiceId);
                const invoiceSnap = await transaction.get(invoiceRef);

                if (!invoiceSnap.exists()) {
                    throw new Error('Factura no encontrada');
                }

                const invoiceData = invoiceSnap.data();

                // 2. Validate status
                if (invoiceData.status !== 'draft') {
                    throw new Error('Solo se pueden emitir facturas en borrador');
                }

                // 3. Get current year
                const year = new Date().getFullYear();
                const counterDocId = `invoices-${year}`;
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
                const number = `F-${year}-${paddedSequence}`;

                // 7. Update invoice
                transaction.update(invoiceRef, {
                    status: 'issued',
                    number,
                    sequence: nextSequence,
                    year,
                    issuedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // 8. Mark delivery note as invoiced (if linked)
                if (invoiceData.deliveryNoteId) {
                    const deliveryNoteRef = doc(db, 'deliveryNotes', invoiceData.deliveryNoteId);
                    transaction.update(deliveryNoteRef, {
                        status: 'invoiced',
                        invoiceId: invoiceRef.id,
                        invoiceNumber: number
                    });
                }

                return { number, sequence: nextSequence };
            });

            addToast(`Factura emitida: ${result.number}`, 'success');
            return { success: true, number: result.number };
        } catch (error: any) {
            console.error('[Invoices] Error issuing invoice:', error);
            addToast(error.message || 'Error al emitir factura', 'error');
            return { success: false };
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    /**
     * Void an invoice (only for issued invoices)
     */
    const voidInvoice = useCallback(async (id: string): Promise<boolean> => {
        try {
            const ref = doc(db, 'invoices', id);
            await updateDoc(ref, {
                status: 'void',
                voidedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            addToast('Factura anulada', 'success');
            return true;
        } catch (error) {
            console.error('[Invoices] Error voiding invoice:', error);
            addToast('Error al anular factura', 'error');
            return false;
        }
    }, [addToast]);

    /**
     * Delete a draft invoice (hard delete)
     */
    const deleteInvoice = useCallback(async (id: string): Promise<boolean> => {
        try {
            await deleteDoc(doc(db, 'invoices', id));
            addToast('Factura eliminada', 'success');
            return true;
        } catch (error) {
            console.error('[Invoices] Error deleting invoice:', error);
            addToast('Error al eliminar factura', 'error');
            return false;
        }
    }, [addToast]);

    /**
     * Subscribe to invoices (realtime) - excludes voided
     */
    const subscribeToInvoices = useCallback((callback: (invoices: Invoice[]) => void, maxResults: number = 10000) => {
        const q = query(
            collection(db, 'invoices'),
            where('status', '!=', 'void'),
            limit(maxResults)
        );

        return onSnapshot(q, (snapshot) => {
            const invoices = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));

            // Sort by createdAt descending (in memory to avoid index)
            invoices.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

            callback(invoices);
        }, (error) => {
            console.error('[Invoices] Realtime subscription error:', error);
            addToast('Error de conexión en Facturas', 'error');
        });
    }, [addToast]);

    /**
     * Get a single invoice by ID
     */
    const getInvoiceById = useCallback(async (id: string): Promise<Invoice | null> => {
        try {
            const snapshot = await getDocs(query(collection(db, 'invoices'), where('__name__', '==', id)));
            if (!snapshot.empty) {
                return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Invoice;
            }
            return null;
        } catch (error) {
            console.error('[Invoices] Error fetching invoice:', error);
            return null;
        }
    }, []);

    /**
     * Mark an invoice as paid
     */
    const markAsPaid = useCallback(async (id: string): Promise<boolean> => {
        try {
            const ref = doc(db, 'invoices', id);
            await updateDoc(ref, {
                isPaid: true,
                paidAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            addToast('Factura marcada como pagada', 'success');
            return true;
        } catch (error) {
            console.error('[Invoices] Error marking as paid:', error);
            addToast('Error al marcar como pagada', 'error');
            return false;
        }
    }, [addToast]);

    /**
     * Mark an invoice as unpaid (revert payment)
     */
    const markAsUnpaid = useCallback(async (id: string): Promise<boolean> => {
        try {
            const ref = doc(db, 'invoices', id);
            await updateDoc(ref, {
                isPaid: false,
                paidAt: null,
                updatedAt: new Date().toISOString()
            });
            addToast('Factura marcada como pendiente', 'success');
            return true;
        } catch (error) {
            console.error('[Invoices] Error marking as unpaid:', error);
            addToast('Error al marcar como pendiente', 'error');
            return false;
        }
    }, [addToast]);

    return {
        createInvoiceFromDeliveryNote,
        issueInvoice,
        voidInvoice,
        deleteInvoice,
        subscribeToInvoices,
        getInvoiceById,
        markAsPaid,
        markAsUnpaid,
        loading
    };
};

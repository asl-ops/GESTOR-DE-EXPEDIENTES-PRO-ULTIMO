import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, limit as firestoreLimit, getDoc, doc } from 'firebase/firestore';
import { EconomicFilters } from '../components/EconomicFiltersPanel';
import { CaseRecord, Client } from '../types/index';
import { DeliveryNote as DeliveryNoteType, Invoice as InvoiceType, Proforma as ProformaType } from '../types/billing';

export interface TimelineEvent {
    id: string;
    date: Date;
    type: 'invoice' | 'deliveryNote' | 'proforma' | 'case';
    description: string;
    amount?: number;
    status: string;
    entityId?: string; // ID for navigation
}

export interface FinancialKPIs {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    pendingBilling: number; // Albaranes
    netBalance: number;
}

interface UseEconomicResult {
    loading: boolean;
    error: string | null;
    client: Client | null;
    cases: CaseRecord[];
    deliveryNotes: DeliveryNoteType[];
    invoices: InvoiceType[];
    proformas: ProformaType[];
    timeline: TimelineEvent[];
    kpis: FinancialKPIs;
    // Legacy support for current UI until refactor
    summary: {
        saldoExpedientes: number;
        pendienteFacturar: number;
        pendienteCobro: number;
        saldoContable: number;
    };
    refresh: () => void;
}

export const useEconomic = (
    clientId: string | null,
    filters: EconomicFilters,
    _pageSize?: any // Ignored, handled client-side
): UseEconomicResult => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [cases, setCases] = useState<CaseRecord[]>([]);
    const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNoteType[]>([]);
    const [invoices, setInvoices] = useState<InvoiceType[]>([]);
    const [proformas, setProformas] = useState<ProformaType[]>([]);

    // New State
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [kpis, setKpis] = useState<FinancialKPIs>({
        totalInvoiced: 0,
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
        pendingBilling: 0,
        netBalance: 0
    });

    const loadData = useCallback(async () => {
        if (!clientId) {
            setClient(null);
            setCases([]);
            setDeliveryNotes([]);
            setInvoices([]);
            setProformas([]);
            setTimeline([]);
            setKpis({ totalInvoiced: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0, pendingBilling: 0, netBalance: 0 });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Fetch Client
            const clientSnap = await getDoc(doc(db, 'clients', clientId));
            if (clientSnap.exists()) {
                setClient({ id: clientSnap.id, ...clientSnap.data() } as Client);
            } else {
                setError('Cliente no encontrado');
                setLoading(false);
                return;
            }

            // 2. Parallel Fetching (Limit 500 for safety)
            const FETCH_LIMIT = 500;
            const [casesSnap, dnSnap, invSnap, profSnap] = await Promise.all([
                getDocs(query(collection(db, 'cases'), where('clienteId', '==', clientId), firestoreLimit(FETCH_LIMIT))),
                getDocs(query(collection(db, 'deliveryNotes'), where('clientId', '==', clientId), firestoreLimit(FETCH_LIMIT))),
                getDocs(query(collection(db, 'invoices'), where('clientId', '==', clientId), firestoreLimit(FETCH_LIMIT))),
                getDocs(query(collection(db, 'proformas'), where('clientId', '==', clientId), firestoreLimit(FETCH_LIMIT)))
            ]);

            const allCases = casesSnap.docs.map(d => ({ ...d.data(), fileNumber: d.id } as CaseRecord));
            const allDeliveryNotes = dnSnap.docs.map(d => ({ id: d.id, ...d.data() } as DeliveryNoteType));
            const allInvoices = invSnap.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceType));
            const allProformas = profSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProformaType));

            // 3. KPI Calculations (on ALL fetched data, before filtering)
            // This ensures top-level KPIs are accurate regardless of table view filters.

            // Invoiced: Status 'issued'
            const totalInvoiced = allInvoices
                .filter(i => i.status === 'issued')
                .reduce((acc, curr) => acc + (curr.total || 0), 0);

            // Paid: isPaid === true
            const totalPaid = allInvoices
                .filter(i => i.isPaid)
                .reduce((acc, curr) => acc + (curr.total || 0), 0);

            // Pending: Issued AND Not Paid
            const totalPending = allInvoices
                .filter(i => i.status === 'issued' && !i.isPaid)
                .reduce((acc, curr) => acc + (curr.total || 0), 0);

            // Overdue: Pending AND > 30 days
            const now = new Date();
            const totalOverdue = allInvoices
                .filter(i => i.status === 'issued' && !i.isPaid)
                .filter(i => {
                    // Use issuedAt or createdAt
                    const dateStr = i.issuedAt || i.createdAt;
                    if (!dateStr) return false;
                    const date = new Date(dateStr);
                    const diffTime = now.getTime() - date.getTime();
                    const diffDays = diffTime / (1000 * 3600 * 24);
                    return diffDays > 30;
                })
                .reduce((acc, curr) => acc + (curr.total || 0), 0);

            // Pending Billing: Delivery Notes 'pending'
            const pendingBilling = allDeliveryNotes
                .filter(dn => dn.status === 'pending')
                .reduce((acc, curr) => acc + (curr.total || 0), 0);

            setKpis({
                totalInvoiced,
                totalPaid,
                totalPending,
                totalOverdue,
                pendingBilling,
                netBalance: totalPending // "Saldo" usually refers to what is owed
            });

            // 4. Timeline Generation
            const events: TimelineEvent[] = [];

            allCases.forEach(c => events.push({
                id: c.fileNumber,
                entityId: c.fileNumber,
                date: new Date(c.createdAt),
                type: 'case',
                description: `Expediente ${c.fileNumber}: ${c.description || 'Sin asunto'}`,
                status: c.closedAt ? 'Cerrado' : 'Abierto'
            }));

            allDeliveryNotes.forEach(dn => events.push({
                id: dn.id,
                entityId: dn.id,
                date: new Date(dn.createdAt),
                type: 'deliveryNote',
                description: `Albarán ${dn.id.substring(0, 8)}...`,
                amount: dn.total,
                status: dn.status === 'invoiced' ? 'Facturado' : 'Pendiente'
            }));

            allInvoices.forEach(inv => events.push({
                id: inv.id,
                entityId: inv.id,
                date: new Date(inv.createdAt),
                type: 'invoice',
                description: `Factura ${inv.number || 'Borrador'}`,
                amount: inv.total,
                status: inv.isPaid ? 'Cobrada' : 'Pdte. Pago'
            }));

            allProformas.forEach(prof => events.push({
                id: prof.id,
                entityId: prof.id,
                date: new Date(prof.createdAt),
                type: 'proforma',
                description: `Proforma ${prof.number || 'Borrador'}`,
                amount: prof.total,
                status: prof.status
            }));

            // Sort desc and take top 20
            events.sort((a, b) => b.date.getTime() - a.date.getTime());
            setTimeline(events.slice(0, 20));


            // 5. Apply Filters for Table Views
            // Cases
            let resultCases = allCases.filter(c => {
                if (filters.caseStatus !== 'all') {
                    const isClosed = !!c.closedAt;
                    if (filters.caseStatus === 'opened' && isClosed) return false;
                    if (filters.caseStatus === 'closed' && !isClosed) return false;
                }
                if (filters.startDate && filters.endDate) {
                    const dateToCheck = filters.dateType === 'closedAt' ? c.closedAt : c.createdAt;
                    if (!dateToCheck) return false;
                    const d = new Date(dateToCheck);
                    const start = new Date(filters.startDate);
                    const end = new Date(filters.endDate);
                    end.setHours(23, 59, 59, 999);
                    return d >= start && d <= end;
                }
                return true;
            });
            resultCases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Delivery Notes
            let resultDeliveryNotes = allDeliveryNotes.filter(dn => {
                if (filters.deliveryNoteStatus !== 'all') {
                    if (filters.deliveryNoteStatus === 'pending' && dn.status !== 'pending') return false;
                    if (filters.deliveryNoteStatus === 'invoiced' && dn.status !== 'invoiced') return false;
                }
                if (filters.startDate && filters.endDate) {
                    const d = new Date(dn.createdAt);
                    const start = new Date(filters.startDate);
                    const end = new Date(filters.endDate);
                    end.setHours(23, 59, 59, 999);
                    return d >= start && d <= end;
                }
                return true;
            });
            resultDeliveryNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Invoices
            let resultInvoices = allInvoices.filter(inv => {
                if (filters.invoiceStatus !== 'all') {
                    if (filters.invoiceStatus === 'paid' && !inv.isPaid) return false;
                    if (filters.invoiceStatus === 'pending' && inv.isPaid) return false;
                    if (filters.invoiceStatus === 'overdue') {
                        if (inv.isPaid) return false;
                        // Add date check logic if needed for strict filtering
                    }
                }
                if (filters.startDate && filters.endDate) {
                    const d = new Date(inv.createdAt);
                    const start = new Date(filters.startDate);
                    const end = new Date(filters.endDate);
                    end.setHours(23, 59, 59, 999);
                    return d >= start && d <= end;
                }
                return true;
            });
            resultInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Proformas (Simple filtering)
            let resultProformas = allProformas.filter(p => {
                if (filters.startDate && filters.endDate) {
                    const d = new Date(p.createdAt);
                    const start = new Date(filters.startDate);
                    const end = new Date(filters.endDate);
                    end.setHours(23, 59, 59, 999);
                    return d >= start && d <= end;
                }
                return true;
            });
            resultProformas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setCases(resultCases);
            setDeliveryNotes(resultDeliveryNotes);
            setInvoices(resultInvoices);
            setProformas(resultProformas);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error cargando datos económicos');
        } finally {
            setLoading(false);
        }
    }, [clientId, filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        loading,
        error,
        client,
        cases,
        deliveryNotes,
        invoices,
        proformas,
        timeline,
        kpis,
        summary: {
            saldoExpedientes: 0,
            pendienteFacturar: kpis.pendingBilling,
            pendienteCobro: kpis.totalPending,
            saldoContable: 0
        },
        refresh: loadData
    };
};

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, limit as firestoreLimit, getDoc, doc, setDoc } from 'firebase/firestore';
import { EconomicFilters } from '../components/EconomicFiltersPanel';
import { CaseRecord, Client } from '../types/index';
import { Invoice as InvoiceType } from '../types/billing';

export interface FinancialKPIs {
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    pendingBilling: number;
    netBalance: number;
}

export interface TimelineEvent {
    id: string;
    date: Date;
    type: 'invoice' | 'deliveryNote' | 'proforma' | 'case';
    description: string;
    amount?: number;
    status: string;
    entityId?: string;
}

export interface EconomicLedgerEntry {
    id: string;
    clientId?: string | null;
    clientName?: string;
    clientIdentity?: string;
    cuentaContable?: string;
    fecha?: string;
    asiento?: string;
    documento?: string;
    descripcion?: string;
    debe?: number;
    haber?: number;
    saldo?: number;
}

interface EconomicInvoice {
    id: string;
    clientId?: string | null;
    clientName?: string;
    clientIdentity?: string;
    number?: string;
    issueDate?: string;
    total?: number;
    normalizedStatus?: 'pending' | 'paid' | 'overdue';
    sourceStatus?: string;
    createdAt?: string;
}

interface EconomicBalance {
    id: string;
    clientId?: string | null;
    cuentaContable?: string | number;
    saldoActual?: number;
    updatedAt?: string;
    importedAt?: string;
    createdAt?: string;
    timestamp?: string;
}

interface ClientEconomicSummaryDoc {
    clientId: string;
    updatedAt: string;
    calcVersion: number;
    cases: {
        open: {
            count: number;
            total: number;
        };
    };
    invoices: {
        pending: { count: number; total: number };
        paid: { count: number; total: number };
        overdue: { count: number; total: number };
    };
    deliveryNotes: {
        toInvoice: { count: number; total: number };
    };
    contable: {
        account: string;
        balance: {
            value: number;
            source: 'economicBalances' | 'ledgerFallback';
            asOf: string;
        };
    };
}

type TabLoadState = 'idle' | 'loading' | 'ready' | 'error';
type BalanceSource = 'economicBalances' | 'ledgerFallback';

interface ContableSummaryMeta {
    source: BalanceSource;
    asOf: string | null;
}

interface UseEconomicResult {
    loading: boolean;
    loadingSummary: boolean;
    isRefreshing: boolean;
    summaryUpdatedAt: string | null;
    error: string | null;
    client: Client | null;
    cases: CaseRecord[];
    invoices: InvoiceType[];
    ledgerEntries: EconomicLedgerEntry[];
    kpis: FinancialKPIs;
    summary: {
        saldoExpedientes: number;
        pendienteFacturar: number;
        pendienteCobro: number;
        saldoContable: number;
        periodLabel: string;
        contableMeta: ContableSummaryMeta;
    };
    casesState: TabLoadState;
    invoicesState: TabLoadState;
    ledgerState: TabLoadState;
    casesError: string | null;
    invoicesError: string | null;
    ledgerError: string | null;
    ensureCasesLoaded: () => Promise<void>;
    ensureInvoicesLoaded: () => Promise<void>;
    ensureLedgerLoaded: () => Promise<void>;
    refresh: () => Promise<void>;
}

const ECONOMIC_CACHE_TTL_MS = 300_000;
const ECONOMIC_SWR_FRESH_MS = 120_000;
const FETCH_LIMIT = 300;

const summaryCache = new Map<string, { ts: number; summary: ClientEconomicSummaryDoc }>();
const rawCasesCache = new Map<string, { ts: number; data: CaseRecord[] }>();
const rawDeliveryNotesCache = new Map<string, { ts: number; data: any[] }>();
const rawInvoicesCache = new Map<string, { ts: number; data: InvoiceType[] }>();
const rawBalancesCache = new Map<string, { ts: number; data: EconomicBalance[] }>();
const rawLedgerCache = new Map<string, { ts: number; data: EconomicLedgerEntry[] }>();

const emptyKpis: FinancialKPIs = {
    totalInvoiced: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    pendingBilling: 0,
    netBalance: 0
};

const defaultContableMeta: ContableSummaryMeta = {
    source: 'ledgerFallback',
    asOf: null
};

const normalizeAccount = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim().replace(/^0+/, '');
};

const toTimestamp = (value: unknown): number => {
    if (!value) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const t = new Date(value).getTime();
        return Number.isFinite(t) ? t : 0;
    }
    if (typeof value === 'object' && value !== null && 'toDate' in (value as any)) {
        try {
            const d = (value as any).toDate?.();
            const t = d instanceof Date ? d.getTime() : 0;
            return Number.isFinite(t) ? t : 0;
        } catch {
            return 0;
        }
    }
    return 0;
};

const toAmount = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const normalized = value.replace(/\./g, '').replace(',', '.').trim();
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

const getOpenCaseAmount = (caseRecord: CaseRecord): number => {
    const embeddedTotal = toAmount(caseRecord.economicData?.totalAmount);
    if (embeddedTotal !== 0) return embeddedTotal;

    const c = caseRecord as any;
    const saldo = toAmount(c.saldo);
    if (saldo !== 0) return saldo;

    const saldoDebe = toAmount(c.saldoDebe);
    const saldoHaber = toAmount(c.saldoHaber);
    const sourceSaldoDebe = toAmount(c.sourceSaldoDebe);
    const sourceSaldoHaber = toAmount(c.sourceSaldoHaber);
    if (sourceSaldoDebe !== 0 || sourceSaldoHaber !== 0) {
        return sourceSaldoDebe - sourceSaldoHaber;
    }
    const net = saldoDebe - saldoHaber;
    return Number.isFinite(net) ? net : 0;
};

const isExpired = (ts: number, ttl = ECONOMIC_CACHE_TTL_MS) => Date.now() - ts > ttl;

const getFilterRange = (filters: EconomicFilters): { start: Date; end: Date } | null => {
    if (!filters.startDate || !filters.endDate) return null;
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (start > end) return null;
    return { start, end };
};

const isDateInRange = (rawDate: unknown, range: { start: Date; end: Date } | null): boolean => {
    if (!range) return true;
    if (!rawDate) return false;
    const date = rawDate instanceof Date ? rawDate : new Date(String(rawDate));
    if (Number.isNaN(date.getTime())) return false;
    return date >= range.start && date <= range.end;
};

const getPeriodLabel = (filters: EconomicFilters): string => {
    if (filters.periodMode === 'fiscalYear' && filters.fiscalYear) {
        return `Ejercicio ${filters.fiscalYear}`;
    }
    if (filters.periodMode === 'custom' && filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate).toLocaleDateString('es-ES');
        const end = new Date(filters.endDate).toLocaleDateString('es-ES');
        return `Rango ${start} - ${end}`;
    }
    return 'Periodo global';
};

const isOverdueInvoice = (inv: InvoiceType): boolean => {
    if (inv.isPaid || inv.status !== 'issued') return false;
    const statusHint = String((inv as any).notes || '').toLowerCase();
    if (statusHint.includes('vencid') || statusHint.includes('impag') || statusHint.includes('devuelt')) {
        return true;
    }
    const dateStr = inv.issuedAt || inv.createdAt;
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const diffDays = (Date.now() - date.getTime()) / (1000 * 3600 * 24);
    return diffDays > 30;
};

const filterCases = (allCases: CaseRecord[], filters: EconomicFilters): CaseRecord[] => {
    const filtered = allCases.filter(c => {
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

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const filterInvoices = (allInvoices: InvoiceType[], filters: EconomicFilters): InvoiceType[] => {
    const filtered = allInvoices.filter(inv => {
        if (filters.invoiceStatus !== 'all') {
            if (filters.invoiceStatus === 'paid' && !inv.isPaid) return false;
            if (filters.invoiceStatus === 'pending' && inv.isPaid) return false;
            if (filters.invoiceStatus === 'overdue' && !isOverdueInvoice(inv)) return false;
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

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const normalizeEconomicInvoices = (
    clientId: string,
    nativeInvoices: InvoiceType[],
    importedEconomicInvoices: EconomicInvoice[]
): InvoiceType[] => {
    const economicAsInvoices: InvoiceType[] = importedEconomicInvoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: 'issued',
        createdAt: inv.issueDate || inv.createdAt || new Date().toISOString(),
        issuedAt: inv.issueDate || inv.createdAt || new Date().toISOString(),
        clientId: inv.clientId || clientId,
        clientName: inv.clientName,
        clientIdentity: inv.clientIdentity,
        lines: [],
        subtotal: toAmount(inv.total),
        vatTotal: 0,
        total: toAmount(inv.total),
        isPaid: inv.normalizedStatus === 'paid',
        notes: inv.sourceStatus ? `AGA: ${inv.sourceStatus}` : 'AGA',
    }));

    return [...nativeInvoices, ...economicAsInvoices];
};

const progressiveByCuenta = async (
    cuenta: string,
    documento: string,
    collectionName: 'economicInvoices' | 'economicBalances' | 'economicLedgerEntries',
    max: number,
    includeDocumentoFallback: boolean
) => {
    const snaps: any[] = [];
    const candidateQueries: Promise<any>[] = [];
    const cuentaNoLeadingZeros = cuenta.replace(/^0+/, '');
    const cuentaAsNumber = Number(cuenta);
    const hasNumericCuenta = Number.isFinite(cuentaAsNumber) && cuenta !== '';

    if (cuenta) {
        candidateQueries.push(
            getDocs(query(collection(db, collectionName), where('cuentaContable', '==', cuenta), firestoreLimit(max)))
        );
    }
    if (cuentaNoLeadingZeros && cuentaNoLeadingZeros !== cuenta) {
        candidateQueries.push(
            getDocs(query(collection(db, collectionName), where('cuentaContable', '==', cuentaNoLeadingZeros), firestoreLimit(max)))
        );
    }
    if (hasNumericCuenta) {
        candidateQueries.push(
            getDocs(query(collection(db, collectionName), where('cuentaContable', '==', cuentaAsNumber), firestoreLimit(max)))
        );
    }

    if (candidateQueries.length > 0) {
        const candidateSnaps = await Promise.all(candidateQueries);
        snaps.push(...candidateSnaps);
        if (candidateSnaps.some((snap) => !snap.empty)) {
            return snaps;
        }
    }

    if (includeDocumentoFallback && documento) {
        const docFallback = await getDocs(
            query(collection(db, collectionName), where('clientIdentity', '==', documento), firestoreLimit(max))
        );
        snaps.push(docFallback);
    }

    return snaps;
};

const summaryToKpis = (summary: ClientEconomicSummaryDoc): FinancialKPIs => ({
    totalInvoiced: toAmount(summary.cases?.open?.total),
    totalPaid: toAmount(summary.invoices?.paid?.total),
    totalPending: toAmount(summary.invoices?.pending?.total),
    totalOverdue: toAmount(summary.invoices?.overdue?.total),
    pendingBilling: toAmount(summary.deliveryNotes?.toInvoice?.total),
    netBalance: toAmount(summary.invoices?.pending?.total)
});

const mapDocs = {
    invoices: (snaps: any[]) => {
        const map = new Map<string, EconomicInvoice>();
        snaps.forEach((snap) => {
            snap?.docs?.forEach((d: any) => map.set(d.id, { id: d.id, ...d.data() } as EconomicInvoice));
        });
        return Array.from(map.values());
    },
    balances: (snaps: any[]) => {
        const map = new Map<string, EconomicBalance>();
        snaps.forEach((snap) => {
            snap?.docs?.forEach((d: any) => map.set(d.id, { id: d.id, ...d.data() } as EconomicBalance));
        });
        return Array.from(map.values());
    },
    ledger: (snaps: any[]) => {
        const map = new Map<string, EconomicLedgerEntry>();
        snaps.forEach((snap) => {
            snap?.docs?.forEach((d: any) => map.set(d.id, { id: d.id, ...d.data() } as EconomicLedgerEntry));
        });
        return Array.from(map.values());
    }
};

export const useEconomic = (
    clientId: string | null,
    filters: EconomicFilters,
    _pageSize?: any
): UseEconomicResult => {
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summaryUpdatedAt, setSummaryUpdatedAt] = useState<string | null>(null);

    const [client, setClient] = useState<Client | null>(null);
    const [kpis, setKpis] = useState<FinancialKPIs>(emptyKpis);
    const [saldoContable, setSaldoContable] = useState(0);
    const [contableMeta, setContableMeta] = useState<ContableSummaryMeta>(defaultContableMeta);

    const [cases, setCases] = useState<CaseRecord[]>([]);
    const [invoices, setInvoices] = useState<InvoiceType[]>([]);
    const [ledgerEntries, setLedgerEntries] = useState<EconomicLedgerEntry[]>([]);

    const [casesState, setCasesState] = useState<TabLoadState>('idle');
    const [invoicesState, setInvoicesState] = useState<TabLoadState>('idle');
    const [ledgerState, setLedgerState] = useState<TabLoadState>('idle');

    const [casesError, setCasesError] = useState<string | null>(null);
    const [invoicesError, setInvoicesError] = useState<string | null>(null);
    const [ledgerError, setLedgerError] = useState<string | null>(null);

    const resetDetailState = useCallback(() => {
        setCases([]);
        setInvoices([]);
        setLedgerEntries([]);
        setCasesState('idle');
        setInvoicesState('idle');
        setLedgerState('idle');
        setCasesError(null);
        setInvoicesError(null);
        setLedgerError(null);
    }, []);

    const recalculateAndPersistSummary = useCallback(async (targetClientId: string, currentClient: Client): Promise<ClientEconomicSummaryDoc> => {
        const cuenta = String(currentClient?.cuentaContable || '').trim();
        const documento = String(currentClient?.documento || currentClient?.nif || '').trim();

        const [casesSnap, dnSnap, invSnap, ecoInvByClientSnap, ecoBalancesByClientSnap, ledgerByClientSnap] = await Promise.all([
            getDocs(query(collection(db, 'cases'), where('clienteId', '==', targetClientId), firestoreLimit(FETCH_LIMIT))),
            getDocs(query(collection(db, 'deliveryNotes'), where('clientId', '==', targetClientId), firestoreLimit(FETCH_LIMIT))),
            getDocs(query(collection(db, 'invoices'), where('clientId', '==', targetClientId), firestoreLimit(FETCH_LIMIT))),
            getDocs(query(collection(db, 'economicInvoices'), where('clientId', '==', targetClientId), firestoreLimit(FETCH_LIMIT * 3))),
            getDocs(query(collection(db, 'economicBalances'), where('clientId', '==', targetClientId), firestoreLimit(50))),
            getDocs(query(collection(db, 'economicLedgerEntries'), where('clientId', '==', targetClientId), firestoreLimit(FETCH_LIMIT * 4)))
        ]);

        const [ecoInvFallbackSnaps, ecoBalancesFallbackSnaps, ledgerFallbackSnaps] = await Promise.all([
            ecoInvByClientSnap.empty
                ? progressiveByCuenta(cuenta, documento, 'economicInvoices', FETCH_LIMIT * 3, true)
                : Promise.resolve([]),
            ecoBalancesByClientSnap.empty
                ? progressiveByCuenta(cuenta, documento, 'economicBalances', 50, false)
                : Promise.resolve([]),
            ledgerByClientSnap.empty
                ? progressiveByCuenta(cuenta, documento, 'economicLedgerEntries', FETCH_LIMIT * 4, true)
                : Promise.resolve([])
        ]);

        const allCases = casesSnap.docs.map(d => ({ ...d.data(), fileNumber: d.id } as CaseRecord));
        const allDeliveryNotes = dnSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const nativeInvoices = invSnap.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceType));

        const importedEconomicInvoices = mapDocs.invoices([ecoInvByClientSnap, ...ecoInvFallbackSnaps]);
        const importedBalances = mapDocs.balances([ecoBalancesByClientSnap, ...ecoBalancesFallbackSnaps]);
        const importedLedger = mapDocs.ledger([ledgerByClientSnap, ...ledgerFallbackSnaps]).sort(
            (a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime()
        );

        const allInvoices = normalizeEconomicInvoices(targetClientId, nativeInvoices, importedEconomicInvoices);

        const totalInvoiced = allCases
            .filter(c => !c.closedAt)
            .reduce((acc, curr) => acc + getOpenCaseAmount(curr), 0);

        const totalPaid = allInvoices
            .filter(i => i.isPaid)
            .reduce((acc, curr) => acc + toAmount(curr.total), 0);

        const pendingInvoices = allInvoices.filter(i => i.status === 'issued' && !i.isPaid);
        const totalPending = pendingInvoices.reduce((acc, curr) => acc + toAmount(curr.total), 0);

        const overdueInvoices = pendingInvoices.filter(isOverdueInvoice);
        const totalOverdue = overdueInvoices.reduce((acc, curr) => acc + toAmount(curr.total), 0);

        const pendingBillingDocs = allDeliveryNotes.filter((dn: any) => dn.status === 'pending');
        const pendingBilling = pendingBillingDocs.reduce((acc: number, curr: any) => acc + toAmount(curr.total), 0);

        const targetAccount = normalizeAccount(currentClient?.cuentaContable);
        const balancesForAccount = targetAccount
            ? importedBalances.filter((b) => normalizeAccount((b as any).cuentaContable) === targetAccount)
            : importedBalances;

        const selectedBalance = balancesForAccount.slice().sort((a: any, b: any) => {
            const ta = Math.max(toTimestamp(a.updatedAt), toTimestamp(a.importedAt), toTimestamp(a.createdAt), toTimestamp(a.timestamp));
            const tb = Math.max(toTimestamp(b.updatedAt), toTimestamp(b.importedAt), toTimestamp(b.createdAt), toTimestamp(b.timestamp));
            return tb - ta;
        })[0];

        const balanceValue = selectedBalance ? toAmount((selectedBalance as any).saldoActual) : null;
        const latestLedgerSaldo = importedLedger.length > 0 ? toAmount(importedLedger[0].saldo) : 0;
        const computedSaldoContable = balanceValue !== null ? balanceValue : latestLedgerSaldo;
        const saldoSource: 'economicBalances' | 'ledgerFallback' = balanceValue !== null ? 'economicBalances' : 'ledgerFallback';

        const summaryDoc: ClientEconomicSummaryDoc = {
            clientId: targetClientId,
            updatedAt: new Date().toISOString(),
            calcVersion: 1,
            cases: {
                open: {
                    count: allCases.filter(c => !c.closedAt).length,
                    total: totalInvoiced
                }
            },
            invoices: {
                pending: {
                    count: pendingInvoices.length,
                    total: totalPending
                },
                paid: {
                    count: allInvoices.filter(i => i.isPaid).length,
                    total: totalPaid
                },
                overdue: {
                    count: overdueInvoices.length,
                    total: totalOverdue
                }
            },
            deliveryNotes: {
                toInvoice: {
                    count: pendingBillingDocs.length,
                    total: pendingBilling
                }
            },
            contable: {
                account: String(currentClient?.cuentaContable || ''),
                balance: {
                    value: computedSaldoContable,
                    source: saldoSource,
                    asOf: importedLedger[0]?.fecha || (selectedBalance as any)?.updatedAt || new Date().toISOString()
                }
            }
        };

        await setDoc(doc(db, 'clientEconomicSummary', targetClientId), summaryDoc, { merge: true });
        summaryCache.set(targetClientId, { ts: Date.now(), summary: summaryDoc });
        return summaryDoc;
    }, []);

    const fetchAndApplySummary = useCallback(async (targetClientId: string, forceRevalidate = false) => {
        setError(null);
        const cachedSummary = summaryCache.get(targetClientId);
        const hasCache = !!cachedSummary && !isExpired(cachedSummary.ts);
        const isFresh = !!cachedSummary && !isExpired(cachedSummary.ts, ECONOMIC_SWR_FRESH_MS);

        if (hasCache && cachedSummary) {
            setKpis(summaryToKpis(cachedSummary.summary));
            setSaldoContable(toAmount(cachedSummary.summary.contable?.balance?.value));
            setContableMeta({
                source: cachedSummary.summary.contable?.balance?.source || 'ledgerFallback',
                asOf: cachedSummary.summary.contable?.balance?.asOf || null
            });
            setSummaryUpdatedAt(cachedSummary.summary.updatedAt || null);
            setLoadingSummary(false);
            if (isFresh && !forceRevalidate) return;
            setIsRefreshing(true);
        } else {
            setLoadingSummary(true);
            setIsRefreshing(false);
        }

        try {
            const clientSnap = await getDoc(doc(db, 'clients', targetClientId));
            if (!clientSnap.exists()) {
                setError('Cliente no encontrado');
                return;
            }
            const currentClient = { id: clientSnap.id, ...clientSnap.data() } as Client;
            setClient(currentClient);

            const summarySnap = await getDoc(doc(db, 'clientEconomicSummary', targetClientId));
            let summaryDoc: ClientEconomicSummaryDoc;
            if (summarySnap.exists()) {
                summaryDoc = summarySnap.data() as ClientEconomicSummaryDoc;
            } else {
                summaryDoc = await recalculateAndPersistSummary(targetClientId, currentClient);
            }

            summaryCache.set(targetClientId, { ts: Date.now(), summary: summaryDoc });
            setKpis(summaryToKpis(summaryDoc));
            setSaldoContable(toAmount(summaryDoc.contable?.balance?.value));
            setContableMeta({
                source: summaryDoc.contable?.balance?.source || 'ledgerFallback',
                asOf: summaryDoc.contable?.balance?.asOf || null
            });
            setSummaryUpdatedAt(summaryDoc.updatedAt || null);
        } catch (err: any) {
            if (!hasCache) {
                setError(err?.message || 'Error cargando resumen económico');
            }
        } finally {
            setLoadingSummary(false);
            setIsRefreshing(false);
        }
    }, [recalculateAndPersistSummary]);

    const fetchCasesRaw = useCallback(async (targetClientId: string): Promise<CaseRecord[]> => {
        const cached = rawCasesCache.get(targetClientId);
        if (cached && !isExpired(cached.ts)) return cached.data;
        const casesSnap = await getDocs(query(collection(db, 'cases'), where('clienteId', '==', targetClientId), firestoreLimit(FETCH_LIMIT)));
        const allCases = casesSnap.docs.map(d => ({ ...d.data(), fileNumber: d.id } as CaseRecord));
        rawCasesCache.set(targetClientId, { ts: Date.now(), data: allCases });
        return allCases;
    }, []);

    const fetchDeliveryNotesRaw = useCallback(async (targetClientId: string): Promise<any[]> => {
        const cached = rawDeliveryNotesCache.get(targetClientId);
        if (cached && !isExpired(cached.ts)) return cached.data;
        const dnSnap = await getDocs(query(collection(db, 'deliveryNotes'), where('clientId', '==', targetClientId), firestoreLimit(FETCH_LIMIT)));
        const allDeliveryNotes = dnSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        rawDeliveryNotesCache.set(targetClientId, { ts: Date.now(), data: allDeliveryNotes });
        return allDeliveryNotes;
    }, []);

    const fetchInvoicesRaw = useCallback(async (targetClientId: string): Promise<InvoiceType[]> => {
        const cached = rawInvoicesCache.get(targetClientId);
        if (cached && !isExpired(cached.ts)) return cached.data;

        const clientSnap = await getDoc(doc(db, 'clients', targetClientId));
        const currentClient = clientSnap.exists() ? ({ id: clientSnap.id, ...clientSnap.data() } as Client) : null;
        const cuenta = String(currentClient?.cuentaContable || '').trim();
        const documento = String(currentClient?.documento || currentClient?.nif || '').trim();

        const [invSnap, ecoInvByClientSnap] = await Promise.all([
            getDocs(query(collection(db, 'invoices'), where('clientId', '==', targetClientId), firestoreLimit(FETCH_LIMIT))),
            getDocs(query(collection(db, 'economicInvoices'), where('clientId', '==', targetClientId), firestoreLimit(FETCH_LIMIT * 3)))
        ]);

        const ecoInvFallbackSnaps = ecoInvByClientSnap.empty
            ? await progressiveByCuenta(cuenta, documento, 'economicInvoices', FETCH_LIMIT * 3, true)
            : [];

        const nativeInvoices = invSnap.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceType));
        const importedEconomicInvoices = mapDocs.invoices([ecoInvByClientSnap, ...ecoInvFallbackSnaps]);
        const allInvoices = normalizeEconomicInvoices(targetClientId, nativeInvoices, importedEconomicInvoices);

        rawInvoicesCache.set(targetClientId, { ts: Date.now(), data: allInvoices });
        return allInvoices;
    }, []);

    const fetchLedgerRaw = useCallback(async (targetClientId: string): Promise<EconomicLedgerEntry[]> => {
        const cached = rawLedgerCache.get(targetClientId);
        if (cached && !isExpired(cached.ts)) return cached.data;

        const clientSnap = await getDoc(doc(db, 'clients', targetClientId));
        const currentClient = clientSnap.exists() ? ({ id: clientSnap.id, ...clientSnap.data() } as Client) : null;
        const cuenta = String(currentClient?.cuentaContable || '').trim();
        const documento = String(currentClient?.documento || currentClient?.nif || '').trim();

        const ledgerByClientSnap = await getDocs(
            query(collection(db, 'economicLedgerEntries'), where('clientId', '==', targetClientId), firestoreLimit(FETCH_LIMIT * 4))
        );
        const ledgerFallbackSnaps = ledgerByClientSnap.empty
            ? await progressiveByCuenta(cuenta, documento, 'economicLedgerEntries', FETCH_LIMIT * 4, true)
            : [];

        const importedLedger = mapDocs.ledger([ledgerByClientSnap, ...ledgerFallbackSnaps]).sort(
            (a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime()
        );
        rawLedgerCache.set(targetClientId, { ts: Date.now(), data: importedLedger });
        return importedLedger;
    }, []);

    const fetchBalancesRaw = useCallback(async (targetClientId: string): Promise<EconomicBalance[]> => {
        const cached = rawBalancesCache.get(targetClientId);
        if (cached && !isExpired(cached.ts)) return cached.data;

        const clientSnap = await getDoc(doc(db, 'clients', targetClientId));
        const currentClient = clientSnap.exists() ? ({ id: clientSnap.id, ...clientSnap.data() } as Client) : null;
        const cuenta = String(currentClient?.cuentaContable || '').trim();
        const documento = String(currentClient?.documento || currentClient?.nif || '').trim();

        const balancesByClientSnap = await getDocs(
            query(collection(db, 'economicBalances'), where('clientId', '==', targetClientId), firestoreLimit(50))
        );

        const balancesFallbackSnaps = balancesByClientSnap.empty
            ? await progressiveByCuenta(cuenta, documento, 'economicBalances', 50, false)
            : [];

        const balances = mapDocs.balances([balancesByClientSnap, ...balancesFallbackSnaps]);
        rawBalancesCache.set(targetClientId, { ts: Date.now(), data: balances });
        return balances;
    }, []);

    const applySummaryForCurrentFilters = useCallback(async (targetClientId: string, currentSummary?: ClientEconomicSummaryDoc) => {
        const range = getFilterRange(filters);

        if (!range) {
            const summaryToApply = currentSummary || summaryCache.get(targetClientId)?.summary;
            if (summaryToApply) {
                setKpis(summaryToKpis(summaryToApply));
                setSaldoContable(toAmount(summaryToApply.contable?.balance?.value));
                setContableMeta({
                    source: summaryToApply.contable?.balance?.source || 'ledgerFallback',
                    asOf: summaryToApply.contable?.balance?.asOf || null
                });
                setSummaryUpdatedAt(summaryToApply.updatedAt || null);
            }
            return;
        }

        try {
            const [allCases, allInvoices, allDeliveryNotes, allBalances, allLedger] = await Promise.all([
                fetchCasesRaw(targetClientId),
                fetchInvoicesRaw(targetClientId),
                fetchDeliveryNotesRaw(targetClientId),
                fetchBalancesRaw(targetClientId),
                fetchLedgerRaw(targetClientId)
            ]);

            const filteredCases = allCases.filter((c) => {
                const dateToCheck = filters.dateType === 'closedAt' ? c.closedAt : c.createdAt;
                return isDateInRange(dateToCheck, range);
            });
            const openCases = filteredCases.filter(c => !c.closedAt);
            const totalInvoiced = openCases.reduce((acc, curr) => acc + getOpenCaseAmount(curr), 0);

            const filteredInvoices = allInvoices.filter(inv => isDateInRange(inv.createdAt, range));
            const paidInvoices = filteredInvoices.filter(i => i.isPaid);
            const pendingInvoices = filteredInvoices.filter(i => i.status === 'issued' && !i.isPaid);
            const overdueInvoices = pendingInvoices.filter(isOverdueInvoice);

            const totalPaid = paidInvoices.reduce((acc, curr) => acc + toAmount(curr.total), 0);
            const totalPending = pendingInvoices.reduce((acc, curr) => acc + toAmount(curr.total), 0);
            const totalOverdue = overdueInvoices.reduce((acc, curr) => acc + toAmount(curr.total), 0);

            const filteredDeliveryNotes = allDeliveryNotes.filter((dn: any) => isDateInRange(dn.createdAt, range));
            const pendingBilling = filteredDeliveryNotes
                .filter((dn: any) => dn.status === 'pending')
                .reduce((acc: number, curr: any) => acc + toAmount(curr.total), 0);

            const targetAccount = normalizeAccount(client?.cuentaContable || currentSummary?.contable?.account);
            const balancesForAccount = targetAccount
                ? allBalances.filter((b) => normalizeAccount((b as any).cuentaContable) === targetAccount)
                : allBalances;

            const balancesByRange = balancesForAccount.filter((balance: any) => {
                const when = new Date(balance.updatedAt || balance.importedAt || balance.createdAt || balance.timestamp || 0);
                return !Number.isNaN(when.getTime()) && when >= range.start && when <= range.end;
            });
            const balancesUntilEnd = balancesForAccount.filter((balance: any) => {
                const when = new Date(balance.updatedAt || balance.importedAt || balance.createdAt || balance.timestamp || 0);
                return !Number.isNaN(when.getTime()) && when <= range.end;
            });

            const balanceInPeriod = balancesByRange.slice().sort((a: any, b: any) => {
                const ta = Math.max(toTimestamp(a.updatedAt), toTimestamp(a.importedAt), toTimestamp(a.createdAt), toTimestamp(a.timestamp));
                const tb = Math.max(toTimestamp(b.updatedAt), toTimestamp(b.importedAt), toTimestamp(b.createdAt), toTimestamp(b.timestamp));
                return tb - ta;
            })[0] || balancesUntilEnd.slice().sort((a: any, b: any) => {
                const ta = Math.max(toTimestamp(a.updatedAt), toTimestamp(a.importedAt), toTimestamp(a.createdAt), toTimestamp(a.timestamp));
                const tb = Math.max(toTimestamp(b.updatedAt), toTimestamp(b.importedAt), toTimestamp(b.createdAt), toTimestamp(b.timestamp));
                return tb - ta;
            })[0];

            const ledgerInPeriod = allLedger.filter((entry) => isDateInRange(entry.fecha, range));
            const latestLedgerInPeriod = ledgerInPeriod.slice().sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())[0];

            const balanceValue = balanceInPeriod ? toAmount((balanceInPeriod as any).saldoActual) : null;
            const computedSaldoContable = balanceValue !== null ? balanceValue : toAmount(latestLedgerInPeriod?.saldo);

            setKpis({
                totalInvoiced,
                totalPaid,
                totalPending,
                totalOverdue,
                pendingBilling,
                netBalance: totalPending
            });
            setSaldoContable(computedSaldoContable);
            setContableMeta({
                source: balanceValue !== null ? 'economicBalances' : 'ledgerFallback',
                asOf: balanceInPeriod
                    ? String((balanceInPeriod as any).updatedAt || (balanceInPeriod as any).importedAt || (balanceInPeriod as any).createdAt || '')
                    : latestLedgerInPeriod?.fecha || null
            });
        } catch {
            // Mantener valores existentes si falla la recomputación por periodo.
        }
    }, [client, fetchBalancesRaw, fetchCasesRaw, fetchDeliveryNotesRaw, fetchInvoicesRaw, fetchLedgerRaw, filters]);

    const ensureCasesLoaded = useCallback(async () => {
        if (!clientId) return;
        setCasesState('loading');
        setCasesError(null);
        try {
            const allCases = await fetchCasesRaw(clientId);
            setCases(filterCases(allCases, filters));
            setCasesState('ready');
        } catch (err: any) {
            setCasesState('error');
            setCasesError(err?.message || 'No se pudieron cargar los expedientes');
        }
    }, [clientId, fetchCasesRaw, filters]);

    const ensureInvoicesLoaded = useCallback(async () => {
        if (!clientId) return;
        setInvoicesState('loading');
        setInvoicesError(null);
        try {
            const allInvoices = await fetchInvoicesRaw(clientId);
            setInvoices(filterInvoices(allInvoices, filters));
            setInvoicesState('ready');
        } catch (err: any) {
            setInvoicesState('error');
            setInvoicesError(err?.message || 'No se pudieron cargar las facturas');
        }
    }, [clientId, fetchInvoicesRaw, filters]);

    const ensureLedgerLoaded = useCallback(async () => {
        if (!clientId) return;
        setLedgerState('loading');
        setLedgerError(null);
        try {
            const allEntries = await fetchLedgerRaw(clientId);
            const range = getFilterRange(filters);
            setLedgerEntries(range ? allEntries.filter((entry) => isDateInRange(entry.fecha, range)) : allEntries);
            setLedgerState('ready');
        } catch (err: any) {
            setLedgerState('error');
            setLedgerError(err?.message || 'No se pudo cargar el extracto contable');
        }
    }, [clientId, fetchLedgerRaw, filters]);

    // Reaplica filtros solo sobre pestañas ya cargadas.
    useEffect(() => {
        if (!clientId) return;

        if (casesState === 'ready') {
            const cached = rawCasesCache.get(clientId);
            if (cached) setCases(filterCases(cached.data, filters));
        }
        if (invoicesState === 'ready') {
            const cached = rawInvoicesCache.get(clientId);
            if (cached) setInvoices(filterInvoices(cached.data, filters));
        }
        if (ledgerState === 'ready') {
            const cached = rawLedgerCache.get(clientId);
            if (cached) {
                const range = getFilterRange(filters);
                const filteredLedger = range
                    ? cached.data.filter((entry) => isDateInRange(entry.fecha, range))
                    : cached.data;
                setLedgerEntries(filteredLedger);
            }
        }
    }, [clientId, filters, casesState, invoicesState, ledgerState]);

    // Aplica periodo global también sobre KPIs y saldo contable.
    useEffect(() => {
        if (!clientId) return;
        const cachedSummary = summaryCache.get(clientId)?.summary;
        void applySummaryForCurrentFilters(clientId, cachedSummary);
    }, [clientId, filters, applySummaryForCurrentFilters]);

    useEffect(() => {
        if (!clientId) {
            setClient(null);
            setKpis(emptyKpis);
            setSaldoContable(0);
            setContableMeta(defaultContableMeta);
            setSummaryUpdatedAt(null);
            setLoadingSummary(false);
            setIsRefreshing(false);
            setError(null);
            resetDetailState();
            return;
        }

        resetDetailState();
        void fetchAndApplySummary(clientId);
    }, [clientId, fetchAndApplySummary, resetDetailState]);

    const refresh = useCallback(async () => {
        if (!clientId) return;
        await fetchAndApplySummary(clientId, true);

        if (casesState === 'ready') await ensureCasesLoaded();
        if (invoicesState === 'ready') await ensureInvoicesLoaded();
        if (ledgerState === 'ready') await ensureLedgerLoaded();
    }, [clientId, fetchAndApplySummary, casesState, invoicesState, ledgerState, ensureCasesLoaded, ensureInvoicesLoaded, ensureLedgerLoaded]);

    const summary = useMemo(() => ({
        saldoExpedientes: kpis.totalInvoiced,
        pendienteFacturar: kpis.pendingBilling,
        pendienteCobro: kpis.totalPending,
        saldoContable,
        periodLabel: getPeriodLabel(filters),
        contableMeta
    }), [kpis, saldoContable, filters, contableMeta]);

    return {
        loading: loadingSummary,
        loadingSummary,
        isRefreshing,
        summaryUpdatedAt,
        error,
        client,
        cases,
        invoices,
        ledgerEntries,
        kpis,
        summary,
        casesState,
        invoicesState,
        ledgerState,
        casesError,
        invoicesError,
        ledgerError,
        ensureCasesLoaded,
        ensureInvoicesLoaded,
        ensureLedgerLoaded,
        refresh
    };
};

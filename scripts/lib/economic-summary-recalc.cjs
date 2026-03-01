/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
} = require('firebase/firestore');

const DEFAULT_FETCH_LIMIT = 500;

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeAccount(value) {
  return clean(value).replace(/[^\d]/g, '').replace(/^0+/, '');
}

function toAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value) : 0;
  if (typeof value === 'string') {
    const txt = clean(value);
    if (!txt) return 0;
    const normalized = txt.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toTimestamp(value) {
  if (!value) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof value === 'object' && value !== null && typeof value.toDate === 'function') {
    try {
      const d = value.toDate();
      const t = d instanceof Date ? d.getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    } catch (_err) {
      return 0;
    }
  }
  return 0;
}

function parseDateSafe(value) {
  const t = toTimestamp(value);
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isDateInRange(value, range) {
  if (!range) return true;
  const d = parseDateSafe(value);
  if (!d) return false;
  return d >= range.start && d <= range.end;
}

function isOverdueInvoice(inv) {
  const normalizedStatus = clean(inv.normalizedStatus || '').toLowerCase();
  if (normalizedStatus === 'overdue') return true;
  if (normalizedStatus === 'paid') return false;

  if (inv.isPaid) return false;
  const status = clean(inv.status || '').toLowerCase();
  if (status && status !== 'issued') return false;

  const sourceStatus = clean(inv.sourceStatus || inv.situationOriginal || inv.notes || '').toLowerCase();
  if (sourceStatus.includes('vencid') || sourceStatus.includes('impag') || sourceStatus.includes('devuelt')) {
    return true;
  }

  const baseDate = parseDateSafe(inv.issuedAt || inv.issueDate || inv.createdAt);
  if (!baseDate) return false;
  const diffDays = (Date.now() - baseDate.getTime()) / (1000 * 3600 * 24);
  return diffDays > 30;
}

function getOpenCaseAmount(caseRecord) {
  const embeddedTotal = toAmount(caseRecord?.economicData?.totalAmount);
  if (embeddedTotal !== 0) return embeddedTotal;

  const saldo = toAmount(caseRecord?.saldo);
  if (saldo !== 0) return saldo;

  const saldoDebe = toAmount(caseRecord?.saldoDebe);
  const saldoHaber = toAmount(caseRecord?.saldoHaber);
  const sourceSaldoDebe = toAmount(caseRecord?.sourceSaldoDebe);
  const sourceSaldoHaber = toAmount(caseRecord?.sourceSaldoHaber);
  if (sourceSaldoDebe !== 0 || sourceSaldoHaber !== 0) return sourceSaldoDebe - sourceSaldoHaber;
  return saldoDebe - saldoHaber;
}

function normalizeEconomicInvoices(clientId, nativeInvoices, importedEconomicInvoices) {
  const imported = importedEconomicInvoices.map((inv) => ({
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
    isPaid: String(inv.normalizedStatus || '').toLowerCase() === 'paid',
    normalizedStatus: inv.normalizedStatus,
    sourceStatus: inv.sourceStatus,
    notes: inv.sourceStatus ? `AGA: ${inv.sourceStatus}` : 'AGA',
  }));

  return [...nativeInvoices, ...imported];
}

async function progressiveByCuenta(db, cuenta, documento, collectionName, max, includeDocumentoFallback) {
  const snaps = [];
  const candidateQueries = [];
  const cuentaNoLeadingZeros = (cuenta || '').replace(/^0+/, '');
  const cuentaAsNumber = Number(cuenta);
  const hasNumericCuenta = Number.isFinite(cuentaAsNumber) && clean(cuenta) !== '';

  if (cuenta) {
    candidateQueries.push(
      getDocs(query(collection(db, collectionName), where('cuentaContable', '==', cuenta)))
    );
  }
  if (cuentaNoLeadingZeros && cuentaNoLeadingZeros !== cuenta) {
    candidateQueries.push(getDocs(query(collection(db, collectionName), where('cuentaContable', '==', cuentaNoLeadingZeros))));
  }
  if (hasNumericCuenta) {
    candidateQueries.push(getDocs(query(collection(db, collectionName), where('cuentaContable', '==', cuentaAsNumber))));
  }

  if (candidateQueries.length > 0) {
    const candidateSnaps = await Promise.all(candidateQueries);
    snaps.push(...candidateSnaps);
    if (candidateSnaps.some((snap) => !snap.empty)) return snaps;
  }

  if (includeDocumentoFallback && documento) {
    const docFallback = await getDocs(
      query(collection(db, collectionName), where('clientIdentity', '==', documento))
    );
    snaps.push(docFallback);
  }

  return snaps;
}

function mapDocs(snaps) {
  const map = new Map();
  snaps.forEach((snap) => {
    snap?.docs?.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
  });
  return Array.from(map.values());
}

function createRangeForYear(year) {
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

function collectAvailableYears(payload) {
  const years = new Set();
  const pushYear = (rawDate) => {
    const d = parseDateSafe(rawDate);
    if (d) years.add(d.getUTCFullYear());
  };

  payload.cases.forEach((c) => pushYear(c.createdAt || c.updatedAt));
  payload.invoices.forEach((i) => pushYear(i.createdAt || i.issuedAt || i.issueDate));
  payload.deliveryNotes.forEach((dn) => pushYear(dn.createdAt || dn.updatedAt));
  payload.balances.forEach((b) => pushYear(b.updatedAt || b.importedAt || b.createdAt || b.timestamp));
  payload.ledger.forEach((l) => pushYear(l.fecha || l.createdAt || l.updatedAt));

  if (years.size === 0) years.add(new Date().getUTCFullYear());
  return Array.from(years).sort((a, b) => a - b);
}

function computeSummaryForRange(payload, range) {
  const filteredCases = payload.cases.filter((c) => isDateInRange(c.createdAt || c.updatedAt, range));
  const openCases = filteredCases.filter((c) => !c.closedAt);
  const totalOpenCases = openCases.reduce((acc, curr) => acc + getOpenCaseAmount(curr), 0);

  const filteredInvoices = payload.invoices.filter((inv) =>
    isDateInRange(inv.createdAt || inv.issuedAt || inv.issueDate, range)
  );
  const paidInvoices = filteredInvoices.filter((i) => i.isPaid);
  const pendingInvoices = filteredInvoices.filter((i) => !i.isPaid);
  const overdueInvoices = pendingInvoices.filter(isOverdueInvoice);

  const totalPaid = paidInvoices.reduce((acc, curr) => acc + toAmount(curr.total), 0);
  const totalPending = pendingInvoices.reduce((acc, curr) => acc + toAmount(curr.total), 0);
  const totalOverdue = overdueInvoices.reduce((acc, curr) => acc + toAmount(curr.total), 0);

  const filteredDeliveryNotes = payload.deliveryNotes.filter((dn) => isDateInRange(dn.createdAt || dn.updatedAt, range));
  const pendingDelivery = filteredDeliveryNotes.filter((dn) => clean(dn.status).toLowerCase() === 'pending');
  const totalToInvoice = pendingDelivery.reduce((acc, curr) => acc + toAmount(curr.total), 0);

  const targetAccount = normalizeAccount(payload.client.cuentaContable || '');
  const balancesForAccount = targetAccount
    ? payload.balances.filter((b) => normalizeAccount(b.cuentaContable) === targetAccount)
    : payload.balances;

  const rangeEnd = range ? range.end : null;
  const eligibleBalances = balancesForAccount.filter((balance) => {
    if (!rangeEnd) return true;
    const when = parseDateSafe(balance.updatedAt || balance.importedAt || balance.createdAt || balance.timestamp);
    return when && when <= rangeEnd;
  });
  const selectedBalance = eligibleBalances.slice().sort((a, b) => {
    const ta = Math.max(toTimestamp(a.updatedAt), toTimestamp(a.importedAt), toTimestamp(a.createdAt), toTimestamp(a.timestamp));
    const tb = Math.max(toTimestamp(b.updatedAt), toTimestamp(b.importedAt), toTimestamp(b.createdAt), toTimestamp(b.timestamp));
    return tb - ta;
  })[0];

  const ledgerEligible = payload.ledger.filter((entry) => {
    if (!rangeEnd) return true;
    const when = parseDateSafe(entry.fecha || entry.updatedAt || entry.createdAt);
    return when && when <= rangeEnd;
  });
  const latestLedger = ledgerEligible.slice().sort(
    (a, b) => toTimestamp(b.fecha || b.updatedAt || b.createdAt) - toTimestamp(a.fecha || a.updatedAt || a.createdAt)
  )[0];

  const balanceValue = selectedBalance ? toAmount(selectedBalance.saldoActual) : null;
  const contableValue = balanceValue !== null ? balanceValue : toAmount(latestLedger?.saldo);
  const contableSource = balanceValue !== null ? 'economicBalances' : 'ledgerFallback';
  const contableAsOf = selectedBalance
    ? clean(selectedBalance.updatedAt || selectedBalance.importedAt || selectedBalance.createdAt || '')
    : clean(latestLedger?.fecha || latestLedger?.updatedAt || latestLedger?.createdAt || '');

  return {
    cases: {
      open: { count: openCases.length, total: Number(totalOpenCases.toFixed(2)) },
    },
    invoices: {
      pending: { count: pendingInvoices.length, total: Number(totalPending.toFixed(2)) },
      paid: { count: paidInvoices.length, total: Number(totalPaid.toFixed(2)) },
      overdue: { count: overdueInvoices.length, total: Number(totalOverdue.toFixed(2)) },
    },
    deliveryNotes: {
      toInvoice: { count: pendingDelivery.length, total: Number(totalToInvoice.toFixed(2)) },
    },
    contable: {
      account: clean(payload.client.cuentaContable || ''),
      balance: {
        value: Number(contableValue.toFixed(2)),
        source: contableSource,
        asOf: contableAsOf || new Date().toISOString(),
      },
    },
  };
}

async function loadClientEconomicPayload(db, client) {
  const clientId = client.id;
  const cuenta = clean(client.cuentaContable || '');
  const documento = clean(client.documento || client.nif || '');

  const [
    casesSnap,
    deliverySnap,
    invoicesSnap,
    ecoInvoicesByClientSnap,
    balancesByClientSnap,
    ledgerByClientSnap,
  ] = await Promise.all([
    getDocs(query(collection(db, 'cases'), where('clienteId', '==', clientId))),
    getDocs(query(collection(db, 'deliveryNotes'), where('clientId', '==', clientId))),
    getDocs(query(collection(db, 'invoices'), where('clientId', '==', clientId))),
    getDocs(query(collection(db, 'economicInvoices'), where('clientId', '==', clientId))),
    getDocs(query(collection(db, 'economicBalances'), where('clientId', '==', clientId))),
    getDocs(query(collection(db, 'economicLedgerEntries'), where('clientId', '==', clientId))),
  ]);

  const [ecoInvFallbackSnaps, balancesFallbackSnaps, ledgerFallbackSnaps] = await Promise.all([
    ecoInvoicesByClientSnap.empty
      ? progressiveByCuenta(db, cuenta, documento, 'economicInvoices', DEFAULT_FETCH_LIMIT * 3, true)
      : Promise.resolve([]),
    balancesByClientSnap.empty
      ? progressiveByCuenta(db, cuenta, documento, 'economicBalances', 50, false)
      : Promise.resolve([]),
    ledgerByClientSnap.empty
      ? progressiveByCuenta(db, cuenta, documento, 'economicLedgerEntries', DEFAULT_FETCH_LIMIT * 4, true)
      : Promise.resolve([]),
  ]);

  const rawCases = casesSnap.docs.map((d) => ({ fileNumber: d.id, ...d.data() }));
  const rawDelivery = deliverySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const nativeInvoices = invoicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const importedEconomicInvoices = mapDocs([ecoInvoicesByClientSnap, ...ecoInvFallbackSnaps]);
  const allInvoices = normalizeEconomicInvoices(clientId, nativeInvoices, importedEconomicInvoices);
  const allBalances = mapDocs([balancesByClientSnap, ...balancesFallbackSnaps]);
  const allLedger = mapDocs([ledgerByClientSnap, ...ledgerFallbackSnaps]).sort(
    (a, b) => toTimestamp(b.fecha || b.updatedAt || b.createdAt) - toTimestamp(a.fecha || a.updatedAt || a.createdAt)
  );

  return {
    client,
    cases: rawCases,
    deliveryNotes: rawDelivery,
    invoices: allInvoices,
    balances: allBalances,
    ledger: allLedger,
  };
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;
  const idx = Math.min(sortedValues.length - 1, Math.max(0, Math.floor(p * sortedValues.length)));
  return sortedValues[idx];
}

async function recalculateEconomicSummaries(db, options = {}) {
  const startAt = Date.now();
  const {
    clientIds = null,
    includeYearly = true,
    logPrefix = '[ECONOMIC-RECALC]',
    writeTimingLog = true,
  } = options;

  let clientDocs = [];
  if (Array.isArray(clientIds) && clientIds.length > 0) {
    const ids = Array.from(new Set(clientIds.map((x) => clean(x)).filter(Boolean)));
    const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, 'clients', id))));
    clientDocs = snaps.filter((s) => s.exists()).map((s) => ({ id: s.id, ...s.data() }));
  } else {
    const allClientsSnap = await getDocs(collection(db, 'clients'));
    clientDocs = allClientsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const metrics = [];
  let yearlyWrites = 0;

  for (const client of clientDocs) {
    const cStart = Date.now();
    try {
      const payload = await loadClientEconomicPayload(db, client);
      const globalBase = computeSummaryForRange(payload, null);
      const nowIso = new Date().toISOString();

      const globalSummary = {
        clientId: client.id,
        updatedAt: nowIso,
        calcVersion: 2,
        ...globalBase,
      };
      await setDoc(doc(db, 'clientEconomicSummary', client.id), globalSummary, { merge: true });

      let years = [];
      if (includeYearly) {
        years = collectAvailableYears(payload);
        await setDoc(doc(db, 'clientEconomicSummaryByYear', client.id), {
          clientId: client.id,
          years,
          updatedAt: nowIso,
          calcVersion: 2,
        }, { merge: true });

        await Promise.all(
          years.map(async (year) => {
            const yearlyBase = computeSummaryForRange(payload, createRangeForYear(year));
            const yearlySummary = {
              clientId: client.id,
              year,
              updatedAt: nowIso,
              calcVersion: 2,
              ...yearlyBase,
            };
            await setDoc(doc(db, 'clientEconomicSummaryByYear', client.id, 'years', String(year)), yearlySummary, { merge: true });
          })
        );
        yearlyWrites += years.length;
      }

      const elapsedMs = Date.now() - cStart;
      metrics.push({
        clientId: client.id,
        years,
        elapsedMs,
        cases: payload.cases.length,
        invoices: payload.invoices.length,
        ledger: payload.ledger.length,
      });
    } catch (err) {
      const elapsedMs = Date.now() - cStart;
      metrics.push({
        clientId: client.id,
        years: [],
        elapsedMs,
        error: String(err?.message || err),
      });
      console.warn(`${logPrefix} error cliente ${client.id}:`, err?.message || err);
    }
  }

  const totalMs = Date.now() - startAt;
  const completed = metrics.filter((m) => !m.error);
  const failed = metrics.filter((m) => !!m.error);
  const elapsedSorted = completed.map((m) => m.elapsedMs).sort((a, b) => a - b);
  const avgMs = completed.length ? Math.round(completed.reduce((acc, m) => acc + m.elapsedMs, 0) / completed.length) : 0;
  const p50Ms = percentile(elapsedSorted, 0.5);
  const p95Ms = percentile(elapsedSorted, 0.95);
  const maxMs = elapsedSorted.length ? elapsedSorted[elapsedSorted.length - 1] : 0;
  const clientsPerMinute = avgMs > 0 ? Number((60000 / avgMs).toFixed(2)) : 0;

  const result = {
    timestamp: new Date().toISOString(),
    clientsRequested: clientDocs.length,
    clientsCompleted: completed.length,
    clientsFailed: failed.length,
    globalSummariesWritten: completed.length,
    yearlySummariesWritten: yearlyWrites,
    totalMs,
    avgMsPerClient: avgMs,
    p50MsPerClient: p50Ms,
    p95MsPerClient: p95Ms,
    maxMsPerClient: maxMs,
    clientsPerMinute,
    estimatedFor100ClientsMinutes: clientsPerMinute > 0 ? Number((100 / clientsPerMinute).toFixed(2)) : null,
    estimatedFor1000ClientsMinutes: clientsPerMinute > 0 ? Number((1000 / clientsPerMinute).toFixed(2)) : null,
    failedClients: failed.map((f) => ({ clientId: f.clientId, error: f.error })),
  };

  if (writeTimingLog) {
    const timingPath = path.resolve('/tmp', `economic_summary_recalc_${Date.now()}.json`);
    fs.writeFileSync(
      timingPath,
      JSON.stringify({
        summary: result,
        perClient: metrics,
      }, null, 2),
      'utf8'
    );
    result.reportPath = timingPath;
  }

  console.log(
    `${logPrefix} completado: ${result.clientsCompleted}/${result.clientsRequested} clientes en ${(totalMs / 1000).toFixed(2)}s` +
    ` | avg ${(avgMs / 1000).toFixed(2)}s/cliente | p95 ${(p95Ms / 1000).toFixed(2)}s`
  );

  return result;
}

module.exports = {
  recalculateEconomicSummaries,
};

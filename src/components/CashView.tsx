import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import {
    addCashMovement,
    annulCashMovement,
    closeCashSession,
    getCashSessionByDate,
    getDailyBalance,
    listCashMovements,
    openCashSession,
} from '@/services/cashService';
import {
    CASH_EXPENSE_CATEGORIES,
    CASH_INCOME_CATEGORIES,
    CASH_PAYMENT_METHODS,
    CashBalance,
    CashCategory,
    CashDailySession,
    CashMovement,
    CashPaymentMethod,
    CashMovementType,
} from '@/types/cash';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    CalendarDays,
    CreditCard,
    FileText,
    History,
    Landmark,
    Lock,
    PlusCircle,
    Printer,
    Search,
    Wallet,
} from 'lucide-react';

type CashTab = 'dashboard' | 'newMovement' | 'history' | 'session';

const todayYmd = () => new Date().toISOString().slice(0, 10);

const formatCurrency = (value: number) =>
    value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-ES');
};

const emptyBalance: CashBalance = {
    saldoApertura: 0,
    ingresos: 0,
    gastos: 0,
    saldoActual: 0,
    numMovimientos: 0,
    ingresosEfectivo: 0,
    gastoEfectivo: 0,
    ingresosTarjeta: 0,
    gastoTarjeta: 0,
    ingresosTransferencia: 0,
    gastoTransferencia: 0,
    ingresosCheque: 0,
    gastoCheque: 0,
    ingresosBizum: 0,
    gastoBizum: 0,
};

const getClientLabel = (client: any) => {
    if (!client) return '—';
    const name = (client.nombre || `${client.surnames || ''} ${client.firstName || ''}`.trim() || '').trim();
    const nif = (client.nif || client.documento || '').trim();
    return nif ? `${name} (${nif})` : name || '—';
};

const escapeHtml = (value?: string) =>
    (value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const CashView: React.FC = () => {
    const { savedClients, caseHistory, currentUser, appSettings } = useAppContext();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<CashTab>('dashboard');
    const [isLoading, setIsLoading] = useState(false);

    const [session, setSession] = useState<CashDailySession | null>(null);
    const [balance, setBalance] = useState<CashBalance>(emptyBalance);
    const [todayMovements, setTodayMovements] = useState<CashMovement[]>([]);
    const [historyMovements, setHistoryMovements] = useState<CashMovement[]>([]);

    const [historyDate, setHistoryDate] = useState(todayYmd());
    const [historyType, setHistoryType] = useState<'TODOS' | CashMovementType>('TODOS');
    const [historyStatus, setHistoryStatus] = useState<'TODOS' | 'COMPLETADO' | 'ANULADO'>('TODOS');
    const [historySearch, setHistorySearch] = useState('');

    const [openAmount, setOpenAmount] = useState('');
    const [openResponsible, setOpenResponsible] = useState('');
    const [closeAmount, setCloseAmount] = useState('');
    const [closeObservations, setCloseObservations] = useState('');

    const [movType, setMovType] = useState<CashMovementType>('INGRESO');
    const [movCategory, setMovCategory] = useState<CashCategory>('PROVISION_FONDOS');
    const [movMethod, setMovMethod] = useState<CashPaymentMethod>('EFECTIVO');
    const [movConcept, setMovConcept] = useState('');
    const [movAmount, setMovAmount] = useState('');
    const [movClientId, setMovClientId] = useState('');
    const [movCaseId, setMovCaseId] = useState('');
    const [movNotes, setMovNotes] = useState('');

    const [annulTarget, setAnnulTarget] = useState<CashMovement | null>(null);
    const [annulReason, setAnnulReason] = useState('');

    const movementCategories = movType === 'INGRESO' ? CASH_INCOME_CATEGORIES : CASH_EXPENSE_CATEGORIES;

    const refreshData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const date = todayYmd();
            const [sessionData, balanceData, todays, history] = await Promise.all([
                getCashSessionByDate(date),
                getDailyBalance(date),
                listCashMovements({ fechaDia: date }),
                historyDate ? listCashMovements({ fechaDia: historyDate }) : listCashMovements({ limitTo: 400 }),
            ]);

            setSession(sessionData);
            setBalance(balanceData);
            setTodayMovements(todays);
            setHistoryMovements(history);
        } catch (error) {
            console.error('Error loading cash module:', error);
            addToast('No se pudieron cargar los datos de caja.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast, historyDate]);

    React.useEffect(() => {
        void refreshData();
    }, [refreshData]);

    const filteredHistory = useMemo(() => {
        return historyMovements.filter((item) => {
            if (historyType !== 'TODOS' && item.tipo !== historyType) return false;
            if (historyStatus !== 'TODOS' && item.estado !== historyStatus) return false;
            if (historySearch.trim()) {
                const q = historySearch.trim().toLowerCase();
                const match = [
                    item.concepto,
                    item.numRecibo,
                    item.observaciones || '',
                    item.importe.toString(),
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(q);
                if (!match) return false;
            }
            return true;
        });
    }, [historyMovements, historyType, historyStatus, historySearch]);

    const casesByClient = useMemo(() => {
        if (!movClientId) return [];
        return caseHistory.filter((c: any) => (c.client?.id || c.clienteId || '') === movClientId);
    }, [caseHistory, movClientId]);

    const handleOpenCash = async (event: React.FormEvent) => {
        event.preventDefault();
        const amount = Number(openAmount);
        if (!Number.isFinite(amount) || amount < 0) {
            addToast('Indica un saldo de apertura válido.', 'warning');
            return;
        }
        try {
            await openCashSession({
                saldoApertura: amount,
                responsable: openResponsible || undefined,
                openedBy: currentUser?.id || undefined,
            });
            addToast('Caja abierta correctamente.', 'success');
            setOpenAmount('');
            setOpenResponsible('');
            await refreshData();
        } catch (error: any) {
            addToast(error?.message || 'No se pudo abrir la caja.', 'error');
        }
    };

    const handleCloseCash = async (event: React.FormEvent) => {
        event.preventDefault();
        const amount = Number(closeAmount);
        if (!Number.isFinite(amount)) {
            addToast('Indica un saldo de cierre válido.', 'warning');
            return;
        }
        try {
            await closeCashSession({
                saldoReal: amount,
                observaciones: closeObservations || undefined,
                closedBy: currentUser?.id || undefined,
            });
            addToast('Caja cerrada correctamente.', 'success');
            setCloseAmount('');
            setCloseObservations('');
            await refreshData();
        } catch (error: any) {
            addToast(error?.message || 'No se pudo cerrar la caja.', 'error');
        }
    };

    const handleCreateMovement = async (event: React.FormEvent) => {
        event.preventDefault();
        const amount = Number(movAmount);
        if (!movConcept.trim() || !Number.isFinite(amount) || amount <= 0) {
            addToast('Concepto e importe son obligatorios.', 'warning');
            return;
        }
        try {
            await addCashMovement({
                tipo: movType,
                categoria: movCategory,
                metodoPago: movMethod,
                concepto: movConcept.trim(),
                importe: amount,
                clienteId: movClientId || undefined,
                expedienteId: movCaseId || undefined,
                observaciones: movNotes.trim() || undefined,
                createdBy: currentUser?.id || undefined,
            });
            addToast('Movimiento registrado correctamente.', 'success');
            setMovConcept('');
            setMovAmount('');
            setMovClientId('');
            setMovCaseId('');
            setMovNotes('');
            await refreshData();
            setActiveTab('history');
        } catch (error: any) {
            addToast(error?.message || 'No se pudo registrar el movimiento.', 'error');
        }
    };

    const handleAnnulMovement = async () => {
        if (!annulTarget || !annulReason.trim()) {
            addToast('Debes indicar un motivo de anulación.', 'warning');
            return;
        }
        try {
            await annulCashMovement({
                movementId: annulTarget.id,
                motivo: annulReason.trim(),
                anuladaBy: currentUser?.id || undefined,
            });
            addToast('Movimiento anulado correctamente.', 'success');
            setAnnulTarget(null);
            setAnnulReason('');
            await refreshData();
        } catch (error: any) {
            addToast(error?.message || 'No se pudo anular el movimiento.', 'error');
        }
    };

    const openPrintWindow = (html: string) => {
        const printWindow = window.open('', '_blank', 'width=920,height=1100');
        if (!printWindow) {
            addToast('El navegador bloqueó la ventana de impresión.', 'warning');
            return;
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
    };

    const printMovementReceipt = (movement: CashMovement) => {
        const agencyName = appSettings?.agency?.name || 'AGA Nexus';
        const agencyCif = appSettings?.agency?.cif || '';
        const agencyAddress = appSettings?.agency?.address || '';
        const lineConcept = escapeHtml(movement.concepto);
        const lineCategory = escapeHtml(categoryLabel(movement.categoria));
        const lineMethod = escapeHtml(CASH_PAYMENT_METHODS[movement.metodoPago] || movement.metodoPago);
        const lineObs = escapeHtml(movement.observaciones || '');
        const badgeColor = movement.tipo === 'INGRESO' ? '#059669' : '#dc2626';

        const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recibo ${escapeHtml(movement.numRecibo)}</title>
  <style>
    body { font-family: Inter, system-ui, -apple-system, sans-serif; margin: 0; color: #0f172a; background: #fff; }
    .page { max-width: 840px; margin: 0 auto; padding: 28px; }
    .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: 700; color: #0071e3; margin: 0; }
    .meta { color: #64748b; font-size: 12px; line-height: 1.5; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; background: ${badgeColor}; text-transform: uppercase; letter-spacing: .08em; }
    .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin-bottom: 14px; }
    .row { display: grid; grid-template-columns: 190px 1fr; gap: 10px; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
    .row:last-child { border-bottom: 0; }
    .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    .value { color: #0f172a; font-size: 14px; font-weight: 600; }
    .amount { font-size: 34px; font-weight: 700; color: #0f172a; margin: 10px 0 0; }
    .footer { margin-top: 26px; color: #94a3b8; font-size: 11px; text-align: center; }
    @media print { .page { padding: 0; } }
  </style>
</head>
<body onload="window.print();window.close();">
  <div class="page">
    <div class="header">
      <div>
        <h1 class="title">${escapeHtml(agencyName)}</h1>
        <div class="meta">${escapeHtml(agencyAddress)}</div>
        <div class="meta">${agencyCif ? `CIF: ${escapeHtml(agencyCif)}` : ''}</div>
      </div>
      <div style="text-align:right">
        <div class="badge">${escapeHtml(movement.tipo)}</div>
        <div style="margin-top:10px;font-size:14px;font-weight:700">RECIBO ${escapeHtml(movement.numRecibo)}</div>
        <div class="meta">${escapeHtml(formatDateTime(movement.fecha))}</div>
      </div>
    </div>

    <div class="card">
      <div class="row"><div class="label">Concepto</div><div class="value">${lineConcept}</div></div>
      <div class="row"><div class="label">Categoría</div><div class="value">${lineCategory}</div></div>
      <div class="row"><div class="label">Método</div><div class="value">${lineMethod}</div></div>
      <div class="row"><div class="label">Cliente</div><div class="value">${escapeHtml(getClientLabel(savedClients.find((c) => c.id === movement.clienteId)))}</div></div>
      <div class="row"><div class="label">Expediente</div><div class="value">${escapeHtml(movement.expedienteId || '—')}</div></div>
      <div class="row"><div class="label">Estado</div><div class="value">${escapeHtml(movement.estado)}</div></div>
      <div class="amount">${escapeHtml(formatCurrency(movement.importe))}</div>
    </div>

    ${lineObs ? `<div class="card"><div class="label" style="margin-bottom:8px">Observaciones</div><div class="value" style="font-weight:500">${lineObs}</div></div>` : ''}

    <div class="footer">Documento generado por AGA Nexus · Módulo de Caja</div>
  </div>
</body>
</html>`;
        openPrintWindow(html);
    };

    const printSessionClose = () => {
        if (!session || session.estado !== 'CERRADA') return;
        const agencyName = appSettings?.agency?.name || 'AGA Nexus';
        const agencyCif = appSettings?.agency?.cif || '';
        const agencyAddress = appSettings?.agency?.address || '';

        const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Cierre caja ${escapeHtml(session.fecha)}</title>
  <style>
    body { font-family: Inter, system-ui, -apple-system, sans-serif; margin: 0; color: #0f172a; background: #fff; }
    .page { max-width: 840px; margin: 0 auto; padding: 28px; }
    .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: 700; color: #0071e3; margin: 0; }
    .meta { color: #64748b; font-size: 12px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    th { text-align: left; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
    td:last-child { text-align: right; font-weight: 600; }
    .highlight { background: #f8fafc; font-weight: 700; }
    .footer { margin-top: 24px; color: #94a3b8; font-size: 11px; text-align: center; }
    @media print { .page { padding: 0; } }
  </style>
</head>
<body onload="window.print();window.close();">
  <div class="page">
    <div class="header">
      <div>
        <h1 class="title">${escapeHtml(agencyName)}</h1>
        <div class="meta">${escapeHtml(agencyAddress)}</div>
        <div class="meta">${agencyCif ? `CIF: ${escapeHtml(agencyCif)}` : ''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:700">CIERRE DIARIO DE CAJA</div>
        <div class="meta">Fecha: ${escapeHtml(session.fecha)}</div>
      </div>
    </div>

    <table>
      <tr><th>Saldo apertura</th><td>${escapeHtml(formatCurrency(balance.saldoApertura))}</td></tr>
      <tr><th>Ingresos</th><td style="color:#059669">+${escapeHtml(formatCurrency(balance.ingresos))}</td></tr>
      <tr><th>Gastos</th><td style="color:#dc2626">-${escapeHtml(formatCurrency(balance.gastos))}</td></tr>
      <tr class="highlight"><th>Saldo esperado</th><td>${escapeHtml(formatCurrency(balance.saldoActual))}</td></tr>
      <tr><th>Saldo cierre contado</th><td>${escapeHtml(formatCurrency(session.saldoCierre || 0))}</td></tr>
      <tr><th>Descuadre</th><td>${escapeHtml(formatCurrency(session.descuadre || 0))}</td></tr>
      <tr><th>Responsable</th><td>${escapeHtml(session.responsable || '—')}</td></tr>
      <tr><th>Observaciones</th><td>${escapeHtml(session.observaciones || '—')}</td></tr>
    </table>

    <div class="footer">Documento generado por AGA Nexus · Módulo de Caja</div>
  </div>
</body>
</html>`;
        openPrintWindow(html);
    };

    return (
        <div className="px-8 py-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant={activeTab === 'dashboard' ? 'primary' : 'outline'} size="sm" icon={Wallet} onClick={() => setActiveTab('dashboard')}>
                        Panel
                    </Button>
                    <Button variant={activeTab === 'newMovement' ? 'primary' : 'outline'} size="sm" icon={PlusCircle} onClick={() => setActiveTab('newMovement')}>
                        Nuevo Movimiento
                    </Button>
                    <Button variant={activeTab === 'history' ? 'primary' : 'outline'} size="sm" icon={History} onClick={() => setActiveTab('history')}>
                        Historial
                    </Button>
                    <Button variant={activeTab === 'session' ? 'primary' : 'outline'} size="sm" icon={Lock} onClick={() => setActiveTab('session')}>
                        Apertura/Cierre
                    </Button>
                    <div className="ml-auto">
                        <Button variant="soft" size="sm" onClick={() => void refreshData()} isLoading={isLoading}>
                            Actualizar
                        </Button>
                    </div>
                </div>
            </div>

            {activeTab === 'dashboard' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <KpiCard title="Saldo Actual" value={formatCurrency(balance.saldoActual)} icon={Wallet} valueClassName="text-sky-700" />
                        <KpiCard title="Ingresos Hoy" value={`+${formatCurrency(balance.ingresos)}`} icon={ArrowUpRight} valueClassName="text-emerald-600" />
                        <KpiCard title="Gastos Hoy" value={`-${formatCurrency(balance.gastos)}`} icon={ArrowDownRight} valueClassName="text-rose-600" />
                        <KpiCard title="Movimientos" value={String(balance.numMovimientos)} icon={FileText} valueClassName="text-slate-700" />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Últimos Movimientos del Día</h3>
                        <MovementsTable rows={todayMovements.slice(0, 10)} onAnnul={setAnnulTarget} onPrint={printMovementReceipt} compact />
                    </div>
                </div>
            )}

            {activeTab === 'newMovement' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <form className="space-y-4" onSubmit={handleCreateMovement}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Tipo</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={movType}
                                    onChange={(e) => {
                                        const next = e.target.value as CashMovementType;
                                        setMovType(next);
                                        setMovCategory(next === 'INGRESO' ? 'PROVISION_FONDOS' : 'SUPLIDO_REGISTRO');
                                    }}
                                >
                                    <option value="INGRESO">Ingreso</option>
                                    <option value="GASTO">Gasto</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Método de pago</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={movMethod}
                                    onChange={(e) => setMovMethod(e.target.value as CashPaymentMethod)}
                                >
                                    {Object.entries(CASH_PAYMENT_METHODS).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Concepto</label>
                                <input
                                    type="text"
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={movConcept}
                                    onChange={(e) => setMovConcept(e.target.value)}
                                    placeholder="Concepto del movimiento"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Importe (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={movAmount}
                                    onChange={(e) => setMovAmount(e.target.value)}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Categoría</label>
                            <select
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                value={movCategory}
                                onChange={(e) => setMovCategory(e.target.value as CashCategory)}
                            >
                                {Object.entries(movementCategories).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Cliente (opcional)</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={movClientId}
                                    onChange={(e) => {
                                        setMovClientId(e.target.value);
                                        setMovCaseId('');
                                    }}
                                >
                                    <option value="">Sin cliente</option>
                                    {savedClients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {getClientLabel(client)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Expediente (opcional)</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={movCaseId}
                                    onChange={(e) => setMovCaseId(e.target.value)}
                                >
                                    <option value="">Sin expediente</option>
                                    {casesByClient.map((item: any) => (
                                        <option key={item.id || item.fileNumber} value={item.id || item.fileNumber}>
                                            {item.fileNumber || item.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Observaciones</label>
                            <textarea
                                className="min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                value={movNotes}
                                onChange={(e) => setMovNotes(e.target.value)}
                                placeholder="Notas internas..."
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button variant="primary" size="md" icon={PlusCircle} type="submit">
                                Registrar movimiento
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input
                                type="text"
                                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                                placeholder="Buscar concepto, recibo, importe..."
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                            />
                            <input
                                type="date"
                                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                                value={historyDate}
                                onChange={(e) => setHistoryDate(e.target.value)}
                            />
                            <select className="h-10 rounded-xl border border-slate-200 px-3 text-sm" value={historyType} onChange={(e) => setHistoryType(e.target.value as any)}>
                                <option value="TODOS">Todos los tipos</option>
                                <option value="INGRESO">Ingresos</option>
                                <option value="GASTO">Gastos</option>
                            </select>
                            <select className="h-10 rounded-xl border border-slate-200 px-3 text-sm" value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value as any)}>
                                <option value="TODOS">Todos los estados</option>
                                <option value="COMPLETADO">Completados</option>
                                <option value="ANULADO">Anulados</option>
                            </select>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <MovementsTable rows={filteredHistory} onAnnul={setAnnulTarget} onPrint={printMovementReceipt} />
                    </div>
                </div>
            )}

            {activeTab === 'session' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Estado de caja</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <p>
                                Fecha: <strong>{todayYmd()}</strong>
                            </p>
                            <p>
                                Estado:{' '}
                                <strong className={session?.estado === 'ABIERTA' ? 'text-emerald-600' : 'text-slate-700'}>
                                    {session?.estado || 'NO ABIERTA'}
                                </strong>
                            </p>
                            <p>Saldo apertura: <strong>{formatCurrency(balance.saldoApertura)}</strong></p>
                            <p>Saldo esperado: <strong>{formatCurrency(balance.saldoActual)}</strong></p>
                        </div>
                    </div>

                    {!session ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Apertura de caja</h3>
                            <form className="space-y-3" onSubmit={handleOpenCash}>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    placeholder="Saldo de apertura"
                                    value={openAmount}
                                    onChange={(e) => setOpenAmount(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    placeholder="Responsable (opcional)"
                                    value={openResponsible}
                                    onChange={(e) => setOpenResponsible(e.target.value)}
                                />
                                <Button variant="primary" size="md" icon={Lock} type="submit">
                                    Abrir caja
                                </Button>
                            </form>
                        </div>
                    ) : session.estado === 'ABIERTA' ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Cierre de caja</h3>
                            <form className="space-y-3" onSubmit={handleCloseCash}>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    placeholder="Saldo contado al cierre"
                                    value={closeAmount}
                                    onChange={(e) => setCloseAmount(e.target.value)}
                                />
                                <textarea
                                    className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Observaciones de cierre"
                                    value={closeObservations}
                                    onChange={(e) => setCloseObservations(e.target.value)}
                                />
                                <Button variant="danger" size="md" icon={AlertTriangle} type="submit">
                                    Cerrar caja
                                </Button>
                            </form>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">Caja cerrada</h3>
                            <div className="space-y-2 text-sm text-slate-600">
                                <p>Saldo cierre: <strong>{formatCurrency(session.saldoCierre || 0)}</strong></p>
                                <p>Descuadre: <strong>{formatCurrency(session.descuadre || 0)}</strong></p>
                                <p>Responsable: <strong>{session.responsable || '—'}</strong></p>
                            </div>
                            <div className="mt-4">
                                <Button variant="outline" size="sm" icon={Printer} onClick={printSessionClose}>
                                    Imprimir cierre diario
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {annulTarget && (
                <div className="fixed inset-0 z-[90] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
                        <h4 className="text-sm uppercase tracking-[0.18em] text-slate-600">Anular movimiento</h4>
                        <p className="text-sm text-slate-600">
                            Recibo <strong>{annulTarget.numRecibo}</strong> · {annulTarget.concepto}
                        </p>
                        <textarea
                            className="min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Motivo de anulación..."
                            value={annulReason}
                            onChange={(e) => setAnnulReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setAnnulTarget(null); setAnnulReason(''); }}>
                                Cancelar
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleAnnulMovement}>
                                Confirmar anulación
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const KpiCard = ({
    title,
    value,
    icon: Icon,
    valueClassName = '',
}: {
    title: string;
    value: string;
    icon: React.ComponentType<any>;
    valueClassName?: string;
}) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{title}</h3>
            <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <p className={`text-2xl font-semibold tracking-tight ${valueClassName}`}>{value}</p>
    </div>
);

const methodIcon = (method: CashPaymentMethod) => {
    if (method === 'EFECTIVO') return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
    if (method === 'TARJETA') return <CreditCard className="w-3.5 h-3.5 text-sky-600" />;
    if (method === 'TRANSFERENCIA') return <Landmark className="w-3.5 h-3.5 text-indigo-600" />;
    return <CalendarDays className="w-3.5 h-3.5 text-slate-500" />;
};

const categoryLabel = (category: CashCategory) =>
    CASH_INCOME_CATEGORIES[category as keyof typeof CASH_INCOME_CATEGORIES]
    || CASH_EXPENSE_CATEGORIES[category as keyof typeof CASH_EXPENSE_CATEGORIES]
    || category;

const MovementsTable = ({
    rows,
    onAnnul,
    onPrint,
    compact = false,
}: {
    rows: CashMovement[];
    onAnnul: (movement: CashMovement) => void;
    onPrint: (movement: CashMovement) => void;
    compact?: boolean;
}) => {
    if (rows.length === 0) {
        return (
            <div className="py-10 text-center text-slate-500 text-sm">
                <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No hay movimientos para mostrar.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[920px]">
                <thead>
                    <tr className="text-left border-b border-slate-200">
                        <th className="py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Recibo</th>
                        <th className="py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Fecha</th>
                        <th className="py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Concepto</th>
                        <th className="py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Categoría</th>
                        <th className="py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Método</th>
                        <th className="py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Estado</th>
                        <th className="py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 text-right">Importe</th>
                        {!compact && <th className="py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 text-right">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100">
                            <td className="py-2 text-xs text-slate-700">{row.numRecibo}</td>
                            <td className="py-2 text-xs text-slate-500">{formatDateTime(row.fecha)}</td>
                            <td className="py-2 text-sm text-slate-700">{row.concepto}</td>
                            <td className="py-2 text-xs text-slate-500">{categoryLabel(row.categoria)}</td>
                            <td className="py-2 text-xs text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                    {methodIcon(row.metodoPago)}
                                    {CASH_PAYMENT_METHODS[row.metodoPago]}
                                </span>
                            </td>
                            <td className="py-2 text-xs">
                                <span className={`inline-flex rounded-full px-2 py-0.5 ${row.estado === 'ANULADO' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {row.estado}
                                </span>
                            </td>
                            <td className={`py-2 text-sm text-right ${row.tipo === 'INGRESO' ? 'text-emerald-700' : 'text-rose-700'} ${row.estado === 'ANULADO' ? 'line-through opacity-60' : ''}`}>
                                {row.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(row.importe)}
                            </td>
                            {!compact && (
                                <td className="py-2 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <Button variant="ghost" size="sm" icon={Printer} onClick={() => onPrint(row)}>
                                            Imprimir
                                        </Button>
                                        {row.estado !== 'ANULADO' ? (
                                            <Button variant="ghost" size="sm" onClick={() => onAnnul(row)}>
                                                Anular
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CashView;

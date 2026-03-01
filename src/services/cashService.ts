import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  CashBalance,
  CashDailySession,
  CashMovement,
  CashPaymentMethod,
} from '@/types/cash';

const CASH_MOVEMENTS_COLLECTION = 'cashMovements';
const CASH_SESSIONS_COLLECTION = 'cashDailySessions';
const CASH_META_COLLECTION = 'cashMeta';

const todayYmd = () => new Date().toISOString().slice(0, 10);

const nowIso = () => new Date().toISOString();

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const movementFromDoc = (id: string, data: any): CashMovement => ({
  id,
  numRecibo: data?.numRecibo || '',
  tipo: data?.tipo || 'INGRESO',
  categoria: data?.categoria || 'OTROS_INGRESOS',
  metodoPago: data?.metodoPago || 'EFECTIVO',
  fecha: data?.fecha || nowIso(),
  fechaDia: data?.fechaDia || todayYmd(),
  concepto: data?.concepto || '',
  importe: toNumber(data?.importe),
  clienteId: data?.clienteId || undefined,
  expedienteId: data?.expedienteId || undefined,
  observaciones: data?.observaciones || undefined,
  estado: data?.estado || 'COMPLETADO',
  motivoAnulacion: data?.motivoAnulacion || undefined,
  fechaAnulacion: data?.fechaAnulacion || undefined,
  createdBy: data?.createdBy || undefined,
  anuladaBy: data?.anuladaBy || undefined,
  createdAt: data?.createdAt || data?.fecha || undefined,
  updatedAt: data?.updatedAt || undefined,
});

const sessionFromDoc = (id: string, data: any): CashDailySession => ({
  id,
  fecha: data?.fecha || id,
  saldoApertura: toNumber(data?.saldoApertura),
  saldoCierre: data?.saldoCierre == null ? undefined : toNumber(data?.saldoCierre),
  estado: data?.estado || 'ABIERTA',
  observaciones: data?.observaciones || undefined,
  descuadre: data?.descuadre == null ? undefined : toNumber(data?.descuadre),
  responsable: data?.responsable || undefined,
  openedBy: data?.openedBy || undefined,
  closedBy: data?.closedBy || undefined,
  openedAt: data?.openedAt || undefined,
  closedAt: data?.closedAt || undefined,
  updatedAt: data?.updatedAt || undefined,
});

const getSessionDocRef = (fecha: string) => doc(db, CASH_SESSIONS_COLLECTION, fecha);

async function getNextReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterRef = doc(db, CASH_META_COLLECTION, `receiptCounter_${year}`);
  const nextCounter = await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const current = counterSnap.exists() ? Number(counterSnap.data().counter || 0) : 0;
    const next = current + 1;
    tx.set(
      counterRef,
      {
        counter: next,
        year,
        updatedAt: nowIso(),
      },
      { merge: true }
    );
    return next;
  });
  return `RC-${year}-${String(nextCounter).padStart(5, '0')}`;
}

export async function getCashSessionByDate(fecha: string): Promise<CashDailySession | null> {
  const snap = await getDoc(getSessionDocRef(fecha));
  if (!snap.exists()) return null;
  return sessionFromDoc(snap.id, snap.data());
}

export async function openCashSession(params: {
  fecha?: string;
  saldoApertura: number;
  responsable?: string;
  openedBy?: string;
}): Promise<CashDailySession> {
  const fecha = params.fecha || todayYmd();
  const docRef = getSessionDocRef(fecha);
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    throw new Error('La caja ya fue abierta para esta fecha.');
  }

  const payload: Omit<CashDailySession, 'id'> = {
    fecha,
    saldoApertura: params.saldoApertura,
    estado: 'ABIERTA',
    responsable: params.responsable || undefined,
    openedBy: params.openedBy || undefined,
    openedAt: nowIso(),
    updatedAt: nowIso(),
  };

  await updateDocFallback(docRef, payload);
  return {
    id: fecha,
    ...payload,
  };
}

// Supports first write (set) and updates using a single helper.
async function updateDocFallback(docRef: ReturnType<typeof getSessionDocRef>, payload: any): Promise<void> {
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await updateDoc(docRef, payload);
    return;
  }
  await runTransaction(db, async (tx) => {
    tx.set(docRef, payload, { merge: true });
  });
}

export async function listCashMovements(options?: {
  fechaDia?: string;
  limitTo?: number;
}): Promise<CashMovement[]> {
  const constraints: any[] = [];
  if (options?.fechaDia) {
    constraints.push(where('fechaDia', '==', options.fechaDia));
  }
  constraints.push(orderBy('fecha', 'desc'));

  const q = query(collection(db, CASH_MOVEMENTS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => movementFromDoc(d.id, d.data()));
  if (options?.limitTo && options.limitTo > 0) {
    return all.slice(0, options.limitTo);
  }
  return all;
}

export async function addCashMovement(data: Omit<CashMovement, 'id' | 'numRecibo' | 'estado' | 'fecha' | 'fechaDia' | 'createdAt' | 'updatedAt'>): Promise<CashMovement> {
  const fechaDia = todayYmd();
  const caja = await getCashSessionByDate(fechaDia);
  if (!caja || caja.estado !== 'ABIERTA') {
    throw new Error('La caja no está abierta para hoy. Abre la caja antes de registrar movimientos.');
  }

  const numRecibo = await getNextReceiptNumber();
  const payload = {
    ...data,
    numRecibo,
    estado: 'COMPLETADO',
    fecha: nowIso(),
    fechaDia,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const ref = await addDoc(collection(db, CASH_MOVEMENTS_COLLECTION), payload);
  return movementFromDoc(ref.id, payload);
}

export async function annulCashMovement(params: {
  movementId: string;
  motivo: string;
  anuladaBy?: string;
}): Promise<void> {
  const movRef = doc(db, CASH_MOVEMENTS_COLLECTION, params.movementId);
  const movSnap = await getDoc(movRef);
  if (!movSnap.exists()) {
    throw new Error('No se encontró el movimiento a anular.');
  }
  const current = movSnap.data();
  if (current.estado === 'ANULADO') {
    throw new Error('Este movimiento ya está anulado.');
  }
  await updateDoc(movRef, {
    estado: 'ANULADO',
    motivoAnulacion: params.motivo,
    fechaAnulacion: nowIso(),
    anuladaBy: params.anuladaBy || undefined,
    updatedAt: nowIso(),
  });
}

export async function getDailyBalance(fecha: string): Promise<CashBalance> {
  const [session, movements] = await Promise.all([
    getCashSessionByDate(fecha),
    listCashMovements({ fechaDia: fecha }),
  ]);

  const completed = movements.filter((m) => m.estado === 'COMPLETADO');
  const byType = (tipo: 'INGRESO' | 'GASTO') =>
    completed.filter((m) => m.tipo === tipo).reduce((acc, m) => acc + toNumber(m.importe), 0);
  const byMethod = (tipo: 'INGRESO' | 'GASTO', metodo: CashPaymentMethod) =>
    completed
      .filter((m) => m.tipo === tipo && m.metodoPago === metodo)
      .reduce((acc, m) => acc + toNumber(m.importe), 0);

  const saldoApertura = session?.saldoApertura || 0;
  const ingresos = byType('INGRESO');
  const gastos = byType('GASTO');

  return {
    saldoApertura,
    ingresos,
    gastos,
    saldoActual: saldoApertura + ingresos - gastos,
    numMovimientos: completed.length,
    ingresosEfectivo: byMethod('INGRESO', 'EFECTIVO'),
    gastoEfectivo: byMethod('GASTO', 'EFECTIVO'),
    ingresosTarjeta: byMethod('INGRESO', 'TARJETA'),
    gastoTarjeta: byMethod('GASTO', 'TARJETA'),
    ingresosTransferencia: byMethod('INGRESO', 'TRANSFERENCIA'),
    gastoTransferencia: byMethod('GASTO', 'TRANSFERENCIA'),
    ingresosCheque: byMethod('INGRESO', 'CHEQUE'),
    gastoCheque: byMethod('GASTO', 'CHEQUE'),
    ingresosBizum: byMethod('INGRESO', 'BIZUM'),
    gastoBizum: byMethod('GASTO', 'BIZUM'),
  };
}

export async function closeCashSession(params: {
  fecha?: string;
  saldoReal: number;
  observaciones?: string;
  closedBy?: string;
}): Promise<CashDailySession> {
  const fecha = params.fecha || todayYmd();
  const docRef = getSessionDocRef(fecha);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('No hay caja abierta para cerrar en esta fecha.');
  }

  const session = sessionFromDoc(snap.id, snap.data());
  if (session.estado === 'CERRADA') {
    throw new Error('La caja ya está cerrada para esta fecha.');
  }

  const balance = await getDailyBalance(fecha);
  const descuadre = params.saldoReal - balance.saldoActual;

  const updates: Partial<CashDailySession> = {
    estado: 'CERRADA',
    saldoCierre: params.saldoReal,
    observaciones: params.observaciones || undefined,
    descuadre,
    closedBy: params.closedBy || undefined,
    closedAt: nowIso(),
    updatedAt: nowIso(),
  };

  await updateDoc(docRef, updates);
  return {
    ...session,
    ...(updates as CashDailySession),
  };
}

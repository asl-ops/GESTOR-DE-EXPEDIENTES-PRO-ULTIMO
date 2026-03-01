export type CashMovementType = 'INGRESO' | 'GASTO';

export type CashMovementStatus = 'COMPLETADO' | 'ANULADO';

export type CashPaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CHEQUE' | 'BIZUM';

export type CashIncomeCategory =
  | 'PROVISION_FONDOS'
  | 'HONORARIOS'
  | 'COBRO_FACTURA'
  | 'DEVOLUCION_TASAS'
  | 'OTROS_INGRESOS';

export type CashExpenseCategory =
  | 'SUPLIDO_REGISTRO'
  | 'SUPLIDO_NOTARIA'
  | 'SUPLIDO_TRAFICO'
  | 'TASAS_ADMINISTRATIVAS'
  | 'MATERIAL_OFICINA'
  | 'CORREO_MENSAJERIA'
  | 'GASTOS_BANCARIOS'
  | 'IMPUESTOS_TASAS'
  | 'OTROS_GASTOS';

export type CashCategory = CashIncomeCategory | CashExpenseCategory;

export const CASH_INCOME_CATEGORIES: Record<CashIncomeCategory, string> = {
  PROVISION_FONDOS: 'Provisión de Fondos',
  HONORARIOS: 'Honorarios Profesionales',
  COBRO_FACTURA: 'Cobro de Factura',
  DEVOLUCION_TASAS: 'Devolución de Tasas',
  OTROS_INGRESOS: 'Otros Ingresos',
};

export const CASH_EXPENSE_CATEGORIES: Record<CashExpenseCategory, string> = {
  SUPLIDO_REGISTRO: 'Suplido - Registro',
  SUPLIDO_NOTARIA: 'Suplido - Notaría',
  SUPLIDO_TRAFICO: 'Suplido - Tráfico',
  TASAS_ADMINISTRATIVAS: 'Tasas Administrativas',
  MATERIAL_OFICINA: 'Material de Oficina',
  CORREO_MENSAJERIA: 'Correo y Mensajería',
  GASTOS_BANCARIOS: 'Gastos Bancarios',
  IMPUESTOS_TASAS: 'Impuestos y Tasas',
  OTROS_GASTOS: 'Otros Gastos',
};

export const CASH_PAYMENT_METHODS: Record<CashPaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  BIZUM: 'Bizum',
};

export interface CashMovement {
  id: string;
  numRecibo: string;
  tipo: CashMovementType;
  categoria: CashCategory;
  metodoPago: CashPaymentMethod;
  fecha: string;
  fechaDia: string;
  concepto: string;
  importe: number;
  clienteId?: string;
  expedienteId?: string;
  observaciones?: string;
  estado: CashMovementStatus;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  createdBy?: string;
  anuladaBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashDailySession {
  id: string;
  fecha: string;
  saldoApertura: number;
  saldoCierre?: number;
  estado: 'ABIERTA' | 'CERRADA';
  observaciones?: string;
  descuadre?: number;
  responsable?: string;
  openedBy?: string;
  closedBy?: string;
  openedAt?: string;
  closedAt?: string;
  updatedAt?: string;
}

export interface CashBalance {
  saldoApertura: number;
  ingresos: number;
  gastos: number;
  saldoActual: number;
  numMovimientos: number;
  ingresosEfectivo: number;
  gastoEfectivo: number;
  ingresosTarjeta: number;
  gastoTarjeta: number;
  ingresosTransferencia: number;
  gastoTransferencia: number;
  ingresosCheque: number;
  gastoCheque: number;
  ingresosBizum: number;
  gastoBizum: number;
}


import { MandatarioConfig } from './mandate';


export type ClientType = "PARTICULAR" | "EMPRESA";
export type ClientStatus = "ACTIVO" | "INACTIVO" | "BAJA";

export interface Administrator {
  id: string;
  nombre: string;           // Unified: "APELLIDOS, NOMBRE"
  firstName?: string;
  surnames?: string;
  nif: string;
  position?: string;
  // Contact & Address
  telefonos?: ContactItem[];
  emails?: ContactItem[];
  domicilioFiscal?: Domicilio;
  domicilioContacto?: Domicilio;
  domicilioContactoIgualFiscal?: boolean;
}

export interface Client {
  id: string;
  surnames?: string;
  firstName?: string;
  nombre: string;           // Unified: "APELLIDOS, NOMBRE" / "RAZON SOCIAL"
  documento?: string;
  nif?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  telefono?: string;         // Alias for phone used in some components
  email?: string;
  birthDate?: string;
  gender?: 'V' | 'M';
  municipalityCode?: string;
  iaeCode?: string;
  isSelfEmployed?: boolean;
  administrators?: Administrator[];

  // -- Datos administrativos y bancarios (del sistema antiguo/moderno) --
  cuentaContable?: string;
  formaCobroId?: string;
  bancoCobro?: string;
  cuentaCobro?: string;
  iban?: string;
  bancoRemesa?: string;
  datosContactoImportadosCCS?: string;
  verificadoPor?: string;
  verificadoAt?: string;
  notas?: string;
  observaciones?: any[];     // Observacion[] alias
  telefonos?: any[];        // ContactItem[] alias
  emails?: any[];           // ContactItem[] alias

  // -- Legacy Address fields --
  sigla?: string;
  via?: string;
  direccion?: string;
  pais?: string;
  provincia?: string;
  poblacion?: string;
  cp?: string;

  fechaInicio?: string;

  // -- Datos de Archivo / Baja --
  estado?: ClientStatus | string;
  tipo?: ClientType | string;
  fechaBaja?: string;
  motivoBaja?: string;
  usuarioBaja?: string;
  notaBaja?: string;

  // -- Domicilios Estructurados --
  domicilioFiscal?: any;
  domicilioContacto?: any;
  domicilioContactoIgualFiscal?: boolean;

  // -- Escritura de constitución (Persona Jurídica) --
  notaria?: string;
  notario?: string;
  fechaEscritura?: string;
  numeroProtocolo?: string;
  observacionesEscritura?: string;

  // -- Datos registrales (Persona Jurídica) --
  registroMercantil?: string;
  tomo?: string;
  libro?: string;
  folio?: string;
  hoja?: string;
  seccion?: string;
  inscripcion?: string;
  observacionesRegistro?: string;

  // -- Metadatos --
  createdAt?: string;
  updatedAt?: string;
  legalName?: string;
}

export interface ClientArchiveRecord {
  id: string;
  nombre: string;
  nombreNormalized: string;
  documento?: string;
  nif?: string;
  documentoNormalized?: string;
  cuentaContable?: string;
  direccion?: string;
  poblacion?: string;
  provincia?: string;
  iban?: string;
  datosContactoImportadosCCS?: string;
  source?: string;
  sourceSheet?: string;
  rowNumber?: number;
  rescatado?: boolean;
  rescuedClientId?: string;
  rescuedAt?: string;
  rescuedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EconomicLineItem {
  id: string;
  conceptId: string;         // References ConceptCatalog
  concept: string;           // Denormalized concept name for display
  type: LineType;            // 'suplido' or 'honorario'
  amount: number;
  date?: string;
}

export interface EconomicData {
  lines: EconomicLineItem[];
  subtotalAmount: number;
  vatAmount: number;
  totalAmount: number;
}

// --- PHASE 2: PREFIX & CONCEPT MANAGEMENT ---

export type LineType = 'suplido' | 'honorario';

export interface ConceptCatalog {
  id: string;
  name: string;              // e.g., "Notaría", "Tasas DGT", "Gestoría"
  category: LineType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrefixLine {
  id: string;
  order: number;
  type: LineType;
  conceptId: string;         // References ConceptCatalog
  conceptName: string;       // Denormalized for display
  defaultAmount: number;
  isIncluded: boolean;
}

// PHASE 3: Auto-Save System
export interface Draft {
  id: string;
  fileNumber: string;
  userId: string;
  data: Partial<CaseRecord>;
  lastSaved: string;
  autoSaved: boolean;
  version: number;
}

// PHASE 3: Dashboard Analytics
export interface CaseStats {
  total: number;
  byStatus: Record<string, number>;
  byPrefix: Record<string, number>;
  thisMonth: number;
  lastMonth: number;
  avgProcessingTime: number; // days
}

export interface RevenueStats {
  total: number;
  byPrefix: Record<string, number>;
  thisMonth: number;
  lastMonth: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  caseCount: number;
  totalRevenue: number;
}

// PHASE 3: Template Management System
export interface MandateTemplate {
  id: string;
  name: string;
  description?: string;
  prefixId?: string; // null/undefined = global template
  fileUrl: string; // Firebase Storage URL
  fileName: string;
  variables: string[]; // e.g., ['CLIENT_NAME', 'VEHICLE_VIN']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PrefixConfig {
  id: string;
  code: string;              // e.g., "GMAT", "FITRI", "FICONTA"
  description: string;       // e.g., "Gestión de Matriculaciones"
  isActive: boolean;
  lines: PrefixLine[];       // DEPRECATED - usar PrefijoMovimiento
  ultimoNumeroAsignado?: number;       // For atomic sequential numbering
  numberLength?: number;     // e.g., 4 for 0001

  // FITRI System: Additional prefix metadata
  departamento?: string;     // e.g., "FISCAL (Gestión Fiscal)"
  provisionFondos?: number;  // e.g., 0.00
  codigoOperacion?: string;  // e.g., "FI-TRI" - Código operación a facturar

  createdAt: string;
  updatedAt: string;
}

// --- ECONOMIC MODEL: MOVIMIENTOS & ACCOUNTING ---

// FITRI System: Subcategorías de Suplidos (Fiscal)
// Estas subcategorías permiten clasificar los suplidos para integración contable futura
// Cada subcategoría se asociará a una cuenta contable específica de "Pagos Delegados"
export type SubcategoriaSuplido =
  | 'Pago a cuenta del IRPF'
  | 'IVA'
  | 'Ingreso del modelo 115'
  | 'Pago a cuenta del Impuesto sobre Sociedades'
  | 'Impuesto sobre Sociedades';

export const SUBCATEGORIAS_SUPLIDOS_FISCAL: SubcategoriaSuplido[] = [
  'Pago a cuenta del IRPF',
  'IVA',
  'Ingreso del modelo 115',
  'Pago a cuenta del Impuesto sobre Sociedades',
  'Impuesto sobre Sociedades'
];

// Enums for economic model
export enum Naturaleza {
  HONORARIO = 'HONORARIO',             // Professional service income
  SUPLIDO = 'SUPLIDO',                 // Expenses on behalf of client
  ENTREGA_A_CUENTA = 'ENTREGA_A_CUENTA', // Advance payments/provisions
  AJUSTE = 'AJUSTE',                   // Adjustments, discounts
  OTRO = 'OTRO'                        // Other
}

export enum RegimenIVA {
  SUJETO = 'SUJETO',                   // Subject to VAT
  EXENTO = 'EXENTO',                   // VAT exempt
  NO_SUJETO = 'NO_SUJETO',            // Not subject to VAT
  NO_APLICA = 'NO_APLICA'             // VAT does not apply
}

export enum ModoImporte {
  MANUAL = 'MANUAL',                   // User enters amount
  FIJO = 'FIJO',                       // Fixed predefined amount
  PORCENTAJE = 'PORCENTAJE',           // Percentage of base
  TARIFA = 'TARIFA'                    // Based on rate table
}

export enum RolCuenta {
  INGRESO = 'INGRESO',                 // 7xx - Income
  IVA_REPER = 'IVA_REPER',            // 477xxx - VAT charged
  GASTO_SUPLIDO = 'GASTO_SUPLIDO',    // 6xx - Expenses on behalf of client
  SUPLIDO_CUENTA_PUENTE = 'SUPLIDO_CUENTA_PUENTE', // 555xxx - Bridge account for suplidos
  PROVISION_CUENTA_PUENTE = 'PROVISION_CUENTA_PUENTE', // 438xxx/555xxx - Provisions
  ANTICIPO = 'ANTICIPO',               // Client advances
  CLIENTE = 'CLIENTE',                 // 430xxx - Clients
  BANCO = 'BANCO',                     // 572xxx - Banks
  CAJA = 'CAJA',                       // 570xxx - Cash
  RETENCION = 'RETENCION'              // 4751xx - Withholdings
}

export enum EstadoMovimiento {
  PENDIENTE = 'PENDIENTE',
  REALIZADO = 'REALIZADO',
  FACTURABLE = 'FACTURABLE',
  NO_FACTURABLE = 'NO_FACTURABLE',
  FACTURADO = 'FACTURADO',
  CANCELADO = 'CANCELADO'
}

// Movimiento - Master catalog of economic actions
export interface Movimiento {
  id: string;
  codigo: string;                      // Unique. Ex: "HON_RENTA", "SUP_TASA_DGT"
  nombre: string;                      // "Honorarios Declaración Renta", "Tasa DGT"
  naturaleza: Naturaleza;
  regimenIva: RegimenIVA;
  ivaPorDefecto: number | null;        // Ex: 21.00 (only if SUJETO)

  // FITRI System: Subcategoría obligatoria para SUPLIDOS
  // Permite clasificar el tipo de suplido para integración contable
  // REGLA: Si naturaleza === SUPLIDO, este campo es OBLIGATORIO
  subcategoriaSuplido?: SubcategoriaSuplido;

  // Controlled exception for honorarios without VAT
  permitirExcepcionIva?: boolean;      // Allows HONORARIO with non-SUJETO regime
  motivoExencion?: string;             // Required if permitirExcepcionIva is true

  // Behavior in invoicing
  afectaFactura: boolean;              // Appears in invoice?
  imprimibleEnFactura: boolean;        // Printed in invoice PDF?
  afectaBaseImponible: boolean;        // Adds to taxable base?
  afectaIva: boolean;                  // Generates VAT charged?

  // Amount calculation
  modoImporte: ModoImporte;
  importePorDefecto: number | null;

  activo: boolean;
  prefixId: string;                    // Associated prefix ID (FITRI, GE, etc.)
  legacyId?: string;                   // For migration tracking from CCS
  createdAt: string;
  updatedAt: string;
}

// Accounting account association for movements
export interface MovimientoCuentaContable {
  id: string;
  movimientoId: string;
  rol: RolCuenta;                      // Purpose of the account
  cuentaContable: string;              // Account code. Ex: "705000", "477000"
  debeHaber: 'DEBE' | 'HABER';        // Position in entry
  descripcion?: string;
}

// Predefined movements for a prefix (template)
export interface PrefijoMovimiento {
  id: string;
  prefijoId: string;
  movimientoId: string;                // Reference to master catalog
  nombre?: string;                     // Movement name (for display)
  orden: number;                       // Display order
  obligatorio: boolean;                // Must be included?
  editableEnExpediente: boolean;       // User can modify/delete?
  importePorDefecto: number | null;
  estadoInicial: EstadoMovimiento;     // Initial state when creating case
  observaciones?: string;

  // Protection for system movements
  categoria: 'CABECERA' | 'OPERATIVO'; // Header (system) or operational
  bloqueado: boolean;                  // If true, cannot be deleted
}

// Movement instance in an actual case
export interface MovimientoExpediente {
  id: string;
  expedienteId: string;
  movimientoId: string;                // Reference to master catalog (for traceability only)
  orden: number;

  // ========================================
  // SNAPSHOT FIELDS (Immutable)
  // ========================================
  // These fields are copied from the catalog at creation time
  // and NEVER change, even if the catalog is updated later.
  // This ensures historical integrity.

  nombreSnapshot: string;              // Commercial name at creation time (e.g., "HONORARIOS I.R.P.F. 3T/2025")
  codigoSnapshot: string;              // Movement code at creation time (e.g., "FITRI_HON_IRPF_3T")
  naturalezaSnapshot: Naturaleza;      // Economic nature at creation time

  // ========================================
  // EDITABLE FIELDS (Can be modified in case)
  // ========================================

  descripcionOverride?: string;        // Allows customizing description for this specific case
  importe: number | null;
  regimenIva: RegimenIVA;             // Copied from movement at creation
  ivaPorcentaje: number | null;       // Copied from movement at creation

  // FITRI System: Subcategoría de suplido (obligatoria si es SUPLIDO)
  // El usuario debe seleccionar la subcategoría al activar/editar un movimiento suplido
  subcategoriaSuplido?: SubcategoriaSuplido;

  estado: EstadoMovimiento;
  facturable: boolean;
  fecha: string;
  observaciones?: string;

  createdAt: string;
  updatedAt: string;
}

// Payment/Receipt (for advance payments)
export interface Cobro {
  id: string;
  clienteId: string;
  expedienteId?: string;               // Can be linked to case or generic
  tipo: 'PROVISION' | 'COBRO_FACTURA' | 'OTRO';
  importe: number;
  fecha: string;
  metodo: 'TRANSFERENCIA' | 'EFECTIVO' | 'TARJETA' | 'CHEQUE' | 'DOMICILIACION';
  referencia?: string;                 // Transfer number, check, etc.
  observaciones?: string;
  cuentaBanco?: string;                // Destination bank account
  createdAt: string;
  updatedAt: string;
}

// --- END PHASE 2 TYPES ---


// --- TIPOS EXTENDIDOS PARA FICHA TÉCNICA (HERMES) ---
export interface Vehicle {
  id?: string;
  vin: string;
  plate?: string;

  // Identificación
  brand: string;
  model: string;
  manufacturer?: string;           // Fabricante (A.1)
  variantVersion?: string;         // Variante/Versión

  // Fechas e ITV
  year: string;                    // Fecha matriculación
  itvCode?: string;                // Código ITV (ej: BA02)
  itvSerialNumber?: string;        // Número Serie ITV
  itvExpiration?: string;          // Fecha Validez ITV

  // Motor y Potencia
  engineSize: string;              // Cilindrada
  fuelType: string;
  power?: string;                  // Potencia Fiscal
  maxNetPower?: string;            // Potencia Neta Máxima (P.2)
  engineCode?: string;             // Código Motor
  emissions?: string;              // Nivel Emisiones
  euroCategory?: string;           // Categoría Homologación (ej: N1)

  // Dimensiones y Masas
  length?: string;                 // Longitud
  width?: string;                  // Anchura
  height?: string;                 // Altura
  wheelbase?: string;              // Distancia ejes
  massInOrder?: string;            // Masa Orden Marcha
  mma?: string;                    // Masa Máxima Autorizada
  technicalMma?: string;           // Masa Máxima Técnica
  tara?: string;                   // Tara

  // Ejes y Ruedas
  axles?: string;                  // Número Ejes
  anteriorVia?: string;            // Vía Anterior
  posteriorVia?: string;           // Vía Posterior

  // Clasificación y Otros
  type?: string;                   // Tipo (ej: 20)
  classCode?: string;              // Clase (ej: 2011)
  serviceCode?: string;            // Servicio (ej: B00)
  bodywork?: string;               // Carrocería (ej: BA)
  homologationNumber?: string;     // Número Homologación
  homologationDate?: string;       // Fecha Homologación

  // Flags
  isImported?: boolean;
  isUsed?: boolean;
}

export type CommunicationType = 'call' | 'email' | 'whatsapp' | 'note';

export interface Communication {
  id: string;
  date: string; // ISO date (backward compat)
  timestamp?: string; // ISO datetime for full precision
  concept: string;
  authorUserId: string;
  type?: CommunicationType; // Optional: call, email, whatsapp, note
}

// --- CONFIGURACIÓN DINÁMICA ---

export type FileCategory = 'GE-MAT' | 'FI-TRI' | 'FI-CONTA';

export interface FieldDefinition {
  id: string;
  label: string;
  options: string[];
}

export interface FileConfig {
  fileType: string; // El subtipo (ej. Matriculación, Trimestre 1)
  category: FileCategory; // La categoría principal (GE-MAT)
  responsibleUserId: string;
  customValues: Record<string, string>; // Valores de los campos dinámicos { "jefatura": "Madrid" }
  openingDate?: string;
  status?: string;
}

export interface AgencyData {
  name: string;
  cif: string;
  address: string;
  managerName: string;
  managerColegiado: string;
  managerDni: string;
}

export interface AppSettings {
  fileCounter: number;
  generalSavePath: string;
  mandatoBody: string;
  // Datos del despacho (Responsable)
  agency: AgencyData;
  // Configuración de campos dinámicos por categoría
  fieldConfigs: Record<FileCategory, FieldDefinition[]>;
  // Estados configurables del expediente (Situaciones)
  caseStatuses: string[];
  // Tipos de expediente configurables (Categoría -> Lista de Subtipos)
  fileTypes: Record<FileCategory, string[]>;
  // PHASE 2: Mandate configuration
  mandateConfig?: {
    defaultFormat: 'pdf' | 'docx' | 'both';
    templateByPrefix: Record<string, string>; // prefixId -> templateId
    globalTemplate?: string;
  };
  // Configuración del mandatario para generación de mandatos
  mandatarioConfig?: MandatarioConfig;
  deletePassword?: string;
  defaultResponsibleId?: string;
  defaultInitialStatus?: string;
  uiTheme?: UITheme;
}

export interface UITheme {
  corporateAccent: string;     // e.g., '#4c739a'
  labelTextColor: string;      // e.g., '#4c739a/70'
  valueTextColor: string;      // e.g., '#4c739a'
  labelWeight: 'font-normal' | 'font-medium' | 'font-semibold' | 'font-bold';
  valueWeight: 'font-normal' | 'font-medium' | 'font-semibold' | 'font-bold';
  dividerColor: string;        // e.g., '#f1f5f9' (slate-100)
  dividerOpacity: number;      // 0 to 1
  activeTabIndicatorColor: string;
  activeTabIndicatorHeight: number; // in pixels
  activeTabIndicatorRadius: number; // in pixels
}

export const DEFAULT_THEME: UITheme = {
  corporateAccent: '#4c739a',
  labelTextColor: '#4c739a',
  valueTextColor: '#4c739a',
  labelWeight: 'font-normal',
  valueWeight: 'font-normal',
  dividerColor: '#f1f5f9',
  dividerOpacity: 1,
  activeTabIndicatorColor: '#4c739a',
  activeTabIndicatorHeight: 2,
  activeTabIndicatorRadius: 0
};

// --- FIN CONFIGURACIÓN DINÁMICA ---

export interface HermesResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  reportUrl?: string;
}

export type DocumentStatus = 'local' | 'uploading' | 'synced' | 'error';

export interface AttachedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  file?: File;
  status: DocumentStatus;
  url?: string;
  description?: string;
  category?: string;
  createdAt: string;
  uploadedAt?: string;
}

export interface User {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role?: 'admin' | 'user';
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  assignedToUserId: string;
  createdByUserId: string;
  createdAt: string;
}

export type CaseStatus = string; // Dinámico

export const DEFAULT_CASE_STATUSES: string[] = [
  'Iniciado',
  'Pendiente Documentación',
  'En Tramitación',
  'Pendiente Pago',
  'Finalizado',
  'Cerrado',
  'Archivado',
  'Eliminado',
];

export const getCaseStatusBadgeColor = (status: string): string => {
  const s = (status || '').toLowerCase();
  // "Pendiente" changed from Yellow to Blue-Grey (Professional/Neutral)
  if (s.includes('pendiente') || s.includes('documentación')) return 'bg-slate-100 text-slate-700 border-slate-200 font-normal';

  if (s.includes('tramitación') || s.includes('proceso')) return 'bg-sky-50 text-sky-700 border-sky-100 font-normal';
  if (s.includes('dgt') || s.includes('administración')) return 'bg-purple-50 text-purple-700 border-purple-100 font-normal';
  if (s.includes('pago') || s.includes('factura')) return 'bg-orange-50 text-orange-700 border-orange-100 font-normal';
  if (s.includes('finalizado') || s.includes('completado')) return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-normal';
  if (s.includes('archivado') || s.includes('cerrado')) return 'bg-gray-100 text-gray-600 border-gray-200 font-normal';

  return 'bg-slate-50 text-slate-600 border-slate-100';
};

export const getCaseStatusBorderColor = (status: string): string => {
  // Helper for selects
  const s = (status || '').toLowerCase();
  if (s.includes('pendiente')) return 'border-yellow-300 focus:ring-yellow-500';
  if (s.includes('finalizado')) return 'border-emerald-300 focus:ring-emerald-500';
  return 'border-slate-300 focus:ring-sky-500';
};

export interface CaseRecord {
  fileNumber: string;

  // 🔄 SISTEMA NUEVO: Referencia centralizada a cliente
  clienteId?: string | null;              // ID de referencia (única fuente de verdad)
  clientSnapshot?: {                      // Cache/histórico para listados rápidos
    nombre: string;
    documento?: string;
    telefono?: string;
    cuentaContable?: string | null;
  } | null;

  // ⚠️ DEPRECADO: Cliente embebido (mantener para backward compatibility)
  client: Client;

  vehicle: Vehicle;
  fileConfig: FileConfig;
  prefixId?: string;         // PHASE 2: New prefix-based system (optional during migration)
  description?: string;      // Descripción del expediente y su razón de ser
  economicData: EconomicData;
  communications: Communication[];
  status: string;
  attachments: AttachedDocument[];
  tasks: Task[];
  movimientos?: MovimientoExpediente[]; // PHASE 5: Economic movements
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  situation?: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface CaseSelection {
  nif: string;
  cases: CaseRecord[];
}

export interface TemplateEconomicLineItem {
  concept: string;
  amount: number;
  included: boolean;
}

export type EconomicTemplates = Record<string, TemplateEconomicLineItem[]>;

// --- CLIENT MODULE TYPES (Unification) ---

export interface ContactItem {
  value: string;
  label: string;
}

export interface Domicilio {
  sigla?: string;
  via?: string;
  numero?: string;
  piso?: string;
  puerta?: string;
  pais?: string;
  provincia?: string;
  poblacion?: string;
  cp?: string;
}

export interface Observacion {
  fecha: string;
  descripcion: string;
  id?: string;
}

export interface ClientCreateInput extends Partial<Client> {
  nombre: string;
}

export interface ClientUpdateInput extends Partial<ClientCreateInput> {
}

export interface ClientSearchParams {
  q?: string;
  documento?: string;
  nif?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo?: ClientType | string;
  estado?: ClientStatus | string;
  limit?: number | 'all';
  offset?: number;
}

export interface ClientSearchResult {
  items: Client[];
  total: number;
}

export interface ClientSnapshot {
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  cuentaContable?: string | null;
}

export interface ClientFilters {
  tipo?: ClientType;
  provincia?: string;
  poblacion?: string;
  metodoCobro?: string;
  bancoCobro?: string;
  identificadorDesde?: string;
  identificadorHasta?: string;
  searchQuery?: string;
  [key: string]: any;
}

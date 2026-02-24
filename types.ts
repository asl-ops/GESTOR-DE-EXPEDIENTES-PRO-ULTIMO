
import type { Dispatch, SetStateAction } from 'react';

// 🆕 Importar nuevos tipos de cliente centralizados
export type { Client as ClientV2, ClientSnapshot, ClientType, ClientStatus } from './src/types/client';

/**
 * @deprecated Cliente embebido en expediente (antiguo sistema)
 * Mantener temporalmente para backward compatibility
 * Usar ClientV2 + clienteId para nuevos desarrollos
 */
export interface Client {
  id: string;
  surnames: string;
  firstName: string;
  nif: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
}

export interface EconomicLineItem {
  id: string;
  concept: string;
  amount: number;
}

export interface EconomicData {
  lines: EconomicLineItem[];
  subtotalAmount: number;
  vatAmount: number;
  totalAmount: number;
}

export interface Vehicle {
  id?: string;
  vin: string;
  brand: string;
  model: string;
  year: string;
  engineSize: string;
  fuelType: string;
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

// Configuración de campos dinámicos
export interface FieldDefinition {
  id: string;
  label: string;
  options: string[]; // Opciones del desplegable
}

export type FileCategory = 'GE-MAT' | 'FI-TRI' | 'FI-CONTA';

export interface FileConfig {
  fileType: string; // Subtipo específico (ej. Matriculación)
  category: FileCategory; // Categoría principal (GE-MAT, etc)
  responsibleUserId: string;
  customValues: Record<string, string>; // { "fieldId": "SelectedOption" }
}

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
}

export interface User {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  assignedToUserId: string;
  createdByUserId: string;
  createdAt: string;
}

export type CaseStatus = string; // Ahora es dinámico, string base

export const DEFAULT_CASE_STATUSES: string[] = [
  'Pendiente Documentación',
  'En Trámite',
  'Pendiente DGT',
  'Pendiente Pago',
  'Finalizado',
  'Archivado',
];

export const getCaseStatusBadgeColor = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes('pendiente') || s.includes('documentación')) return 'bg-yellow-100 text-yellow-800';
  if (s.includes('trámite') || s.includes('proceso')) return 'bg-sky-100 text-sky-800';
  if (s.includes('dgt') || s.includes('administración')) return 'bg-purple-100 text-purple-800';
  if (s.includes('pago') || s.includes('factura')) return 'bg-orange-100 text-orange-800';
  if (s.includes('finalizado') || s.includes('completado')) return 'bg-emerald-100 text-emerald-800';
  if (s.includes('archivado') || s.includes('cerrado')) return 'bg-slate-200 text-slate-800';
  return 'bg-slate-100 text-slate-800';
};

export const getCaseStatusBorderColor = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes('pendiente')) return 'border-yellow-300';
  if (s.includes('trámite')) return 'border-sky-300';
  if (s.includes('dgt')) return 'border-purple-300';
  if (s.includes('finalizado')) return 'border-emerald-300';
  return 'border-slate-300';
};

export interface CaseRecord {
  fileNumber: string;

  // 🔄 SISTEMA NUEVO: Referencia centralizada a cliente
  clienteId?: string | null;              // ID de referencia (única fuente de verdad)
  clientSnapshot?: ClientSnapshot | null;  // Cache/histórico para listados rápidos

  // ⚠️ DEPRECADO: Cliente embebido (mantener para backward compatibility)
  client: Client;

  vehicle: Vehicle;
  fileConfig: FileConfig;
  economicData: EconomicData;
  communications: Communication[];
  status: string;
  attachments: AttachedDocument[];
  tasks: Task[];
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

export interface AppSettings {
  fileCounter: number;
  generalSavePath: string;
  mandatoBody: string;
  // Configuración de campos dinámicos por categoría
  fieldConfigs: Record<FileCategory, FieldDefinition[]>;
  // Estados configurables del expediente
  caseStatuses: string[];
  // Tipos de expediente configurables (Categoría -> Lista de Subtipos)
  fileTypes: Record<FileCategory, string[]>;
}

export interface DeliveryNoteLine {
    concept: string;
    amount: number;
    vatRate?: number;
    vatAmount?: number;
}

export type DeliveryNoteStatus = 'pending' | 'invoiced' | 'void';

export interface DeliveryNote {
    id: string;
    clientId: string;
    clientName: string; // denormalized for sorting
    clientIdentity?: string; // NIF/Reference
    expedienteId: string;
    expedienteNumero: string;
    closedAt: string; // ISO timestamp from case
    createdAt: string; // ISO timestamp
    status: DeliveryNoteStatus;
    lines: DeliveryNoteLine[];
    subtotal: number;
    vatTotal: number;
    total: number;
    // Proforma integration
    proformaId?: string | null;  // ID of proforma this albarán belongs to
    incorporatedAt?: string;      // Timestamp when incorporated
    incorporatedBy?: string;      // User ID who incorporated
}

export interface ClientDeliveryGroup {
    clientId: string;
    clientName: string;
    clientIdentity?: string;
    deliveryNotes: DeliveryNote[];
}

// Proforma Types
export type ProformaStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced' | 'void';

export interface ProformaLine {
    concept: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    vatRate?: number;
    vatAmount?: number;
}

export interface Proforma {
    id: string;
    number?: string; // Assigned on "emit", null while draft
    clientId: string | null;
    clientName?: string;
    clientIdentity?: string;
    caseId: string | null;
    caseNumber?: string;
    createdAt: string;
    updatedAt?: string;
    validUntil?: string;
    status: ProformaStatus;
    lines: ProformaLine[];
    subtotal: number;
    vatTotal: number;
    total: number;
    notes?: string;
    // Albaranes integration
    albaranesIds?: string[];  // Array of DeliveryNote IDs included in this proforma
}

// Invoice Types
export type InvoiceStatus = 'draft' | 'issued' | 'void';

export interface InvoiceLine {
    concept: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    vatRate: number;
    vatAmount: number;
}

export interface Invoice {
    id: string;
    number?: string; // Assigned on "issue", e.g. F-2026-000001
    sequence?: number;
    year?: number;
    status: InvoiceStatus;
    createdAt: string;
    issuedAt?: string;
    voidedAt?: string;
    updatedAt?: string;
    // Source
    deliveryNoteId?: string;
    proformaId?: string;
    expedienteId?: string;
    expedienteNumero?: string;
    // Client
    clientId: string | null;
    clientName?: string;
    clientIdentity?: string;
    clientAddress?: string;
    // Lines and totals
    lines: InvoiceLine[];
    subtotal: number;
    vatTotal: number;
    total: number;
    // Extra
    notes?: string;
    formaCobroId?: string;
    paymentMethod?: string;
    // Payment status
    isPaid?: boolean;
    paidAt?: string;
}

/**
 * Global Search Service
 * 
 * Provides intelligent search across all entities:
 * - Clients (nombre, identificador)
 * - Cases/Expedientes (código, asunto, cliente)
 * - Invoices (número, cliente, importe)
 * - Proformas (número, cliente, importe)
 * - Delivery Notes/Albaranes (número, cliente, importe)
 * 
 * Features:
 * - Text normalization (accents, case)
 * - Relevance scoring (exact > starts with > contains)
 * - Multi-field search
 * - Grouped results by type
 */

import { Client, CaseRecord } from '../types';
import { Invoice, Proforma, DeliveryNote } from '../types/billing';

// 🧠 CONCEPTO 1: Normalización de texto
// Elimina acentos y convierte a minúsculas para búsqueda flexible
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD') // Descompone caracteres con acentos
        .replace(/[\u0300-\u036f]/g, ''); // Elimina los acentos
}

// 🧠 CONCEPTO 2: Scoring de relevancia
// Determina qué tan relevante es un resultado
enum MatchScore {
    EXACT = 100,      // Coincidencia exacta
    STARTS_WITH = 75, // Empieza con...
    CONTAINS = 50,    // Contiene...
    NO_MATCH = 0      // No coincide
}

function calculateMatchScore(searchTerm: string, targetText: string): MatchScore {
    const normalizedSearch = normalizeText(searchTerm);
    const normalizedTarget = normalizeText(targetText);

    if (normalizedTarget === normalizedSearch) {
        return MatchScore.EXACT;
    }
    if (normalizedTarget.startsWith(normalizedSearch)) {
        return MatchScore.STARTS_WITH;
    }
    if (normalizedTarget.includes(normalizedSearch)) {
        return MatchScore.CONTAINS;
    }
    return MatchScore.NO_MATCH;
}

// 🧠 CONCEPTO 3: Tipos de resultados agrupados
export interface SearchResult {
    id: string;
    type: 'client' | 'case' | 'invoice' | 'proforma' | 'deliveryNote';
    title: string;
    subtitle: string;
    badge?: string;
    score: number;
    data: any; // El objeto completo para navegación
}

export interface GroupedSearchResults {
    clients: SearchResult[];
    cases: SearchResult[];
    invoices: SearchResult[];
    proformas: SearchResult[];
    deliveryNotes: SearchResult[];
}

// 🧠 CONCEPTO 4: Búsqueda en Clientes
export function searchClients(clients: Client[], searchTerm: string): SearchResult[] {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];

    for (const client of clients) {
        let maxScore = MatchScore.NO_MATCH;

        // Buscar en nombre completo
        const fullName = `${client.firstName} ${client.surnames}`.trim();
        const nameScore = calculateMatchScore(searchTerm, fullName);
        maxScore = Math.max(maxScore, nameScore);

        // Buscar en identificador (DNI/CIF sin letra)
        const nifWithoutLetter = (client.nif || '').replace(/[A-Za-z]/g, '');
        const nifScore = calculateMatchScore(searchTerm, nifWithoutLetter);
        maxScore = Math.max(maxScore, nifScore);

        // También buscar en NIF completo
        const nifFullScore = calculateMatchScore(searchTerm, client.nif || '');
        maxScore = Math.max(maxScore, nifFullScore);

        if (maxScore > MatchScore.NO_MATCH) {
            results.push({
                id: client.id,
                type: 'client',
                title: `${client.nif} — ${fullName}`,
                subtitle: client.isSelfEmployed ? 'Autónomo' : 'Particular',
                badge: client.isSelfEmployed ? 'EMPRESA' : 'PARTICULAR',
                score: maxScore,
                data: client
            });
        }
    }

    // Ordenar por score (mayor a menor)
    return results.sort((a, b) => b.score - a.score);
}

// 🧠 CONCEPTO 5: Búsqueda en Expedientes
export function searchCases(cases: CaseRecord[], searchTerm: string): SearchResult[] {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];

    for (const caseRecord of cases) {
        let maxScore = MatchScore.NO_MATCH;

        // Buscar en código visible del expediente
        const codeScore = calculateMatchScore(searchTerm, caseRecord.fileNumber);
        maxScore = Math.max(maxScore, codeScore);

        // Buscar en descripción/asunto
        if (caseRecord.description) {
            const descScore = calculateMatchScore(searchTerm, caseRecord.description);
            maxScore = Math.max(maxScore, descScore);
        }

        // Buscar en nombre del cliente (snapshot)
        if (caseRecord.clientSnapshot?.nombre) {
            const clientNameScore = calculateMatchScore(searchTerm, caseRecord.clientSnapshot.nombre);
            maxScore = Math.max(maxScore, clientNameScore);
        }

        // Buscar en documento del cliente (snapshot)
        if (caseRecord.clientSnapshot?.documento) {
            const clientDocScore = calculateMatchScore(searchTerm, caseRecord.clientSnapshot.documento);
            maxScore = Math.max(maxScore, clientDocScore);
        }

        // Buscar en cliente embebido (legacy)
        if (caseRecord.client) {
            const fullName = `${caseRecord.client.firstName} ${caseRecord.client.surnames}`.trim();
            const clientScore = calculateMatchScore(searchTerm, fullName);
            maxScore = Math.max(maxScore, clientScore);

            const nifScore = calculateMatchScore(searchTerm, caseRecord.client.nif || '');
            maxScore = Math.max(maxScore, nifScore);
        }

        if (maxScore > MatchScore.NO_MATCH) {
            const clientName = caseRecord.clientSnapshot?.nombre ||
                `${caseRecord.client?.firstName || ''} ${caseRecord.client?.surnames || ''}`.trim();

            results.push({
                id: caseRecord.fileNumber,
                type: 'case',
                title: `${caseRecord.fileNumber} — ${caseRecord.description || 'Sin asunto'}`,
                subtitle: `${clientName} — ${caseRecord.status || 'Sin estado'}`,
                badge: caseRecord.status,
                score: maxScore,
                data: caseRecord
            });
        }
    }

    return results.sort((a, b) => b.score - a.score);
}

// 🧠 CONCEPTO 6: Búsqueda por importe (muy importante para ti)
function matchesAmount(searchTerm: string, amount: number): boolean {
    // Eliminar puntos y comas del término de búsqueda
    const cleanSearch = searchTerm.replace(/[.,\s]/g, '');

    // Si no es un número, no buscar por importe
    if (!/^\d+$/.test(cleanSearch)) {
        return false;
    }

    // Convertir el importe a string sin decimales y con decimales
    const amountStr = Math.floor(amount).toString();
    const amountWithDecimals = amount.toFixed(2).replace(/[.,]/g, '');

    // Buscar coincidencia
    return amountStr.includes(cleanSearch) || amountWithDecimals.includes(cleanSearch);
}

// 🧠 CONCEPTO 7: Búsqueda en Facturas
export function searchInvoices(invoices: Invoice[], searchTerm: string): SearchResult[] {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];

    for (const invoice of invoices) {
        let maxScore = MatchScore.NO_MATCH;

        // Buscar en número de factura
        if (invoice.number) {
            const numberScore = calculateMatchScore(searchTerm, invoice.number);
            maxScore = Math.max(maxScore, numberScore);
        }

        // Buscar en nombre del cliente
        if (invoice.clientName) {
            const clientScore = calculateMatchScore(searchTerm, invoice.clientName);
            maxScore = Math.max(maxScore, clientScore);
        }

        // Buscar en identificador del cliente
        if (invoice.clientIdentity) {
            const identityScore = calculateMatchScore(searchTerm, invoice.clientIdentity);
            maxScore = Math.max(maxScore, identityScore);
        }

        // 🎯 BÚSQUEDA POR IMPORTE (feature especial para ti)
        if (matchesAmount(searchTerm, invoice.total)) {
            maxScore = Math.max(maxScore, MatchScore.CONTAINS);
        }

        if (maxScore > MatchScore.NO_MATCH) {
            results.push({
                id: invoice.id,
                type: 'invoice',
                title: `${invoice.number || 'Sin número'} — ${invoice.clientName || 'Sin cliente'} — ${invoice.total.toFixed(2)}€`,
                subtitle: `${invoice.status === 'issued' ? 'Emitida' : invoice.status === 'draft' ? 'Borrador' : 'Anulada'} — ${new Date(invoice.createdAt).toLocaleDateString()}`,
                badge: invoice.status,
                score: maxScore,
                data: invoice
            });
        }
    }

    return results.sort((a, b) => b.score - a.score);
}

// 🧠 CONCEPTO 8: Búsqueda en Proformas
export function searchProformas(proformas: Proforma[], searchTerm: string): SearchResult[] {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];

    for (const proforma of proformas) {
        let maxScore = MatchScore.NO_MATCH;

        // Buscar en número de proforma
        if (proforma.number) {
            const numberScore = calculateMatchScore(searchTerm, proforma.number);
            maxScore = Math.max(maxScore, numberScore);
        }

        // Buscar en nombre del cliente
        if (proforma.clientName) {
            const clientScore = calculateMatchScore(searchTerm, proforma.clientName);
            maxScore = Math.max(maxScore, clientScore);
        }

        // Buscar en identificador del cliente
        if (proforma.clientIdentity) {
            const identityScore = calculateMatchScore(searchTerm, proforma.clientIdentity);
            maxScore = Math.max(maxScore, identityScore);
        }

        // 🎯 BÚSQUEDA POR IMPORTE
        if (matchesAmount(searchTerm, proforma.total)) {
            maxScore = Math.max(maxScore, MatchScore.CONTAINS);
        }

        if (maxScore > MatchScore.NO_MATCH) {
            const statusLabel = proforma.status === 'draft' ? 'Borrador' :
                proforma.status === 'sent' ? 'Enviada' :
                    proforma.status === 'accepted' ? 'Aceptada' :
                        proforma.status === 'invoiced' ? 'Facturada' : 'Anulada';

            results.push({
                id: proforma.id,
                type: 'proforma',
                title: `${proforma.number || 'Sin número'} — ${proforma.clientName || 'Sin cliente'} — ${proforma.total.toFixed(2)}€`,
                subtitle: `${statusLabel} — ${new Date(proforma.createdAt).toLocaleDateString()}`,
                badge: proforma.status,
                score: maxScore,
                data: proforma
            });
        }
    }

    return results.sort((a, b) => b.score - a.score);
}

// 🧠 CONCEPTO 9: Búsqueda en Albaranes
export function searchDeliveryNotes(deliveryNotes: DeliveryNote[], searchTerm: string): SearchResult[] {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];

    for (const note of deliveryNotes) {
        let maxScore = MatchScore.NO_MATCH;

        // Buscar en número de expediente
        const expedienteScore = calculateMatchScore(searchTerm, note.expedienteNumero);
        maxScore = Math.max(maxScore, expedienteScore);

        // Buscar en nombre del cliente
        const clientScore = calculateMatchScore(searchTerm, note.clientName);
        maxScore = Math.max(maxScore, clientScore);

        // Buscar en identificador del cliente
        if (note.clientIdentity) {
            const identityScore = calculateMatchScore(searchTerm, note.clientIdentity);
            maxScore = Math.max(maxScore, identityScore);
        }

        // 🎯 BÚSQUEDA POR IMPORTE
        if (matchesAmount(searchTerm, note.total)) {
            maxScore = Math.max(maxScore, MatchScore.CONTAINS);
        }

        if (maxScore > MatchScore.NO_MATCH) {
            const statusLabel = note.status === 'pending' ? 'Pendiente' :
                note.status === 'invoiced' ? 'Facturado' : 'Anulado';

            results.push({
                id: note.id,
                type: 'deliveryNote',
                title: `${note.expedienteNumero} — ${note.clientName} — ${note.total.toFixed(2)}€`,
                subtitle: `${statusLabel} — ${new Date(note.createdAt).toLocaleDateString()}`,
                badge: note.status,
                score: maxScore,
                data: note
            });
        }
    }

    return results.sort((a, b) => b.score - a.score);
}

// 🧠 CONCEPTO 10: Búsqueda global unificada
export function performGlobalSearch(
    searchTerm: string,
    data: {
        clients: Client[];
        cases: CaseRecord[];
        invoices?: Invoice[];
        proformas?: Proforma[];
        deliveryNotes?: DeliveryNote[];
    }
): GroupedSearchResults {
    return {
        clients: searchClients(data.clients, searchTerm),
        cases: searchCases(data.cases, searchTerm),
        invoices: searchInvoices(data.invoices || [], searchTerm),
        proformas: searchProformas(data.proformas || [], searchTerm),
        deliveryNotes: searchDeliveryNotes(data.deliveryNotes || [], searchTerm)
    };
}

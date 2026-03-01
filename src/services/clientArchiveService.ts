import {
    collection,
    doc,
    endAt,
    getDoc,
    getDocs,
    limit as fsLimit,
    orderBy,
    query,
    startAt,
    updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Client, ClientArchiveRecord, ClientCreateInput } from '@/types';
import { createClient, getAllClients, getClientById } from './clientService';
import { isMostlyNumeric, normalizeDocumento, normalizeText } from '@/utils/normalize';

const ARCHIVE_COLLECTION = 'clientArchiveIndex';

export interface SearchArchiveParams {
    q: string;
    limit?: number;
}

export interface SearchArchiveResult {
    items: ClientArchiveRecord[];
    total: number;
}

function detectTipo(documento?: string): 'PARTICULAR' | 'EMPRESA' {
    const normalized = normalizeDocumento(documento || '');
    if (!normalized) return 'PARTICULAR';
    return /^[A-Z]/.test(normalized) ? 'EMPRESA' : 'PARTICULAR';
}

function toArchiveRecord(id: string, raw: any): ClientArchiveRecord {
    return {
        id,
        nombre: raw.nombre || '',
        nombreNormalized: raw.nombreNormalized || normalizeText(raw.nombre || ''),
        documento: raw.documento || undefined,
        nif: raw.nif || undefined,
        documentoNormalized: raw.documentoNormalized || normalizeDocumento(raw.documento || raw.nif || ''),
        cuentaContable: raw.cuentaContable || undefined,
        direccion: raw.direccion || undefined,
        poblacion: raw.poblacion || undefined,
        provincia: raw.provincia || undefined,
        iban: raw.iban || undefined,
        datosContactoImportadosCCS: raw.datosContactoImportadosCCS || undefined,
        source: raw.source || undefined,
        sourceSheet: raw.sourceSheet || undefined,
        rowNumber: raw.rowNumber || undefined,
        rescatado: Boolean(raw.rescatado),
        rescuedClientId: raw.rescuedClientId || undefined,
        rescuedAt: raw.rescuedAt || undefined,
        rescuedBy: raw.rescuedBy || undefined,
        createdAt: raw.createdAt || undefined,
        updatedAt: raw.updatedAt || undefined,
    };
}

export async function searchArchiveClients(params: SearchArchiveParams): Promise<SearchArchiveResult> {
    const qRaw = (params.q || '').trim();
    if (!qRaw) return { items: [], total: 0 };

    const limit = Math.max(1, Math.min(params.limit || 10, 30));
    const archiveCol = collection(db, ARCHIVE_COLLECTION);

    const qNormalized = isMostlyNumeric(qRaw)
        ? (normalizeDocumento(qRaw) || '')
        : normalizeText(qRaw);

    if (!qNormalized || qNormalized.length < (isMostlyNumeric(qRaw) ? 3 : 2)) {
        return { items: [], total: 0 };
    }

    const field = isMostlyNumeric(qRaw) ? 'documentoNormalized' : 'nombreNormalized';
    const qRef = query(
        archiveCol,
        orderBy(field),
        startAt(qNormalized),
        endAt(`${qNormalized}\uf8ff`),
        fsLimit(limit)
    );

    const snapshot = await getDocs(qRef);
    const items = snapshot.docs
        .map((d) => toArchiveRecord(d.id, d.data()))
        .filter((r) => !r.rescatado);
    return { items, total: items.length };
}

export async function rescueArchiveClient(archiveId: string, rescuedBy?: string): Promise<Client> {
    const archiveRef = doc(db, ARCHIVE_COLLECTION, archiveId);
    const archiveSnap = await getDoc(archiveRef);

    if (!archiveSnap.exists()) {
        throw new Error('Registro de almacén no encontrado');
    }

    const archive = toArchiveRecord(archiveSnap.id, archiveSnap.data());
    const now = new Date().toISOString();

    if (archive.rescuedClientId) {
        const existing = await getClientById(archive.rescuedClientId);
        return existing;
    }

    const allClients = await getAllClients();
    const targetDocumento = normalizeDocumento(archive.documento || archive.nif || '');
    const existingByDocumento = targetDocumento
        ? allClients.find(c => normalizeDocumento(c.documento || c.nif || '') === targetDocumento)
        : undefined;

    let rescuedClient: Client;

    if (existingByDocumento) {
        rescuedClient = existingByDocumento;
    } else {
        const payload: ClientCreateInput = {
            nombre: archive.nombre || 'CLIENTE RESCATADO',
            documento: archive.documento || archive.nif || undefined,
            nif: archive.nif || archive.documento || undefined,
            tipo: detectTipo(archive.documento || archive.nif || undefined),
            estado: 'ACTIVO',
            direccion: archive.direccion,
            poblacion: archive.poblacion,
            provincia: archive.provincia,
            cuentaContable: archive.cuentaContable,
            iban: archive.iban,
            datosContactoImportadosCCS: archive.datosContactoImportadosCCS,
            notas: 'Rescatado desde almacén histórico CCS'
        };
        rescuedClient = await createClient(payload);
    }

    await updateDoc(archiveRef, {
        rescatado: true,
        rescuedClientId: rescuedClient.id,
        rescuedAt: now,
        rescuedBy: rescuedBy || null,
        updatedAt: now
    });

    return rescuedClient;
}

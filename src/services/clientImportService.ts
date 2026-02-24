import * as XLSX from 'xlsx';
import { createClient, updateClient } from './clientService';
import { ClientCreateInput, ClientType, ClientStatus } from '@/types/client';
import { normalizeDocumento, normalizeText } from '@/utils/normalize';

export interface ClientImportReport {
    timestamp: string;
    success: boolean;
    summary: {
        total: number;
        created: number;
        updated: number;
        skipped: number;
        errors: number;
    };
    errors: Array<{
        line: number;
        field?: string;
        value?: any;
        error: string;
        action: 'SKIPPED' | 'PARTIAL';
    }>;
    warnings: Array<{
        line: number;
        field: string;
        value?: any;
        message: string;
    }>;
}

export type DuplicatePolicy = 'IGNORE' | 'UPDATE';

interface ImportOptions {
    duplicatePolicy?: DuplicatePolicy;
    batchSize?: number;
    onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * Servicio de Importación Masiva de Clientes
 * Compatible con exportaciones de CCS/Econ CEGID
 */
export const ClientImportService = {

    /**
     * Parsea un archivo Excel y extrae la hoja "Clientes"
     */
    async parseExcel(file: File): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Buscar hoja "Clientes" (case-insensitive)
                    const sheetName = workbook.SheetNames.find(
                        name => name.toLowerCase() === 'clientes'
                    );

                    if (!sheetName) {
                        throw new Error('No se encontró la hoja "Clientes" en el archivo Excel');
                    }

                    const sheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(sheet);

                    if (rows.length === 0) {
                        throw new Error('La hoja "Clientes" está vacía');
                    }

                    resolve(rows);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Deduce el tipo de cliente por el formato del documento
     * - Solo números → PARTICULAR
     * - Empieza con letra → EMPRESA
     */
    inferClientType(documento: string): ClientType {
        if (!documento) return 'PARTICULAR';
        const normalized = normalizeDocumento(documento) || '';
        // Si empieza con letra, es CIF/NIF de empresa
        return /^[A-Z]/.test(normalized) ? 'EMPRESA' : 'PARTICULAR';
    },

    /**
     * Valida un email (formato básico)
     */
    isValidEmail(email: string): boolean {
        if (!email) return true; // Email vacío es válido (opcional)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Normaliza una fila del Excel a ClientCreateInput
     */
    normalizeRow(row: any, lineNumber: number): {
        client: ClientCreateInput | null;
        errors: ClientImportReport['errors'];
        warnings: ClientImportReport['warnings'];
    } {
        const errors: ClientImportReport['errors'] = [];
        const warnings: ClientImportReport['warnings'] = [];

        // 1. VALIDACIÓN OBLIGATORIA: nombre
        const nombre = normalizeText(row.nombre || '');
        if (!nombre) {
            errors.push({
                line: lineNumber,
                field: 'nombre',
                value: row.nombre,
                error: 'El campo "nombre" es obligatorio',
                action: 'SKIPPED'
            });
            return { client: null, errors, warnings };
        }

        // 2. VALIDACIÓN OBLIGATORIA: documento
        const documentoRaw = String(row.documento || '').trim();
        if (!documentoRaw) {
            errors.push({
                line: lineNumber,
                field: 'documento',
                value: row.documento,
                error: 'El campo "documento" es obligatorio para vincular expedientes',
                action: 'SKIPPED'
            });
            return { client: null, errors, warnings };
        }

        const documento = normalizeDocumento(documentoRaw);
        if (!documento) {
            errors.push({
                line: lineNumber,
                field: 'documento',
                value: documentoRaw,
                error: 'El documento no pudo normalizarse correctamente',
                action: 'SKIPPED'
            });
            return { client: null, errors, warnings };
        }

        // 3. VALIDACIÓN: email (WARNING si inválido, no bloquea)
        const email = row.email?.trim() || '';
        if (email && !this.isValidEmail(email)) {
            warnings.push({
                line: lineNumber,
                field: 'email',
                value: email,
                message: 'Email inválido, se ignorará este campo'
            });
        }

        // 4. Deducir tipo si no viene especificado
        let tipo: ClientType = 'PARTICULAR';
        if (row.tipo) {
            const tipoUpper = String(row.tipo).toUpperCase();
            if (tipoUpper === 'EMPRESA' || tipoUpper === 'PARTICULAR') {
                tipo = tipoUpper as ClientType;
            } else {
                warnings.push({
                    line: lineNumber,
                    field: 'tipo',
                    value: row.tipo,
                    message: `Tipo inválido "${row.tipo}", se deducirá automáticamente`
                });
                tipo = this.inferClientType(documento);
            }
        } else {
            tipo = this.inferClientType(documento);
        }

        // 5. Estado
        let estado: ClientStatus = 'ACTIVO';
        if (row.estado) {
            const estadoUpper = String(row.estado).toUpperCase();
            if (estadoUpper === 'ACTIVO' || estadoUpper === 'INACTIVO') {
                estado = estadoUpper as ClientStatus;
            } else {
                warnings.push({
                    line: lineNumber,
                    field: 'estado',
                    value: row.estado,
                    message: `Estado inválido "${row.estado}", se usará "ACTIVO"`
                });
            }
        }

        // 6. Construir objeto cliente
        const client: ClientCreateInput = {
            nombre,
            documento,
            tipo,
            estado,
            nif: row.nif?.trim() || undefined,
            telefono: row.telefono?.trim() || undefined,
            email: (email && this.isValidEmail(email)) ? email.toLowerCase() : undefined,
            direccion: row.direccion?.trim() || undefined,
            poblacion: row.poblacion?.trim() || undefined,
            provincia: row.provincia?.trim() || undefined,
            cp: row.cp?.toString().trim() || undefined,
            pais: row.pais?.trim() || 'España',
            fechaInicio: row.fechaInicio || undefined,
            cuentaContable: row.cuentaContable?.trim() || undefined,
            iban: row.iban?.trim() || undefined,
            bancoCobro: row.bancoCobro?.trim() || undefined,
            cuentaCobro: row.cuentaCobro?.trim() || undefined,
            notas: row.notas?.trim() || undefined
        };

        // 7. Warnings adicionales (datos recomendados vacíos)
        if (!client.telefono) {
            warnings.push({
                line: lineNumber,
                field: 'telefono',
                message: 'Teléfono vacío (recomendado para contacto)'
            });
        }

        if (!client.email) {
            warnings.push({
                line: lineNumber,
                field: 'email',
                message: 'Email vacío (recomendado para comunicaciones)'
            });
        }

        return { client, errors, warnings };
    },

    /**
     * Importa clientes desde un archivo Excel
     */
    async importFromExcel(
        file: File,
        options: ImportOptions = {}
    ): Promise<ClientImportReport> {
        const {
            duplicatePolicy = 'IGNORE',
            batchSize = 500,
            onProgress
        } = options;

        const report: ClientImportReport = {
            timestamp: new Date().toISOString(),
            success: true,
            summary: {
                total: 0,
                created: 0,
                updated: 0,
                skipped: 0,
                errors: 0
            },
            errors: [],
            warnings: []
        };

        try {
            // 1. Parsear Excel
            onProgress?.(0, 0, 'Leyendo archivo Excel...');
            const rows = await this.parseExcel(file);
            report.summary.total = rows.length;

            // 2. Procesar por lotes
            const batches = Math.ceil(rows.length / batchSize);

            for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
                const start = batchIndex * batchSize;
                const end = Math.min(start + batchSize, rows.length);
                const batch = rows.slice(start, end);

                onProgress?.(
                    start,
                    rows.length,
                    `Procesando lote ${batchIndex + 1}/${batches} (${start + 1}-${end}/${rows.length})`
                );

                // 3. Procesar cada fila del lote
                for (let i = 0; i < batch.length; i++) {
                    const row = batch[i];
                    const lineNumber = start + i + 2; // +2 porque Excel empieza en 1 y tiene cabecera

                    // Normalizar y validar
                    const { client, errors, warnings } = this.normalizeRow(row, lineNumber);

                    // Agregar warnings
                    report.warnings.push(...warnings);

                    // Si hay errores críticos, saltar
                    if (errors.length > 0) {
                        report.errors.push(...errors);
                        report.summary.errors++;
                        report.summary.skipped++;
                        continue;
                    }

                    if (!client) {
                        report.summary.skipped++;
                        continue;
                    }

                    // 4. Verificar duplicados por documento
                    try {
                        // Buscar cliente existente por documento
                        const { items: existingClients } = await import('./clientService').then(
                            m => m.searchClients({ documento: client.documento, limit: 1 })
                        );

                        if (existingClients.length > 0) {
                            // Cliente duplicado
                            if (duplicatePolicy === 'IGNORE') {
                                report.warnings.push({
                                    line: lineNumber,
                                    field: 'documento',
                                    value: client.documento,
                                    message: `Cliente con documento "${client.documento}" ya existe, ignorado`
                                });
                                report.summary.skipped++;
                                continue;
                            } else {
                                // UPDATE: actualizar solo campos con valor
                                const existingClient = existingClients[0];
                                await updateClient(existingClient.id, client);
                                report.summary.updated++;
                                continue;
                            }
                        }

                        // 5. Crear nuevo cliente
                        await createClient(client);
                        report.summary.created++;

                    } catch (error) {
                        report.errors.push({
                            line: lineNumber,
                            error: error instanceof Error ? error.message : 'Error desconocido',
                            action: 'SKIPPED'
                        });
                        report.summary.errors++;
                        report.summary.skipped++;
                    }
                }
            }

            onProgress?.(rows.length, rows.length, 'Importación completada');

        } catch (error) {
            report.success = false;
            report.errors.push({
                line: 0,
                error: `Error fatal: ${error instanceof Error ? error.message : String(error)}`,
                action: 'SKIPPED'
            });
        }

        return report;
    }
};

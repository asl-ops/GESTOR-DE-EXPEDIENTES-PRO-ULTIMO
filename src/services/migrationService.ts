import * as XLSX from 'xlsx';
import {
    bulkCreatePrefijoMovimientos
} from './prefijoMovimientoService';
import {
    Naturaleza,
    PrefijoMovimiento,
    EstadoMovimiento
} from '../types';

export interface MigrationReport {
    timestamp: string;
    movimientos: {
        total: number;
        imported: number;
        updated: number;
        errors: { line: number; error: string; data?: any }[];
        byNaturaleza: Record<string, number>;
    };
    prefixes: {
        total: number;
        imported: number;
        errors: { line: number; error: string; data?: any }[];
    };
    conflicts: { codigo: string; message: string }[];
}

/**
 * Service to handle bulk migration from Excel files
 * Standardizes the import process and ensures nature/fiscal rules are applied
 */
export const MigrationService = {

    /**
     * Parses an Excel file into a JSON object per sheet
     */
    parseExcel(file: File): Promise<Record<string, any[]>> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const result: Record<string, any[]> = {};

                workbook.SheetNames.forEach(sheetName => {
                    const roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    if (roa.length) result[sheetName] = roa;
                });
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Inters the naturaleza based on text/category
     */
    inferNaturaleza(text: string): Naturaleza {
        const t = text.toUpperCase();
        if (t.includes('HONORARIO') || t.includes('CUOTA') || t.includes('SERVICIO')) return Naturaleza.HONORARIO;
        if (t.includes('SUPLIDO') || t.includes('TASA') || t.includes('GASTO')) return Naturaleza.SUPLIDO;
        if (t.includes('PROVISION') || t.includes('ENTREGA') || t.includes('A CUENTA')) return Naturaleza.ENTREGA_A_CUENTA;
        if (t.includes('AJUSTE') || t.includes('DTO') || t.includes('DESCUENTO')) return Naturaleza.AJUSTE;
        return Naturaleza.OTRO;
    },

    /**
     * Processes the movement catalog Excel
     */
    async importMovimientos(data: any[]): Promise<MigrationReport['movimientos']> {
        const report = {
            total: data.length,
            imported: 0,
            updated: 0,
            errors: [] as any[],
            byNaturaleza: {} as Record<string, number>
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                const codigo = String(row.codigo || row.Codigo || '').trim();
                if (!codigo) throw new Error('Código faltante');

                const naturaleza = this.inferNaturaleza(row.naturaleza || row.clase || row.Nombre || '');

                // TODO: This migration service needs refactoring - requires prefixId
                // For now, skip this operation
                // const existing = await getMovimientoByCodigo(codigo);
                // if (existing) {
                //     await updateMovimiento(existing.id, movimientoData);
                //     report.updated++;
                // } else {
                //     await createMovimiento(movimientoData);
                //     report.imported++;
                // }

                report.byNaturaleza[naturaleza] = (report.byNaturaleza[naturaleza] || 0) + 1;
            } catch (error) {
                report.errors.push({ line: i + 2, error: error instanceof Error ? error.message : String(error), data: row });
            }
        }

        return report;
    },

    /**
     * Processes the prefix configuration Excel
     */
    async importPrefixes(data: any[]): Promise<MigrationReport['prefixes']> {
        const report = {
            total: data.length,
            imported: 0,
            errors: [] as any[]
        };

        // Group by prefixId to handle in batches if needed
        const prefixGroups: Record<string, any[]> = {};
        data.forEach(row => {
            const pid = row.prefixId || row.prefijo || row.Prefijo;
            if (pid) {
                if (!prefixGroups[pid]) prefixGroups[pid] = [];
                prefixGroups[pid].push(row);
            }
        });

        for (const [prefixId, rows] of Object.entries(prefixGroups)) {
            try {
                const movementsToCreate: Omit<PrefijoMovimiento, 'id'>[] = [];

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    // TODO: This migration service needs refactoring - requires prefixId for getMovimientoByCodigo
                    // const movCodigo = row.movimientoCodigo || row.movimiento || row.codigo;
                    // const mov = await getMovimientoByCodigo(movCodigo);
                    // if (!mov) { ... }

                    // For now, create placeholder entries
                    movementsToCreate.push({
                        prefijoId: prefixId,
                        movimientoId: 'placeholder_' + row.movimientoCodigo,
                        nombre: row.nombreOverride || row.nombre,
                        orden: parseInt(row.orden) || (i + 1),
                        importePorDefecto: parseFloat(row.importe) || null,
                        editableEnExpediente: true,
                        obligatorio: !!row.obligatorio,
                        estadoInicial: (row.estado as EstadoMovimiento) || EstadoMovimiento.PENDIENTE,
                        categoria: row.categoria === 'CABECERA' ? 'CABECERA' : 'OPERATIVO',
                        bloqueado: row.categoria === 'CABECERA'
                    });
                }

                if (movementsToCreate.length > 0) {
                    await bulkCreatePrefijoMovimientos(movementsToCreate as any);
                    report.imported += movementsToCreate.length;
                }
            } catch (error) {
                report.errors.push({ line: 0, error: `Error en prefijo ${prefixId}: ${error instanceof Error ? error.message : String(error)}` });
            }
        }

        return report;
    }
};

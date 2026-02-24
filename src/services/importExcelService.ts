import * as XLSX from 'xlsx';
import {
    Movimiento,
    PrefixConfig,
    PrefijoMovimiento,
    Naturaleza,
    RegimenIVA,
    EstadoMovimiento
} from '@/types';
import { createMovimiento, getMovimientoByCodigo } from './movimientoService';
import { createPrefix, getPrefixByCode } from './prefixService';
import { bulkCreatePrefijoMovimientos } from './prefijoMovimientoService';

export interface ImportReport {
    timestamp: string;
    success: boolean;
    summary: {
        movimientosCreated: number;
        movimientosSkipped: number;
        prefixesCreated: number;
        prefixesSkipped: number;
        relationsCreated: number;
    };
    errors: string[];
    warnings: string[];
}

export async function importEconomicModelFromExcel(file: File): Promise<ImportReport> {
    const report: ImportReport = {
        timestamp: new Date().toISOString(),
        success: true,
        summary: {
            movimientosCreated: 0,
            movimientosSkipped: 0,
            prefixesCreated: 0,
            prefixesSkipped: 0,
            relationsCreated: 0
        },
        errors: [],
        warnings: []
    };

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);

        // 1. Process Movimientos
        const movSheet = workbook.Sheets['Movimientos'];
        if (movSheet) {
            const movData: any[] = XLSX.utils.sheet_to_json(movSheet);
            for (const row of movData) {
                try {
                    const codigo = String(row.Codigo || row.codigo || '').toUpperCase().trim();
                    if (!codigo) continue;

                    const existing = await getMovimientoByCodigo('', codigo);
                    if (existing) {
                        report.summary.movimientosSkipped++;
                        report.warnings.push(`Movimiento "${codigo}" ya existe, saltado.`);
                        continue;
                    }

                    const naturaleza = normalizeNaturaleza(row.Naturaleza || row.naturaleza);
                    const nuevoMov: Omit<Movimiento, 'id' | 'createdAt' | 'updatedAt'> = {
                        codigo,
                        nombre: row.Nombre || row.nombre || codigo,
                        naturaleza,
                        regimenIva: normalizeRegimenIva(row.RegimenIVA || row.regimenIva || row.IVA),
                        ivaPorDefecto: parseFloat(row.IvaDefecto || row.iva || 21),
                        afectaIva: row.AfectaIVA !== undefined ? !!row.AfectaIVA : true,
                        afectaFactura: row.AfectaFactura !== undefined ? !!row.AfectaFactura : true,
                        afectaBaseImponible: row.AfectaBase !== undefined ? !!row.AfectaBase : true,
                        imprimibleEnFactura: row.Imprimible !== undefined ? !!row.Imprimible : true,
                        permitirExcepcionIva: !!row.PermitirExcepcion,
                        motivoExencion: row.MotivoExencion || '',
                        modoImporte: row.ModoImporte || 'MANUAL' as any,
                        importePorDefecto: null,
                        prefixId: '',
                        activo: true
                    };

                    await createMovimiento('', nuevoMov);
                    report.summary.movimientosCreated++;
                } catch (e: any) {
                    report.errors.push(`Error procesando movimiento ${row.Codigo}: ${e.message}`);
                }
            }
        }

        // 2. Process Prefixes
        const prefSheet = workbook.Sheets['Prefijos'];
        if (prefSheet) {
            const prefData: any[] = XLSX.utils.sheet_to_json(prefSheet);
            for (const row of prefData) {
                try {
                    const code = String(row.Codigo || row.code || '').toUpperCase().trim();
                    if (!code) continue;

                    const existing = await getPrefixByCode(code);
                    if (existing) {
                        report.summary.prefixesSkipped++;
                        report.warnings.push(`Prefijo "${code}" ya existe, saltado.`);
                        continue;
                    }

                    const nuevoPref: Partial<PrefixConfig> = {
                        code,
                        description: row.Descripcion || row.nombre || code,
                        isActive: true,
                        ultimoNumeroAsignado: parseInt(row.Contador || row.ultimoNumero || 0),
                        lines: [] // Concepts are different from movements
                    };

                    await createPrefix(nuevoPref as any);
                    report.summary.prefixesCreated++;
                } catch (e: any) {
                    report.errors.push(`Error procesando prefijo ${row.Codigo}: ${e.message}`);
                }
            }
        }

        // 3. Process Relations (Prefijo - Movimientos)
        const relSheet = workbook.Sheets['Relaciones'];
        if (relSheet) {
            const relData: any[] = XLSX.utils.sheet_to_json(relSheet);
            // Group by prefix for bulk operations
            const groupedByPrefix: Record<string, any[]> = {};
            for (const row of relData) {
                const pCode = String(row.PrefixCodigo || row.prefijo || '').toUpperCase().trim();
                if (!pCode) continue;
                if (!groupedByPrefix[pCode]) groupedByPrefix[pCode] = [];
                groupedByPrefix[pCode].push(row);
            }

            for (const [pCode, rows] of Object.entries(groupedByPrefix)) {
                try {
                    const prefix = await getPrefixByCode(pCode);
                    if (!prefix) {
                        report.errors.push(`Relaciones saltadas: Prefijo "${pCode}" no encontrado.`);
                        continue;
                    }

                    const tasksToCreate: Omit<PrefijoMovimiento, 'id'>[] = [];
                    for (const row of rows) {
                        const mCode = String(row.MovimientoCodigo || row.movimiento || '').toUpperCase().trim();
                        const mov = await getMovimientoByCodigo('', mCode);
                        if (!mov) {
                            report.warnings.push(`Relación saltada en ${pCode}: Movimiento "${mCode}" no encontrado.`);
                            continue;
                        }

                        tasksToCreate.push({
                            prefijoId: prefix.id,
                            movimientoId: mov.id,
                            nombre: mov.nombre,
                            categoria: (row.Categoria || 'OPERATIVO').toUpperCase() as any,
                            orden: parseInt(row.Orden || tasksToCreate.length + 1),
                            obligatorio: row.Obligatorio !== undefined ? !!row.Obligatorio : true,
                            importePorDefecto: mov.importePorDefecto || 0,
                            estadoInicial: EstadoMovimiento.PENDIENTE,
                            bloqueado: row.Bloqueado !== undefined ? !!row.Bloqueado : (row.Categoria === 'CABECERA'),
                            editableEnExpediente: row.Editable !== undefined ? !!row.Editable : true
                        });
                    }

                    if (tasksToCreate.length > 0) {
                        await bulkCreatePrefijoMovimientos(tasksToCreate as any);
                        report.summary.relationsCreated += tasksToCreate.length;
                    }
                } catch (e: any) {
                    report.errors.push(`Error procesando relaciones para prefijo ${pCode}: ${e.message}`);
                }
            }
        }

    } catch (e: any) {
        report.success = false;
        report.errors.push(`Error fatal en la importación: ${e.message}`);
    }

    return report;
}

function normalizeNaturaleza(val: any): Naturaleza {
    const s = String(val || '').toUpperCase();
    if (s.includes('HONORARIO')) return Naturaleza.HONORARIO;
    if (s.includes('SUPLIDO')) return Naturaleza.SUPLIDO;
    if (s.includes('ENTREGA')) return Naturaleza.ENTREGA_A_CUENTA;
    return Naturaleza.HONORARIO;
}

function normalizeRegimenIva(val: any): RegimenIVA {
    const s = String(val || '').toUpperCase();
    if (s.includes('EXENTO')) return RegimenIVA.EXENTO;
    if (s.includes('NO SUJETO')) return RegimenIVA.NO_SUJETO;
    return RegimenIVA.SUJETO;
}

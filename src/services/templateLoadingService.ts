import { MovimientoExpediente } from '../types';
import { getPrefijoMovimientos } from './prefijoMovimientoService';
import { getMovimientoById } from './movimientoService';

/**
 * Template Loading Service
 * 
 * Servicio para cargar automáticamente los movimientos de una plantilla
 * cuando se crea un expediente con un prefijo específico.
 */

/**
 * Carga los movimientos predefinidos de una plantilla de prefijo
 * y los convierte en instancias de MovimientoExpediente listas para usar
 * 
 * @param prefijoId - ID del prefijo (ej: "prefix_FITRI")
 * @param expedienteId - ID del expediente (fileNumber)
 * @returns Array de MovimientoExpediente listos para asignar al expediente
 */
export async function loadTemplateMovements(
    prefijoId: string,
    expedienteId: string
): Promise<MovimientoExpediente[]> {
    try {
        console.log(`📋 Cargando plantilla de movimientos para prefijo: ${prefijoId}`);

        // 1. Obtener los PrefijoMovimientos asociados al prefijo
        const prefijoMovimientos = await getPrefijoMovimientos(prefijoId);

        if (prefijoMovimientos.length === 0) {
            console.log(`⚠️ No hay movimientos predefinidos para el prefijo ${prefijoId}`);
            return [];
        }

        console.log(`✅ Encontrados ${prefijoMovimientos.length} movimientos en la plantilla`);

        // 2. Crear instancias de MovimientoExpediente para cada PrefijoMovimiento
        const movimientosExpediente: MovimientoExpediente[] = [];

        for (const prefijoMov of prefijoMovimientos) {
            try {
                // Obtener los detalles del movimiento desde el catálogo
                // CRITICAL: Must pass prefixId as first parameter
                const movimientoDetail = await getMovimientoById(prefijoId, prefijoMov.movimientoId);

                if (!movimientoDetail) {
                    console.warn(`⚠️ No se encontró el movimiento ${prefijoMov.movimientoId} en el catálogo`);
                    continue;
                }

                // ========================================
                // IMPORTE INICIAL LOGIC
                // ========================================
                // Priority order:
                // 1. PrefijoMovimiento.importePorDefecto (template override)
                // 2. Movimiento.importePorDefecto (catalog default, only for HONORARIO)
                // 3. 0 (fallback)

                console.log(`\n🔍 Procesando: ${movimientoDetail.nombre}`);
                console.log(`   📋 Naturaleza: ${movimientoDetail.naturaleza}`);
                console.log(`   📦 Catálogo importePorDefecto: ${movimientoDetail.importePorDefecto ?? 'undefined'}`);
                console.log(`   📝 Plantilla importePorDefecto: ${prefijoMov.importePorDefecto ?? 'undefined'}`);

                let importeInicial = 0;

                if (prefijoMov.importePorDefecto != null && prefijoMov.importePorDefecto >= 0) {
                    // Template has explicit override
                    importeInicial = prefijoMov.importePorDefecto;
                    console.log(`   ✅ Usando importe de PLANTILLA: ${importeInicial}€`);
                } else if (
                    movimientoDetail.naturaleza === 'HONORARIO' &&
                    movimientoDetail.importePorDefecto != null &&
                    movimientoDetail.importePorDefecto >= 0
                ) {
                    // HONORARIO with catalog default
                    importeInicial = movimientoDetail.importePorDefecto;
                    console.log(`   ✅ Aplicando honorarios predefinidos del CATÁLOGO: ${importeInicial}€`);
                } else {
                    console.log(`   ⚠️ Sin importe predefinido, usando 0€`);
                    if (movimientoDetail.naturaleza === 'HONORARIO') {
                        console.log(`   ⚠️ ATENCIÓN: Es un HONORARIO pero no tiene importePorDefecto en el catálogo`);
                    }
                }

                // Crear la instancia de MovimientoExpediente con SNAPSHOT de datos del catálogo
                const movExpediente: MovimientoExpediente = {
                    id: `mov_${Date.now()}_${prefijoMov.orden}`,
                    expedienteId: expedienteId,
                    movimientoId: prefijoMov.movimientoId,  // For traceability only
                    orden: prefijoMov.orden,

                    // ========================================
                    // SNAPSHOT FIELDS (Immutable)
                    // ========================================
                    // These values are frozen at creation time and will NEVER change
                    // even if the catalog is updated later (e.g., "3T/2025" -> "1T/2026")
                    nombreSnapshot: movimientoDetail.nombre,
                    codigoSnapshot: movimientoDetail.codigo,
                    naturalezaSnapshot: movimientoDetail.naturaleza,

                    // ========================================
                    // EDITABLE FIELDS
                    // ========================================
                    // descripcionOverride is intentionally left undefined
                    // It's only used if the user manually customizes the description
                    // for this specific case instance

                    // Apply calculated initial amount
                    importe: importeInicial,

                    // Copiar régimen IVA y porcentaje del catálogo
                    regimenIva: movimientoDetail.regimenIva,
                    ivaPorcentaje: movimientoDetail.ivaPorDefecto,

                    // Copiar subcategoría de suplido si existe
                    subcategoriaSuplido: movimientoDetail.subcategoriaSuplido,

                    // Estado inicial definido en el PrefijoMovimiento
                    estado: prefijoMov.estadoInicial,

                    // Facturable según el catálogo
                    facturable: movimientoDetail.afectaFactura,

                    // Fecha actual
                    fecha: new Date().toISOString(),

                    // Timestamps
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                movimientosExpediente.push(movExpediente);
                console.log(`  ✅ Movimiento cargado: ${movimientoDetail.nombre} (${movimientoDetail.codigo}) - Importe: ${importeInicial}€`);

            } catch (error: any) {
                console.error(`❌ Error cargando movimiento ${prefijoMov.movimientoId}:`, error.message);
                // Continuar con los demás movimientos aunque uno falle
            }
        }

        console.log(`🎉 Plantilla cargada: ${movimientosExpediente.length} movimientos listos`);
        return movimientosExpediente;

    } catch (error: any) {
        console.error(`❌ Error cargando plantilla de movimientos:`, error.message);
        throw error;
    }
}

/**
 * Valida que todos los movimientos SUPLIDO tengan subcategoría asignada
 * 
 * @param movimientos - Array de MovimientoExpediente a validar
 * @returns true si todos los suplidos tienen subcategoría, false en caso contrario
 */
export async function validateSuplidosSubcategorias(
    movimientos: MovimientoExpediente[]
): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const mov of movimientos) {
        // Use snapshot data instead of querying the catalog
        // This is faster and works even if the catalog entry was deleted/modified
        if (mov.naturalezaSnapshot === 'SUPLIDO') {
            if (!mov.subcategoriaSuplido || mov.subcategoriaSuplido.trim() === '') {
                const displayName = mov.descripcionOverride || mov.nombreSnapshot;
                errors.push(
                    `El movimiento "${displayName}" es un suplido y requiere una subcategoría obligatoria`
                );
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

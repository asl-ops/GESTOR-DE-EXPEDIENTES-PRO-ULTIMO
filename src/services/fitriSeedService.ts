import {
    Naturaleza,
    RegimenIVA,
    ModoImporte,
    EstadoMovimiento,
    SubcategoriaSuplido,
    PrefijoMovimiento,
    PrefixConfig
} from '../types';
import { createMovimiento } from './movimientoService';
import { addPrefijoMovimiento } from './prefijoMovimientoService';
import { savePrefix } from './prefixService';

/**
 * FITRI Template Seeding Service
 * 
 * Este servicio crea el prefijo FITRI y todos sus movimientos predefinidos
 * según el modelo CCS (30 años de uso) adaptado al sistema Hermes/Notion.
 * 
 * FITRI = Departamento Fiscal - Gestión Trimestral
 */

// Definición del prefijo FITRI según CCS
const FITRI_PREFIX_DATA: Omit<PrefixConfig, 'createdAt' | 'updatedAt'> = {
    id: 'prefix_FITRI',
    code: 'FITRI',
    description: 'DEPARTAMENTO FISCAL',
    departamento: 'FISCAL (Gestión Fiscal)',
    provisionFondos: 0.00,
    codigoOperacion: 'FI-TRI',
    ultimoNumeroAsignado: 58031, // Según contador CCS
    numberLength: 5,
    isActive: true,
    lines: [] // Deprecated - usar PrefijoMovimiento
};

// Definición de los 9 movimientos del catálogo FITRI
interface FitriMovementDefinition {
    codigo: string;
    nombre: string;
    naturaleza: Naturaleza;
    subcategoriaSuplido?: SubcategoriaSuplido;
    importePorDefecto: number;
    orden: number;
}

const FITRI_MOVEMENTS: FitriMovementDefinition[] = [
    {
        codigo: 'FITRI_SUP_IRPF_3T',
        nombre: 'INGRESO I.R.P.F. 3T/2025',
        naturaleza: Naturaleza.SUPLIDO,
        subcategoriaSuplido: 'Pago a cuenta del IRPF',
        importePorDefecto: 0.00,
        orden: 1
    },
    {
        codigo: 'FITRI_HON_IRPF_3T',
        nombre: 'HONORARIOS I.R.P.F. 3T/2025',
        naturaleza: Naturaleza.HONORARIO,
        importePorDefecto: 40.00,
        orden: 2
    },
    {
        codigo: 'FITRI_SUP_IVA_3T',
        nombre: 'INGRESO CTA IVA 3T/2025',
        naturaleza: Naturaleza.SUPLIDO,
        subcategoriaSuplido: 'IVA',
        importePorDefecto: 0.00,
        orden: 3
    },
    {
        codigo: 'FITRI_HON_IVA_3T',
        nombre: 'HONORARIOS IVA 3T/2025',
        naturaleza: Naturaleza.HONORARIO,
        importePorDefecto: 40.00,
        orden: 4
    },
    {
        codigo: 'FITRI_HON_LIBROS_3T',
        nombre: 'CONFECCIÓN LIBROS 3T/2025',
        naturaleza: Naturaleza.HONORARIO,
        importePorDefecto: 100.00,
        orden: 5
    },
    {
        codigo: 'FITRI_HON_RESUMEN_ANUAL',
        nombre: 'HONORARIOS RESUMEN ANUAL',
        naturaleza: Naturaleza.HONORARIO,
        importePorDefecto: 45.00,
        orden: 6
    },
    {
        codigo: 'FITRI_HON_349_3T',
        nombre: 'MODELO 349 3T/2025',
        naturaleza: Naturaleza.HONORARIO,
        importePorDefecto: 40.00,
        orden: 7
    },
    {
        codigo: 'FITRI_HON_347_2024',
        nombre: 'MODELO 347 2024',
        naturaleza: Naturaleza.HONORARIO,
        importePorDefecto: 50.00,
        orden: 8
    },
    {
        codigo: 'FITRI_HON_AYUDA_COMBUSTIBLE',
        nombre: 'SOL. AYUDA DIRECTA COMBUSTIBLE',
        naturaleza: Naturaleza.HONORARIO,
        importePorDefecto: 25.00,
        orden: 9
    }
];

/**
 * Seed del prefijo FITRI completo
 * Crea el prefijo, los movimientos del catálogo y las asociaciones PrefijoMovimiento
 */
export async function seedFitriTemplate(): Promise<{
    success: boolean;
    message: string;
    errors: string[];
}> {
    const errors: string[] = [];
    const now = new Date().toISOString();

    try {
        console.log('🌱 Iniciando seed del prefijo FITRI...');

        // PASO 1: Crear el prefijo FITRI
        console.log('📋 Creando prefijo FITRI...');
        try {
            await savePrefix({
                ...FITRI_PREFIX_DATA,
                createdAt: now,
                updatedAt: now
            });
            console.log('✅ Prefijo FITRI creado correctamente');
        } catch (error: any) {
            const errorMsg = `Error creando prefijo FITRI: ${error.message}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
            return { success: false, message: errorMsg, errors };
        }

        // PASO 2: Crear los movimientos del catálogo
        console.log('📝 Creando movimientos del catálogo FITRI...');
        const createdMovements: Map<string, string> = new Map(); // codigo -> id

        for (const movDef of FITRI_MOVEMENTS) {
            try {
                const movimientoData: any = {
                    codigo: movDef.codigo,
                    nombre: movDef.nombre,
                    naturaleza: movDef.naturaleza,

                    // Regla de negocio: SUPLIDOS siempre NO_SUJETO, HONORARIOS siempre SUJETO
                    regimenIva: movDef.naturaleza === Naturaleza.SUPLIDO
                        ? RegimenIVA.NO_SUJETO
                        : RegimenIVA.SUJETO,

                    // Regla de negocio: HONORARIOS tienen IVA 21% por defecto
                    ivaPorDefecto: movDef.naturaleza === Naturaleza.HONORARIO ? 21.00 : null,

                    // Comportamiento en facturación
                    afectaFactura: true,
                    imprimibleEnFactura: true,
                    afectaBaseImponible: movDef.naturaleza === Naturaleza.HONORARIO,
                    afectaIva: movDef.naturaleza === Naturaleza.HONORARIO,

                    // Modo de importe
                    modoImporte: ModoImporte.MANUAL,
                    importePorDefecto: movDef.importePorDefecto,

                    activo: true,
                    legacyId: `CCS_${movDef.codigo}`
                };

                // Subcategoría obligatoria para suplidos (solo si existe)
                if (movDef.subcategoriaSuplido) {
                    movimientoData.subcategoriaSuplido = movDef.subcategoriaSuplido;
                }

                const created = await createMovimiento(FITRI_PREFIX_DATA.id, movimientoData);
                createdMovements.set(movDef.codigo, created.id);
                console.log(`  ✅ Movimiento creado: ${movDef.nombre} (${created.id})`);
            } catch (error: any) {
                const errorMsg = `Error creando movimiento ${movDef.nombre}: ${error.message}`;
                console.error('  ❌', errorMsg);
                errors.push(errorMsg);
            }
        }

        // PASO 3: Crear las asociaciones PrefijoMovimiento
        console.log('🔗 Creando asociaciones PrefijoMovimiento...');
        for (const movDef of FITRI_MOVEMENTS) {
            const movimientoId = createdMovements.get(movDef.codigo);
            if (!movimientoId) {
                const errorMsg = `No se pudo encontrar el ID del movimiento ${movDef.codigo}`;
                console.error('  ⚠️', errorMsg);
                errors.push(errorMsg);
                continue;
            }

            try {
                const prefijoMovData: Omit<PrefijoMovimiento, 'id'> = {
                    prefijoId: FITRI_PREFIX_DATA.id,
                    movimientoId: movimientoId,
                    orden: movDef.orden,
                    obligatorio: false, // Los movimientos FITRI son opcionales (se activan/desactivan)
                    editableEnExpediente: true,
                    importePorDefecto: movDef.importePorDefecto,
                    estadoInicial: EstadoMovimiento.REALIZADO,
                    categoria: 'OPERATIVO', // Todos los movimientos FITRI son operativos
                    bloqueado: false
                };

                await addPrefijoMovimiento(prefijoMovData);
                console.log(`  ✅ Asociación creada: ${movDef.nombre}`);
            } catch (error: any) {
                const errorMsg = `Error creando asociación para ${movDef.nombre}: ${error.message}`;
                console.error('  ❌', errorMsg);
                errors.push(errorMsg);
            }
        }

        const successMessage = errors.length === 0
            ? '🎉 Plantilla FITRI creada correctamente con todos sus movimientos'
            : `⚠️ Plantilla FITRI creada con ${errors.length} errores`;

        console.log(successMessage);
        return {
            success: errors.length === 0,
            message: successMessage,
            errors
        };

    } catch (error: any) {
        const errorMsg = `Error general en seed FITRI: ${error.message}`;
        console.error('❌', errorMsg);
        return {
            success: false,
            message: errorMsg,
            errors: [errorMsg, ...errors]
        };
    }
}

/**
 * Verificar si el prefijo FITRI ya existe
 */
export async function checkFitriExists(): Promise<boolean> {
    try {
        const { getPrefixByCode } = await import('./prefixService');
        const existing = await getPrefixByCode('FITRI');
        return existing !== null;
    } catch (error) {
        console.error('Error verificando existencia de FITRI:', error);
        return false;
    }
}

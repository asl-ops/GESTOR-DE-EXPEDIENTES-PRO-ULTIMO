import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { seedFitriTemplate, checkFitriExists } from '../services/fitriSeedService';
import { useToast } from '../hooks/useToast';

/**
 * FitriTemplateSeeder
 * 
 * Componente de administración para crear el prefijo FITRI y su plantilla completa.
 * Incluye verificación de existencia previa y feedback detallado del proceso.
 */
export const FitriTemplateSeeder: React.FC = () => {
    const [isSeeding, setIsSeeding] = useState(false);
    const [fitriExists, setFitriExists] = useState<boolean | null>(null);
    const [seedResult, setSeedResult] = useState<{
        success: boolean;
        message: string;
        errors: string[];
    } | null>(null);
    const { addToast } = useToast();

    // Verificar si FITRI ya existe
    const checkExistence = async () => {
        try {
            const exists = await checkFitriExists();
            setFitriExists(exists);
            if (exists) {
                addToast('El prefijo FITRI ya existe en el sistema', 'info');
            }
        } catch (error: any) {
            addToast(`Error verificando FITRI: ${error.message}`, 'error');
        }
    };

    // Ejecutar el seed
    const handleSeed = async () => {
        if (fitriExists) {
            addToast('El prefijo FITRI ya existe. No se puede crear de nuevo.', 'warning');
            return;
        }

        setIsSeeding(true);
        setSeedResult(null);

        try {
            const result = await seedFitriTemplate();
            setSeedResult(result);

            if (result.success) {
                addToast('✅ Plantilla FITRI creada correctamente', 'success');
                setFitriExists(true);
            } else {
                addToast(`⚠️ Plantilla FITRI creada con errores`, 'warning');
            }
        } catch (error: any) {
            const errorResult = {
                success: false,
                message: `Error ejecutando seed: ${error.message}`,
                errors: [error.message]
            };
            setSeedResult(errorResult);
            addToast(errorResult.message, 'error');
        } finally {
            setIsSeeding(false);
        }
    };

    React.useEffect(() => {
        checkExistence();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                    <h3 className="text-lg font-normal text-slate-700">
                        Plantilla FITRI - Departamento Fiscal
                    </h3>
                    <p className="text-sm text-slate-500">
                        Crear prefijo y movimientos predefinidos según modelo CCS
                    </p>
                </div>
            </div>

            {/* Status Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-start gap-4">
                    {fitriExists === null ? (
                        <Loader2 className="w-5 h-5 text-slate-400 animate-spin mt-0.5" />
                    ) : fitriExists ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                        <p className="font-normal text-slate-700 mb-1">
                            {fitriExists === null
                                ? 'Verificando existencia...'
                                : fitriExists
                                    ? 'Prefijo FITRI ya existe'
                                    : 'Prefijo FITRI no encontrado'}
                        </p>
                        <p className="text-sm text-slate-500">
                            {fitriExists === null
                                ? 'Consultando base de datos...'
                                : fitriExists
                                    ? 'La plantilla FITRI está disponible para usar en expedientes'
                                    : 'Puede crear la plantilla completa con 9 movimientos predefinidos'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            {!fitriExists && fitriExists !== null && (
                <button
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl 
                             font-normal transition-all duration-200 disabled:opacity-50 
                             disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSeeding ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Creando plantilla FITRI...</span>
                        </>
                    ) : (
                        <>
                            <Database className="w-5 h-5" />
                            <span>Crear Plantilla FITRI</span>
                        </>
                    )}
                </button>
            )}

            {/* Seed Result */}
            {seedResult && (
                <div
                    className={`rounded-2xl p-6 border ${seedResult.success
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}
                >
                    <div className="flex items-start gap-3 mb-3">
                        {seedResult.success ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className="font-normal text-slate-700 mb-1">
                                {seedResult.message}
                            </p>
                            {seedResult.errors.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    <p className="text-sm font-medium text-slate-600">
                                        Errores detectados:
                                    </p>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        {seedResult.errors.map((error, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-amber-600 mt-0.5">•</span>
                                                <span>{error}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Information Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h4 className="font-normal text-slate-700 mb-3">
                    Contenido de la plantilla FITRI
                </h4>
                <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-start gap-2">
                        <span className="text-sky-600 mt-0.5">•</span>
                        <span>
                            <strong className="font-medium">Prefijo:</strong> FITRI - Departamento Fiscal
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-sky-600 mt-0.5">•</span>
                        <span>
                            <strong className="font-medium">Código operación:</strong> FI-TRI
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-sky-600 mt-0.5">•</span>
                        <span>
                            <strong className="font-medium">Movimientos:</strong> 9 predefinidos (2 suplidos + 7 honorarios)
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-sky-600 mt-0.5">•</span>
                        <span>
                            <strong className="font-medium">Suplidos:</strong> IRPF 3T, IVA 3T (con subcategorías)
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-sky-600 mt-0.5">•</span>
                        <span>
                            <strong className="font-medium">Honorarios:</strong> IRPF, IVA, Libros, Resumen Anual, 349, 347, Ayuda Combustible
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

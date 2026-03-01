import React, { useState } from 'react';
import { ClientImportService, ClientImportReport, DuplicatePolicy } from '@/services/clientImportService';
import { useToast } from '@/hooks/useToast';
import { Upload, HelpCircle, Download, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ClientImporter: React.FC = () => {
    const { addToast } = useToast();
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
    const [report, setReport] = useState<ClientImportReport | null>(null);
    const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('IGNORE');
    const [showManual, setShowManual] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar extensión
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            addToast('Por favor selecciona un archivo Excel (.xlsx o .xls)', 'error');
            return;
        }

        setIsImporting(true);
        setReport(null);
        setProgress({ current: 0, total: 0, message: 'Iniciando importación...' });

        try {
            const importReport = await ClientImportService.importFromExcel(file, {
                duplicatePolicy,
                batchSize: 500,
                onProgress: (current, total, message) => {
                    setProgress({ current, total, message });
                }
            });

            setReport(importReport);

            if (importReport.success) {
                addToast(
                    `Importación completada: ${importReport.summary.created} creados, ${importReport.summary.updated} actualizados`,
                    'success'
                );
            } else {
                addToast('Importación completada con errores', 'warning');
            }
        } catch (error) {
            addToast(
                `Error en la importación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setIsImporting(false);
            // Reset input
            e.target.value = '';
        }
    };

    const downloadErrorLog = () => {
        if (!report) return;

        const lines: string[] = [
            '=== REPORTE DE IMPORTACIÓN DE CLIENTES ===',
            `Fecha: ${new Date(report.timestamp).toLocaleString('es-ES')}`,
            '',
            '--- RESUMEN ---',
            `Total procesados: ${report.summary.total}`,
            `Creados: ${report.summary.created}`,
            `Actualizados: ${report.summary.updated}`,
            `Ignorados: ${report.summary.skipped}`,
            `Errores: ${report.summary.errors}`,
            '',
        ];

        if (report.errors.length > 0) {
            lines.push('--- ERRORES ---');
            report.errors.forEach(err => {
                lines.push(
                    `Línea ${err.line}: ${err.error}${err.field ? ` (campo: ${err.field})` : ''}`
                );
            });
            lines.push('');
        }

        if (report.warnings.length > 0) {
            lines.push('--- ADVERTENCIAS ---');
            report.warnings.forEach(warn => {
                lines.push(`Línea ${warn.line}: ${warn.message} (campo: ${warn.field})`);
            });
        }

        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `import_log_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Upload className="w-4 h-4" />
                        </div>
                        Importación Masiva de Clientes
                    </h3>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                        Importa clientes desde un archivo Excel con validación automática
                    </p>
                </div>
                <button
                    onClick={() => setShowManual(true)}
                    className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                    <HelpCircle className="w-4 h-4" />
                    Manual
                </button>
            </div>

            {/* Main Controls */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Duplicate Policy */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                            Política de duplicados
                        </label>
                        <select
                            value={duplicatePolicy}
                            onChange={(e) => setDuplicatePolicy(e.target.value as DuplicatePolicy)}
                            disabled={isImporting}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                        >
                            <option value="IGNORE">Ignorar duplicados (recomendado primera vez)</option>
                            <option value="UPDATE">Actualizar duplicados</option>
                        </select>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                            Archivo Excel
                        </label>
                        <label className="block">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                disabled={isImporting}
                                className="hidden"
                            />
                            <div
                                onClick={(e) => {
                                    if (!isImporting) {
                                        (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                                    }
                                }}
                                className={`w-full bg-white border-2 border-blue-200 text-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer ${isImporting
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-blue-50 hover:border-blue-300 active:scale-95'
                                    }`}
                            >
                                <Upload className="w-5 h-5" />
                                {isImporting ? 'Importando...' : 'Seleccionar Excel'}
                            </div>
                        </label>
                    </div>
                </div>

                {/* Progress Bar */}
                {isImporting && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                style={{
                                    width: progress.total > 0
                                        ? `${(progress.current / progress.total) * 100}%`
                                        : '0%'
                                }}
                            />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                            {progress.message}
                            {progress.total > 0 && (
                                <span className="text-blue-600 ml-2">
                                    ({progress.current}/{progress.total})
                                </span>
                            )}
                        </p>
                    </div>
                )}
            </div>

            {/* Report */}
            {report && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500" />
                            Resultado de la Importación
                        </h4>
                        <button
                            onClick={downloadErrorLog}
                            className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Descargar Log
                        </button>
                    </div>

                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider mb-1">Creados</p>
                            <p className="text-2xl font-black text-emerald-900">{report.summary.created}</p>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                            <p className="text-[9px] font-black text-blue-700 uppercase tracking-wider mb-1">Actualizados</p>
                            <p className="text-2xl font-black text-blue-900">{report.summary.updated}</p>
                        </div>
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider mb-1">Ignorados</p>
                            <p className="text-2xl font-black text-amber-900">{report.summary.skipped}</p>
                        </div>
                        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                            <p className="text-[9px] font-black text-rose-700 uppercase tracking-wider mb-1">Errores</p>
                            <p className="text-2xl font-black text-rose-900">{report.summary.errors}</p>
                        </div>
                    </div>

                    {/* Errors */}
                    {report.errors.length > 0 && (
                        <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                            <h5 className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Errores ({report.errors.length})
                            </h5>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {report.errors.slice(0, 10).map((err, idx) => (
                                    <div key={idx} className="bg-white rounded-xl p-3 text-[10px]">
                                        <span className="font-black text-slate-900">Línea {err.line}:</span>{' '}
                                        <span className="text-slate-600">{err.error}</span>
                                        {err.field && <span className="text-slate-400 italic"> (campo: {err.field})</span>}
                                    </div>
                                ))}
                                {report.errors.length > 10 && (
                                    <p className="text-[9px] text-slate-500 italic text-center pt-2">
                                        ... y {report.errors.length - 10} errores más (descarga el log completo)
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Warnings */}
                    {report.warnings.length > 0 && (
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                            <h5 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info size={14} />
                                Advertencias ({report.warnings.length})
                            </h5>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {report.warnings.slice(0, 10).map((warn, idx) => (
                                    <div key={idx} className="bg-white rounded-xl p-3 text-[10px]">
                                        <span className="font-black text-slate-900">Línea {warn.line}:</span>{' '}
                                        <span className="text-slate-600">{warn.message}</span>
                                    </div>
                                ))}
                                {report.warnings.length > 10 && (
                                    <p className="text-[9px] text-slate-500 italic text-center pt-2">
                                        ... y {report.warnings.length - 10} advertencias más
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Manual Modal */}
            {showManual && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-3xl">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                Manual de Importación
                            </h3>
                            <button
                                onClick={() => setShowManual(false)}
                                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Required Fields */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    Campos Obligatorios
                                </h4>
                                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">nombre</p>
                                            <p className="text-[10px] text-slate-600 mt-1">Nombre completo del cliente (texto)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">documento</p>
                                            <p className="text-[10px] text-slate-600 mt-1">DNI/CIF del cliente (texto, sin espacios ni guiones)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Excel Format */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info size={14} className="text-blue-500" />
                                    Formato del Excel
                                </h4>
                                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-wider">Nombre de la hoja</p>
                                        <p className="text-sm text-slate-700 font-mono bg-white rounded-xl px-4 py-2 border border-blue-200">Clientes</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-blue-900 uppercase tracking-wider">Columnas disponibles</p>
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">
                                                <span className="font-black">nombre</span> <span className="text-emerald-600">*</span>
                                            </div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">
                                                <span className="font-black">documento</span> <span className="text-emerald-600">*</span>
                                            </div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">tipo</div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">telefono</div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">email</div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">direccion</div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">poblacion</div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">provincia</div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">codigoPostal</div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">observaciones</div>
                                            <div className="bg-white rounded-xl px-3 py-2 border border-blue-200">datosContactoImportadosCCS</div>
                                        </div>
                                        <p className="text-[9px] text-blue-700 italic mt-2">
                                            <span className="text-emerald-600">*</span> Campos obligatorios
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Important Notes */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} className="text-amber-500" />
                                    Notas Importantes
                                </h4>
                                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 space-y-3">
                                    <div className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        <p className="text-[10px] text-slate-700">El campo <strong>documento</strong> debe estar formateado como TEXTO en Excel para evitar que se pierdan ceros iniciales</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        <p className="text-[10px] text-slate-700">El <strong>tipo</strong> se deduce automáticamente: DNI numérico = PARTICULAR, CIF alfanumérico = EMPRESA</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        <p className="text-[10px] text-slate-700">Los emails inválidos generan advertencias pero no impiden la importación</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        <p className="text-[10px] text-slate-700">Los duplicados se detectan por el campo <strong>documento</strong></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

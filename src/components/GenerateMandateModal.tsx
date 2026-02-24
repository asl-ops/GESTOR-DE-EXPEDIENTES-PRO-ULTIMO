import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';
import { MandateData } from '@/types/mandate';
import { Client } from '@/types';
import MandateDocument from './MandateDocument';
import { FileText, Eye, Download } from 'lucide-react';

interface GenerateMandateModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
    clientSnapshot?: { nombre: string; documento?: string; telefono?: string; email?: string; } | null;
    fileNumber: string;
    defaultAsunto: string;
    mandateData: MandateData | null;
    onGenerate: (asuntoLinea1: string, asuntoLinea2: string, selectedAdminId?: string) => Promise<void>;
    isGenerating: boolean;
}

const GenerateMandateModal: React.FC<GenerateMandateModalProps> = ({
    isOpen,
    onClose,
    client,
    clientSnapshot,
    fileNumber,
    defaultAsunto,
    mandateData,
    onGenerate,
    isGenerating,
}) => {
    const [asuntoLinea1, setAsuntoLinea1] = useState('');
    const [asuntoLinea2, setAsuntoLinea2] = useState('');
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');
    const [previewData, setPreviewData] = useState<MandateData | null>(null);

    useEffect(() => {
        if (isOpen) {
            setAsuntoLinea1(defaultAsunto);
            setAsuntoLinea2('');
            setSelectedAdminId('');
        }
    }, [isOpen, defaultAsunto]);

    useEffect(() => {
        if (mandateData) {
            let updatedMandateData = { ...mandateData };

            // Si hay un administrador seleccionado, actualizar los datos del mandante
            if (selectedAdminId && client.administrators) {
                const admin = client.administrators.find(a => a.id === selectedAdminId);
                if (admin) {
                    updatedMandateData = {
                        ...updatedMandateData,
                        mandante: {
                            ...updatedMandateData.mandante,
                            representante: {
                                nombre: `${admin.firstName} ${admin.surnames}`,
                                dni: admin.nif
                            },
                            empresa: `${client.firstName} ${client.surnames}`,
                            cif: client.nif
                        }
                    };
                }
            }

            // Actualizar los datos de vista previa con el asunto editado
            setPreviewData({
                ...updatedMandateData,
                asunto: {
                    linea_1: asuntoLinea1,
                    linea_2: asuntoLinea2,
                },
            });
        }
    }, [mandateData, asuntoLinea1, asuntoLinea2, selectedAdminId, client]);

    // Abrir ventana de impresión (Vista Previa)
    const handlePrintPreview = () => {
        if (!previewData) return;

        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        if (!printWindow) {
            alert('Permite las ventanas emergentes para generar documentos.');
            return;
        }

        printWindow.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><title>Mandato ${fileNumber}</title></head><body><div id="print-root"></div></body></html>`);

        // Copiar estilos
        Array.from(document.styleSheets).forEach(styleSheet => {
            try {
                const cssRules = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
                const style = printWindow.document.createElement('style');
                style.textContent = cssRules;
                printWindow.document.head.appendChild(style);
            } catch (e) { console.warn('Could not copy stylesheet:', e); }
        });
        printWindow.document.close();

        printWindow.onload = () => {
            const printRootEl = printWindow.document.getElementById('print-root');
            if (!printRootEl) { printWindow.close(); return; }

            // Estilos específicos de impresión (Mejorados)
            const printStyle = printWindow.document.createElement('style');
            printStyle.textContent = `
                @media screen {
                    body { 
                        margin: 0; 
                        background-color: #f1f5f9; 
                        display: flex; 
                        justify-content: center; 
                        padding: 40px 20px;
                    }
                    .print-page {
                        width: 210mm;
                        min-height: 297mm;
                        background: white;
                        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                        border-radius: 4px;
                        overflow: hidden;
                        transform-origin: top center;
                    }
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 12mm;
                    }
                    html, body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* Forzar ocupación total del área imprimible */
                    .print-page {
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        overflow: visible !important;
                        transform: none !important;
                        zoom: 1 !important;
                        max-width: none !important;
                    }
                    /* Anular padding del documento para que use el margen de @page */
                    #mandate-content {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        background: transparent !important;
                    }
                    /* Asegurar que el contenedor raíz no restrinja */
                    #print-root {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Ocultar elementos innecesarios */
                    body > *:not(#print-root), 
                    #print-root > *:not(.print-page) {
                        display: none !important;
                    }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `;
            printWindow.document.head.appendChild(printStyle);

            import('react-dom/client').then(({ createRoot }) => {
                const root = createRoot(printRootEl);
                root.render(
                    <React.StrictMode>
                        <div className="print-page">
                            <MandateDocument data={previewData} />
                        </div>
                    </React.StrictMode>
                );

                // Disparo de impresión (sin auto-escalado agresivo)
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                }, 800);
            });
        };
    };

    const handleGenerate = async () => {
        await onGenerate(asuntoLinea1, asuntoLinea2, selectedAdminId);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-indigo-600" />
                        <h3 className="text-xl font-semibold text-slate-900">Generar Mandato</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <XMarkIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Client Info */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Datos del Cliente</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-slate-600">Nombre:</span>{' '}
                                <span className="font-medium text-slate-900 uppercase">
                                    {(client.firstName || client.surnames) ? `${client.firstName} ${client.surnames}` : clientSnapshot?.nombre}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-600">DNI/NIF:</span>{' '}
                                <span className="font-medium text-slate-900 uppercase">
                                    {client.nif || clientSnapshot?.documento || '—'}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-slate-600">Expediente:</span>{' '}
                                <span className="font-medium text-slate-900">{fileNumber}</span>
                            </div>
                        </div>
                    </div>

                    {/* Administrator Selector */}
                    {client.administrators && client.administrators.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Firmante (Administrador)
                            </label>
                            <select
                                value={selectedAdminId}
                                onChange={(e) => setSelectedAdminId(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">-- Seleccionar Administrador --</option>
                                {client.administrators.map(admin => (
                                    <option key={admin.id} value={admin.id}>
                                        {admin.firstName} {admin.surnames} ({admin.position || 'Administrador'})
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-500">
                                Selecciona quién firmará el mandato en representación de la empresa.
                            </p>
                        </div>
                    )}

                    {/* Asunto Fields */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Asunto del Mandato - Línea 1 *
                        </label>
                        <textarea
                            rows={3}
                            value={asuntoLinea1}
                            onChange={(e) => setAsuntoLinea1(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ej: Tramitación de matriculación de vehículo marca SEAT modelo IBIZA..."
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Asunto del Mandato - Línea 2 (Opcional)
                        </label>
                        <textarea
                            rows={2}
                            value={asuntoLinea2}
                            onChange={(e) => setAsuntoLinea2(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Información adicional del asunto (opcional)"
                        />
                    </div>

                    {/* Preview Button (New) */}
                    <div className="mb-4">
                        <button
                            onClick={handlePrintPreview}
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors w-full justify-center border border-indigo-200 rounded-lg p-3 bg-indigo-50"
                        >
                            <Eye className="w-5 h-5" />
                            Vista Previa / Imprimir
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-200 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !asuntoLinea1.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generando...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Guardar en Adjuntos
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Hidden element for PDF generation */}
            {previewData && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <MandateDocument data={previewData} />
                </div>
            )}
        </div>
    );
};

export default GenerateMandateModal;

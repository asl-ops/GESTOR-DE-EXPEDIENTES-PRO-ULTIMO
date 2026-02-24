import React, { useState, useEffect, useRef } from 'react';
import {
    FileText,
    Download,
    FileSpreadsheet,
    X,
    Search,
    Calendar,
    User,
    Filter,
    Clock,
    AlertCircle,
    BarChart3,
    Eye
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import SmartDatePicker from './ui/SmartDatePicker';
import { Button } from './ui/Button';
import {
    ImprovedReportFilters,
    ReportType,
    ReportData,
    generateListadoGeneral,
    generateListadoAbiertoCerrados,
    generateRendimientoBasico,
    generateMas30Dias,
    generateIncompletos,
    exportToExcel,
    exportToPDF
} from '../services/improvedReportService';

interface ImprovedReportsModuleProps {
    onClose: () => void;
}

const ImprovedReportsModule: React.FC<ImprovedReportsModuleProps> = ({ onClose }) => {
    const { caseHistory, users } = useAppContext();
    const { addToast } = useToast();

    // Estado de filtros
    const [filters, setFilters] = useState<ImprovedReportFilters>(() => {
        // Intentar recuperar filtros guardados
        const saved = localStorage.getItem('lastReportFilters');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            statusType: 'todos' as const,
            openingDateRange: undefined,
            closingDateRange: undefined,
            responsibleUserId: undefined,
            expedienteType: undefined,
            quickSearch: ''
        };
    });

    // Definición de tipo para sugerencias
    interface Suggestion {
        main: string;      // NIF o Expediente
        secondary: string; // Nombre Cliente
        value: string;     // Valor a aplicar en el filtro
        type: 'client' | 'file';
    }

    // Estado para sugerencias de búsqueda
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedClientName, setSelectedClientName] = useState(''); // Estado para el nombre del cliente
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    // Tipo de informe seleccionado
    const [selectedReport, setSelectedReport] = useState<ReportType>('listado_general');

    // Vista previa
    const [previewData, setPreviewData] = useState<ReportData | null>(null);
    const [showPreview, setShowPreview] = useState(true);

    // Guardar filtros en localStorage cuando cambien
    useEffect(() => {
        localStorage.setItem('lastReportFilters', JSON.stringify(filters));
    }, [filters]);

    // Actualizar vista previa automáticamente
    useEffect(() => {
        if (showPreview) {
            generatePreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedReport, filters, showPreview]);

    // Manejar clics fuera del buscador para cerrar sugerencias
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const generatePreview = () => {
        try {
            const fullData = generateReport();
            if (fullData) {
                // Mostrar solo los primeros 10 resultados
                const previewData: ReportData = {
                    ...fullData,
                    rows: fullData.rows.slice(0, 10),
                    totalCount: fullData.rows.length
                };
                setPreviewData(previewData);
            }
        } catch (error) {
            console.error('Error generating preview:', error);
        }
    };

    const generateReport = (): ReportData | null => {
        switch (selectedReport) {
            case 'listado_general':
                return generateListadoGeneral(caseHistory, filters);
            case 'listado_abiertos_cerrados':
                return generateListadoAbiertoCerrados(caseHistory, filters);
            case 'rendimiento_basico':
                return generateRendimientoBasico(caseHistory, filters, users);
            case 'mas_30_dias':
                return generateMas30Dias(caseHistory, filters);
            case 'incompletos':
                return generateIncompletos(caseHistory, filters);
            default:
                return null;
        }
    };

    const handleSearchChange = (value: string) => {
        setFilters({ ...filters, quickSearch: value });

        // Si el usuario borra o cambia el texto, limpiamos el nombre seleccionado visualmente
        // para indicar que está buscando de nuevo o que el valor actual no corresponde a una selección exacta
        if (selectedClientName && value !== filters.quickSearch) {
            setSelectedClientName('');
        }

        if (value.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const term = value.toLowerCase();
        const clientMatches = new Map<string, Suggestion>(); // Usar Map para evitar duplicados por NIF
        const fileMatches: Suggestion[] = [];

        caseHistory.forEach(c => {
            const clientName = `${c.client.surnames || ''} ${c.client.firstName || ''}`.trim();
            const nif = c.client.nif || 'Sin NIF';
            const fileNumber = c.fileNumber;

            // 1. Buscar coincidencias en Clientes (Nombre o NIF)
            if (clientName.toLowerCase().includes(term) || nif.toLowerCase().includes(term)) {
                if (!clientMatches.has(nif)) {
                    clientMatches.set(nif, {
                        main: nif,
                        secondary: clientName,
                        value: nif !== 'Sin NIF' ? nif : clientName, // Preferir NIF para la búsqueda
                        type: 'client'
                    });
                }
            }

            // 2. Buscar coincidencias en Número de Expediente
            if (fileNumber.toLowerCase().includes(term)) {
                fileMatches.push({
                    main: fileNumber,
                    secondary: clientName,
                    value: fileNumber,
                    type: 'file'
                });
            }
        });

        // Combinar resultados: Primero clientes, luego expedientes
        const allSuggestions = [
            ...Array.from(clientMatches.values()),
            ...fileMatches
        ].slice(0, 8); // Limitar a 8 resultados

        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0);
    };

    const selectSuggestion = (suggestion: Suggestion) => {
        setFilters({ ...filters, quickSearch: suggestion.main }); // Usamos el identificador principal (NIF o Expediente)
        setSelectedClientName(suggestion.secondary); // Mostramos el nombre en el segundo campo
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleGenerateReport = () => {
        try {
            const reportData = generateReport();
            if (!reportData) {
                addToast('Error al generar el informe', 'error');
                return;
            }

            setPreviewData(reportData);
            setShowPreview(true);
            addToast(`Informe generado: ${reportData.totalCount} registros`, 'success');
        } catch (error) {
            console.error('Error generating report:', error);
            addToast('Error al generar el informe', 'error');
        }
    };

    const handleExportExcel = () => {
        try {
            const reportData = generateReport();
            if (!reportData) {
                addToast('Error al exportar', 'error');
                return;
            }

            exportToExcel(reportData);
            addToast('Informe exportado a Excel', 'success');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            addToast('Error al exportar a Excel', 'error');
        }
    };

    const handleExportPDF = () => {
        try {
            const reportData = generateReport();
            if (!reportData) {
                addToast('Error al exportar', 'error');
                return;
            }

            exportToPDF(reportData);
            addToast('Abriendo vista de impresión...', 'info');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            addToast('Error al exportar a PDF', 'error');
        }
    };

    // Obtener tipos de expediente únicos
    const expedienteTypes = Array.from(
        new Set(caseHistory.map(c => c.fileConfig.category))
    ).sort();

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[95vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-white border-b border-slate-200 p-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-normal text-[#4c739a] flex items-center gap-3 uppercase tracking-widest">
                            <BarChart3 className="w-6 h-6 opacity-70" />
                            Analítica y Rendimiento
                        </h1>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-2">v3.16.0 • Sistema de Gestión de Expedientes</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-slate-50 border-b border-slate-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">

                        {/* Rango de Fecha de Apertura */}
                        <div className="lg:col-span-3">
                            <label className="block text-[10px] font-normal text-slate-500 mb-2 uppercase tracking-widest">
                                <Calendar className="w-3 h-3 inline mr-1 opacity-70" />
                                Fecha Apertura
                            </label>
                            <div className="flex gap-2">
                                <SmartDatePicker
                                    value={filters.openingDateRange?.start || ''}
                                    onChange={(val) => setFilters({
                                        ...filters,
                                        openingDateRange: {
                                            start: val,
                                            end: filters.openingDateRange?.end || val
                                        }
                                    })}
                                    className="flex-1"
                                />
                                <span className="self-center text-slate-400">→</span>
                                <SmartDatePicker
                                    value={filters.openingDateRange?.end || ''}
                                    onChange={(val) => setFilters({
                                        ...filters,
                                        openingDateRange: {
                                            start: filters.openingDateRange?.start || val,
                                            end: val
                                        }
                                    })}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Rango de Fecha de Cierre (solo si Cerrados) */}
                        {filters.statusType === 'cerrados' && (
                            <div className="lg:col-span-3">
                                <label className="block text-[10px] font-normal text-slate-500 mb-2 uppercase tracking-widest">
                                    <Calendar className="w-3 h-3 inline mr-1 opacity-70" />
                                    Fecha Cierre
                                </label>
                                <div className="flex gap-2">
                                    <SmartDatePicker
                                        value={filters.closingDateRange?.start || ''}
                                        onChange={(val) => setFilters({
                                            ...filters,
                                            closingDateRange: {
                                                start: val,
                                                end: filters.closingDateRange?.end || val
                                            }
                                        })}
                                        className="flex-1"
                                    />
                                    <span className="self-center text-slate-400">→</span>
                                    <SmartDatePicker
                                        value={filters.closingDateRange?.end || ''}
                                        onChange={(val) => setFilters({
                                            ...filters,
                                            closingDateRange: {
                                                start: filters.closingDateRange?.start || val,
                                                end: val
                                            }
                                        })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Estado */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                                <Filter className="w-3 h-3 inline mr-1" />
                                Estado
                            </label>
                            <select
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={filters.statusType}
                                onChange={(e) => setFilters({
                                    ...filters,
                                    statusType: e.target.value as 'todos' | 'abiertos' | 'cerrados'
                                })}
                            >
                                <option value="todos">Todos</option>
                                <option value="abiertos">Abiertos</option>
                                <option value="cerrados">Cerrados</option>
                            </select>
                        </div>

                        {/* Responsable */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                                <User className="w-3 h-3 inline mr-1" />
                                Responsable
                            </label>
                            <select
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={filters.responsibleUserId || ''}
                                onChange={(e) => setFilters({
                                    ...filters,
                                    responsibleUserId: e.target.value || undefined
                                })}
                            >
                                <option value="">Todos</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tipo de Expediente */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                                <FileText className="w-3 h-3 inline mr-1" />
                                Tipo Expediente
                            </label>
                            <select
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={filters.expedienteType || ''}
                                onChange={(e) => setFilters({
                                    ...filters,
                                    expedienteType: e.target.value || undefined
                                })}
                            >
                                <option value="">Todos</option>
                                {expedienteTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Buscador Rápido con Autocompletado - ANCHO COMPLETO */}
                        <div className="lg:col-span-12" ref={searchWrapperRef}>
                            <label className="block text-[10px] font-normal text-slate-500 mb-2 uppercase tracking-widest">
                                Cliente / DNI / NIE / CIF
                            </label>
                            <div className="flex gap-4">
                                {/* Campo de Búsqueda (Identificador) */}
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="DNI/NIE/CIF..."
                                        className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={filters.quickSearch || ''}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        onFocus={() => {
                                            if (filters.quickSearch && filters.quickSearch.length >= 2) {
                                                handleSearchChange(filters.quickSearch);
                                            }
                                        }}
                                    />
                                    {filters.quickSearch && (
                                        <button
                                            onClick={() => {
                                                setFilters({ ...filters, quickSearch: '' });
                                                setSelectedClientName('');
                                                setSuggestions([]);
                                                setShowSuggestions(false);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Dropdown de Sugerencias */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                            {suggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        selectSuggestion(suggestion);
                                                    }}
                                                >
                                                    <span className="font-mono font-bold text-slate-900">{suggestion.main}</span>
                                                    <span className="text-slate-500 ml-3 truncate flex-1 text-right">{suggestion.secondary}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Campo de Nombre (Solo lectura) */}
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Nombre del cliente"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none cursor-default"
                                        value={selectedClientName}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tipos de Informe */}
                <div className="bg-white border-b border-slate-200 px-6">
                    <div className="flex gap-6 flex-wrap">
                        <button
                            onClick={() => setSelectedReport('listado_general')}
                            className={`app-tab flex items-center gap-2 ${selectedReport === 'listado_general' ? 'app-tab-active' : ''}`}
                        >
                            <FileText className="w-4 h-4" />
                            Listado General
                        </button>

                        <button
                            onClick={() => setSelectedReport('listado_abiertos_cerrados')}
                            className={`app-tab flex items-center gap-2 ${selectedReport === 'listado_abiertos_cerrados' ? 'app-tab-active' : ''}`}
                        >
                            <Filter className="w-4 h-4" />
                            Abiertos / Cerrados
                        </button>

                        <button
                            onClick={() => setSelectedReport('rendimiento_basico')}
                            className={`app-tab flex items-center gap-2 ${selectedReport === 'rendimiento_basico' ? 'app-tab-active' : ''}`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Rendimiento Básico
                        </button>

                        <button
                            onClick={() => setSelectedReport('mas_30_dias')}
                            className={`app-tab flex items-center gap-2 ${selectedReport === 'mas_30_dias' ? 'app-tab-active' : ''}`}
                        >
                            <Clock className="w-4 h-4" />
                            +30 días sin cerrar
                        </button>

                        <button
                            onClick={() => setSelectedReport('incompletos')}
                            className={`app-tab flex items-center gap-2 ${selectedReport === 'incompletos' ? 'app-tab-active' : ''}`}
                        >
                            <AlertCircle className="w-4 h-4" />
                            Incompletos
                        </button>
                    </div>
                </div>

                {/* Vista Previa */}
                {showPreview && previewData && (
                    <div className="flex-1 overflow-auto p-6 bg-slate-50">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-normal text-[#4c739a] text-sm uppercase tracking-widest">{previewData.title}</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Mostrando {Math.min(10, previewData.totalCount)} de {previewData.totalCount} registros
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                            {previewData.headers.map((header, idx) => (
                                                <th key={idx} className="px-4 py-3 text-left text-[10px] font-normal uppercase tracking-widest">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.rows.map((row, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                {row.map((cell, cellIdx) => (
                                                    <td key={cellIdx} className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {previewData.summary && previewData.summary.length > 0 && (
                                <div className="bg-slate-50 px-6 py-8 border-t border-slate-200">
                                    <h4 className="font-normal text-[#4c739a] text-[10px] uppercase tracking-widest mb-6">📊 Resumen de Informe</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                        {previewData.summary.map((item, idx) => (
                                            <div key={idx} className="flex flex-col gap-1">
                                                <span className="text-[9px] text-slate-400 font-normal uppercase tracking-widest">{item.label}</span>
                                                <span className="text-xl font-normal text-[#4c739a]">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!showPreview && (
                    <div className="flex-1 flex items-center justify-center bg-slate-50">
                        <div className="text-center">
                            <Eye className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 mb-4">Vista previa desactivada</p>
                            <button
                                onClick={() => setShowPreview(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                            >
                                Mostrar Vista Previa
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer con Acciones */}
                <div className="bg-white border-t border-slate-200 p-6 flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                        {previewData && (
                            <span>
                                Informe: <strong className="text-slate-800">{previewData.title}</strong>
                                {' • '}
                                {previewData.totalCount} registro{previewData.totalCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleExportExcel}
                            variant="outline"
                            className="text-emerald-700 hover:bg-emerald-50"
                            icon={FileSpreadsheet}
                        >
                            Excel
                        </Button>
                        <Button
                            onClick={handleExportPDF}
                            variant="outline"
                            className="text-red-700 hover:bg-red-50"
                            icon={Download}
                        >
                            PDF
                        </Button>
                        <Button
                            onClick={handleGenerateReport}
                            variant="primary"
                            icon={BarChart3}
                        >
                            GENERAR INFORME
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImprovedReportsModule;

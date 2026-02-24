import React, { useEffect, useRef } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { EconomicLineItem, LineType } from '../types';
import { CurrencyInput } from './ui/CurrencyInput';

interface EconomicLinesEditorProps {
    lines: EconomicLineItem[];
    onChange: (lines: EconomicLineItem[]) => void;
    vatRate?: number; // default 0.21
}

const COMMON_CONCEPTS = [
    'Tasas DGT',
    'Honorarios Profesionales',
    'Impuesto Matriculación',
    'Suplidos Varios',
    'Gestión Administrativa',
    'Otros'
];

export const EconomicLinesEditor: React.FC<EconomicLinesEditorProps> = ({
    lines,
    onChange,
    vatRate = 0.21
}) => {
    const lastLineRef = useRef<HTMLInputElement>(null);

    // Auto-focus logic when a new line is added
    useEffect(() => {
        if (lines.length > 0 && lastLineRef.current) {
            // Only focus if the last line is empty (newly added)
            const lastLine = lines[lines.length - 1];
            if (!lastLine.concept && !lastLine.amount) {
                lastLineRef.current.focus();
            }
        }
    }, [lines.length]);

    const handleAddLine = () => {
        const newLine: EconomicLineItem = {
            id: crypto.randomUUID(),
            conceptId: '',
            concept: '',
            amount: 0,
            date: new Date().toISOString(),
            type: 'suplido' as const // default to non-taxable
        };
        onChange([...lines, newLine]);
    };

    const handleUpdateLine = (id: string, field: keyof EconomicLineItem, value: any) => {
        const newLines = lines.map(line => {
            if (line.id === id) {
                // If updating concept, auto-infer type
                if (field === 'concept') {
                    const conceptText = (value as string).toLowerCase();
                    const isTaxable = conceptText.includes('honorarios') ||
                        conceptText.includes('gestión') ||
                        conceptText.includes('tramitación');

                    return {
                        ...line,
                        concept: value,
                        type: (isTaxable ? 'honorario' : 'suplido') as LineType
                    };
                }
                return { ...line, [field]: value };
            }
            return line;
        });
        onChange(newLines);
    };

    const handleRemoveLine = (id: string) => {
        onChange(lines.filter(l => l.id !== id));
    };

    // Calculations
    const subtotal = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

    // Calculate VAT base (only Honorarios)
    // We check if "Honorarios" is in the concept text OR if type is 'honorario' (fallback)
    const vatBase = lines
        .filter(line =>
            line.concept.toLowerCase().includes('honorarios') ||
            line.type === 'honorario' ||
            line.concept.toLowerCase().includes('gestión')
        )
        .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

    const vatAmount = vatBase * vatRate;
    const total = subtotal + vatAmount;

    return (
        <div className="flex flex-col h-full">
            {/* Header with Title and Add Button */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-sky-50 rounded text-sky-600">
                        <Calculator size={16} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">Datos Económicos</h3>
                </div>
                <button
                    onClick={handleAddLine}
                    className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors bg-opacity-50"
                >
                    <Plus size={14} />
                    <span>Añadir línea</span>
                </button>
            </div>

            {/* Lines List */}
            <div className="flex-1 p-4 bg-slate-50/30 overflow-y-auto space-y-2">
                {lines.map((line, index) => (
                    <div
                        key={line.id}
                        className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm group hover:border-sky-200 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-50 transition-all duration-200"
                    >
                        {/* Concept Input/Select */}
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block pl-1">
                                Concepto
                            </label>
                            <div className="relative">
                                <input
                                    ref={index === lines.length - 1 ? lastLineRef : null}
                                    type="text"
                                    list={`concepts-${line.id}`}
                                    value={line.concept}
                                    onChange={(e) => handleUpdateLine(line.id, 'concept', e.target.value)}
                                    placeholder="Seleccionar o escribir..."
                                    className="w-full text-sm font-medium text-slate-700 placeholder:text-slate-300 border-none outline-none focus:ring-0 bg-transparent p-0"
                                />
                                <datalist id={`concepts-${line.id}`}>
                                    {COMMON_CONCEPTS.map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="w-32 text-right border-l border-slate-100 pl-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block pr-1">
                                Importe (€)
                            </label>
                            <CurrencyInput
                                value={line.amount || 0}
                                onChange={(val) => handleUpdateLine(line.id, 'amount', val)}
                                className="w-full text-sm font-bold text-slate-900 text-right border-none outline-none focus:ring-0 bg-transparent p-0 placeholder:text-slate-300"
                                placeholder="0,00"
                            />
                        </div>

                        {/* Delete Action */}
                        <button
                            onClick={() => handleRemoveLine(line.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-100"
                            title="Eliminar línea"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                {lines.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                        No hay líneas económicas. Añade una para empezar.
                    </div>
                )}

                {/* Duplicate Add Button (Bottom) */}
                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleAddLine}
                        className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors bg-opacity-50"
                    >
                        <Plus size={14} />
                        <span>Añadir línea</span>
                    </button>
                </div>
            </div>

            {/* Footer Summary */}
            <div className="bg-white border-t border-slate-100 p-6 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-medium">{subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>IVA ({(vatRate * 100).toFixed(0)}%) <span className="text-[10px] text-slate-400 lowercase">(s/ honorarios)</span></span>
                    <span className="font-medium">{vatAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>
                <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Importe Total</span>
                    <div className="text-2xl font-light text-sky-600 leading-none">
                        {total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium">€</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import {
    X,
    Euro,
    StickyNote,
    Plus
} from 'lucide-react';
import { EconomicLineItem } from '../types';
import SmartDatePicker from './ui/SmartDatePicker';
import { Button } from './ui/Button';
import { PremiumNumericInput } from './ui/PremiumNumericInput';

interface RegisterPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegister: (payment: Partial<EconomicLineItem>) => void;
}

const PREDEFINED_CONCEPTS = [
    'Honorarios Profesionales',
    'Tasas DGT',
    'Impuesto de Matriculación',
    'Impuesto de Transmisiones',
    'Placas de Matrícula',
    'Suplidos Colegio Gestores',
    'Otros Gastos',
];

const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({ isOpen, onClose, onRegister }) => {
    const [formData, setFormData] = useState({
        concept: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        method: 'Transferencia',
        status: 'Pendiente',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRegister({
            id: `pay-${Date.now()}`,
            concept: formData.concept,
            amount: formData.amount,
            type: 'honorario', // Default or mapped based on concept
            conceptId: `concept-${Date.now()}`
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200"><Euro className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Registrar Nuevo Pago</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión Económica de Expediente</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Concepto del Pago</label>
                            <div className="relative">
                                <select
                                    required
                                    value={formData.concept}
                                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none ring-1 ring-slate-200/50"
                                >
                                    <option value="" disabled>Seleccionar concepto...</option>
                                    {PREDEFINED_CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="Otro">Otro concepto...</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-300 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importe (€)</label>
                            <div className="relative">
                                <PremiumNumericInput
                                    value={formData.amount}
                                    onChange={(val) => setFormData({ ...formData, amount: val })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all ring-1 ring-slate-200/50"
                                    placeholder="0,00"
                                />
                                <Euro className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <SmartDatePicker
                                label="Fecha de Registro"
                                value={formData.date}
                                onChange={(val) => setFormData({ ...formData, date: val })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pago</label>
                            <select
                                value={formData.method}
                                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all ring-1 ring-slate-200/50"
                            >
                                <option>Transferencia</option>
                                <option>Efectivo</option>
                                <option>Tarjeta</option>
                                <option>Domiciliación</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all ring-1 ring-slate-200/50"
                            >
                                <option>Pendiente</option>
                                <option>Cobrado</option>
                                <option>Anulado</option>
                            </select>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Adicionales</label>
                            <div className="relative">
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Referencia de factura, observaciones..."
                                    className="w-full h-24 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all ring-1 ring-slate-200/50 no-scrollbar"
                                />
                                <StickyNote className="w-4 h-4 text-slate-300 absolute left-4 top-5" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-[2]"
                            icon={Plus}
                        >
                            Registrar Pago
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Simple ChevronDown for internal use
const ChevronDown = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);

export default RegisterPaymentModal;

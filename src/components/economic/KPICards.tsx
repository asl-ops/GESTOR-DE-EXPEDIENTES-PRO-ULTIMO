import React from 'react';
import { FinancialKPIs } from '@/hooks/useEconomic';

interface KPICardsProps {
    kpis: FinancialKPIs;
    onDrillDown: (type: 'invoiced' | 'paid' | 'pending' | 'overdue' | 'billing') => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

const Card: React.FC<{
    label: string;
    value: number;
    onClick: () => void;
    color?: string;
}> = ({ label, value, onClick, color = 'text-slate-900' }) => (
    <div
        onClick={onClick}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-sky-200 transition-all cursor-pointer group flex-1 min-w-[200px]"
    >
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-sky-600 transition-colors">
            {label}
        </div>
        <div className={`text-2xl font-mono font-medium tracking-tight ${color}`}>
            {formatCurrency(value)}
        </div>
    </div>
);

const KPICards: React.FC<KPICardsProps> = ({ kpis, onDrillDown }) => {
    return (
        <div className="flex flex-wrap gap-4">
            <Card
                label="Facturado"
                value={kpis.totalInvoiced}
                onClick={() => onDrillDown('invoiced')}
            />
            <Card
                label="Cobrado"
                value={kpis.totalPaid}
                onClick={() => onDrillDown('paid')}
                color="text-emerald-600"
            />
            <Card
                label="Pendiente"
                value={kpis.totalPending}
                onClick={() => onDrillDown('pending')}
                color="text-amber-600"
            />
            <Card
                label="Vencido"
                value={kpis.totalOverdue}
                onClick={() => onDrillDown('overdue')}
                color="text-rose-600"
            />
            <Card
                label="Pdte. Facturar"
                value={kpis.pendingBilling}
                onClick={() => onDrillDown('billing')}
                color="text-slate-600"
            />
        </div>
    );
};

export default KPICards;

import React from 'react';
import { FinancialKPIs } from '@/hooks/useEconomic';

interface KPICardsProps {
    kpis: FinancialKPIs;
    saldoContable: number;
    onDrillDown: (type: 'openCases' | 'pendingInvoices' | 'contableBalance') => void;
    loading?: boolean;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

const Card: React.FC<{
    label: string;
    value: number;
    onClick: () => void;
    color?: string;
    loading?: boolean;
}> = ({ label, value, onClick, color = 'text-slate-900', loading = false }) => (
    <div
        onClick={onClick}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-sky-200 transition-all cursor-pointer group flex-1 min-w-[200px]"
    >
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-sky-600 transition-colors">
            {label}
        </div>
        {loading ? (
            <div className="h-8 w-32 rounded bg-slate-100 animate-pulse" />
        ) : (
            <div className={`text-2xl font-mono font-medium tracking-tight ${color}`}>
                {formatCurrency(value)}
            </div>
        )}
    </div>
);

const KPICards: React.FC<KPICardsProps> = ({ kpis, saldoContable, onDrillDown, loading = false }) => {
    return (
        <div className="flex flex-wrap gap-4">
            <Card
                label="Expedientes abiertos"
                value={kpis.totalInvoiced}
                onClick={() => !loading && onDrillDown('openCases')}
                loading={loading}
            />
            <Card
                label="Facturas pendientes"
                value={kpis.totalPending}
                onClick={() => !loading && onDrillDown('pendingInvoices')}
                color="text-amber-600"
                loading={loading}
            />
            <Card
                label="Saldo contable"
                value={saldoContable}
                onClick={() => !loading && onDrillDown('contableBalance')}
                color="text-slate-700"
                loading={loading}
            />
        </div>
    );
};

export default KPICards;

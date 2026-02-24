import React, { useMemo } from 'react';
import { CaseRecord } from '@/types';
import {
    calculateCaseStats,
    calculateRevenueStats,
    getTopClients,
    formatCurrency,
    calculatePercentageChange
} from '@/services/analyticsService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, Clock } from 'lucide-react';

interface AnalyticsDashboardProps {
    cases: CaseRecord[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const StatsCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
}> = ({ title, value, change, icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-sky-500/30 transition-all duration-300">
        <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-300 ${color}`}>
                {icon}
            </div>
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</span>
        </div>
        <div className="text-3xl font-black text-slate-900 leading-tight">{value}</div>
        <div className="mt-2 flex items-center justify-between">
            {change !== undefined ? (
                <div className={`text-[10px] font-bold flex items-center gap-1 ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{Math.abs(change)}% vs mes anterior</span>
                </div>
            ) : (
                <div className="text-[10px] font-bold text-slate-300">{subtitle || 'Métrica histórica'}</div>
            )}
        </div>
    </div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ cases }) => {
    const stats = useMemo(() => calculateCaseStats(cases), [cases]);
    const revenue = useMemo(() => calculateRevenueStats(cases), [cases]);
    const topClients = useMemo(() => getTopClients(cases, 5), [cases]);

    // Prepare data for charts
    const statusData = useMemo(() =>
        Object.entries(stats.byStatus).map(([name, value]) => ({ name, value })),
        [stats.byStatus]
    );

    const prefixData = useMemo(() =>
        Object.entries(stats.byPrefix).map(([name, value]) => ({ name, value })),
        [stats.byPrefix]
    );

    const revenueByPrefixData = useMemo(() =>
        Object.entries(revenue.byPrefix).map(([name, value]) => ({
            name,
            value: Math.round(value)
        })),
        [revenue.byPrefix]
    );

    const caseChange = calculatePercentageChange(stats.thisMonth, stats.lastMonth);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Expedientes"
                    value={stats.total}
                    change={caseChange}
                    icon={<FileText className="w-6 h-6" />}
                    color="bg-sky-500 shadow-lg shadow-sky-500/20"
                />
                <StatsCard
                    title="Ingresos Totales"
                    value={formatCurrency(revenue.total)}
                    icon={<DollarSign className="w-6 h-6" />}
                    color="bg-emerald-500 shadow-lg shadow-emerald-500/20"
                    subtitle="Facturación acumulada"
                />
                <StatsCard
                    title="Tiempo Medio"
                    value={`${stats.avgProcessingTime}d`}
                    icon={<Clock className="w-6 h-6" />}
                    color="bg-amber-500 shadow-lg shadow-amber-500/20"
                    subtitle="Días por expediente"
                />
                <StatsCard
                    title="Nuevos (Mes)"
                    value={stats.thisMonth}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="bg-indigo-500 shadow-lg shadow-indigo-500/20"
                    subtitle="Aperturas recientes"
                />
            </div>

            {/* Main Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribution Charts */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <h3 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest border-l-4 border-sky-500 pl-4">Distribución por Estados</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <h3 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest border-l-4 border-indigo-500 pl-4">Expedientes por Prefijo</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={prefixData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Financial and Client KPIs */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <h3 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Ingresos por Especialidad</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueByPrefixData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        formatter={(value) => formatCurrency(Number(value))}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <h3 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest border-l-4 border-amber-500 pl-4">Principales Clientes</h3>
                        <div className="space-y-4 pt-4">
                            {topClients.map((client, index) => (
                                <div key={client.clientId} className="group flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-all hover:bg-white hover:shadow-md">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{client.clientName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <FileText className="w-3 h-3" /> {client.caseCount} expedientes
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-600">{formatCurrency(client.totalRevenue)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;

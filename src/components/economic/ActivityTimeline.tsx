import React from 'react';
import { TimelineEvent } from '@/hooks/useEconomic';
import {
    FileText,
    Receipt,
    Briefcase,
    File,
    Clock
} from 'lucide-react';

interface Props {
    events: TimelineEvent[];
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

const formatCurrency = (val?: number) => val ? val.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + '€' : '';

const EventIcon = ({ type }: { type: TimelineEvent['type'] }) => {
    switch (type) {
        case 'invoice': return <FileText className="w-4 h-4 text-indigo-500" />;
        case 'deliveryNote': return <Receipt className="w-4 h-4 text-amber-500" />;
        case 'case': return <Briefcase className="w-4 h-4 text-slate-500" />;
        case 'proforma': return <File className="w-4 h-4 text-slate-400" />;
        default: return <Clock className="w-4 h-4 text-slate-300" />;
    }
};

const ActivityTimeline: React.FC<Props> = ({ events }) => {
    if (events.length === 0) {
        return <div className="text-xs text-slate-400 text-center py-4">Sin actividad reciente</div>;
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Histórico
                </h3>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="overflow-y-auto p-5 space-y-6 scrollbar-thin">
                {events.map((ev, i) => (
                    <div key={`${ev.type}-${ev.id}-${i}`} className="flex gap-3 relative">
                        {/* Vertical line connector */}
                        {i !== events.length - 1 && (
                            <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-slate-100" />
                        )}

                        <div className="relative z-10 w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            <EventIcon type={ev.type} />
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight">
                                    {ev.description}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap ml-2">
                                    {formatDate(ev.date)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-1.5">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                    {ev.status}
                                </span>
                                {ev.amount && (
                                    <span className="text-xs font-mono font-medium text-slate-700">
                                        {formatCurrency(ev.amount)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityTimeline;

import React from 'react';
import { Upload, Euro, StickyNote, RefreshCcw } from 'lucide-react';

interface QuickActionsProps {
    onAddDocument: () => void;
    onRegisterPayment: () => void;
    onAddNote: () => void;
    onChangeStatus: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    onAddDocument,
    onRegisterPayment,
    onAddNote,
    onChangeStatus,
}) => {
    return (
        <div className="grid grid-cols-4 gap-4">
            <button
                onClick={onAddDocument}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-[#cfdbe7] rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
                <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                    <Upload size={24} />
                </div>
                <span className="text-[#111418] text-sm font-normal">Añadir Doc</span>
            </button>

            <button
                onClick={onRegisterPayment}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-[#cfdbe7] rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
                <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
                    <Euro size={24} />
                </div>
                <span className="text-[#111418] text-sm font-normal">Registrar Pago</span>
            </button>

            <button
                onClick={onAddNote}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-[#cfdbe7] rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
                <div className="p-3 rounded-full bg-amber-50 text-amber-600">
                    <StickyNote size={24} />
                </div>
                <span className="text-[#111418] text-sm font-normal">Añadir Nota</span>
            </button>

            <button
                onClick={onChangeStatus}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-[#cfdbe7] rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
                <div className="p-3 rounded-full bg-purple-50 text-purple-600">
                    <RefreshCcw size={24} />
                </div>
                <span className="text-[#111418] text-sm font-normal">Cambiar Estado</span>
            </button>
        </div>
    );
};

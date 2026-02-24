
import React from 'react';
import { ArrowLeft, Receipt, Construction } from 'lucide-react';

interface ClientBillingPlaceholderProps {
    clientId?: string;
    onBack: () => void;
}

const ClientBillingPlaceholder: React.FC<ClientBillingPlaceholderProps> = ({ clientId, onBack }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 animate-in fade-in duration-300">
            <div className="max-w-5xl mx-auto w-full flex flex-col items-center justify-center flex-1">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center max-w-lg w-full">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                        <Receipt size={32} />
                    </div>

                    <h1 className="text-xl font-bold text-slate-900 mb-2">Facturación del cliente</h1>

                    <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium mb-6 border border-yellow-100">
                        <Construction size={12} />
                        <span>En desarrollo</span>
                    </div>

                    <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                        Este módulo permitirá gestionar facturas, recibos y cobros asociados al cliente <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded">{clientId || 'ID'}</span>.
                        <br />
                        Próximamente disponible.
                    </p>

                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Volver a Clientes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientBillingPlaceholder;

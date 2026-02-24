import React, { useState } from 'react';
import { FileCategory, Client } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { Check, Search, UserPlus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';

interface CreateCaseWizardProps {
    onComplete: (category: FileCategory, client: Client) => void;
    onCancel: () => void;
    initialCategory?: FileCategory;
}

const STEPS = [
    { id: 'category', title: 'Tipo de Expediente' },
    { id: 'client', title: 'Cliente' },
    { id: 'confirm', title: 'Confirmación' }
];

const CreateCaseWizard: React.FC<CreateCaseWizardProps> = ({ onComplete, onCancel, initialCategory }) => {
    const { savedClients, economicTemplates } = useAppContext();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<FileCategory>(initialCategory || 'GE-MAT');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClientData, setNewClientData] = useState<Client>({
        id: '', nombre: '', surnames: '', firstName: '', nif: '', address: '', city: '', province: '', postalCode: '', phone: '', email: ''
    });

    const filteredClients = savedClients.filter(c =>
        (c.nif || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.surnames || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.firstName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNext = () => {
        if (currentStep === 0 && !selectedCategory) return;
        if (currentStep === 1 && !selectedClient && !isNewClient) return;
        if (currentStep === 1 && isNewClient && (!newClientData.nif || !newClientData.surnames)) return; // Basic validation

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            const clientToUse = isNewClient ? newClientData : selectedClient!;
            onComplete(selectedCategory, clientToUse);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            onCancel();
        }
    };

    const handleClientSelect = (client: Client) => {
        setSelectedClient(client);
        setIsNewClient(false);
    };

    const toggleNewClient = () => {
        setIsNewClient(!isNewClient);
        setSelectedClient(null);
    };

    const getEconomicPreview = () => {
        const template = economicTemplates[selectedCategory] || [];
        const total = template.filter(l => l.included).reduce((sum, l) => sum + l.amount, 0);
        return { template, total };
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar */}
                <div className="bg-slate-800 text-white p-8 md:w-1/3 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-8">Nuevo Expediente</h2>
                        <div className="space-y-6">
                            {STEPS.map((step, index) => (
                                <div key={step.id} className={`flex items-center gap-4 ${index === currentStep ? 'text-white' : 'text-slate-500'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${index === currentStep ? 'border-indigo-500 bg-indigo-500' :
                                        index < currentStep ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                                        }`}>
                                        {index < currentStep ? <Check className="w-5 h-5" /> : <span className="font-bold">{index + 1}</span>}
                                    </div>
                                    <span className="font-medium">{step.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="text-slate-400 text-sm">
                        Gestor de Expedientes Pro
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 md:w-2/3 flex flex-col">
                    <div className="flex-1">
                        {currentStep === 0 && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-xl font-bold text-slate-800">Selecciona el Tipo de Expediente</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {['GE-MAT', 'FI-TRI', 'FI-CONTA'].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat as FileCategory)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${selectedCategory === cat
                                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                                : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className="block font-bold text-lg text-slate-800">{cat}</span>
                                            <span className="text-slate-500 text-sm">
                                                {cat === 'GE-MAT' ? 'Gestión de Matriculaciones y Tráfico' :
                                                    cat === 'FI-TRI' ? 'Gestión Fiscal Trimestral' : 'Contabilidad Financiera'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-xl font-bold text-slate-800">Selecciona el Cliente</h3>

                                {!isNewClient ? (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre o NIF..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div className="h-64 overflow-y-auto border rounded-lg divide-y divide-slate-100">
                                            {filteredClients.map(client => (
                                                <button
                                                    key={client.id}
                                                    onClick={() => handleClientSelect(client)}
                                                    className={`w-full p-3 text-left hover:bg-slate-50 flex justify-between items-center ${selectedClient?.id === client.id ? 'bg-indigo-50' : ''}`}
                                                >
                                                    <div>
                                                        <div className="font-medium text-slate-800">{client.nombre || `${client.surnames || ''}, ${client.firstName || ''}`.trim()}</div>
                                                        <div className="text-sm text-slate-500">{client.nif}</div>
                                                    </div>
                                                    {selectedClient?.id === client.id && <Check className="text-indigo-600 w-5 h-5" />}
                                                </button>
                                            ))}
                                            {filteredClients.length === 0 && (
                                                <div className="p-4 text-center text-slate-500">No se encontraron clientes</div>
                                            )}
                                        </div>

                                        <button
                                            onClick={toggleNewClient}
                                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 font-medium hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                            Crear Nuevo Cliente
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                                <input
                                                    type="text"
                                                    value={newClientData.firstName}
                                                    onChange={(e) => setNewClientData({ ...newClientData, firstName: e.target.value })}
                                                    className="w-full p-2 border rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos</label>
                                                <input
                                                    type="text"
                                                    value={newClientData.surnames}
                                                    onChange={(e) => setNewClientData({ ...newClientData, surnames: e.target.value })}
                                                    className="w-full p-2 border rounded-lg"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">NIF/DNI</label>
                                                <input
                                                    type="text"
                                                    value={newClientData.nif}
                                                    onChange={(e) => setNewClientData({ ...newClientData, nif: e.target.value })}
                                                    className="w-full p-2 border rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleNewClient}
                                            className="text-indigo-600 hover:underline text-sm"
                                        >
                                            Volver a buscar cliente existente
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-xl font-bold text-slate-800">Resumen del Expediente</h3>

                                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Tipo:</span>
                                        <span className="font-medium text-slate-900">{selectedCategory}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Cliente:</span>
                                        <span className="font-medium text-slate-900">
                                            {isNewClient
                                                ? (newClientData.nombre || `${newClientData.surnames || ''}, ${newClientData.firstName || ''}`.trim())
                                                : (selectedClient?.nombre || `${selectedClient?.surnames || ''}, ${selectedClient?.firstName || ''}`.trim())
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-slate-700 mb-2">Modelo Económico a Aplicar</h4>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="p-2 text-left">Concepto</th>
                                                    <th className="p-2 text-right">Importe</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {getEconomicPreview().template.filter(l => l.included).map((line, i) => (
                                                    <tr key={i}>
                                                        <td className="p-2">{line.concept}</td>
                                                        <td className="p-2 text-right font-mono">{line.amount.toFixed(2)}€</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-50 font-bold">
                                                    <td className="p-2">Total Estimado</td>
                                                    <td className="p-2 text-right">{getEconomicPreview().total.toFixed(2)}€</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">* Podrás modificar estos valores una vez creado el expediente.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between pt-4 border-t border-slate-200">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            icon={ArrowLeft}
                        >
                            {currentStep === 0 ? 'Cancelar' : 'Atrás'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleNext}
                            disabled={currentStep === 1 && !selectedClient && !isNewClient}
                            icon={currentStep === STEPS.length - 1 ? undefined : ArrowRight}
                            iconPosition="right"
                        >
                            {currentStep === STEPS.length - 1 ? 'Crear expediente' : 'Siguiente'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCaseWizard;

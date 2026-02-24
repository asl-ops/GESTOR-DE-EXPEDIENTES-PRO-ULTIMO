
import React, { useState, useEffect } from 'react';
import { EconomicTemplates, AppSettings, FileCategory, FieldDefinition } from '../types';
import { XMarkIcon, PlusCircleIcon, TrashIcon, CogIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { Button } from './ui/Button';
import ConfirmationModal from './ConfirmationModal';
import { PremiumNumericInput } from './ui/PremiumNumericInput';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ActiveTab = 'general' | 'despacho' | 'tipos' | 'campos' | 'situaciones' | 'economia';

const PLACEHOLDERS = ['{{CLIENT_FULL_NAME}}', '{{CLIENT_NIF}}', '{{CLIENT_ADDRESS}}', '{{ASUNTO}}', '{{GESTOR_NAME}}', '{{GESTOR_DNI}}', '{{GESTOR_COLEGIADO_NUM}}', '{{GESTOR_COLEGIO}}', '{{GESTOR_DESPACHO}}', '{{GESTOR_DESPACHO_DIRECCION}}', '{{CURRENT_CITY}}', '{{CURRENT_DAY}}', '{{CURRENT_MONTH}}', '{{CURRENT_YEAR}}'];

const FILE_CATEGORIES: { id: FileCategory; label: string }[] = [
    { id: 'GE-MAT', label: 'GE-MAT (Tráfico)' },
    { id: 'FI-TRI', label: 'FI-TRI (Fiscal)' },
    { id: 'FI-CONTA', label: 'FI-CONTA (Contable)' }
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { appSettings, updateSettings, economicTemplates, updateEconomicTemplates } = useAppContext();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<ActiveTab>('despacho');
    const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
    const [localTemplates, setLocalTemplates] = useState<EconomicTemplates>({});
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    // State for Config UI
    const [selectedCategory, setSelectedCategory] = useState<FileCategory>('GE-MAT');
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldOptions, setNewFieldOptions] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [newFileType, setNewFileType] = useState('');

    useEffect(() => {
        if (isOpen && appSettings) {
            setLocalSettings(JSON.parse(JSON.stringify(appSettings))); // Deep copy
            setLocalTemplates(JSON.parse(JSON.stringify(economicTemplates)));
            if (Object.keys(economicTemplates).length > 0) setSelectedTemplateKey(Object.keys(economicTemplates)[0]);
        }
    }, [isOpen, appSettings, economicTemplates]);

    if (!isOpen || !localSettings) return null;

    const handleSettingsSave = async () => {
        if (localSettings) {
            await updateSettings(localSettings);
            addToast('Configuración guardada correctamente.', 'success');
        }
    };

    const handleCancel = () => {
        const hasChanges = JSON.stringify(appSettings) !== JSON.stringify(localSettings) ||
            JSON.stringify(economicTemplates) !== JSON.stringify(localTemplates);

        if (hasChanges) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    // --- LOGICA ECONOMIA ---
    const handleTemplateLineChange = (index: number, field: 'concept' | 'amount', value: string | number) => {
        const updated = { ...localTemplates };
        updated[selectedTemplateKey][index] = { ...updated[selectedTemplateKey][index], [field]: value };
        setLocalTemplates(updated); updateEconomicTemplates(updated);
    };
    const handleTemplateLineToggle = (index: number) => {
        const updated = { ...localTemplates };
        updated[selectedTemplateKey][index].included = !updated[selectedTemplateKey][index].included;
        setLocalTemplates(updated); updateEconomicTemplates(updated);
    };
    const handleAddTemplateLine = () => {
        const updated = { ...localTemplates, [selectedTemplateKey]: [...localTemplates[selectedTemplateKey], { concept: '', amount: 0, included: true }] };
        setLocalTemplates(updated); updateEconomicTemplates(updated);
    };

    // --- LOGICA CAMPOS PERSONALIZADOS ---
    const handleAddField = () => {
        if (!newFieldName || !newFieldOptions) {
            addToast('Nombre del campo y opciones requeridos', 'warning');
            return;
        }
        const fieldId = newFieldName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const options = newFieldOptions.split(',').map(s => s.trim()).filter(Boolean);

        const newField: FieldDefinition = { id: fieldId, label: newFieldName, options };

        // Ensure structure exists
        const currentFieldConfigs = localSettings.fieldConfigs || { 'GE-MAT': [], 'FI-TRI': [], 'FI-CONTA': [] };
        const currentCategoryFields = currentFieldConfigs[selectedCategory] || [];

        const updatedConfigs = {
            ...currentFieldConfigs,
            [selectedCategory]: [...currentCategoryFields, newField]
        };

        setLocalSettings({ ...localSettings, fieldConfigs: updatedConfigs });
        setNewFieldName('');
        setNewFieldOptions('');
        addToast('Campo añadido. Pulsa Guardar para confirmar.', 'info');
    };

    const handleRemoveField = (category: FileCategory, fieldId: string) => {
        const updatedConfigs = { ...localSettings.fieldConfigs };
        updatedConfigs[category] = updatedConfigs[category].filter(f => f.id !== fieldId);
        setLocalSettings({ ...localSettings, fieldConfigs: updatedConfigs });
    };

    // --- LOGICA SITUACIONES ---
    const handleAddStatus = () => {
        if (!newStatus.trim()) return;
        if (localSettings.caseStatuses.includes(newStatus)) {
            addToast('Este estado ya existe.', 'warning');
            return;
        }
        setLocalSettings({
            ...localSettings,
            caseStatuses: [...localSettings.caseStatuses, newStatus.trim()]
        });
        setNewStatus('');
    };

    const handleRemoveStatus = (status: string) => {
        setLocalSettings({
            ...localSettings,
            caseStatuses: localSettings.caseStatuses.filter(s => s !== status)
        });
    };

    // --- LOGICA TIPOS / MODALIDADES ---
    const handleAddFileType = () => {
        if (!newFileType.trim()) return;
        const currentTypes = localSettings.fileTypes[selectedCategory] || [];
        if (currentTypes.includes(newFileType)) return;

        const updatedFileTypes = { ...localSettings.fileTypes };
        updatedFileTypes[selectedCategory] = [...currentTypes, newFileType.trim()];

        setLocalSettings({ ...localSettings, fileTypes: updatedFileTypes });
        setNewFileType('');
    };

    const handleRemoveFileType = (type: string) => {
        const updatedFileTypes = { ...localSettings.fileTypes };
        updatedFileTypes[selectedCategory] = updatedFileTypes[selectedCategory].filter(t => t !== type);
        setLocalSettings({ ...localSettings, fileTypes: updatedFileTypes });
    };


    const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
        <button onClick={() => setActiveTab(tabName)} className={`app-tab ${activeTab === tabName ? 'app-tab-active' : ''}`}>{label}</button>
    );

    const CategorySelector = () => (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {FILE_CATEGORIES.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap ${selectedCategory === cat.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
                >
                    {cat.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCancel}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b bg-slate-50 rounded-t-xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-200 p-2 rounded-lg text-slate-600"><CogIcon /></div>
                        <div>
                            <h2 className="text-xl font-normal text-slate-800">Configuración de Responsable</h2>
                            <p className="text-xs text-slate-500">Gestiona datos de la gestoría, modelos económicos y tipos.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleSettingsSave}
                            variant="primary"
                            size="lg"
                        >
                            Guardar Cambios
                        </Button>
                        <button onClick={handleCancel} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"><XMarkIcon /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b flex-shrink-0">
                    <div className="flex space-x-2 overflow-x-auto px-6">
                        <TabButton tabName="despacho" label="Datos Despacho" />
                        <TabButton tabName="general" label="General / Mandato" />
                        <TabButton tabName="situaciones" label="Estados" />
                        <TabButton tabName="tipos" label="Tipos" />
                        <TabButton tabName="campos" label="Campos" />
                        <TabButton tabName="economia" label="Modelo Económico Base" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow bg-slate-50/50">

                    {/* DATOS DESPACHO */}
                    {activeTab === 'despacho' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto">
                            <h3 className="section-title">Datos de la Gestoría / Responsable</h3>
                            <p className="text-sm text-slate-600 mb-6">Estos datos se utilizarán automáticamente en los contratos y mandatos generados.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Razón Social</label>
                                    <input type="text" value={localSettings.agency.name} onChange={e => setLocalSettings({ ...localSettings, agency: { ...localSettings.agency, name: e.target.value } })} className="w-full px-3 py-2 border rounded-md focus:ring-sky-500 focus:border-sky-500" placeholder="Ej: Gestoría Pérez S.L." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CIF / NIF Despacho</label>
                                    <input type="text" value={localSettings.agency.cif} onChange={e => setLocalSettings({ ...localSettings, agency: { ...localSettings.agency, cif: e.target.value } })} className="w-full px-3 py-2 border rounded-md focus:ring-sky-500 focus:border-sky-500" placeholder="Ej: B12345678" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Completa</label>
                                    <input type="text" value={localSettings.agency.address} onChange={e => setLocalSettings({ ...localSettings, agency: { ...localSettings.agency, address: e.target.value } })} className="w-full px-3 py-2 border rounded-md focus:ring-sky-500 focus:border-sky-500" placeholder="Ej: C/ Mayor 1, 1ºA, 28001 Madrid" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Gestor/a Colegiado/a</label>
                                    <input type="text" value={localSettings.agency.managerName} onChange={e => setLocalSettings({ ...localSettings, agency: { ...localSettings.agency, managerName: e.target.value } })} className="w-full px-3 py-2 border rounded-md focus:ring-sky-500 focus:border-sky-500" placeholder="Ej: María López García" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nº Colegiado</label>
                                    <input type="text" value={localSettings.agency.managerColegiado} onChange={e => setLocalSettings({ ...localSettings, agency: { ...localSettings.agency, managerColegiado: e.target.value } })} className="w-full px-3 py-2 border rounded-md focus:ring-sky-500 focus:border-sky-500" placeholder="Ej: 12345" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">DNI Gestor</label>
                                    <input type="text" value={localSettings.agency.managerDni} onChange={e => setLocalSettings({ ...localSettings, agency: { ...localSettings.agency, managerDni: e.target.value } })} className="w-full px-3 py-2 border rounded-md focus:ring-sky-500 focus:border-sky-500" placeholder="Ej: 50123456K" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GENERAL Y MANDATO */}
                    {activeTab === 'general' && (
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="section-title">Numeración y Rutas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Contador Expediente</label>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-slate-500 bg-slate-100 px-2 py-2 rounded-l border border-r-0">EXP-</span>
                                            <PremiumNumericInput
                                                value={localSettings.fileCounter}
                                                onChange={val => setLocalSettings({ ...localSettings, fileCounter: val })}
                                                className="flex-1 px-3 py-2 border rounded-r-md"
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Siguiente número a asignar.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Ruta Base de Guardado</label>
                                        <input type="text" value={localSettings.generalSavePath} onChange={e => setLocalSettings({ ...localSettings, generalSavePath: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                        <p className="text-xs text-slate-500 mt-1">Carpeta local o de red para ficheros.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="section-title">Plantilla del Mandato</h3>
                                <textarea rows={15} value={localSettings.mandatoBody} onChange={e => setLocalSettings({ ...localSettings, mandatoBody: e.target.value })} className="w-full font-mono text-xs p-4 border rounded-md bg-slate-50 focus:ring-2 focus:ring-sky-500 outline-none" />
                                <div className="mt-4 bg-yellow-50 p-3 rounded-md border border-yellow-100">
                                    <p className="text-xs font-bold text-yellow-800 mb-2">Variables Disponibles:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PLACEHOLDERS.map(p => <code key={p} className="bg-white px-2 py-1 rounded text-[10px] border text-slate-600 select-all cursor-pointer hover:border-sky-400">{p}</code>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SITUACIONES */}
                    {activeTab === 'situaciones' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-3xl mx-auto">
                            <h3 className="section-title">Configuración de Situaciones</h3>
                            <p className="text-sm text-slate-600 mb-6">Define los estados por los que puede pasar un expediente. El orden aquí determinará el orden en los desplegables.</p>

                            <div className="flex gap-2 mb-4">
                                <input type="text" value={newStatus} onChange={e => setNewStatus(e.target.value)} placeholder="Nueva situación (ej. Pendiente Firma)" className="flex-1 px-3 py-2 border rounded-md" onKeyDown={e => e.key === 'Enter' && handleAddStatus()} />
                                <Button onClick={handleAddStatus} variant="create" size="sm" icon={PlusCircleIcon} />
                            </div>

                            <ul className="space-y-2">
                                {localSettings.caseStatuses.map((status, idx) => (
                                    <li key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-md border border-slate-100 group hover:border-slate-300 transition-colors">
                                        <span className="font-normal text-slate-700">{status}</span>
                                        <button onClick={() => handleRemoveStatus(status)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* TIPOS DE EXPEDIENTE */}
                    {activeTab === 'tipos' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto">
                            <h3 className="section-title">Modalidades por Tipo</h3>
                            <p className="text-sm text-slate-600 mb-4">Configura los subtipos disponibles (ej. Matriculación, Baja) para cada categoría principal.</p>
                            <CategorySelector />

                            <div className="mt-6">
                                <div className="flex gap-2 mb-4">
                                    <input type="text" value={newFileType} onChange={e => setNewFileType(e.target.value)} placeholder={`Nueva modalidad para ${selectedCategory}...`} className="flex-1 px-3 py-2 border rounded-md" onKeyDown={e => e.key === 'Enter' && handleAddFileType()} />
                                    <Button onClick={handleAddFileType} variant="create" size="sm" icon={PlusCircleIcon} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(localSettings.fileTypes[selectedCategory] || []).map((type, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-md border border-slate-200">
                                            <span className="text-sm text-slate-700">{type}</span>
                                            <button onClick={() => handleRemoveFileType(type)} className="text-slate-400 hover:text-red-500"><TrashIcon /></button>
                                        </div>
                                    ))}
                                    {(localSettings.fileTypes[selectedCategory] || []).length === 0 && <p className="text-sm text-slate-400 italic col-span-2 text-center py-4">No hay modalidades definidas.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CAMPOS PERSONALIZADOS */}
                    {activeTab === 'campos' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto">
                            <h3 className="section-title">Campos Personalizados</h3>
                            <p className="text-sm text-slate-600 mb-4">Define qué desplegables extra aparecen en la ficha del expediente.</p>
                            <CategorySelector />

                            <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 mb-6">
                                <h4 className="text-sm font-bold text-sky-800 mb-3 uppercase">Añadir Nuevo Campo</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-sky-700 mb-1">Nombre (Etiqueta)</label>
                                        <input type="text" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} placeholder="Ej: Tipo de Impuesto" className="w-full px-3 py-2 border border-sky-200 rounded-md text-sm focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-sky-700 mb-1">Opciones (separadas por comas)</label>
                                        <input type="text" value={newFieldOptions} onChange={e => setNewFieldOptions(e.target.value)} placeholder="Ej: IVA, IRPF, IS" className="w-full px-3 py-2 border border-sky-200 rounded-md text-sm focus:ring-sky-500" />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAddField}
                                    variant="create"
                                    className="w-full md:w-auto"
                                    icon={PlusCircleIcon}
                                >
                                    Añadir Campo
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-700 border-b pb-2">Campos Actuales ({localSettings.fieldConfigs?.[selectedCategory]?.length || 0})</h4>
                                {localSettings.fieldConfigs?.[selectedCategory]?.map(field => (
                                    <div key={field.id} className="flex items-start justify-between bg-white p-4 rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-bold text-slate-800">{field.label}</p>
                                            <p className="text-xs text-slate-500 mt-1 font-mono bg-slate-100 inline-block px-1 rounded">ID: {field.id}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {field.options.map(opt => <span key={opt} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">{opt}</span>)}
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveField(selectedCategory, field.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ECONOMIA */}
                    {activeTab === 'economia' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="section-title">Plantillas Económicas (Modelo Base)</h3>
                            <div className="mb-4">
                                <label htmlFor="template-select" className="block text-sm font-medium text-slate-700 mb-1">Selecciona modalidad para editar:</label>
                                <select id="template-select" value={selectedTemplateKey} onChange={e => setSelectedTemplateKey(e.target.value)} className="w-full px-3 py-2 border rounded-md max-w-md">
                                    {Object.keys(localTemplates).map(key => (<option key={key} value={key}>{key}</option>))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Los importes que definas aquí se copiarán automáticamente al crear un nuevo expediente de este tipo.</p>
                            </div>
                            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                {localTemplates[selectedTemplateKey]?.map((line, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-1 flex items-center justify-center">
                                            <input type="checkbox" checked={line.included} onChange={() => handleTemplateLineToggle(index)} className="h-5 w-5 rounded border-slate-400 text-sky-600 focus:ring-sky-500" title={line.included ? 'Activado' : 'Desactivado'} />
                                        </div>
                                        <div className="col-span-7">
                                            <input type="text" placeholder="Concepto" value={line.concept} onChange={e => handleTemplateLineChange(index, 'concept', e.target.value)} className={`w-full px-2 py-1 border rounded-md ${!line.included && 'opacity-60 bg-slate-100'}`} />
                                        </div>
                                        <div className="col-span-4">
                                            <PremiumNumericInput
                                                placeholder="Importe"
                                                value={line.amount || 0}
                                                onChange={val => handleTemplateLineChange(index, 'amount', val)}
                                                className={`w-full px-2 py-1 border rounded-md ${!line.included && 'opacity-60 bg-slate-100'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    onClick={handleAddTemplateLine}
                                    variant="outline"
                                    className="w-full mt-4"
                                    icon={PlusCircleIcon}
                                >
                                    Añadir Concepto
                                </Button>
                            </div>
                        </div>
                    )}

                </div>

                <ConfirmationModal
                    isOpen={showConfirmClose}
                    title="Configuración sin guardar"
                    message="Has realizado cambios en la configuración. ¿Deseas guardarlos antes de salir para no perder los ajustes?"
                    confirmText="Guardar y salir"
                    secondaryText="Descartar y salir"
                    cancelText="Seguir editando"
                    variant="primary"
                    onClose={() => setShowConfirmClose(false)}
                    onConfirm={async () => {
                        await handleSettingsSave();
                        onClose();
                    }}
                    secondaryAction={onClose}
                />
            </div>
        </div>
    );
};

export default SettingsModal;

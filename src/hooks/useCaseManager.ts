import { useState, useEffect, useCallback } from 'react';
import {
    CaseRecord, AttachedDocument, Task, CaseStatus, FileCategory,
    MovimientoExpediente, RegimenIVA, Client, Vehicle, EconomicData,
    Communication, FileConfig
} from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { classifyAndRenameDocument } from '@/services/geminiService';

import {
    getInitialClient, getInitialVehicle, getInitialEconomicData,
    getInitialCommunicationsData, getInitialFileConfig, getFileNumber
} from '@/utils/initializers';
import { roundToTwo, calculateIVA } from '@/utils/fiscalUtils';

// ... existing code ...

export const useCaseManager = () => {
    const {
        currentUser, economicTemplates, saveCase, saveClient,
        savedClients, caseHistory
    } = useAppContext();
    const { addToast } = useToast();

    const [client, setClient] = useState<Client>(getInitialClient());
    const [clienteId, setClienteId] = useState<string | null>(null);
    const [clientSnapshot, setClientSnapshot] = useState<{
        nombre: string;
        documento?: string;
        telefono?: string;
        email?: string;
    } | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle>(getInitialVehicle());
    const [economicData, setEconomicData] = useState<EconomicData>(getInitialEconomicData());
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [attachments, setAttachments] = useState<AttachedDocument[]>([]);
    const [fileConfig, setFileConfig] = useState<FileConfig>({ fileType: '', category: 'GE-MAT', responsibleUserId: '', customValues: {} });
    const [fileNumber, setFileNumber] = useState('');
    const [description, setDescription] = useState<string>('');  // Nueva descripción del expediente
    const [caseStatus, setCaseStatus] = useState<CaseStatus>('Pendiente Documentación');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [movimientos, setMovimientos] = useState<MovimientoExpediente[]>([]);
    const [createdAt, setCreatedAt] = useState<string>('');

    const [isClassifying, setIsClassifying] = useState(false);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 🆕 Sincronizar datos del cliente desde el catálogo global si tenemos ID
    // Esto asegura que si el expediente solo tiene clienteId, cargamos sus metadatos (Nombre, NIF, DNI)
    // para que componentes como el generador de Mandatos funcionen siempre.
    useEffect(() => {
        if (clienteId && savedClients.length > 0) {
            const foundClient = savedClients.find(c => c.id === clienteId || (c.nif && c.nif === clienteId) || (c.documento && c.documento === clienteId));
            if (foundClient) {
                // Mapear el nuevo formato (nombre) al formato que espera este hook (firstName, surnames)
                // si los campos están vacíos
                setClient(prev => {
                    // Evitar bucles de actualización si ya son iguales
                    if (prev.id === foundClient.id && (prev.nif === (foundClient.nif || foundClient.documento))) {
                        return prev;
                    }

                    const nombreCompuesto = foundClient.nombre || `${foundClient.firstName || ''} ${foundClient.surnames || ''}`.trim();

                    return {
                        ...prev,
                        id: foundClient.id,
                        firstName: foundClient.firstName || (nombreCompuesto.includes(',') ? nombreCompuesto.split(',')[1]?.trim() : nombreCompuesto),
                        surnames: foundClient.surnames || (nombreCompuesto.includes(',') ? nombreCompuesto.split(',')[0]?.trim() : ''),
                        nif: foundClient.nif || foundClient.documento || '',
                        address: foundClient.direccion || '',
                        city: foundClient.poblacion || '',
                        phone: foundClient.telefono || '',
                        email: foundClient.email || '',
                        administrators: foundClient.administrators || []
                    };
                });
            }
        }
    }, [clienteId, savedClients]);



    const applyEconomicTemplate = useCallback((templateKey: string, showToast: boolean = true) => {
        const template = economicTemplates[templateKey];
        const newLines = template ? template.filter((line: any) => line.included).map((line: any, index: number) => ({
            id: `line_${Date.now()}_${index}`,
            conceptId: `concept_${Date.now()}_${index}`,
            concept: line.concept,
            type: 'honorario' as const,
            amount: line.amount
        })) : [];
        setEconomicData((prev: EconomicData) => ({ ...prev, lines: newLines }));
        if (template && showToast) {
            addToast(`Plantilla para "${templateKey}" aplicada.`, 'info');
        }
    }, [economicTemplates, addToast]);

    const clearForm = useCallback((newCounter?: number, category?: FileCategory | null) => {
        if (!currentUser) return;
        setClient(getInitialClient());
        setClienteId(null);
        setClientSnapshot(null);
        setVehicle(getInitialVehicle());
        setCommunications(getInitialCommunicationsData(currentUser.id));
        setAttachments([]);
        setTasks([]);
        setMovimientos([]);

        if (category) {
            const initialConfig = getInitialFileConfig(currentUser.id, category);
            setFileConfig(initialConfig);
            applyEconomicTemplate(initialConfig.fileType, false);
        }

        setCaseStatus('Pendiente Documentación');
        setDescription('');  // Limpiar descripción
        if (newCounter !== undefined) {
            setFileNumber(getFileNumber(newCounter));
        }
        setCreatedAt('');
    }, [currentUser, applyEconomicTemplate]);

    const loadCaseData = useCallback((caseToLoad: CaseRecord, isDuplication: boolean = false) => {
        setFileNumber(isDuplication ? 'new' : caseToLoad.fileNumber);
        setClient(caseToLoad.client);
        setClienteId(caseToLoad.clienteId || null);
        setClientSnapshot(caseToLoad.clientSnapshot || null);
        setVehicle(caseToLoad.vehicle);
        // Reset metadata for duplication
        const baseConfig = {
            ...caseToLoad.fileConfig,
            category: caseToLoad.fileConfig.category || 'GE-MAT',
            customValues: caseToLoad.fileConfig.customValues || {}
        };

        if (isDuplication) {
            // @ts-ignore - custom properties not in interface yet
            baseConfig.openingDate = new Date().toISOString();
            // @ts-ignore
            baseConfig.closedAt = undefined;
            // @ts-ignore
            baseConfig.situation = 'Iniciado';
        }

        setFileConfig(baseConfig);
        const filteredEconomicData = isDuplication ? {
            ...caseToLoad.economicData,
            lines: caseToLoad.economicData.lines.filter(l => !l.id.startsWith('pay-'))
        } : caseToLoad.economicData;

        setEconomicData(filteredEconomicData);
        setCommunications(isDuplication ? [] : caseToLoad.communications);
        setAttachments(isDuplication ? [] : (caseToLoad.attachments || []));
        setCaseStatus(isDuplication ? 'Pendiente Documentación' : caseToLoad.status);
        setDescription(caseToLoad.description || '');  // Cargar descripción
        setTasks(isDuplication ? [] : (caseToLoad.tasks || []));
        setMovimientos(isDuplication ? [] : (caseToLoad.movimientos || []));
        setCreatedAt(isDuplication ? '' : caseToLoad.createdAt);
    }, []);

    const handleSaveAndReturn = async (currentTasks: Task[], forcedFileNumber?: string) => {
        if (!currentUser) return false;

        // Determinar si tenemos datos suficientes (nombre e identificador)
        const name = clientSnapshot?.nombre || client.surnames || client.firstName;
        const hasIdentifier = !!clienteId || !!client.nif;

        if (!name || !hasIdentifier) {
            addToast('Se requieren datos de cliente (Nombre e Identificador/DNI) para guardar.', 'error');
            return false;
        }

        setIsSaving(true);

        try {
            let finalFileNumber = fileNumber;
            if (forcedFileNumber) {
                finalFileNumber = forcedFileNumber;
            } else if (!finalFileNumber || finalFileNumber === 'new') {
                // Intentar usar el sistema de prefijos transaccional
                try {
                    const { getPrefixes, getPrefixNextNumber } = await import('@/services/prefixService');
                    const prefixes = await getPrefixes();
                    const targetPrefix = prefixes.find(p => p.code === fileConfig.category);

                    if (targetPrefix) {
                        const nextNumResult = await getPrefixNextNumber(targetPrefix.id);
                        finalFileNumber = `${targetPrefix.code}-${nextNumResult.formattedNumber}`;
                    } else {
                        // Fallback: Buscar el número máximo entre TODOS los expedientes (como antes)
                        console.warn(`Prefijo ${fileConfig.category} no encontrado. Usando fallback.`);
                        const allNumbers = caseHistory
                            .map(c => {
                                const match = c.fileNumber.match(/-(\d+)$/);
                                return match ? parseInt(match[1], 10) : 0;
                            })
                            .filter(num => num > 0);

                        const maxNumber = allNumbers.length > 0 ? Math.max(...allNumbers) : 0;
                        const newCounter = maxNumber + 1;
                        finalFileNumber = `EXP-${String(newCounter).padStart(4, '0')}`;
                    }
                } catch (err) {
                    console.error('Error al generar número de expediente transaccional:', err);
                    throw err;
                }
            }
            setFileNumber(finalFileNumber);

            const currentCaseData: CaseRecord = {
                fileNumber: finalFileNumber,
                client,
                clienteId,  // 🆕 Guardar referencia a cliente
                clientSnapshot,  // 🆕 Guardar snapshot del cliente
                vehicle,
                fileConfig,
                description,
                economicData,
                communications,
                attachments,
                status: caseStatus,
                tasks: currentTasks,
                movimientos: movimientos,
                createdAt: createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Función auxiliar para limpiar undefined de objetos (Firestore no los acepta)
            const cleanUndefined = (obj: any): any => {
                const newObj: any = Array.isArray(obj) ? [] : {};
                Object.keys(obj).forEach(key => {
                    const value = obj[key];
                    if (value === undefined) return;
                    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
                        newObj[key] = cleanUndefined(value);
                    } else {
                        newObj[key] = value;
                    }
                });
                return newObj;
            };

            const cleanCaseData = cleanUndefined(currentCaseData);

            const { success } = await saveCase(cleanCaseData);
            if (success) {
                if (name && client.nif && !savedClients.some((c: Client) => c.nif === client.nif)) {
                    const newClient = { ...client, id: `cli_${Date.now()} ` };
                    await saveClient(newClient);
                }
            }
            return success;
        } catch (error) {
            console.error('Error al guardar expediente:', error);
            addToast('Error inesperado al guardar el expediente', 'error');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddDocuments = useCallback(async (files: File[]) => {
        if (files.length === 0) return;
        setIsClassifying(true);
        try {
            const newDocs = await Promise.all(files.map(async (file) => {
                const { name, category } = await classifyAndRenameDocument(file, fileNumber, client, vehicle);
                return {
                    id: `doc-${Date.now()}-${Math.random()}`,
                    file,
                    name,
                    category,
                    type: file.type,
                    size: file.size,
                    status: 'local' as const,
                    createdAt: new Date().toISOString()
                };
            }));
            setAttachments((prev: AttachedDocument[]) => [...prev, ...newDocs]);
            addToast(`${newDocs.length} documento(s) clasificado(s) y añadido(s).`, 'info');
        } catch (error: any) {
            addToast(error.message.includes('API Key') ? error.message : 'Error al clasificar documentos.', 'error');
            setAttachments((prev: AttachedDocument[]) => [...prev, ...files.map(file => ({
                id: `doc-${Date.now()}-${Math.random()}`,
                file,
                name: file.name,
                category: 'Sin clasificar',
                type: file.type,
                size: file.size,
                status: 'local' as const,
                createdAt: new Date().toISOString()
            }))]);
        } finally {
            setIsClassifying(false);
        }
    }, [addToast, client, fileNumber, vehicle]);

    const handleFileConfigChange = (newConfig: FileConfig) => {
        const fileTypeChanged = newConfig.fileType !== fileConfig.fileType;
        setFileConfig(newConfig);
        if (fileTypeChanged) {
            const hasUserData = economicData.lines.some((l: any) => l.concept || l.amount > 0);
            if (!hasUserData) {
                applyEconomicTemplate(newConfig.fileType, false);
            }
        }
    };

    const handleUpdateTaskStatus = async (fileNumberToUpdate: string, taskId: string, isCompleted: boolean) => {
        const caseToUpdate = caseHistory.find((c: CaseRecord) => c.fileNumber === fileNumberToUpdate);
        if (!caseToUpdate) return;

        const updatedTasks = caseToUpdate.tasks.map((task: Task) =>
            task.id === taskId ? { ...task, isCompleted } : task
        );

        const { success } = await saveCase({ ...caseToUpdate, tasks: updatedTasks });
        if (success) addToast(`Tarea actualizada en ${fileNumberToUpdate}.`, 'success');
    };

    const deleteCase = async (fileNumberToDelete: string) => {
        if (!currentUser) return;
        const caseToDelete = caseHistory.find((c: CaseRecord) => c.fileNumber === fileNumberToDelete);
        if (!caseToDelete) return;

        const auditLog: Communication = {
            id: `audit-${Date.now()}`,
            date: new Date().toISOString(),
            concept: `Expediente eliminado por ${currentUser.name}`,
            authorUserId: currentUser.id
        };

        const updatedCase: CaseRecord = {
            ...caseToDelete,
            status: 'Eliminado',
            communications: [...caseToDelete.communications, auditLog],
            updatedAt: new Date().toISOString()
        };

        const { success } = await saveCase(updatedCase);
        if (success) addToast(`Expediente ${fileNumberToDelete} eliminado.`, 'success');
    };

    // 🆕 Sincronizar movimientos -> EconomicData (totales) - FUENTE DE VERDAD
    useEffect(() => {
        if (!movimientos.length) return;

        let subtotal = 0;
        let vat = 0;

        movimientos.forEach(m => {
            const amt = roundToTwo(m.importe || 0);
            subtotal = roundToTwo(subtotal + amt);
            if (m.regimenIva === RegimenIVA.SUJETO && m.facturable) {
                vat = roundToTwo(vat + calculateIVA(amt, m.ivaPorcentaje || 21));
            }
        });

        const total = roundToTwo(subtotal + vat);

        // Sync lines for legacy billing compatibility
        const legacyLines = movimientos.map(m => ({
            id: m.id,
            conceptId: m.movimientoId,
            concept: m.descripcionOverride || '',
            type: m.facturable ? 'honorario' as const : 'suplido' as const,
            amount: m.importe || 0
        }));

        // Solo actualizar si hay diferencia real significativa
        if (
            Math.abs(economicData.subtotalAmount - subtotal) > 0.001 ||
            Math.abs(economicData.vatAmount - vat) > 0.001 ||
            Math.abs(economicData.totalAmount - total) > 0.001 ||
            economicData.lines.length !== legacyLines.length
        ) {
            setEconomicData(prev => ({
                ...prev,
                lines: legacyLines,
                subtotalAmount: subtotal,
                vatAmount: vat,
                totalAmount: total
            }));
        }
    }, [movimientos, economicData.subtotalAmount, economicData.vatAmount, economicData.totalAmount, economicData.lines.length]);

    return {
        client, setClient,
        clienteId, setClienteId,
        clientSnapshot, setClientSnapshot,
        vehicle, setVehicle,
        economicData, setEconomicData,
        movimientos, setMovimientos,
        communications, setCommunications,
        attachments, setAttachments,
        fileConfig, setFileConfig, handleFileConfigChange,
        fileNumber,
        description, setDescription,  // Exportar descripción
        caseStatus, setCaseStatus,
        tasks, setTasks,
        createdAt,
        isClassifying,
        isBatchProcessing, setIsBatchProcessing,
        isSaving,
        clearForm,
        loadCaseData,
        handleSaveAndReturn,
        handleAddDocuments,
        handleUpdateTaskStatus,
        deleteCase
    };
};

import html2pdf from 'html2pdf.js';
import { MandateData } from '@/types/mandate';
import { Administrator, Client, AppSettings } from '@/types';

// ...

export const prepareMandateData = (
    client: Client,
    asuntoLinea1: string,
    asuntoLinea2: string,
    appSettings: AppSettings,
    selectedAdministrator?: Administrator
): MandateData | null => {
    const mandatarioConfig = appSettings.mandatarioConfig;

    if (!mandatarioConfig) {
        console.error('No hay configuración de mandatario');
        return null;
    }

    // Parsear la dirección del cliente
    const addressParts = parseClientAddress(client);

    const mandateData: MandateData = {
        mandante: {
            nombre: (client.firstName || client.surnames) ? `${client.firstName || ''} ${client.surnames || ''}`.trim() : (client as any).nombre || '',
            dni: client.nif || (client as any).documento || '',
            domicilio: {
                poblacion: client.city || addressParts.poblacion,
                calle: addressParts.calle,
                numero: addressParts.numero,
                cp: client.postalCode || '',
            },
            representante: selectedAdministrator ? {
                nombre: `${selectedAdministrator.firstName} ${selectedAdministrator.surnames}`,
                dni: selectedAdministrator.nif
            } : undefined,
            empresa: selectedAdministrator ? `${client.firstName} ${client.surnames}` : undefined,
            cif: selectedAdministrator ? client.nif : undefined,
        },
        mandatario: {
            nombre_1: mandatarioConfig.nombre_1,
            dni_1: mandatarioConfig.dni_1,
            col_1: mandatarioConfig.col_1,
            nombre_2: mandatarioConfig.nombre_2,
            dni_2: mandatarioConfig.dni_2,
            col_2: mandatarioConfig.col_2,
            colegio: mandatarioConfig.colegio,
            despacho: mandatarioConfig.despacho,
            domicilio: mandatarioConfig.domicilio,
        },
        asunto: {
            linea_1: asuntoLinea1,
            linea_2: asuntoLinea2,
        },
        firma: {
            lugar: client.city || mandatarioConfig.domicilio.poblacion,
            fecha: new Date(),
        },
    };

    return mandateData;
};

/**
 * Parsea la dirección del cliente para extraer calle y número
 */
const parseClientAddress = (client: Client): { calle: string; numero: string; poblacion: string } => {
    const address = client.address || '';

    // Intentar extraer número de la dirección
    const numeroMatch = address.match(/\d+/);
    const numero = numeroMatch ? numeroMatch[0] : 's/n';

    // Extraer la calle (todo menos el número)
    const calle = address.replace(/\d+/g, '').trim();

    return {
        calle: calle || address,
        numero,
        poblacion: client.city || '',
    };
};

/**
 * Genera un PDF del mandato a partir del elemento HTML
 */
export const generateMandatePDF = async (
    elementId: string,
    fileName: string
): Promise<Blob> => {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error(`No se encontró el elemento con ID: ${elementId}`);
    }

    const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait' as const
        },
    };

    try {
        // Generar el PDF y obtener el blob
        const pdf = await html2pdf().set(options).from(element).output('blob');
        return pdf;
    } catch (error) {
        console.error('Error generando PDF:', error);
        throw new Error('Error al generar el PDF del mandato');
    }
};

/**
 * Genera un PDF a partir de un elemento HTML genérico
 */
export const generatePdfFromElement = async (
    element: HTMLElement,
    fileName: string,
    optionsOverride: any = {}
): Promise<Blob> => {
    const defaultOptions = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
    };

    const options = { ...defaultOptions, ...optionsOverride };

    try {
        return await html2pdf().set(options).from(element).output('blob');
    } catch (error) {
        console.error('Error generando PDF genérico:', error);
        throw new Error('Error al generar el PDF');
    }
};

/**
 * Descarga el PDF generado
 */
export const downloadMandatePDF = async (
    elementId: string,
    fileName: string
): Promise<void> => {
    const element = document.getElementById(elementId);

    if (!element) {
        throw new Error(`No se encontró el elemento con ID: ${elementId}`);
    }

    const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait' as const
        },
    };

    try {
        await html2pdf().set(options).from(element).save();
    } catch (error) {
        console.error('Error descargando PDF:', error);
        throw new Error('Error al descargar el PDF del mandato');
    }
};

/**
 * Genera el nombre del archivo para el mandato
 */
export const generateMandateFileName = (
    clientName: string,
    fileNumber: string
): string => {
    const date = new Date().toISOString().split('T')[0];
    const cleanName = clientName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    return `Mandato_${cleanName}_${fileNumber}_${date}.pdf`;
};

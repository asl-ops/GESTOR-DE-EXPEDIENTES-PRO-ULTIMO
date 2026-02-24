import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Client, Vehicle, Communication, User, Task } from "@/types";

// Initialize GoogleGenerativeAI with API key
// Initialize GoogleGenerativeAI with API key
const getApiKey = () => {
  const key = process.env.API_KEY ||
    ((import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) ||
    ((import.meta as any).env && (import.meta as any).env.VITE_API_KEY) ||
    ((import.meta as any).env && (import.meta as any).env.NEXT_PUBLIC_GEMINI_API_KEY) ||
    '';
  return key;
};

const apiKey = getApiKey();

if (!apiKey) {
  console.error("CRITICAL: Gemini API Key is missing. OCR features will not work.");
  console.error("Please configure VITE_GEMINI_API_KEY in your .env file or build environment.");
} else if (apiKey.startsWith('PLAC') || apiKey.includes('PLACEHOLDER')) {
  console.warn("WARNING: Gemini API Key appears to be a placeholder. OCR features will fail.");
} else {
  console.log("Gemini API Key initialized successfully (ends with ...", apiKey.slice(-4), ")");
}

const genAI = new GoogleGenerativeAI(apiKey);

const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const handleGeminiError = (error: any, context: string): Error => {
  console.error(`Error calling Gemini API for ${context}:`, error);
  if (!apiKey) {
    return new Error("Error: API Key no configurada. Revisa tu archivo .env o la configuración del servidor.");
  }
  if (apiKey.startsWith('PLAC') || apiKey.includes('PLACEHOLDER')) {
    return new Error("Error de configuración: Estás usando una API Key de ejemplo. Configura una clave válida en .env");
  }
  if (error.message && /api key/i.test(error.message)) {
    return new Error("Error de autenticación con Gemini. La API Key puede ser inválida o haber expirado.");
  }
  return new Error(`Error al ${context}. Detalles: ${error.message || 'Desconocido'}`);
};

export const extractDataFromImage = async (file: File) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            surnames: { type: SchemaType.STRING },
            firstName: { type: SchemaType.STRING },
            nif: { type: SchemaType.STRING },
            address: { type: SchemaType.STRING },
            city: { type: SchemaType.STRING },
            province: { type: SchemaType.STRING },
            postalCode: { type: SchemaType.STRING },
          },
          required: ["surnames", "nif", "address"],
        },
      },
    });

    const imagePart = await fileToGenerativePart(file);
    const prompt = "Analiza este documento de identidad (DNI/NIE) o CIF. Extrae los datos del titular.";

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error: any) {
    throw handleGeminiError(error, "extraer datos del documento");
  }
};

export const extractVehicleDataFromImage = async (file: File) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            vin: { type: SchemaType.STRING },
            brand: { type: SchemaType.STRING },
            model: { type: SchemaType.STRING },
            year: { type: SchemaType.STRING },
            engineSize: { type: SchemaType.STRING },
            fuelType: { type: SchemaType.STRING },
          },
          required: ["vin", "brand"],
        },
      },
    });

    const imagePart = await fileToGenerativePart(file);
    const prompt = "Analiza esta Ficha Técnica de Vehículo (ITV). Extrae los datos técnicos.";

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error: any) {
    throw handleGeminiError(error, "extraer datos del vehículo");
  }
};

export const classifyAndRenameDocument = async (
  file: File,
  fileNumber: string,
  client: Client,
  vehicle: Vehicle
) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            documentType: {
              type: SchemaType.STRING,
              enum: [
                "DNI_CIF",
                "Ficha_Tecnica_ITV",
                "Permiso_Circulacion",
                "Factura_Compra",
                "Contrato_Compraventa",
                "Impuesto_Matriculacion_576",
                "Impuesto_Transmisiones_620",
                "Mandato_Gestoria",
                "Justificante_Pago_Tasas",
                "Otro_Documento"
              ]
            },
          },
          required: ["documentType"],
        },
      },
    });

    const imagePart = await fileToGenerativePart(file);
    const prompt = `Clasifica este documento para un expediente de gestoría. Cliente: ${client.nif}. Vehículo: ${vehicle.brand} ${vehicle.model}.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const parsed = JSON.parse(response.text());
    const docType = parsed.documentType || "Otro_Documento";

    const clientIdentifier = (client.nif || client.surnames || "CLIENTE").replace(/[^a-zA-Z0-9]/g, "");
    const extension = file.name.split('.').pop() || "pdf";

    return {
      name: `${fileNumber}_${clientIdentifier}_${docType}.${extension}`,
      category: docType.replace(/_/g, " ")
    };
  } catch (error) {
    console.error("Error en classifyAndRenameDocument:", error);
    return {
      name: file.name,
      category: "Otro Documento"
    };
  }
};

export const getGroundedAnswer = async (query: string) => {
  try {
    // Grounding might require a specific model or beta features. 
    // For simplicity in this refactor, we'll use the standard model without explicit tools 
    // unless we are sure about the tool configuration in this SDK version.
    // However, let's try to keep it simple for now.
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(query);
    const response = await result.response;
    const answer = response.text();

    // Grounding metadata extraction depends on the specific response structure
    // which might differ. We'll return empty sources for now to avoid breakage.
    return { answer, sources: [] };
  } catch (error: any) {
    throw handleGeminiError(error, "obtener respuesta del asistente");
  }
};

export const summarizeCommunications = async (
  communications: Communication[],
  users: User[],
  client: Client
) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const log = communications.map(c => {
      const author = users.find(u => u.id === c.authorUserId)?.name || "Usuario";
      return `[${c.date}] ${author}: ${c.concept}`;
    }).join("\n");

    const prompt = `Resume las siguientes comunicaciones del expediente del cliente ${client.firstName} ${client.surnames}. Identifica el estado actual y si hay acciones pendientes:\n\n${log}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    throw handleGeminiError(error, "resumir comunicaciones");
  }
};

export const draftCommunication = async (intent: string, clientName: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Genera un email profesional y amable para el cliente ${clientName}.
    Motivo del mensaje: ${intent}.
    Firmado: Gestoría Arcos.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    throw handleGeminiError(error, "redactar comunicación");
  }
};

export const suggestTasks = async (
  fileType: string,
  attachmentNames: string[],
  existingTasks: Task[]
) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            tasks: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            }
          }
        }
      }
    });

    const prompt = `
      Actúa como un gestor administrativo experto.
      Tipo de expediente: ${fileType}.
      Documentos actuales: ${attachmentNames.join(", ")}.
      Tareas ya creadas: ${existingTasks.map(t => t.text).join(", ")}.
      
      Sugiere de 3 a 5 tareas siguientes lógicas necesarias para completar este expediente.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsed = JSON.parse(response.text());
    return parsed.tasks || [];
  } catch (error) {
    console.error("Error en suggestTasks:", error);
    return [];
  }
};
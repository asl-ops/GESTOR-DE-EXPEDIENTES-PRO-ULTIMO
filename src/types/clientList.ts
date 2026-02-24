
export interface ClientListFilter {
    hasExpedientes?: boolean;
    detectedAuto?: boolean;
    activeLastDays?: number;
    missingContact?: boolean;
    incompleteAddress?: boolean;
    textSearch?: string;
    createdLastDays?: number;
    recentObservationsDays?: number;
    sortBy?: "nombre" | "identificador" | "exps" | "ultimaActividad";
    sortDir?: "asc" | "desc";
}

export interface ClientListField {
    id: string; // 'nombre' | 'documento' | 'emailPrincipal' | 'telefonoPrincipal' | 'poblacion' | 'provincia' | 'numExpedientes' | 'fechaUltimaActividad'
    label: string;
    visible: boolean;
}

export interface ClientList {
    id: string;
    name: string;
    isSystem?: boolean;
    filters: ClientListFilter;
    userId?: string;
    createdAt?: string;
    fields?: ClientListField[]; // Custom output fields
}

export type CRMViewType = 'all' | 'with_cases' | 'no_cases' | 'recent' | 'no_email' | 'no_phone' | 'detected' | 'no_contact' | 'incomplete_address' | 'created_30' | 'recent_obs';


export interface PaymentMethod {
    id: string;
    codigo: number;
    nombre: string;
    activo: boolean;
    orden: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface PaymentMethodCreateInput {
    codigo: number;
    nombre: string;
    activo: boolean;
    orden: number;
}

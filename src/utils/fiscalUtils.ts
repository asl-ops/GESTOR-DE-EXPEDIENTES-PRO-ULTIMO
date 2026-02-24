/**
 * Rounded to exactly 2 decimal places for financial calculations.
 * Avoids floating point precision issues in accounting.
 */
export const roundToTwo = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates the VAT amount for a given base.
 */
export const calculateIVA = (base: number, percentage: number = 21): number => {
    return roundToTwo(base * (percentage / 100));
};

/**
 * Formats a number as currency (Euro).
 */
export const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const NIF_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

/**
 * Calcula el control final para un DNI o CIF
 */
export const calculateCIFControl = (_letra: string, nums: string): string => {
    if (nums.length < 7) return "";

    let sumEven = 0;
    let sumOdd = 0;

    for (let i = 0; i < 7; i++) {
        const n = parseInt(nums.charAt(i), 10);
        if ((i + 1) % 2 === 0) {
            sumEven += n;
        } else {
            const mult = n * 2;
            sumOdd += (mult > 9 ? (mult - 9) : mult);
        }
    }

    const total = sumEven + sumOdd;
    const control = (10 - (total % 10)) % 10;
    return control.toString();
};

export const calculateNIF = (doc: string): string => {
    const clean = (doc || "").toUpperCase().trim();
    if (!clean) return "";

    // Si ya tiene letra al principio, es un CIF/NIE (Simplificado)
    if (/^[ABCDEFGHJNPQRSUVW]/.test(clean)) {
        const letra = clean.charAt(0);
        const nums = clean.slice(1).replace(/\D/g, "").slice(0, 7);
        if (nums.length < 7) return clean;
        const control = calculateCIFControl(letra, nums);
        return `${letra}${nums}${control}`;
    }

    const onlyNums = clean.replace(/\D/g, "").slice(0, 8);
    if (onlyNums.length < 8) return onlyNums;
    const num = parseInt(onlyNums, 10);
    return `${onlyNums}${NIF_LETTERS[num % 23]}`;
};

/**
 * Detecta el tipo de cliente basándose en el documento identificador
 */
export const detectClientType = (doc: string): 'PARTICULAR' | 'EMPRESA' => {
    const clean = (doc || "").toUpperCase().trim();
    if (!clean) return 'PARTICULAR';
    // CIF español: Empieza por letras A, B, C, D, E, F, G, H, J, N, P, Q, R, S, U, V, W
    if (/^[ABCDEFGHJNPQRSUVW]/.test(clean)) return 'EMPRESA';
    // DNI (solo números) o NIE (X, Y, Z) se consideran particulares
    return 'PARTICULAR';
};

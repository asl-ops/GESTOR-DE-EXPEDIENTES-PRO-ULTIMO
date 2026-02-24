/**
 * Utilidades de normalización de texto para búsquedas
 * Permite encontrar "Sánchez" escribiendo "sanchez", DNI con/sin espacios, etc.
 */

/**
 * Normaliza texto: mayúsculas, sin tildes, sin espacios dobles
 */
export function normalizeText(v: string): string {
    return v
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita tildes
        .replace(/\s+/g, " "); // espacios múltiples → uno solo
}

/**
 * Normaliza documento (DNI/NIE/CIF): mayúsculas, sin espacios ni guiones
 */
export function normalizeDocumento(v?: string): string | undefined {
    if (!v) return undefined;
    return normalizeText(v).replace(/\s|-/g, "");
}

/**
 * Normaliza teléfono: solo dígitos
 */
export function normalizeTelefono(v?: string): string | undefined {
    if (!v) return undefined;
    return v.replace(/\D/g, ""); // solo números
}

/**
 * Detecta si un string es mayormente numérico
 */
export function isMostlyNumeric(v: string): boolean {
    const s = v.replace(/\s|-/g, "").toUpperCase();
    // Documentos: o todo números (DNI), o letra + números (CIF)
    return s.length > 0 && /^[A-Z0-9][0-9]*$/.test(s);
}

/**
 * Calcula si dos strings son similares (para detección de duplicados)
 * Retorna un valor entre 0 (totalmente diferentes) y 1 (idénticos)
 */
export function similarityScore(a: string, b: string): number {
    const normA = normalizeText(a);
    const normB = normalizeText(b);

    if (normA === normB) return 1;

    // Implementación simple de Levenshtein simplificado
    const longer = normA.length > normB.length ? normA : normB;
    const shorter = normA.length > normB.length ? normB : normA;

    if (longer.length === 0) return 1;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Admin Authentication Service
 * Centralizes admin access control across the application
 */

export type AdminAuthCallback = (isAuthenticated: boolean) => void;

/**
 * Checks if admin access should be granted
 */
export const requireAdminAuth = async (
    onAuthRequired: () => Promise<boolean>,
    onSuccess: () => void,
    onCancel?: () => void
): Promise<void> => {
    try {
        const isAuthenticated = await onAuthRequired();
        if (isAuthenticated) {
            onSuccess();
        } else {
            onCancel?.();
        }
    } catch (error) {
        console.error('Admin authentication error:', error);
        onCancel?.();
    }
};

/**
 * Gets the configured admin password
 * TODO: Move to Firebase-based auth in production
 */
export const getAdminPassword = (): string => {
    return '1812';
};

/**
 * Validates admin password
 */
export const validateAdminPassword = (password: string): boolean => {
    return password === getAdminPassword();
};

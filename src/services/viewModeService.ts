/**
 * View Mode Service
 * Manages user preference for navigation view mode (menu vs cards)
 */

const VIEW_MODE_KEY = 'expedientes-pro-view-mode';

export type ViewMode = 'menu' | 'cards';

/**
 * Get the current view mode preference
 * Defaults to 'menu' if not set
 * Includes migration from legacy values
 */
export function getViewMode(): ViewMode {
    const stored = localStorage.getItem(VIEW_MODE_KEY);

    // Migration: Handle legacy values
    if (stored === 'Tarjetas' || stored === 'tarjetas' || stored === 'card' || stored === 'cardView') {
        const migrated: ViewMode = 'cards';
        localStorage.setItem(VIEW_MODE_KEY, migrated);
        return migrated;
    }

    if (stored === 'Menú' || stored === 'menu' || stored === 'menuView') {
        const migrated: ViewMode = 'menu';
        localStorage.setItem(VIEW_MODE_KEY, migrated);
        return migrated;
    }

    // Valid values
    if (stored === 'menu' || stored === 'cards') {
        return stored;
    }

    // Default to classic menu view
    return 'menu';
}

/**
 * Set the view mode preference
 */
export function setViewMode(mode: ViewMode): void {
    localStorage.setItem(VIEW_MODE_KEY, mode);
}

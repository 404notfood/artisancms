/**
 * Shared formatting utilities for dates, numbers, etc.
 * Used across Admin and Front pages to eliminate duplication.
 */

/**
 * Format a date string as a short French locale date (e.g. "19 mars 2026").
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format a date string as a relative time string (e.g. "Il y a 5 min").
 */
export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'A l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/**
 * Format a number using French locale (e.g. 1 000 000).
 */
export function formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
}

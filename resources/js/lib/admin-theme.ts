/**
 * Admin theme utilities — CSS variable-based styles for dynamic theming.
 * Replaces hardcoded indigo-* classes throughout the admin.
 */

/** Inline style for primary-colored backgrounds (buttons, toggles, badges). */
export const ADMIN_PRIMARY_BG: React.CSSProperties = {
    backgroundColor: 'var(--admin-primary, #6366f1)',
};

/** Inline style for primary-colored hover backgrounds. */
export const ADMIN_PRIMARY_HOVER_BG: React.CSSProperties = {
    backgroundColor: 'var(--admin-primary-hover, #4f46e5)',
};

/** Inline style for primary-colored text. */
export const ADMIN_PRIMARY_TEXT: React.CSSProperties = {
    color: 'var(--admin-primary, #6366f1)',
};

/** Inline style for primary-colored border. */
export const ADMIN_PRIMARY_BORDER: React.CSSProperties = {
    borderColor: 'var(--admin-primary, #6366f1)',
};

/** Focus ring class using CSS variable (for inputs, selects, textareas). */
export const ADMIN_INPUT_FOCUS =
    'focus:border-[var(--admin-primary,#6366f1)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#6366f1)]';

/** Primary button styles. */
export const adminBtnPrimary: React.CSSProperties = {
    backgroundColor: 'var(--admin-primary, #6366f1)',
};

/** Active tab light background + text color (using color-mix). */
export const adminTabActive: React.CSSProperties = {
    backgroundColor: 'color-mix(in srgb, var(--admin-primary, #6366f1) 12%, transparent)',
    color: 'var(--admin-primary, #6366f1)',
};

/** Selected card border + ring. */
export const adminSelectedBorder: React.CSSProperties = {
    borderColor: 'var(--admin-primary, #6366f1)',
    boxShadow: '0 0 0 1px var(--admin-primary, #6366f1), 0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

/** Upload hover border + text. */
export const adminUploadHover: React.CSSProperties = {
    // Applied via onMouseEnter/onMouseLeave or CSS — fallback to inline
};

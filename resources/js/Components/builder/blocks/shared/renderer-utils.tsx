/**
 * Shared renderer utilities for block renderers.
 *
 * Extracts massively duplicated patterns across 39 renderers:
 *   - Empty state placeholder (15+ renderers)
 *   - Hover card effect (8+ renderers)
 *   - Arrow SVG icon (5+ renderers)
 *   - Responsive grid columns map (6+ renderers)
 *   - "colorScheme aware" card wrapper
 */

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
    message: string;
    hint?: string;
    /** Use 'themed' for renderers using CSS var design tokens, 'simple' for basic Tailwind. Default: 'simple' */
    variant?: 'simple' | 'themed';
}

export function EmptyState({ message, hint, variant = 'simple' }: EmptyStateProps) {
    if (variant === 'themed') {
        return (
            <div style={{
                width: '100%',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-text-muted, #94a3b8)',
                border: '2px dashed var(--color-border, rgba(100,116,139,0.2))',
                borderRadius: 'var(--border-radius, 0.5rem)',
            }}>
                {message}
            </div>
        );
    }

    return (
        <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
            <p className="text-sm">{message}</p>
            {hint && <p className="text-xs mt-1">{hint}</p>}
        </div>
    );
}

// ─── Hover Card Effect ───────────────────────────────────────────────────────

/** Adds translateY(-3px) + boxShadow on hover. Use as spread on the element: {...hoverCardHandlers} */
export const hoverCardHandlers = {
    onMouseEnter: (e: React.MouseEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
    },
    onMouseLeave: (e: React.MouseEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = '';
        el.style.boxShadow = '';
    },
};

/** Creates custom hover handlers with specific shadow. */
export function createHoverHandlers(opts?: { translateY?: string; shadow?: string }) {
    const y = opts?.translateY ?? '-3px';
    const shadow = opts?.shadow ?? '0 12px 32px rgba(0,0,0,0.12)';
    return {
        onMouseEnter: (e: React.MouseEvent) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = `translateY(${y})`;
            el.style.boxShadow = shadow;
        },
        onMouseLeave: (e: React.MouseEvent) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = '';
            el.style.boxShadow = '';
        },
    };
}

/** Hover handlers for CTA/button elements (opacity + translateY). */
export const hoverButtonHandlers = {
    onMouseEnter: (e: React.MouseEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '0.88';
        el.style.transform = 'translateY(-1px)';
    },
    onMouseLeave: (e: React.MouseEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
        el.style.transform = '';
    },
};

// ─── Arrow SVG Icon ──────────────────────────────────────────────────────────

interface ArrowIconProps {
    size?: number;
}

/** Small right-pointing arrow used in CTA buttons across hero, button, cta, icon-box blocks. */
export function ArrowIcon({ size = 16 }: ArrowIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ─── Responsive Grid Columns ─────────────────────────────────────────────────

/** Generates CSS gridTemplateColumns value with responsive auto-fit. */
export function responsiveGridCols(columns: number, minWidth = 260): string {
    if (columns === 1) return 'repeat(1, 1fr)';
    const minW = columns >= 4 ? Math.min(minWidth, 200) : columns >= 3 ? Math.min(minWidth, 280) : minWidth;
    return `repeat(auto-fit, minmax(min(100%, ${minW}px), 1fr))`;
}

// ─── Common Card Style ───────────────────────────────────────────────────────

/** Returns base card CSS properties for themed blocks (testimonials, team, icon-box, pricing). */
export function themedCardStyle(isDark = false): React.CSSProperties {
    return {
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'var(--color-surface, rgba(0,0,0,0.03))',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'var(--color-border, rgba(0,0,0,0.07))'}`,
        borderRadius: 'var(--border-radius, 0.75rem)',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    };
}

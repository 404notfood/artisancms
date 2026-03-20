import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import type { SharedProps } from '@/types/cms';

/**
 * Returns the resolved admin prefix (e.g., 'admin' or 'my-panel').
 */
export function useAdminPrefix(): string {
    const { cms } = usePage<SharedProps>().props;
    return cms?.adminPrefix ?? 'admin';
}

/**
 * Returns a function that builds admin URLs using the dynamic prefix.
 *
 * Usage:
 *   const adminUrl = useAdminUrl();
 *   adminUrl('pages')      // => '/admin/pages'  (or '/my-panel/pages')
 *   adminUrl()             // => '/admin'
 *   adminUrl('settings')   // => '/admin/settings'
 */
export function useAdminUrl(): (path?: string) => string {
    const prefix = useAdminPrefix();
    return useMemo(() => {
        return (path: string = '') => {
            const clean = path.replace(/^\/+/, '');
            return clean ? `/${prefix}/${clean}` : `/${prefix}`;
        };
    }, [prefix]);
}

/**
 * Non-hook version: builds an admin URL from a prefix string.
 * Use when you can't call hooks (e.g., in static configs, callbacks).
 */
export function adminUrl(prefix: string, path: string = ''): string {
    const clean = path.replace(/^\/+/, '');
    return clean ? `/${prefix}/${clean}` : `/${prefix}`;
}

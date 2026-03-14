import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage().props as unknown as { auth: { user: { role?: { permissions?: string[] } } | null } };
    const permissions = auth.user?.role?.permissions ?? [];

    function can(permission: string): boolean {
        if (permissions.includes('*')) return true;
        if (permissions.includes(permission)) return true;

        const [resource] = permission.split('.');
        return permissions.includes(`${resource}.*`);
    }

    function isAdmin(): boolean {
        return permissions.includes('*');
    }

    return { can, isAdmin };
}

import { useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ALL_PERMISSIONS = {
    pages: ['read', 'create', 'update', 'update.own', 'delete', 'publish'],
    posts: ['read', 'create', 'update', 'update.own', 'delete', 'publish'],
    media: ['read', 'create', 'update', 'delete'],
    menus: ['read', 'create', 'update', 'delete'],
    users: ['read', 'create', 'update', 'delete'],
    roles: ['read', 'create', 'update', 'delete'],
    comments: ['read', 'moderate', 'delete'],
    taxonomies: ['read', 'create', 'update', 'delete'],
    settings: ['read', 'update'],
    themes: ['read', 'manage'],
    plugins: ['read', 'manage'],
    analytics: ['read'],
    widgets: ['read', 'create', 'update', 'delete'],
    redirects: ['read', 'create', 'update', 'delete'],
    webhooks: ['read', 'create', 'update', 'delete'],
    templates: ['read', 'install', 'delete'],
    content_types: ['read', 'create', 'update', 'delete'],
    content_entries: ['read', 'create', 'update', 'update.own', 'delete'],
    custom_fields: ['read', 'create', 'update', 'delete'],
    global_sections: ['read', 'create', 'update', 'delete'],
    email_templates: ['read', 'update'],
    design_tokens: ['read', 'create', 'update', 'delete'],
    block_patterns: ['read', 'create', 'update', 'delete'],
    popups: ['read', 'create', 'update', 'delete'],
    backups: ['read', 'create', 'download', 'restore', 'delete'],
    import_export: ['read', 'import', 'export'],
    config: ['import', 'export'],
    updates: ['read', 'manage', 'rollback'],
    system: ['read', 'manage', 'sessions'],
    activity_log: ['read'],
    seo: ['read', 'update'],
    newsletters: ['read', 'send'],
} as const;

const GROUP_LABELS: Record<string, string> = {
    pages: 'Pages',
    posts: 'Articles',
    media: 'Médias',
    menus: 'Menus',
    users: 'Utilisateurs',
    roles: 'Rôles',
    comments: 'Commentaires',
    taxonomies: 'Taxonomies',
    themes: 'Thèmes',
    plugins: 'Extensions',
    settings: 'Réglages',
    analytics: 'Analytics',
    widgets: 'Widgets',
    redirects: 'Redirections',
    newsletters: 'Newsletter',
    webhooks: 'Webhooks',
    templates: 'Templates',
    content_types: 'Types de contenu',
    content_entries: 'Entrées de contenu',
    custom_fields: 'Champs personnalisés',
    global_sections: 'Sections globales',
    email_templates: 'Emails',
    design_tokens: 'Design tokens',
    block_patterns: 'Patterns builder',
    popups: 'Popups',
    backups: 'Sauvegardes',
    import_export: 'Import / export',
    config: 'Configuration',
    updates: 'Mises à jour',
    system: 'Système',
    activity_log: 'Journal activité',
    seo: 'SEO',
};

const ACTION_LABELS: Record<string, string> = {
    read: 'Voir',
    create: 'Créer',
    update: 'Modifier',
    'update.own': 'Modifier ses contenus',
    delete: 'Supprimer',
    publish: 'Publier',
    moderate: 'Modérer',
    manage: 'Gérer',
    send: 'Envoyer',
    install: 'Installer',
    download: 'Télécharger',
    restore: 'Restaurer',
    import: 'Importer',
    export: 'Exporter',
    rollback: 'Rollback',
    sessions: 'Sessions',
};

const ACTIONS = [
    'read',
    'create',
    'update',
    'update.own',
    'delete',
    'publish',
    'moderate',
    'manage',
    'send',
    'install',
    'download',
    'restore',
    'import',
    'export',
    'rollback',
    'sessions',
] as const;

interface PermissionsMatrixProps {
    permissions: string[];
    onChange: (permissions: string[]) => void;
    disabled?: boolean;
}

export function PermissionsMatrix({ permissions, onChange, disabled }: PermissionsMatrixProps) {
    const permSet = new Set(permissions);

    function togglePermission(group: string, action: string) {
        if (disabled) return;
        const perm = `${group}.${action}`;
        const next = new Set(permSet);
        if (next.has(perm)) {
            next.delete(perm);
        } else {
            next.add(perm);
        }
        onChange(Array.from(next));
    }

    function toggleGroup(group: string) {
        if (disabled) return;
        const actions = ALL_PERMISSIONS[group as keyof typeof ALL_PERMISSIONS];
        const groupPerms = actions.map((a) => `${group}.${a}`);
        const allSelected = groupPerms.every((p) => permSet.has(p));

        const next = new Set(permSet);
        groupPerms.forEach((p) => {
            if (allSelected) {
                next.delete(p);
            } else {
                next.add(p);
            }
        });
        onChange(Array.from(next));
    }

    function toggleAll() {
        if (disabled) return;
        const allPerms = Object.entries(ALL_PERMISSIONS).flatMap(([group, actions]) =>
            actions.map((a) => `${group}.${a}`),
        );
        const allSelected = allPerms.every((p) => permSet.has(p));
        onChange(allSelected ? [] : allPerms);
    }

    const allPermsFlat = Object.entries(ALL_PERMISSIONS).flatMap(([group, actions]) =>
        actions.map((a) => `${group}.${a}`),
    );
    const allSelected = allPermsFlat.every((p) => permSet.has(p));
    const someSelected = allPermsFlat.some((p) => permSet.has(p));

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="py-2 pr-4 text-left font-medium text-gray-700">
                            <button
                                type="button"
                                onClick={toggleAll}
                                disabled={disabled}
                                className="flex items-center gap-2 hover:text-indigo-600"
                            >
                                <PermCheckbox
                                    checked={allSelected}
                                    indeterminate={!allSelected && someSelected}
                                />
                                <span>Ressource</span>
                            </button>
                        </th>
                        <th className="px-2 py-2 text-center font-medium text-gray-500" colSpan={ACTIONS.length}>
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(ALL_PERMISSIONS).map(([group, actions]) => {
                        const groupPerms = actions.map((a) => `${group}.${a}`);
                        const groupAllSelected = groupPerms.every((p) => permSet.has(p));
                        const groupSomeSelected = groupPerms.some((p) => permSet.has(p));

                        return (
                            <tr key={group} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 pr-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group)}
                                        disabled={disabled}
                                        className="flex items-center gap-2 font-medium text-gray-800 hover:text-indigo-600"
                                    >
                                        <PermCheckbox
                                            checked={groupAllSelected}
                                            indeterminate={!groupAllSelected && groupSomeSelected}
                                        />
                                        <span>{GROUP_LABELS[group] ?? group}</span>
                                    </button>
                                </td>
                                {ACTIONS
                                    .filter((a) => (actions as readonly string[]).includes(a))
                                    .map((action) => (
                                        <td key={action} className="px-2 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => togglePermission(group, action)}
                                                disabled={disabled}
                                                className="inline-flex flex-col items-center gap-0.5"
                                            >
                                                <PermCheckbox checked={permSet.has(`${group}.${action}`)} />
                                                <span className="text-[10px] text-gray-400">
                                                    {ACTION_LABELS[action] ?? action}
                                                </span>
                                            </button>
                                        </td>
                                    ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p className="mt-2 text-xs text-gray-400">{permissions.length} permissions sélectionnées</p>
        </div>
    );
}

function PermCheckbox({
    checked,
    indeterminate,
}: {
    checked: boolean;
    indeterminate?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                checked
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : indeterminate
                      ? 'border-indigo-400 bg-indigo-100'
                      : 'border-gray-300 bg-white',
            )}
        >
            {checked ? (
                <Check className="h-3.5 w-3.5" />
            ) : indeterminate ? (
                <Minus className="h-3.5 w-3.5 text-indigo-600" />
            ) : null}
        </div>
    );
}

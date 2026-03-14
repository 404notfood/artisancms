import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import type { CustomFieldGroupData, PaginatedResponse } from '@/types/cms';

interface Props {
    groups: PaginatedResponse<CustomFieldGroupData>;
}

const appliesLabels: Record<string, string> = {
    page: 'Pages',
    post: 'Articles',
};

function formatAppliesTo(appliesTo: string[]): string {
    return appliesTo
        .map((item) => {
            if (item.includes(':template:')) {
                const parts = item.split(':template:');
                const type = appliesLabels[parts[0]] ?? parts[0];
                return `${type} (${parts[1]})`;
            }
            return appliesLabels[item] ?? item;
        })
        .join(', ');
}

export default function CustomFieldsIndex({ groups }: Props) {
    function handleDelete(group: CustomFieldGroupData) {
        if (
            !confirm(
                `Supprimer le groupe "${group.name}" et tous ses champs ? Cette action est irréversible.`
            )
        ) {
            return;
        }
        router.delete(`/admin/custom-fields/${group.id}`);
    }

    function handleToggleActive(group: CustomFieldGroupData) {
        router.put(
            `/admin/custom-fields/${group.id}`,
            {
                name: group.name,
                slug: group.slug,
                applies_to: group.applies_to,
                active: !group.active,
                fields: (group.fields ?? []) as unknown as string,
            },
            { preserveState: true }
        );
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Champs personnalisés</h1>
                    <Link
                        href="/admin/custom-fields/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon />
                        Nouveau groupe
                    </Link>
                </div>
            }
        >
            <Head title="Champs personnalisés" />

            <div className="rounded-lg border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">Nom</th>
                                <th className="px-4 py-3 font-medium text-gray-700">
                                    S'applique à
                                </th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">
                                    Champs
                                </th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">
                                    Position
                                </th>
                                <th className="px-4 py-3 font-medium text-gray-700">Statut</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {groups.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        Aucun groupe de champs personnalisés.
                                    </td>
                                </tr>
                            ) : (
                                groups.data.map((group) => (
                                    <tr key={group.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/custom-fields/${group.id}/edit`}
                                                className="font-medium text-gray-900 hover:text-indigo-600"
                                            >
                                                {group.name}
                                            </Link>
                                            {group.description && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {group.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {formatAppliesTo(group.applies_to)}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                            {group.fields_count ?? 0}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 sm:table-cell capitalize">
                                            {group.position === 'side'
                                                ? 'Barre latérale'
                                                : 'Normal'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleToggleActive(group)}
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    group.active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {group.active ? 'Actif' : 'Inactif'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/custom-fields/${group.id}/edit`}
                                                    className="text-gray-500 hover:text-indigo-600"
                                                    title="Modifier"
                                                >
                                                    <EditIcon />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(group)}
                                                    className="text-gray-500 hover:text-red-600"
                                                    title="Supprimer"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {groups.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {groups.from}–{groups.to} sur {groups.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: groups.last_page }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/admin/custom-fields?page=${p}`}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === groups.current_page
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {p}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

function PlusIcon() {
    return (
        <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
        </svg>
    );
}

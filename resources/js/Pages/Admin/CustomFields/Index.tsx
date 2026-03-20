import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import type { CustomFieldGroupData, PaginatedResponse, SharedProps } from '@/types/cms';
import { Plus, Pencil, Trash2 } from 'lucide-react';

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
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
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
                        href={`/${prefix}/custom-fields/create`}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
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
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(group)}
                                                    className="text-gray-500 hover:text-red-600"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

// Icons imported from lucide-react.

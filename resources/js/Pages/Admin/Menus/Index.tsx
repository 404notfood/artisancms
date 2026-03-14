import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { MenuData } from '@/types/cms';

interface MenusIndexProps {
    menus: MenuData[];
}

export default function MenusIndex({ menus }: MenusIndexProps) {
    const [showCreate, setShowCreate] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        slug: '',
        location: '',
    });

    function generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function handleNameChange(value: string) {
        setData((prev) => ({
            ...prev,
            name: value,
            slug: prev.slug === '' || prev.slug === generateSlug(prev.name) ? generateSlug(value) : prev.slug,
        }));
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/menus', {
            onSuccess: () => {
                reset();
                setShowCreate(false);
            },
        });
    }

    function handleDelete(menu: MenuData) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le menu "${menu.name}" ?`)) return;
        router.delete(`/admin/menus/${menu.id}`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Menus</h1>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon />
                        Nouveau menu
                    </button>
                </div>
            }
        >
            <Head title="Menus" />

            <div className="space-y-6">
                {/* Create form */}
                {showCreate && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Créer un menu</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Nom
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                                        Slug
                                    </label>
                                    <input
                                        id="slug"
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                    {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                                </div>
                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                        Emplacement
                                    </label>
                                    <select
                                        id="location"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="">Aucun</option>
                                        <option value="header">En-tête</option>
                                        <option value="footer">Pied de page</option>
                                        <option value="sidebar">Barre latérale</option>
                                    </select>
                                    {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {processing ? 'Création...' : 'Créer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowCreate(false); reset(); }}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Menus list */}
                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-700">Nom</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Emplacement</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Éléments</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {menus.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                            Aucun menu créé.
                                        </td>
                                    </tr>
                                ) : (
                                    menus.map((menu) => (
                                        <tr key={menu.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/admin/menus/${menu.id}/edit`}
                                                    className="font-medium text-gray-900 hover:text-indigo-600"
                                                >
                                                    {menu.name}
                                                </Link>
                                                <p className="text-xs text-gray-500">{menu.slug}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {menu.location ? (
                                                    <LocationBadge location={menu.location} />
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {menu.items?.length ?? 0} élément(s)
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/admin/menus/${menu.id}/edit`}
                                                        className="text-gray-500 hover:text-indigo-600"
                                                        title="Modifier"
                                                    >
                                                        <EditIcon />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(menu)}
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
                </div>
            </div>
        </AdminLayout>
    );
}

function LocationBadge({ location }: { location: string }) {
    const labels: Record<string, string> = {
        header: 'En-tête',
        footer: 'Pied de page',
        sidebar: 'Barre latérale',
    };
    return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            {labels[location] ?? location}
        </span>
    );
}

function PlusIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}

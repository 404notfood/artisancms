import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import type { MenuData, MenuItemData, PageData, PostData } from '@/types/cms';

interface MenusEditProps {
    menu: MenuData;
    pages: PageData[];
    posts: PostData[];
}

interface NewItemForm {
    label: string;
    type: MenuItemData['type'];
    url: string;
    target: string;
    page_id: string;
    post_id: string;
}

const defaultNewItem: NewItemForm = {
    label: '',
    type: 'url',
    url: '',
    target: '_self',
    page_id: '',
    post_id: '',
};

export default function MenusEdit({ menu, pages, posts }: MenusEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: menu.name,
        slug: menu.slug,
        location: menu.location ?? '',
    });

    const [items, setItems] = useState<MenuItemData[]>(menu.items ?? []);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [newItem, setNewItem] = useState<NewItemForm>(defaultNewItem);
    const [showAddItem, setShowAddItem] = useState(false);

    // Sync items when Inertia reloads the page props
    useEffect(() => {
        setItems(menu.items ?? []);
    }, [menu.items]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/menus/${menu.id}`);
    }

    function handleAddItem(e: React.FormEvent) {
        e.preventDefault();

        let label = newItem.label;
        let url = newItem.url;

        if (newItem.type === 'page' && newItem.page_id) {
            const page = pages.find((p) => p.id === Number(newItem.page_id));
            if (page) {
                label = label || page.title;
                url = `/${page.slug}`;
            }
        } else if (newItem.type === 'post' && newItem.post_id) {
            const post = posts.find((p) => p.id === Number(newItem.post_id));
            if (post) {
                label = label || post.title;
                url = `/blog/${post.slug}`;
            }
        }

        if (!label) return;

        router.post(`/admin/menus/${menu.id}/items`, {
            label,
            type: newItem.type,
            url,
            target: newItem.target,
            order: items.length,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setNewItem(defaultNewItem);
                setShowAddItem(false);
            },
        });
    }

    function handleUpdateItem(item: MenuItemData, updates: Partial<MenuItemData>) {
        const { children, ...payload } = { ...item, ...updates };
        router.put(`/admin/menus/${menu.id}/items/${item.id}`, payload as Record<string, string | number | boolean | null>, {
            preserveScroll: true,
            onSuccess: () => setEditingItemId(null),
        });
    }

    function handleDeleteItem(item: MenuItemData) {
        if (!confirm(`Supprimer l'élément "${item.label}" ?`)) return;
        router.delete(`/admin/menus/${menu.id}/items/${item.id}`, {
            preserveScroll: true,
        });
    }

    function moveItem(index: number, direction: 'up' | 'down') {
        const newItems = [...items];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= newItems.length) return;

        [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
        setItems(newItems);

        // Persist the new order
        const orderedIds = newItems.map((item, i) => ({ id: item.id, order: i }));
        router.put(`/admin/menus/${menu.id}/items/reorder`, { items: orderedIds }, {
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/admin/menus" className="text-gray-500 hover:text-gray-700">
                        <BackIcon />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Modifier le menu : {menu.name}</h1>
                </div>
            }
        >
            <Head title={`Menu : ${menu.name}`} />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Menu info */}
                <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Informations du menu</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Nom
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
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

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>

                {/* Menu items */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Éléments du menu</h2>
                        <button
                            onClick={() => setShowAddItem(!showAddItem)}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            <PlusIcon />
                            Ajouter
                        </button>
                    </div>

                    {/* Add item form */}
                    {showAddItem && (
                        <form onSubmit={handleAddItem} className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        value={newItem.type}
                                        onChange={(e) => setNewItem({ ...newItem, type: e.target.value as MenuItemData['type'] })}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="url">URL personnalisée</option>
                                        <option value="page">Page</option>
                                        <option value="post">Article</option>
                                        <option value="custom">Personnalisé</option>
                                    </select>
                                </div>

                                {newItem.type === 'page' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Page</label>
                                        <select
                                            value={newItem.page_id}
                                            onChange={(e) => setNewItem({ ...newItem, page_id: e.target.value })}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="">Sélectionner une page</option>
                                            {pages.map((p) => (
                                                <option key={p.id} value={p.id}>{p.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {newItem.type === 'post' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Article</label>
                                        <select
                                            value={newItem.post_id}
                                            onChange={(e) => setNewItem({ ...newItem, post_id: e.target.value })}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="">Sélectionner un article</option>
                                            {posts.map((p) => (
                                                <option key={p.id} value={p.id}>{p.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {(newItem.type === 'url' || newItem.type === 'custom') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">URL</label>
                                        <input
                                            type="text"
                                            value={newItem.url}
                                            onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Label</label>
                                    <input
                                        type="text"
                                        value={newItem.label}
                                        onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Texte du lien"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cible</label>
                                    <select
                                        value={newItem.target}
                                        onChange={(e) => setNewItem({ ...newItem, target: e.target.value })}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="_self">Même fenêtre</option>
                                        <option value="_blank">Nouvelle fenêtre</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                >
                                    Ajouter
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddItem(false); setNewItem(defaultNewItem); }}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Items list */}
                    {items.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-500">
                            Aucun élément dans ce menu. Cliquez sur "Ajouter" pour commencer.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
                                >
                                    {/* Reorder buttons */}
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            type="button"
                                            onClick={() => moveItem(index, 'up')}
                                            disabled={index === 0}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            <ChevronUpIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveItem(index, 'down')}
                                            disabled={index === items.length - 1}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            <ChevronDownIcon />
                                        </button>
                                    </div>

                                    {/* Item content */}
                                    <div className="flex-1 min-w-0">
                                        {editingItemId === item.id ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                    <input
                                                        type="text"
                                                        defaultValue={item.label}
                                                        onBlur={(e) => handleUpdateItem(item, { label: e.target.value })}
                                                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                                                        placeholder="Label"
                                                    />
                                                    <input
                                                        type="text"
                                                        defaultValue={item.url ?? ''}
                                                        onBlur={(e) => handleUpdateItem(item, { url: e.target.value })}
                                                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                                                        placeholder="URL"
                                                    />
                                                    <select
                                                        defaultValue={item.target}
                                                        onChange={(e) => handleUpdateItem(item, { target: e.target.value })}
                                                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                                                    >
                                                        <option value="_self">Meme fenetre</option>
                                                        <option value="_blank">Nouvelle fenetre</option>
                                                    </select>
                                                </div>

                                                {/* Mega menu fields */}
                                                <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                        Mega menu
                                                    </p>
                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                                            <input
                                                                type="checkbox"
                                                                defaultChecked={item.is_mega ?? false}
                                                                onChange={(e) => handleUpdateItem(item, { is_mega: e.target.checked } as Partial<MenuItemData>)}
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            Activer
                                                        </label>
                                                        <div>
                                                            <label className="block text-xs text-gray-500">Colonnes</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="6"
                                                                defaultValue={item.mega_columns ?? 3}
                                                                onBlur={(e) => handleUpdateItem(item, { mega_columns: parseInt(e.target.value, 10) || 3 } as Partial<MenuItemData>)}
                                                                className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500">Badge</label>
                                                            <input
                                                                type="text"
                                                                defaultValue={item.badge_text ?? ''}
                                                                onBlur={(e) => handleUpdateItem(item, { badge_text: e.target.value || null } as Partial<MenuItemData>)}
                                                                className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                                                                placeholder="Ex: Nouveau"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500">Couleur badge</label>
                                                            <input
                                                                type="color"
                                                                defaultValue={item.badge_color ?? '#6366f1'}
                                                                onBlur={(e) => handleUpdateItem(item, { badge_color: e.target.value } as Partial<MenuItemData>)}
                                                                className="mt-0.5 h-8 w-full rounded border border-gray-300 cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                                    {item.is_mega && (
                                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                                            Mega
                                                        </span>
                                                    )}
                                                    {item.badge_text && (
                                                        <span
                                                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                                            style={{ backgroundColor: item.badge_color ?? '#6366f1' }}
                                                        >
                                                            {item.badge_text}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    <TypeBadge type={item.type} /> {item.url ?? ''}
                                                    {item.target === '_blank' && ' (nouvelle fenetre)'}
                                                    {item.is_mega && ` | ${item.mega_columns ?? 3} colonnes`}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                                            className="text-gray-400 hover:text-indigo-600"
                                            title="Modifier"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteItem(item)}
                                            className="text-gray-400 hover:text-red-600"
                                            title="Supprimer"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function TypeBadge({ type }: { type: string }) {
    const labels: Record<string, string> = {
        page: 'Page',
        post: 'Article',
        url: 'URL',
        custom: 'Custom',
        taxonomy: 'Taxonomie',
    };
    return (
        <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
            {labels[type] ?? type}
        </span>
    );
}

function BackIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
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

function ChevronUpIcon() {
    return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    );
}

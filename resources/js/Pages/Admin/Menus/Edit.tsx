import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router , usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import type { MenuData, MenuItemData, PageData, PostData, SharedProps } from '@/types/cms';
import { ArrowLeft, Plus } from 'lucide-react';
import AddItemForm, { defaultNewItem, type NewItemForm } from './components/AddItemForm';
import MenuItemRow from './components/MenuItemRow';

interface MenusEditProps {
    menu: MenuData;
    pages: PageData[];
    posts: PostData[];
}

export default function MenusEdit({ menu, pages, posts }: MenusEditProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { data, setData, put, processing, errors } = useForm({
        name: menu.name,
        slug: menu.slug,
        location: menu.location ?? '',
    });

    const [items, setItems] = useState<MenuItemData[]>(menu.items ?? []);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [newItem, setNewItem] = useState<NewItemForm>(defaultNewItem);
    const [showAddItem, setShowAddItem] = useState(false);

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
            if (page) { label = label || page.title; url = `/${page.slug}`; }
        } else if (newItem.type === 'post' && newItem.post_id) {
            const post = posts.find((p) => p.id === Number(newItem.post_id));
            if (post) { label = label || post.title; url = `/blog/${post.slug}`; }
        }

        if (!label) return;

        router.post(`/admin/menus/${menu.id}/items`, {
            label, type: newItem.type, url, target: newItem.target, order: items.length,
        }, {
            preserveScroll: true,
            onSuccess: () => { setNewItem(defaultNewItem); setShowAddItem(false); },
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
        if (!confirm(`Supprimer l'element "${item.label}" ?`)) return;
        router.delete(`/admin/menus/${menu.id}/items/${item.id}`, { preserveScroll: true });
    }

    function moveItem(index: number, direction: 'up' | 'down') {
        const newItems = [...items];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= newItems.length) return;
        [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
        setItems(newItems);
        const orderedIds = newItems.map((item, i) => ({ id: item.id, order: i }));
        router.put(`/admin/menus/${menu.id}/items/reorder`, { items: orderedIds }, { preserveScroll: true });
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={`/${prefix}/menus`} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
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
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
                            <input id="name" type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
                            <input id="slug" type="text" value={data.slug} onChange={(e) => setData('slug', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
                            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Emplacement</label>
                            <select id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option value="">Aucun</option>
                                <option value="header">En-tete</option>
                                <option value="footer">Pied de page</option>
                                <option value="sidebar">Barre laterale</option>
                            </select>
                            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>

                {/* Menu items */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Elements du menu</h2>
                        <button onClick={() => setShowAddItem(!showAddItem)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                            <Plus className="h-4 w-4" />
                            Ajouter
                        </button>
                    </div>

                    {showAddItem && (
                        <AddItemForm
                            newItem={newItem}
                            setNewItem={setNewItem}
                            onSubmit={handleAddItem}
                            onCancel={() => { setShowAddItem(false); setNewItem(defaultNewItem); }}
                            pages={pages}
                            posts={posts}
                        />
                    )}

                    {items.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-500">
                            Aucun element dans ce menu. Cliquez sur "Ajouter" pour commencer.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <MenuItemRow
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    total={items.length}
                                    isEditing={editingItemId === item.id}
                                    onToggleEdit={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                                    onUpdate={handleUpdateItem}
                                    onDelete={() => handleDeleteItem(item)}
                                    onMove={moveItem}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

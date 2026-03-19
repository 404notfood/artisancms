import type { MenuItemData, PageData, PostData } from '@/types/cms';

export interface NewItemForm {
    label: string;
    type: MenuItemData['type'];
    url: string;
    target: string;
    page_id: string;
    post_id: string;
}

export const defaultNewItem: NewItemForm = {
    label: '',
    type: 'url',
    url: '',
    target: '_self',
    page_id: '',
    post_id: '',
};

interface AddItemFormProps {
    newItem: NewItemForm;
    setNewItem: (item: NewItemForm) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    pages: PageData[];
    posts: PostData[];
}

export default function AddItemForm({ newItem, setNewItem, onSubmit, onCancel, pages, posts }: AddItemFormProps) {
    return (
        <form onSubmit={onSubmit} className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                        value={newItem.type}
                        onChange={(e) => setNewItem({ ...newItem, type: e.target.value as MenuItemData['type'] })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="url">URL personnalisee</option>
                        <option value="page">Page</option>
                        <option value="post">Article</option>
                        <option value="custom">Personnalise</option>
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
                            <option value="">Selectionner une page</option>
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
                            <option value="">Selectionner un article</option>
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
                        <option value="_self">Meme fenetre</option>
                        <option value="_blank">Nouvelle fenetre</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                    Ajouter
                </button>
                <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Annuler
                </button>
            </div>
        </form>
    );
}

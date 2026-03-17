import { useEffect, useState } from 'react';
import { useBuilderStore } from '@/stores/builder-store';
import { nanoid } from 'nanoid';
import { Layers, Trash2, GripVertical } from 'lucide-react';

interface PatternData {
    id: number;
    name: string;
    slug: string;
    content: unknown[];
    category: string;
    is_synced: boolean;
    creator?: { name: string };
}

function reassignIds(blocks: unknown[]): unknown[] {
    return blocks.map((block: any) => ({
        ...block,
        id: nanoid(),
        children: block.children?.length ? reassignIds(block.children) : [],
    }));
}

export default function PatternLibrary() {
    const [patterns, setPatterns] = useState<PatternData[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const { addBlock, blocks } = useBuilderStore();

    useEffect(() => {
        fetch('/admin/block-patterns', {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((r) => r.json())
            .then((data) => {
                setPatterns(data.patterns ?? []);
                setCategories(data.categories ?? []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const insertPattern = (pattern: PatternData) => {
        const freshBlocks = reassignIds(pattern.content) as any[];
        const store = useBuilderStore.getState();

        store.pushHistory();
        // Insert each top-level block from the pattern at root level
        for (const block of freshBlocks) {
            useBuilderStore.setState((state) => {
                state.blocks.push(block);
                state.isDirty = true;
            });
        }
    };

    const deletePattern = (id: number) => {
        if (!confirm('Supprimer ce pattern ?')) return;

        fetch(`/admin/block-patterns/${id}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
            credentials: 'same-origin',
        }).then(() => {
            setPatterns((prev) => prev.filter((p) => p.id !== id));
        });
    };

    const filtered = filter
        ? patterns.filter((p) => p.category === filter)
        : patterns;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Category filter */}
            {categories.length > 1 && (
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => setFilter('')}
                        className={`px-2 py-1 text-xs rounded ${!filter ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Tout ({patterns.length})
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-2 py-1 text-xs rounded capitalize ${filter === cat ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Patterns grid */}
            {filtered.length > 0 ? (
                <div className="space-y-2">
                    {filtered.map((pattern) => (
                        <div
                            key={pattern.id}
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 transition-colors group"
                        >
                            <Layers className="h-4 w-4 text-gray-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{pattern.name}</p>
                                <p className="text-xs text-gray-400">
                                    {Array.isArray(pattern.content) ? pattern.content.length : 0} blocs
                                    {pattern.is_synced && ' · Synchronise'}
                                </p>
                            </div>
                            <button
                                onClick={() => insertPattern(pattern)}
                                className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Inserer
                            </button>
                            <button
                                onClick={() => deletePattern(pattern.id)}
                                className="p-1 text-gray-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-400">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun pattern sauvegarde</p>
                    <p className="text-xs mt-1">Selectionnez des blocs puis "Sauvegarder comme pattern"</p>
                </div>
            )}
        </div>
    );
}

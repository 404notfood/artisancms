import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Palette,
    Type,
    MousePointerClick,
    Space,
    Layers,
    Square,
    Plus,
    Trash2,
    Wand2,
    Pencil,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { type DesignToken, type CategoryDef } from './components/types';
import TokenPreview from './components/TokenPreview';
import EditTokenForm from './components/EditTokenForm';
import resolveTokenDisplay from './components/resolveTokenDisplay';

interface StyleBookProps {
    tokens: Record<string, DesignToken[]>;
    categories: CategoryDef[];
}

const categoryIcons: Record<string, ReactNode> = {
    color: <Palette className="h-4 w-4" />,
    typography: <Type className="h-4 w-4" />,
    button: <MousePointerClick className="h-4 w-4" />,
    spacing: <Space className="h-4 w-4" />,
    shadow: <Layers className="h-4 w-4" />,
    border: <Square className="h-4 w-4" />,
};

export default function StyleBookIndex({ tokens, categories }: StyleBookProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [activeCategory, setActiveCategory] = useState(categories[0]?.key ?? 'color');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showNewForm, setShowNewForm] = useState(false);

    const categoryTokens = tokens[activeCategory] ?? [];

    const deleteToken = (id: number) => {
        if (confirm('Supprimer ce token ?')) {
            router.delete(`/admin/design-tokens/${id}`);
        }
    };

    return (
        <AdminLayout
            header={<h1 className="text-xl font-semibold text-gray-900">Style Book</h1>}
        >
            <Head title="Style Book - Design Tokens" />

            <div className="space-y-6">
                {/* Top actions */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Gerez les design tokens pour harmoniser le style de votre site.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => router.post(`/${prefix}/design-tokens/seed-defaults`)}
                    >
                        <Wand2 className="h-4 w-4" />
                        Generer les tokens par defaut
                    </Button>
                </div>

                {/* Category tabs */}
                <div className="flex gap-2 flex-wrap">
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => {
                                setActiveCategory(cat.key);
                                setEditingId(null);
                                setShowNewForm(false);
                            }}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                activeCategory === cat.key
                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200',
                            )}
                        >
                            {categoryIcons[cat.key]}
                            {cat.label}
                            <Badge variant="outline" className="text-[10px] ml-1">
                                {(tokens[cat.key] ?? []).length}
                            </Badge>
                        </button>
                    ))}
                </div>

                {/* Tokens list */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            {categoryIcons[activeCategory]}
                            {categories.find((c) => c.key === activeCategory)?.label}
                        </CardTitle>
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                                setShowNewForm(true);
                                setEditingId(null);
                            }}
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {showNewForm && (
                            <EditTokenForm
                                category={activeCategory}
                                onClose={() => setShowNewForm(false)}
                            />
                        )}

                        {categoryTokens.length > 0 ? (
                            categoryTokens.map((token) => (
                                <div key={token.id}>
                                    {editingId === token.id ? (
                                        <EditTokenForm
                                            token={token}
                                            category={activeCategory}
                                            onClose={() => setEditingId(null)}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{token.name}</p>
                                                    <p className="text-xs font-mono text-gray-400">
                                                        --token-{token.slug}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <TokenPreview token={token} />
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingId(token.id)}
                                                        className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteToken(token.id)}
                                                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            !showNewForm && (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-sm">Aucun token dans cette categorie.</p>
                                    <p className="text-xs mt-1">Cliquez sur "Ajouter" ou "Generer les tokens par defaut".</p>
                                </div>
                            )
                        )}
                    </CardContent>
                </Card>

                {/* CSS Preview */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Preview CSS Variables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto font-mono">
                            {`:root {\n${Object.entries(tokens)
                                .flatMap(([, catTokens]) =>
                                    catTokens.map(
                                        (t) => `  --token-${t.slug}: ${resolveTokenDisplay(t)};`
                                    )
                                )
                                .join('\n')}\n}`}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

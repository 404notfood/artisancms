import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
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
    Save,
    Wand2,
    Pencil,
    X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface TokenValue {
    [key: string]: string;
}

interface DesignToken {
    id: number;
    name: string;
    slug: string;
    category: string;
    value: TokenValue;
    order: number;
}

interface CategoryDef {
    key: string;
    label: string;
}

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

function ColorSwatch({ value }: { value: TokenValue }) {
    const hex = value.hex ?? value.value ?? '#000';
    return (
        <div className="flex items-center gap-3">
            <div
                className="h-10 w-10 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: hex }}
            />
            <span className="text-sm font-mono text-gray-600">{hex}</span>
        </div>
    );
}

function TypographyPreview({ value }: { value: TokenValue }) {
    return (
        <div>
            <p
                style={{
                    fontSize: value.fontSize,
                    fontWeight: value.fontWeight as any,
                    lineHeight: value.lineHeight,
                    fontFamily: value.fontFamily,
                }}
            >
                Texte de preview
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">
                {value.fontSize} / {value.fontWeight} / {value.lineHeight}
            </p>
        </div>
    );
}

function SpacingPreview({ value }: { value: TokenValue }) {
    const size = `${value.value}${value.unit ?? 'rem'}`;
    return (
        <div className="flex items-center gap-3">
            <div
                className="bg-indigo-200 rounded"
                style={{ width: size, height: '24px', minWidth: '4px' }}
            />
            <span className="text-sm font-mono text-gray-600">{size}</span>
        </div>
    );
}

function ShadowPreview({ value }: { value: TokenValue }) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="h-10 w-16 rounded-lg bg-white border"
                style={{ boxShadow: value.value }}
            />
            <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">{value.value}</span>
        </div>
    );
}

function BorderPreview({ value }: { value: TokenValue }) {
    if (value.width) {
        return (
            <div className="flex items-center gap-3">
                <div
                    className="h-10 w-16 rounded"
                    style={{ border: `${value.width} ${value.style ?? 'solid'} ${value.color ?? '#000'}` }}
                />
                <span className="text-xs font-mono text-gray-500">
                    {value.width} {value.style} {value.color}
                </span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-3">
            <div className="h-10 w-16 bg-gray-100" style={{ borderRadius: value.value }} />
            <span className="text-sm font-mono text-gray-600">{value.value}</span>
        </div>
    );
}

function ButtonPreview({ value }: { value: TokenValue }) {
    const hex = value.value ?? '#4f46e5';
    return (
        <div className="flex items-center gap-3">
            <div
                className="h-8 w-8 rounded border border-gray-200"
                style={{ backgroundColor: hex }}
            />
            <span className="text-sm font-mono text-gray-600">{hex}</span>
        </div>
    );
}

function TokenPreview({ token }: { token: DesignToken }) {
    switch (token.category) {
        case 'color':
            return <ColorSwatch value={token.value} />;
        case 'typography':
            return <TypographyPreview value={token.value} />;
        case 'spacing':
            return <SpacingPreview value={token.value} />;
        case 'shadow':
            return <ShadowPreview value={token.value} />;
        case 'border':
            return <BorderPreview value={token.value} />;
        case 'button':
            return <ButtonPreview value={token.value} />;
        default:
            return <span className="text-sm text-gray-500">{JSON.stringify(token.value)}</span>;
    }
}

interface EditTokenFormProps {
    token?: DesignToken;
    category: string;
    onClose: () => void;
}

function EditTokenForm({ token, category, onClose }: EditTokenFormProps) {
    const isEdit = !!token;
    const form = useForm({
        name: token?.name ?? '',
        slug: token?.slug ?? '',
        category,
        value: token?.value ?? (category === 'color' ? { hex: '#000000' } : { value: '' }),
        order: token?.order ?? 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            form.put(`/admin/design-tokens/${token.id}`, { onSuccess: onClose });
        } else {
            form.post('/admin/design-tokens', { onSuccess: onClose });
        }
    };

    return (
        <form onSubmit={submit} className="bg-gray-50 rounded-lg p-4 border space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{isEdit ? 'Modifier' : 'Nouveau'} token</h4>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs">Nom</Label>
                    <Input
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>
                <div>
                    <Label className="text-xs">Slug</Label>
                    <Input
                        value={form.data.slug}
                        onChange={(e) => form.setData('slug', e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Auto-genere"
                    />
                </div>
            </div>

            {category === 'color' && (
                <div>
                    <Label className="text-xs">Couleur (hex)</Label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={(form.data.value as any).hex ?? '#000000'}
                            onChange={(e) => form.setData('value', { hex: e.target.value })}
                            className="h-8 w-10 cursor-pointer rounded border"
                        />
                        <Input
                            value={(form.data.value as any).hex ?? ''}
                            onChange={(e) => form.setData('value', { hex: e.target.value })}
                            className="h-8 text-sm font-mono"
                        />
                    </div>
                </div>
            )}

            {category === 'typography' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Font Size</Label>
                        <Input
                            value={(form.data.value as any).fontSize ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, fontSize: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="1rem"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Font Weight</Label>
                        <Input
                            value={(form.data.value as any).fontWeight ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, fontWeight: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="400"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Line Height</Label>
                        <Input
                            value={(form.data.value as any).lineHeight ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, lineHeight: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="1.5"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Font Family</Label>
                        <Input
                            value={(form.data.value as any).fontFamily ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, fontFamily: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="inherit"
                        />
                    </div>
                </div>
            )}

            {category === 'spacing' && (
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Label className="text-xs">Valeur</Label>
                        <Input
                            value={(form.data.value as any).value ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, value: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="1"
                        />
                    </div>
                    <div className="w-20">
                        <Label className="text-xs">Unite</Label>
                        <select
                            value={(form.data.value as any).unit ?? 'rem'}
                            onChange={(e) => form.setData('value', { ...form.data.value, unit: e.target.value })}
                            className="h-8 w-full rounded border text-sm px-2"
                        >
                            <option value="rem">rem</option>
                            <option value="px">px</option>
                            <option value="em">em</option>
                        </select>
                    </div>
                </div>
            )}

            {(category === 'shadow' || category === 'button') && (
                <div>
                    <Label className="text-xs">Valeur CSS</Label>
                    <Input
                        value={(form.data.value as any).value ?? ''}
                        onChange={(e) => form.setData('value', { value: e.target.value })}
                        className="h-8 text-sm font-mono"
                    />
                </div>
            )}

            {category === 'border' && (
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <Label className="text-xs">Largeur</Label>
                        <Input
                            value={(form.data.value as any).width ?? (form.data.value as any).value ?? ''}
                            onChange={(e) => {
                                const v = { ...form.data.value };
                                if ((v as any).width !== undefined) {
                                    (v as any).width = e.target.value;
                                } else {
                                    (v as any).value = e.target.value;
                                }
                                form.setData('value', v);
                            }}
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Style</Label>
                        <Input
                            value={(form.data.value as any).style ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, style: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="solid"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Couleur</Label>
                        <Input
                            value={(form.data.value as any).color ?? ''}
                            onChange={(e) => form.setData('value', { ...form.data.value, color: e.target.value })}
                            className="h-8 text-sm"
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Annuler
                </Button>
                <Button type="submit" size="sm" disabled={form.processing} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {isEdit ? 'Modifier' : 'Creer'}
                </Button>
            </div>
        </form>
    );
}

export default function StyleBookIndex({ tokens, categories }: StyleBookProps) {
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
                        onClick={() => router.post('/admin/design-tokens/seed-defaults')}
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

function resolveTokenDisplay(token: DesignToken): string {
    const v = token.value;
    switch (token.category) {
        case 'color':
            return v.hex ?? v.value ?? '#000';
        case 'typography':
            return v.fontSize ?? v.value ?? '1rem';
        case 'spacing':
            return `${v.value ?? '0'}${v.unit ?? 'rem'}`;
        case 'shadow':
        case 'button':
            return v.value ?? '';
        case 'border':
            if (v.width) return `${v.width} ${v.style ?? 'solid'} ${v.color ?? '#000'}`;
            return v.value ?? '';
        default:
            return v.value ?? JSON.stringify(v);
    }
}

import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Separator } from '@/Components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/Components/ui/dialog';
import {
    LayoutGrid,
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Pencil,
    Newspaper,
    FolderTree,
    Search,
    Type,
    Code,
    Calendar,
    Tags,
    AlertTriangle,
} from 'lucide-react';
import { useState, useCallback, FormEvent } from 'react';
import type { WidgetAreaData, WidgetData, WidgetTypeDefinition } from '@/types/cms';

// ---------------------------------------------------------------------------
// Icon map for widget types
// ---------------------------------------------------------------------------

const widgetIconMap: Record<string, typeof Newspaper> = {
    newspaper: Newspaper,
    'folder-tree': FolderTree,
    search: Search,
    type: Type,
    code: Code,
    calendar: Calendar,
    tags: Tags,
};

function getWidgetIcon(iconName: string) {
    return widgetIconMap[iconName] || LayoutGrid;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
    areas: WidgetAreaData[];
    widgetTypes: Record<string, WidgetTypeDefinition>;
}

// ---------------------------------------------------------------------------
// Widget Config Form
// ---------------------------------------------------------------------------

interface WidgetConfigFormProps {
    type: string;
    config: Record<string, unknown>;
    onChange: (config: Record<string, unknown>) => void;
}

function WidgetConfigForm({ type, config, onChange }: WidgetConfigFormProps) {
    const updateField = (key: string, value: unknown) => {
        onChange({ ...config, [key]: value });
    };

    switch (type) {
        case 'recent_posts':
            return (
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="config-count" className="text-xs text-gray-600">
                            Nombre d'articles
                        </Label>
                        <Input
                            id="config-count"
                            type="number"
                            min={1}
                            max={20}
                            value={(config.count as number) ?? 5}
                            onChange={(e) => updateField('count', parseInt(e.target.value, 10) || 5)}
                            className="mt-1"
                        />
                    </div>
                </div>
            );

        case 'categories':
            return (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="config-show-count" className="text-xs text-gray-600">
                            Afficher le nombre
                        </Label>
                        <Switch
                            id="config-show-count"
                            checked={(config.show_count as boolean) ?? true}
                            onCheckedChange={(v) => updateField('show_count', v)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="config-hierarchical" className="text-xs text-gray-600">
                            Hierarchique
                        </Label>
                        <Switch
                            id="config-hierarchical"
                            checked={(config.hierarchical as boolean) ?? false}
                            onCheckedChange={(v) => updateField('hierarchical', v)}
                        />
                    </div>
                </div>
            );

        case 'search':
            return (
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="config-placeholder" className="text-xs text-gray-600">
                            Texte du placeholder
                        </Label>
                        <Input
                            id="config-placeholder"
                            type="text"
                            value={(config.placeholder as string) ?? ''}
                            onChange={(e) => updateField('placeholder', e.target.value)}
                            className="mt-1"
                            placeholder="Rechercher..."
                        />
                    </div>
                </div>
            );

        case 'text':
            return (
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="config-content" className="text-xs text-gray-600">
                            Contenu
                        </Label>
                        <textarea
                            id="config-content"
                            value={(config.content as string) ?? ''}
                            onChange={(e) => updateField('content', e.target.value)}
                            rows={4}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Saisissez votre texte..."
                        />
                    </div>
                </div>
            );

        case 'custom_html':
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700">
                            Le HTML personnalise peut contenir du code potentiellement dangereux. Utilisez avec precaution.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="config-html" className="text-xs text-gray-600">
                            Code HTML
                        </Label>
                        <textarea
                            id="config-html"
                            value={(config.html as string) ?? ''}
                            onChange={(e) => updateField('html', e.target.value)}
                            rows={6}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="<div>...</div>"
                        />
                    </div>
                </div>
            );

        case 'archives':
            return (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="config-archive-count" className="text-xs text-gray-600">
                            Afficher le nombre
                        </Label>
                        <Switch
                            id="config-archive-count"
                            checked={(config.show_count as boolean) ?? true}
                            onCheckedChange={(v) => updateField('show_count', v)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="config-dropdown" className="text-xs text-gray-600">
                            Afficher en liste deroulante
                        </Label>
                        <Switch
                            id="config-dropdown"
                            checked={(config.dropdown as boolean) ?? false}
                            onCheckedChange={(v) => updateField('dropdown', v)}
                        />
                    </div>
                </div>
            );

        case 'tag_cloud':
            return (
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="config-max-tags" className="text-xs text-gray-600">
                            Nombre maximum de tags
                        </Label>
                        <Input
                            id="config-max-tags"
                            type="number"
                            min={5}
                            max={100}
                            value={(config.max_tags as number) ?? 20}
                            onChange={(e) => updateField('max_tags', parseInt(e.target.value, 10) || 20)}
                            className="mt-1"
                        />
                    </div>
                </div>
            );

        default:
            return (
                <p className="text-xs text-gray-400 italic">
                    Aucune option de configuration pour ce type de widget.
                </p>
            );
    }
}

// ---------------------------------------------------------------------------
// Widget Card
// ---------------------------------------------------------------------------

interface WidgetCardProps {
    widget: WidgetData;
    widgetTypes: Record<string, WidgetTypeDefinition>;
}

function WidgetCard({ widget, widgetTypes }: WidgetCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [title, setTitle] = useState(widget.title);
    const [config, setConfig] = useState<Record<string, unknown>>(widget.config ?? {});
    const [active, setActive] = useState(widget.active);
    const [saving, setSaving] = useState(false);

    const typeDef = widgetTypes[widget.type];
    const typeLabel = typeDef?.label ?? widget.type;
    const TypeIcon = typeDef ? getWidgetIcon(typeDef.icon) : LayoutGrid;

    const handleSave = () => {
        setSaving(true);
        router.put(
            `/admin/widgets/${widget.id}`,
            { type: widget.type, title, config: config as unknown as string, active },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            }
        );
    };

    const handleDelete = () => {
        if (!confirm(`Supprimer le widget "${widget.title}" ?`)) return;
        router.delete(`/admin/widgets/${widget.id}`, { preserveScroll: true });
    };

    const handleToggleActive = (checked: boolean) => {
        setActive(checked);
        router.put(
            `/admin/widgets/${widget.id}`,
            { type: widget.type, title: widget.title, config: widget.config as unknown as string, active: checked },
            { preserveScroll: true }
        );
    };

    return (
        <div className="border border-gray-200 rounded-lg bg-white">
            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                {expanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <TypeIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="font-medium text-sm text-gray-900 flex-1 truncate">
                    {widget.title}
                </span>
                <Badge variant="outline" className="text-xs shrink-0">
                    {typeLabel}
                </Badge>
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Switch
                        checked={active}
                        onCheckedChange={handleToggleActive}
                    />
                </div>
            </div>

            {/* Expanded config */}
            {expanded && (
                <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    <div>
                        <Label htmlFor={`widget-title-${widget.id}`} className="text-xs text-gray-600">
                            Titre du widget
                        </Label>
                        <Input
                            id={`widget-title-${widget.id}`}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    <Separator />

                    <WidgetConfigForm
                        type={widget.type}
                        config={config}
                        onChange={setConfig}
                    />

                    <Separator />

                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Supprimer
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Widget Area Section
// ---------------------------------------------------------------------------

interface WidgetAreaSectionProps {
    area: WidgetAreaData;
    widgetTypes: Record<string, WidgetTypeDefinition>;
}

function WidgetAreaSection({ area, widgetTypes }: WidgetAreaSectionProps) {
    const [expanded, setExpanded] = useState(true);
    const [editingArea, setEditingArea] = useState(false);
    const [areaName, setAreaName] = useState(area.name);
    const [areaSlug, setAreaSlug] = useState(area.slug);
    const [areaDescription, setAreaDescription] = useState(area.description ?? '');
    const [addingWidget, setAddingWidget] = useState(false);

    const handleUpdateArea = (e: FormEvent) => {
        e.preventDefault();
        router.put(
            `/admin/widget-areas/${area.id}`,
            { name: areaName, slug: areaSlug, description: areaDescription || null },
            {
                preserveScroll: true,
                onSuccess: () => setEditingArea(false),
            }
        );
    };

    const handleDeleteArea = () => {
        if (!confirm(`Supprimer la zone "${area.name}" et tous ses widgets ?`)) return;
        router.delete(`/admin/widget-areas/${area.id}`);
    };

    const handleAddWidget = (type: string, typeDef: WidgetTypeDefinition) => {
        router.post(
            `/admin/widget-areas/${area.id}/widgets`,
            {
                type,
                title: typeDef.label,
                config: typeDef.defaultConfig as unknown as string,
                active: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => setAddingWidget(false),
            }
        );
    };

    return (
        <Card>
            {/* Area header */}
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 cursor-pointer select-none"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <CardTitle className="text-base">{area.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {area.widgets.length} widget{area.widgets.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">
                            {area.slug}
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingArea(true)}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={handleDeleteArea}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
                {area.description && (
                    <p className="text-sm text-gray-500 mt-1 ml-7">{area.description}</p>
                )}
            </CardHeader>

            {/* Expanded content */}
            {expanded && (
                <CardContent className="pt-0">
                    {/* Widgets list */}
                    {area.widgets.length > 0 ? (
                        <div className="space-y-2 mb-4">
                            {area.widgets.map((widget) => (
                                <WidgetCard
                                    key={widget.id}
                                    widget={widget}
                                    widgetTypes={widgetTypes}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-sm text-gray-400 mb-4 border border-dashed border-gray-200 rounded-lg">
                            Aucun widget dans cette zone. Cliquez sur "Ajouter un widget" pour commencer.
                        </div>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => setAddingWidget(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter un widget
                    </Button>
                </CardContent>
            )}

            {/* Edit area dialog */}
            <Dialog open={editingArea} onOpenChange={setEditingArea}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier la zone de widgets</DialogTitle>
                        <DialogDescription>
                            Modifiez les informations de la zone "{area.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateArea} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-area-name">Nom</Label>
                            <Input
                                id="edit-area-name"
                                value={areaName}
                                onChange={(e) => setAreaName(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-area-slug">Slug</Label>
                            <Input
                                id="edit-area-slug"
                                value={areaSlug}
                                onChange={(e) => setAreaSlug(e.target.value)}
                                required
                                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                                className="mt-1 font-mono"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-area-desc">Description</Label>
                            <Input
                                id="edit-area-desc"
                                value={areaDescription}
                                onChange={(e) => setAreaDescription(e.target.value)}
                                className="mt-1"
                                placeholder="Optionnel"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingArea(false)}>
                                Annuler
                            </Button>
                            <Button type="submit">Enregistrer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add widget dialog */}
            <Dialog open={addingWidget} onOpenChange={setAddingWidget}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter un widget</DialogTitle>
                        <DialogDescription>
                            Choisissez un type de widget a ajouter dans la zone "{area.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-2">
                        {Object.entries(widgetTypes).map(([type, def]) => {
                            const Icon = getWidgetIcon(def.icon);
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                    onClick={() => handleAddWidget(type, def)}
                                >
                                    <Icon className="h-5 w-5 text-indigo-500 shrink-0" />
                                    <span className="text-sm font-medium text-gray-900">{def.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function WidgetsIndex({ areas, widgetTypes }: Props) {
    const [showCreateArea, setShowCreateArea] = useState(false);
    const [newAreaName, setNewAreaName] = useState('');
    const [newAreaSlug, setNewAreaSlug] = useState('');
    const [newAreaDescription, setNewAreaDescription] = useState('');

    const handleCreateArea = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            router.post(
                '/admin/widget-areas',
                {
                    name: newAreaName,
                    slug: newAreaSlug,
                    description: newAreaDescription || null,
                },
                {
                    onSuccess: () => {
                        setShowCreateArea(false);
                        setNewAreaName('');
                        setNewAreaSlug('');
                        setNewAreaDescription('');
                    },
                }
            );
        },
        [newAreaName, newAreaSlug, newAreaDescription]
    );

    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleNameChange = (value: string) => {
        setNewAreaName(value);
        if (!newAreaSlug || newAreaSlug === generateSlug(newAreaName)) {
            setNewAreaSlug(generateSlug(value));
        }
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5" />
                        Widgets
                    </h1>
                    <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setShowCreateArea(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter une zone
                    </Button>
                </div>
            }
        >
            <Head title="Widgets" />

            {/* Widget type palette (left panel on desktop) */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left panel: available widget types */}
                <div className="w-full lg:w-72 shrink-0">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Types de widgets</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-1">
                                {Object.entries(widgetTypes).map(([type, def]) => {
                                    const Icon = getWidgetIcon(def.icon);
                                    return (
                                        <div
                                            key={type}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-100"
                                        >
                                            <Icon className="h-4 w-4 text-indigo-500 shrink-0" />
                                            <span className="truncate">{def.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                Cliquez sur "Ajouter un widget" dans une zone pour placer un widget.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main area: widget areas */}
                <div className="flex-1 min-w-0">
                    {areas.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <LayoutGrid className="h-12 w-12 text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium">Aucune zone de widgets</p>
                                <p className="text-sm text-gray-400 mt-1 mb-4">
                                    Creez une zone de widgets pour y placer des widgets (barre laterale, pied de page, etc.).
                                </p>
                                <Button size="sm" onClick={() => setShowCreateArea(true)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Creer une zone
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {areas.map((area) => (
                                <WidgetAreaSection
                                    key={area.id}
                                    area={area}
                                    widgetTypes={widgetTypes}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create area dialog */}
            <Dialog open={showCreateArea} onOpenChange={setShowCreateArea}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouvelle zone de widgets</DialogTitle>
                        <DialogDescription>
                            Creez une zone de widgets pour organiser vos widgets dans votre site (barre laterale, pied de page, etc.).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateArea} className="space-y-4">
                        <div>
                            <Label htmlFor="new-area-name">Nom</Label>
                            <Input
                                id="new-area-name"
                                value={newAreaName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                required
                                className="mt-1"
                                placeholder="Barre laterale"
                            />
                        </div>
                        <div>
                            <Label htmlFor="new-area-slug">Slug</Label>
                            <Input
                                id="new-area-slug"
                                value={newAreaSlug}
                                onChange={(e) => setNewAreaSlug(e.target.value)}
                                required
                                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                                className="mt-1 font-mono"
                                placeholder="barre-laterale"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Identifiant unique utilise dans les templates. Lettres minuscules, chiffres et tirets uniquement.
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="new-area-desc">Description</Label>
                            <Input
                                id="new-area-desc"
                                value={newAreaDescription}
                                onChange={(e) => setNewAreaDescription(e.target.value)}
                                className="mt-1"
                                placeholder="Optionnel"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateArea(false)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit">Creer la zone</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

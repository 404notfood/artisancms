import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/Components/ui/dialog';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { WidgetAreaData, WidgetTypeDefinition } from '@/types/cms';
import { getWidgetIcon } from './widget-icons';
import { WidgetCard } from './WidgetCard';

export interface WidgetAreaSectionProps {
    area: WidgetAreaData;
    widgetTypes: Record<string, WidgetTypeDefinition>;
}

export function WidgetAreaSection({ area, widgetTypes }: WidgetAreaSectionProps) {
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

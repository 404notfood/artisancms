import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
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
import { LayoutGrid, Plus } from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';
import type { WidgetAreaData, WidgetTypeDefinition } from '@/types/cms';
import { getWidgetIcon } from './components/widget-icons';
import { WidgetAreaSection } from './components/WidgetAreaSection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
    areas: WidgetAreaData[];
    widgetTypes: Record<string, WidgetTypeDefinition>;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function WidgetsIndex({ areas, widgetTypes }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [showCreateArea, setShowCreateArea] = useState(false);
    const [newAreaName, setNewAreaName] = useState('');
    const [newAreaSlug, setNewAreaSlug] = useState('');
    const [newAreaDescription, setNewAreaDescription] = useState('');

    const handleCreateArea = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            router.post(
                `/${prefix}/widget-areas`,
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

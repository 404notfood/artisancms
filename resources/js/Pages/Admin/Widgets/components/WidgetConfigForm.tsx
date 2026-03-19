import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { AlertTriangle } from 'lucide-react';

export interface WidgetConfigFormProps {
    type: string;
    config: Record<string, unknown>;
    onChange: (config: Record<string, unknown>) => void;
}

export function WidgetConfigForm({ type, config, onChange }: WidgetConfigFormProps) {
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

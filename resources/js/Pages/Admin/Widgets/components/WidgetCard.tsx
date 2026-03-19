import { router } from '@inertiajs/react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Separator } from '@/Components/ui/separator';
import {
    ChevronDown,
    ChevronRight,
    GripVertical,
    Trash2,
    LayoutGrid,
} from 'lucide-react';
import { useState } from 'react';
import type { WidgetData, WidgetTypeDefinition } from '@/types/cms';
import { getWidgetIcon } from './widget-icons';
import { WidgetConfigForm } from './WidgetConfigForm';

export interface WidgetCardProps {
    widget: WidgetData;
    widgetTypes: Record<string, WidgetTypeDefinition>;
}

export function WidgetCard({ widget, widgetTypes }: WidgetCardProps) {
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

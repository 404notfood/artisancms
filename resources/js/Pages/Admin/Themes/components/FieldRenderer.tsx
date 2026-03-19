import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Upload } from 'lucide-react';
import { type FieldDefinition, FONT_OPTIONS } from './types';

interface FieldRendererProps {
    dotKey: string;
    definition: FieldDefinition;
    value: string | boolean;
    onChange: (value: string | boolean) => void;
    onImageUpload: (file: File) => void;
}

export default function FieldRenderer({ dotKey, definition, value, onChange, onImageUpload }: FieldRendererProps) {
    switch (definition.type) {
        case 'color':
            return (
                <div>
                    <Label htmlFor={dotKey}>{definition.label}</Label>
                    <div className="mt-1 flex items-center gap-3">
                        <input
                            type="color"
                            id={dotKey}
                            value={String(value || definition.default)}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-10 w-20 cursor-pointer rounded border"
                        />
                        <Input
                            value={String(value || definition.default)}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="#000000"
                            className="max-w-32 font-mono"
                        />
                    </div>
                </div>
            );

        case 'font':
            return (
                <div>
                    <Label htmlFor={dotKey}>{definition.label}</Label>
                    <select
                        id={dotKey}
                        value={String(value || definition.default)}
                        onChange={(e) => onChange(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.label}
                            </option>
                        ))}
                    </select>
                </div>
            );

        case 'select':
            return (
                <div>
                    <Label htmlFor={dotKey}>{definition.label}</Label>
                    <select
                        id={dotKey}
                        value={String(value ?? definition.default)}
                        onChange={(e) => onChange(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {(definition.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            );

        case 'text':
            return (
                <div>
                    <Label htmlFor={dotKey}>{definition.label}</Label>
                    <Input
                        id={dotKey}
                        value={String(value || '')}
                        onChange={(e) => onChange(e.target.value)}
                        className="mt-1"
                    />
                </div>
            );

        case 'boolean':
            return (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                    <Label htmlFor={dotKey} className="cursor-pointer">
                        {definition.label}
                    </Label>
                    <Switch
                        id={dotKey}
                        checked={Boolean(value)}
                        onCheckedChange={(checked) => onChange(checked)}
                    />
                </div>
            );

        case 'image':
            return (
                <div>
                    <Label>{definition.label}</Label>
                    <div className="mt-1 flex items-center gap-3">
                        <Input
                            value={String(value || '')}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="/storage/media/logo.png"
                            className="flex-1"
                        />
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                            <Upload className="h-4 w-4" />
                            Upload
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onImageUpload(file);
                                }}
                            />
                        </label>
                    </div>
                    {value && typeof value === 'string' && value.length > 0 && (
                        <img
                            src={value}
                            alt="Preview"
                            className="mt-2 h-12 rounded border object-contain"
                        />
                    )}
                </div>
            );

        default:
            return null;
    }
}

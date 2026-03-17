import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';

interface FieldSchema {
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'color' | 'password';
    default?: string | number | boolean;
    description?: string;
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
}

interface PluginSettingsFormProps {
    schema: FieldSchema[];
    values: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
}

export default function PluginSettingsForm({ schema, values, onChange }: PluginSettingsFormProps) {
    if (!schema || schema.length === 0) {
        return (
            <p className="text-sm text-gray-500 py-8 text-center">
                Ce plugin n'a pas de parametres configurables.
            </p>
        );
    }

    return (
        <div className="space-y-5">
            {schema.map((field) => {
                const value = values[field.key] ?? field.default ?? '';

                switch (field.type) {
                    case 'text':
                    case 'password':
                        return (
                            <div key={field.key}>
                                <Label htmlFor={field.key}>{field.label}</Label>
                                {field.description && (
                                    <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>
                                )}
                                <Input
                                    id={field.key}
                                    type={field.type}
                                    value={String(value)}
                                    onChange={(e) => onChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="mt-1"
                                />
                            </div>
                        );

                    case 'number':
                        return (
                            <div key={field.key}>
                                <Label htmlFor={field.key}>{field.label}</Label>
                                {field.description && (
                                    <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>
                                )}
                                <Input
                                    id={field.key}
                                    type="number"
                                    value={Number(value)}
                                    onChange={(e) => onChange(field.key, Number(e.target.value))}
                                    className="mt-1"
                                />
                            </div>
                        );

                    case 'boolean':
                        return (
                            <div key={field.key} className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <div>
                                    <Label htmlFor={field.key} className="cursor-pointer">{field.label}</Label>
                                    {field.description && (
                                        <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>
                                    )}
                                </div>
                                <Switch
                                    id={field.key}
                                    checked={Boolean(value)}
                                    onCheckedChange={(checked) => onChange(field.key, checked)}
                                />
                            </div>
                        );

                    case 'select':
                        return (
                            <div key={field.key}>
                                <Label htmlFor={field.key}>{field.label}</Label>
                                {field.description && (
                                    <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>
                                )}
                                <select
                                    id={field.key}
                                    value={String(value)}
                                    onChange={(e) => onChange(field.key, e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                >
                                    {(field.options ?? []).map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );

                    case 'textarea':
                        return (
                            <div key={field.key}>
                                <Label htmlFor={field.key}>{field.label}</Label>
                                {field.description && (
                                    <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>
                                )}
                                <textarea
                                    id={field.key}
                                    value={String(value)}
                                    onChange={(e) => onChange(field.key, e.target.value)}
                                    rows={4}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                            </div>
                        );

                    case 'color':
                        return (
                            <div key={field.key}>
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={String(value || '#000000')}
                                        onChange={(e) => onChange(field.key, e.target.value)}
                                        className="h-10 w-14 cursor-pointer rounded border"
                                    />
                                    <Input
                                        value={String(value)}
                                        onChange={(e) => onChange(field.key, e.target.value)}
                                        className="max-w-32 font-mono"
                                    />
                                </div>
                            </div>
                        );

                    default:
                        return null;
                }
            })}
        </div>
    );
}

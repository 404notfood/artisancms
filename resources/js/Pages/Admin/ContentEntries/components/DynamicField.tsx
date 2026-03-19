import type { ContentTypeFieldDef } from '@/types/cms';

interface DynamicFieldProps {
    field: ContentTypeFieldDef;
    value: unknown;
    onChange: (value: unknown) => void;
    error?: string;
}

const baseInputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function renderField(field: ContentTypeFieldDef, value: unknown, onChange: (value: unknown) => void) {
    switch (field.type) {
        case 'text':
        case 'email':
        case 'url':
            return (
                <input
                    type={field.type}
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={baseInputClass}
                    placeholder={field.placeholder ?? ''}
                    required={field.required}
                />
            );

        case 'number':
            return (
                <input
                    type="number"
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={baseInputClass}
                    placeholder={field.placeholder ?? ''}
                    required={field.required}
                />
            );

        case 'date':
            return (
                <input
                    type="date"
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={baseInputClass}
                    required={field.required}
                />
            );

        case 'datetime':
            return (
                <input
                    type="datetime-local"
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={baseInputClass}
                    required={field.required}
                />
            );

        case 'color':
            return (
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={(value as string) ?? '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-10 w-14 rounded border border-gray-300 p-1 cursor-pointer"
                    />
                    <input
                        type="text"
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={baseInputClass}
                        placeholder="#000000"
                    />
                </div>
            );

        case 'textarea':
        case 'wysiwyg':
            return (
                <textarea
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    rows={field.type === 'wysiwyg' ? 6 : 3}
                    className={baseInputClass}
                    placeholder={field.placeholder ?? ''}
                    required={field.required}
                />
            );

        case 'select':
            return (
                <select
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={baseInputClass}
                    required={field.required}
                >
                    <option value="">-- Selectionnez --</option>
                    {(field.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );

        case 'radio':
            return (
                <div className="flex flex-wrap gap-4">
                    {(field.options ?? []).map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`field_${field.slug}`}
                                value={opt}
                                checked={(value as string) === opt}
                                onChange={(e) => onChange(e.target.value)}
                                className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                    ))}
                </div>
            );

        case 'checkbox':
            return (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{field.placeholder ?? field.name}</span>
                </label>
            );

        case 'file':
        case 'image':
            return (
                <input
                    type="text"
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={baseInputClass}
                    placeholder={field.type === 'image' ? "URL de l'image..." : 'URL du fichier...'}
                />
            );

        default:
            return (
                <input
                    type="text"
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={baseInputClass}
                    placeholder={field.placeholder ?? ''}
                />
            );
    }
}

export default function DynamicField({ field, value, onChange, error }: DynamicFieldProps) {
    const label = (
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
    );

    return (
        <div>
            {field.type !== 'checkbox' && label}
            {renderField(field, value, onChange)}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

import { useState } from 'react';
import type { CustomFieldType } from '@/types/cms';
import { ChevronRight, ChevronUp, ChevronDown, Trash2, X } from 'lucide-react';
import type { FieldEntry } from './types';
import { fieldTypeLabels, typesWithOptions } from './types';

export interface FieldEditorProps {
    field: FieldEntry;
    index: number;
    totalFields: number;
    fieldTypes: string[];
    errors: Record<string, string>;
    onUpdate: (updates: Partial<FieldEntry>) => void;
    onRemove: () => void;
    onMove: (direction: 'up' | 'down') => void;
    onAddOption: () => void;
    onUpdateOption: (
        optionIndex: number,
        updates: Partial<{ label: string; value: string }>
    ) => void;
    onRemoveOption: (optionIndex: number) => void;
}

export function FieldEditor({
    field,
    index,
    totalFields,
    fieldTypes,
    errors,
    onUpdate,
    onRemove,
    onMove,
    onAddOption,
    onUpdateOption,
    onRemoveOption,
}: FieldEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasOptions = typesWithOptions.includes(field.type);

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50">
            {/* Field header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                    <ChevronRight
                        className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                    <span>{field.name || `Champ ${index + 1}`}</span>
                    <span className="text-xs text-gray-400 font-normal">
                        ({fieldTypeLabels[field.type] ?? field.type})
                    </span>
                    {field.id && (
                        <span className="text-xs text-gray-300 font-mono">#{field.id}</span>
                    )}
                </button>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onMove('up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Monter"
                    >
                        <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove('down')}
                        disabled={index === totalFields - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Descendre"
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={totalFields <= 1}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                        title="Supprimer"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Field body */}
            {isExpanded && (
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">
                                Nom du champ
                            </label>
                            <input
                                type="text"
                                value={field.name}
                                onChange={(e) => onUpdate({ name: e.target.value })}
                                placeholder="Ex : Prix"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            {errors[`fields.${index}.name`] && (
                                <p className="mt-0.5 text-xs text-red-600">
                                    {errors[`fields.${index}.name`]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600">Slug</label>
                            <input
                                type="text"
                                value={field.slug}
                                onChange={(e) => onUpdate({ slug: e.target.value })}
                                placeholder="prix"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            {errors[`fields.${index}.slug`] && (
                                <p className="mt-0.5 text-xs text-red-600">
                                    {errors[`fields.${index}.slug`]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600">Type</label>
                            <select
                                value={field.type}
                                onChange={(e) =>
                                    onUpdate({ type: e.target.value as CustomFieldType })
                                }
                                className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {fieldTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {fieldTypeLabels[type] ?? type}
                                    </option>
                                ))}
                            </select>
                            {errors[`fields.${index}.type`] && (
                                <p className="mt-0.5 text-xs text-red-600">
                                    {errors[`fields.${index}.type`]}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">
                                Description / aide
                            </label>
                            <input
                                type="text"
                                value={field.description}
                                onChange={(e) => onUpdate({ description: e.target.value })}
                                placeholder="Texte d'aide affiché sous le champ"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600">
                                Placeholder
                            </label>
                            <input
                                type="text"
                                value={field.placeholder}
                                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                                placeholder="Texte indicatif dans le champ"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">
                                Valeur par défaut
                            </label>
                            <input
                                type="text"
                                value={field.default_value}
                                onChange={(e) => onUpdate({ default_value: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex items-end gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={field.validation.required}
                                    onChange={(e) =>
                                        onUpdate({
                                            validation: {
                                                ...field.validation,
                                                required: e.target.checked,
                                            },
                                        })
                                    }
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Requis
                            </label>

                            {(field.type === 'number' ||
                                field.type === 'text' ||
                                field.type === 'textarea') && (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-xs text-gray-500">Min</label>
                                        <input
                                            type="number"
                                            value={field.validation.min}
                                            onChange={(e) =>
                                                onUpdate({
                                                    validation: {
                                                        ...field.validation,
                                                        min: e.target.value,
                                                    },
                                                })
                                            }
                                            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-xs text-gray-500">Max</label>
                                        <input
                                            type="number"
                                            value={field.validation.max}
                                            onChange={(e) =>
                                                onUpdate({
                                                    validation: {
                                                        ...field.validation,
                                                        max: e.target.value,
                                                    },
                                                })
                                            }
                                            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Options for select/radio/checkbox */}
                    {hasOptions && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium text-gray-600">
                                    Options
                                </label>
                                <button
                                    type="button"
                                    onClick={onAddOption}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    + Ajouter une option
                                </button>
                            </div>
                            {field.options.length === 0 && (
                                <p className="text-xs text-gray-400 italic">
                                    Aucune option définie. Ajoutez des options pour ce champ.
                                </p>
                            )}
                            <div className="space-y-2">
                                {field.options.map((option, oi) => (
                                    <div key={oi} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={option.label}
                                            onChange={(e) =>
                                                onUpdateOption(oi, { label: e.target.value })
                                            }
                                            placeholder="Label"
                                            className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <input
                                            type="text"
                                            value={option.value}
                                            onChange={(e) =>
                                                onUpdateOption(oi, { value: e.target.value })
                                            }
                                            placeholder="Valeur"
                                            className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onRemoveOption(oi)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                            title="Supprimer l'option"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

import type { ContentTypeFieldDef } from '@/types/cms';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { fieldTypes } from './content-type-helpers';

interface FieldRowProps {
    field: ContentTypeFieldDef;
    index: number;
    total: number;
    onUpdate: (updates: Partial<ContentTypeFieldDef>) => void;
    onNameChange: (name: string) => void;
    onRemove: () => void;
    onMove: (direction: 'up' | 'down') => void;
}

export default function FieldRow({ field, index, total, onUpdate, onNameChange, onRemove, onMove }: FieldRowProps) {
    const needsOptions = field.type === 'select' || field.type === 'radio';

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-1 pt-1">
                    <button
                        type="button"
                        onClick={() => onMove('up')}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Monter"
                    >
                        <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove('down')}
                        disabled={index === total - 1}
                        className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Descendre"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </div>

                {/* Field config */}
                <div className="flex-1 grid gap-3 sm:grid-cols-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nom du champ</label>
                        <input
                            type="text"
                            value={field.name}
                            onChange={(e) => onNameChange(e.target.value)}
                            className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="ex: Poste, Date debut..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                        <input
                            type="text"
                            value={field.slug}
                            onChange={(e) => onUpdate({ slug: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="poste"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <select
                            value={field.type}
                            onChange={(e) => onUpdate({ type: e.target.value as ContentTypeFieldDef['type'] })}
                            className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            {fieldTypes.map((ft) => (
                                <option key={ft.value} value={ft.value}>{ft.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
                        <input
                            type="text"
                            value={field.placeholder ?? ''}
                            onChange={(e) => onUpdate({ placeholder: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Texte d'aide..."
                        />
                    </div>
                </div>

                {/* Required + remove */}
                <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-1.5 cursor-pointer" title="Obligatoire">
                        <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => onUpdate({ required: e.target.checked })}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-600">Requis</span>
                    </label>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="rounded p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer ce champ"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Options for select/radio */}
            {needsOptions && (
                <div className="mt-3 ml-10">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Options (une par ligne ou separees par des virgules)
                    </label>
                    <textarea
                        value={(field.options ?? []).join(', ')}
                        onChange={(e) => {
                            const opts = e.target.value
                                .split(/[,\n]/)
                                .map((o) => o.trim())
                                .filter(Boolean);
                            onUpdate({ options: opts });
                        }}
                        rows={2}
                        className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Option 1, Option 2, Option 3"
                    />
                </div>
            )}
        </div>
    );
}

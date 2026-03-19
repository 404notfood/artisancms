import { Plus } from 'lucide-react';
import type { FieldEntry } from './types';
import { FieldEditor } from './FieldEditor';

interface FieldListSectionProps {
    fields: FieldEntry[];
    fieldTypes: string[];
    errors: Record<string, string>;
    onAddField: () => void;
    onUpdateField: (index: number, updates: Partial<FieldEntry>) => void;
    onRemoveField: (index: number) => void;
    onMoveField: (index: number, direction: 'up' | 'down') => void;
    onAddOption: (fieldIndex: number) => void;
    onUpdateOption: (
        fieldIndex: number,
        optionIndex: number,
        updates: Partial<{ label: string; value: string }>
    ) => void;
    onRemoveOption: (fieldIndex: number, optionIndex: number) => void;
}

export function FieldListSection({
    fields,
    fieldTypes,
    errors,
    onAddField,
    onUpdateField,
    onRemoveField,
    onMoveField,
    onAddOption,
    onUpdateOption,
    onRemoveOption,
}: FieldListSectionProps) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Champs</h2>
                <button
                    type="button"
                    onClick={onAddField}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter un champ
                </button>
            </div>

            {errors.fields && <p className="text-sm text-red-600">{errors.fields}</p>}

            <div className="space-y-4">
                {fields.map((field, index) => (
                    <FieldEditor
                        key={field.id ?? `new-${index}`}
                        field={field}
                        index={index}
                        totalFields={fields.length}
                        fieldTypes={fieldTypes}
                        errors={errors}
                        onUpdate={(updates) => onUpdateField(index, updates)}
                        onRemove={() => onRemoveField(index)}
                        onMove={(dir) => onMoveField(index, dir)}
                        onAddOption={() => onAddOption(index)}
                        onUpdateOption={(oi, updates) => onUpdateOption(index, oi, updates)}
                        onRemoveOption={(oi) => onRemoveOption(index, oi)}
                    />
                ))}
            </div>
        </div>
    );
}

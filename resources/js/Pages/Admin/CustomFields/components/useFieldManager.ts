import { useState } from 'react';
import type { FieldEntry } from './types';
import { generateSlug } from './types';

export function useFieldManager(initialFields: FieldEntry[]) {
    const [fields, setFields] = useState<FieldEntry[]>(initialFields);

    function updateField(index: number, updates: Partial<FieldEntry>) {
        setFields((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...updates };

            // Auto-generate slug from name for new fields (id === null) or
            // fields whose slug still matches the auto-generated one
            if (
                'name' in updates &&
                (updated[index].id === null || true) &&
                (updated[index].slug === '' ||
                    updated[index].slug === generateSlug(prev[index].name))
            ) {
                updated[index].slug = generateSlug(updates.name ?? '');
            }

            return updated;
        });
    }

    function addField() {
        setFields((prev) => [...prev, {
            id: null,
            name: '',
            slug: '',
            type: 'text',
            description: '',
            placeholder: '',
            default_value: '',
            options: [],
            validation: { required: false, min: '', max: '' },
            order: prev.length,
        }]);
    }

    function removeField(index: number) {
        if (fields.length <= 1) return;
        setFields((prev) =>
            prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i }))
        );
    }

    function moveField(index: number, direction: 'up' | 'down') {
        setFields((prev) => {
            const updated = [...prev];
            const swapIndex = direction === 'up' ? index - 1 : index + 1;
            if (swapIndex < 0 || swapIndex >= updated.length) return prev;
            [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
            return updated.map((f, i) => ({ ...f, order: i }));
        });
    }

    function addOption(fieldIndex: number) {
        setFields((prev) => {
            const updated = [...prev];
            updated[fieldIndex] = {
                ...updated[fieldIndex],
                options: [...updated[fieldIndex].options, { label: '', value: '' }],
            };
            return updated;
        });
    }

    function updateOption(
        fieldIndex: number,
        optionIndex: number,
        updates: Partial<{ label: string; value: string }>
    ) {
        setFields((prev) => {
            const updated = [...prev];
            const options = [...updated[fieldIndex].options];
            options[optionIndex] = { ...options[optionIndex], ...updates };

            if ('label' in updates) {
                const currentOption = updated[fieldIndex].options[optionIndex];
                if (
                    currentOption.value === '' ||
                    currentOption.value === generateSlug(currentOption.label)
                ) {
                    options[optionIndex].value = generateSlug(updates.label ?? '');
                }
            }

            updated[fieldIndex] = { ...updated[fieldIndex], options };
            return updated;
        });
    }

    function removeOption(fieldIndex: number, optionIndex: number) {
        setFields((prev) => {
            const updated = [...prev];
            updated[fieldIndex] = {
                ...updated[fieldIndex],
                options: updated[fieldIndex].options.filter((_, i) => i !== optionIndex),
            };
            return updated;
        });
    }

    return {
        fields,
        updateField,
        addField,
        removeField,
        moveField,
        addOption,
        updateOption,
        removeOption,
    };
}

import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import type { CustomFieldGroupData, CustomFieldType } from '@/types/cms';

interface FieldEntry {
    id: number | null;
    name: string;
    slug: string;
    type: CustomFieldType;
    description: string;
    placeholder: string;
    default_value: string;
    options: { label: string; value: string }[];
    validation: { required: boolean; min: string; max: string };
    order: number;
}

interface Props {
    group: CustomFieldGroupData;
    fieldTypes: string[];
}

const fieldTypeLabels: Record<string, string> = {
    text: 'Texte court',
    textarea: 'Texte long',
    wysiwyg: 'Éditeur visuel',
    number: 'Nombre',
    email: 'E-mail',
    url: 'URL',
    select: 'Liste déroulante',
    checkbox: 'Cases à cocher',
    radio: 'Boutons radio',
    image: 'Image',
    file: 'Fichier',
    date: 'Date',
    datetime: 'Date et heure',
    color: 'Couleur',
    repeater: 'Répéteur',
};

const typesWithOptions = ['select', 'checkbox', 'radio'];

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
}

function createEmptyField(order: number): FieldEntry {
    return {
        id: null,
        name: '',
        slug: '',
        type: 'text',
        description: '',
        placeholder: '',
        default_value: '',
        options: [],
        validation: { required: false, min: '', max: '' },
        order,
    };
}

function fieldFromData(f: NonNullable<CustomFieldGroupData['fields']>[number]): FieldEntry {
    return {
        id: f.id,
        name: f.name,
        slug: f.slug,
        type: f.type,
        description: f.description ?? '',
        placeholder: f.placeholder ?? '',
        default_value: f.default_value ?? '',
        options: f.options ?? [],
        validation: {
            required: f.validation?.required ?? false,
            min: f.validation?.min !== undefined ? String(f.validation.min) : '',
            max: f.validation?.max !== undefined ? String(f.validation.max) : '',
        },
        order: f.order,
    };
}

const appliesToOptions = [
    { label: 'Pages', value: 'page' },
    { label: 'Articles', value: 'post' },
];

export default function CustomFieldsEdit({ group, fieldTypes }: Props) {
    const initialFields =
        group.fields && group.fields.length > 0
            ? group.fields.map(fieldFromData)
            : [createEmptyField(0)];

    const [fields, setFields] = useState<FieldEntry[]>(initialFields);

    const { data, setData, put, processing, errors } = useForm({
        name: group.name,
        slug: group.slug,
        description: group.description ?? '',
        applies_to: group.applies_to,
        position: group.position,
        order: group.order,
        active: group.active,
        fields: initialFields as FieldEntry[],
    });

    function toggleAppliesTo(value: string) {
        setData((prev) => {
            const current = prev.applies_to;
            const updated = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
            return { ...prev, applies_to: updated };
        });
    }

    function updateField(index: number, updates: Partial<FieldEntry>) {
        setFields((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...updates };

            // Auto-generate slug from name for new fields
            if (
                'name' in updates &&
                updated[index].id === null &&
                (updated[index].slug === '' ||
                    updated[index].slug === generateSlug(prev[index].name))
            ) {
                updated[index].slug = generateSlug(updates.name ?? '');
            }

            return updated;
        });
    }

    function addField() {
        setFields((prev) => [...prev, createEmptyField(prev.length)]);
    }

    function removeField(index: number) {
        if (fields.length <= 1) return;
        setFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })));
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

    function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();

        const preparedFields = fields.map((field, i) => ({
            ...field,
            order: i,
            options: typesWithOptions.includes(field.type)
                ? field.options.length > 0
                    ? field.options
                    : null
                : null,
            validation: {
                required: field.validation.required,
                ...(field.validation.min !== '' ? { min: Number(field.validation.min) } : {}),
                ...(field.validation.max !== '' ? { max: Number(field.validation.max) } : {}),
            },
        }));

        router.put(`/admin/custom-fields/${group.id}`, {
            name: data.name,
            slug: data.slug,
            description: data.description,
            applies_to: data.applies_to,
            position: data.position,
            order: data.order,
            active: data.active,
            fields: JSON.stringify(preparedFields),
        });
    }

    function handleDelete() {
        if (
            !confirm(
                `Supprimer le groupe "${group.name}" et tous ses champs ? Cette action est irréversible.`
            )
        ) {
            return;
        }
        router.delete(`/admin/custom-fields/${group.id}`);
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/custom-fields"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <BackIcon />
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-900">
                            Modifier le groupe de champs
                        </h1>
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                group.active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {group.active ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                    >
                        Supprimer
                    </button>
                </div>
            }
        >
            <Head title={`Modifier : ${group.name}`} />

            <form onSubmit={handleFormSubmit} className="mx-auto max-w-4xl space-y-6">
                {/* Group settings */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Paramètres du groupe</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Nom du groupe
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="slug"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Slug
                            </label>
                            <input
                                id="slug"
                                type="text"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                            {errors.slug && (
                                <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                S'applique à
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {appliesToOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => toggleAppliesTo(option.value)}
                                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                                            data.applies_to.includes(option.value)
                                                ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            {errors.applies_to && (
                                <p className="mt-1 text-sm text-red-600">{errors.applies_to}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="position"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Position dans l'éditeur
                            </label>
                            <select
                                id="position"
                                value={data.position}
                                onChange={(e) => setData('position', e.target.value as 'normal' | 'side')}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="normal">Normal (sous le contenu)</option>
                                <option value="side">Barre latérale</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.active}
                                onChange={(e) => setData('active', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Groupe actif
                        </label>
                    </div>
                </div>

                {/* Fields list */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900">Champs</h2>
                        <button
                            type="button"
                            onClick={addField}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <PlusIcon />
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
                                onUpdate={(updates) => updateField(index, updates)}
                                onRemove={() => removeField(index)}
                                onMove={(dir) => moveField(index, dir)}
                                onAddOption={() => addOption(index)}
                                onUpdateOption={(oi, updates) => updateOption(index, oi, updates)}
                                onRemoveOption={(oi) => removeOption(index, oi)}
                            />
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/admin/custom-fields"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}

interface FieldEditorProps {
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

function FieldEditor({
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
                    <ChevronIcon expanded={isExpanded} />
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
                        <ArrowUpIcon />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove('down')}
                        disabled={index === totalFields - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Descendre"
                    >
                        <ArrowDownIcon />
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={totalFields <= 1}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                        title="Supprimer"
                    >
                        <TrashSmallIcon />
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
                                            <XIcon />
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

// ─── Icons ───────────────────────────────────────────

function BackIcon() {
    return (
        <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
    return (
        <svg
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    );
}

function ArrowUpIcon() {
    return (
        <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
    );
}

function ArrowDownIcon() {
    return (
        <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    );
}

function TrashSmallIcon() {
    return (
        <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
        </svg>
    );
}

function XIcon() {
    return (
        <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

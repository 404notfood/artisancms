import { useForm } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import type { ContentTypeData, ContentTypeFieldDef } from '@/types/cms';

interface ContentTypeFormProps {
    contentType?: ContentTypeData;
}

const fieldTypes = [
    { value: 'text', label: 'Texte court' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'wysiwyg', label: 'Editeur riche' },
    { value: 'number', label: 'Nombre' },
    { value: 'email', label: 'E-mail' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date et heure' },
    { value: 'select', label: 'Liste deroulante' },
    { value: 'checkbox', label: 'Case a cocher' },
    { value: 'radio', label: 'Boutons radio' },
    { value: 'file', label: 'Fichier' },
    { value: 'image', label: 'Image' },
    { value: 'color', label: 'Couleur' },
];

const supportOptions = [
    { value: 'title', label: 'Titre' },
    { value: 'slug', label: 'Slug' },
    { value: 'featured_image', label: 'Image mise en avant' },
    { value: 'excerpt', label: 'Extrait' },
    { value: 'content', label: 'Contenu (page builder)' },
    { value: 'taxonomies', label: 'Taxonomies' },
    { value: 'revisions', label: 'Revisions' },
    { value: 'comments', label: 'Commentaires' },
];

function slugify(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function createEmptyField(order: number): ContentTypeFieldDef {
    return {
        name: '',
        slug: '',
        type: 'text',
        required: false,
        placeholder: '',
        options: [],
        order,
    };
}

export default function ContentTypeForm({ contentType }: ContentTypeFormProps) {
    const isEditing = !!contentType;

    const { data, setData, post, put, processing, errors } = useForm({
        name: contentType?.name ?? '',
        slug: contentType?.slug ?? '',
        description: contentType?.description ?? '',
        icon: contentType?.icon ?? '',
        fields: contentType?.fields ?? [],
        supports: contentType?.supports ?? ['title', 'slug'],
        has_archive: contentType?.has_archive ?? false,
        public: contentType?.public ?? true,
        menu_position: contentType?.menu_position ?? 0,
    });

    const [slugManual, setSlugManual] = useState(isEditing);

    function handleNameChange(name: string) {
        setData('name', name);
        if (!slugManual) {
            setData((prev) => ({ ...prev, name, slug: slugify(name) }));
        }
    }

    function handleSupportsToggle(value: string) {
        const current = data.supports;
        if (current.includes(value)) {
            setData('supports', current.filter((s) => s !== value));
        } else {
            setData('supports', [...current, value]);
        }
    }

    // ---- Field management ----

    function addField() {
        setData('fields', [...data.fields, createEmptyField(data.fields.length)]);
    }

    function updateField(index: number, updates: Partial<ContentTypeFieldDef>) {
        const newFields = [...data.fields];
        newFields[index] = { ...newFields[index], ...updates };
        setData('fields', newFields);
    }

    function removeField(index: number) {
        const newFields = data.fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i }));
        setData('fields', newFields);
    }

    function moveField(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= data.fields.length) return;
        const newFields = [...data.fields];
        [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
        setData('fields', newFields.map((f, i) => ({ ...f, order: i })));
    }

    function handleFieldNameChange(index: number, name: string) {
        updateField(index, { name, slug: slugify(name) });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing) {
            put(`/admin/content-types/${contentType.id}`);
        } else {
            post('/admin/content-types');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* General info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informations generales</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="ex: Portfolio, Temoignages, Equipe..."
                            required
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.slug}
                            onChange={(e) => {
                                setSlugManual(true);
                                setData('slug', e.target.value);
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="portfolio"
                            required
                        />
                        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Description optionnelle du type de contenu..."
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icone (emoji)</label>
                        <input
                            type="text"
                            value={data.icon}
                            onChange={(e) => setData('icon', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="ex: 🎨 📸 👥 📅"
                            maxLength={10}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position dans le menu</label>
                        <input
                            type="number"
                            value={data.menu_position}
                            onChange={(e) => setData('menu_position', parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            min={0}
                        />
                    </div>
                </div>
            </div>

            {/* Supports */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Fonctionnalites supportees</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Selectionnez les fonctionnalites disponibles pour ce type de contenu.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {supportOptions.map((opt) => (
                        <label
                            key={opt.value}
                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                                data.supports.includes(opt.value)
                                    ? 'border-indigo-300 bg-indigo-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={data.supports.includes(opt.value)}
                                onChange={() => handleSupportsToggle(opt.value)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Options */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Options</h2>

                <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.has_archive}
                            onChange={(e) => setData('has_archive', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-700">Page d'archive</span>
                            <p className="text-xs text-gray-500">Generer automatiquement une page listant les entrees</p>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.public}
                            onChange={(e) => setData('public', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-700">Public</span>
                            <p className="text-xs text-gray-500">Les entrees sont visibles sur le front-end</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Custom Fields Builder */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Champs personnalises</h2>
                        <p className="text-sm text-gray-500">
                            Definissez les champs specifiques a ce type de contenu.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addField}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        <PlusIcon />
                        Ajouter un champ
                    </button>
                </div>

                {data.fields.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                        <p className="text-sm text-gray-500">
                            Aucun champ personnalise. Cliquez sur "Ajouter un champ" pour commencer.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.fields.map((field, index) => (
                            <FieldRow
                                key={index}
                                field={field}
                                index={index}
                                total={data.fields.length}
                                onUpdate={(updates) => updateField(index, updates)}
                                onNameChange={(name) => handleFieldNameChange(index, name)}
                                onRemove={() => removeField(index)}
                                onMove={(dir) => moveField(index, dir)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3">
                <a
                    href="/admin/content-types"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Annuler
                </a>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {processing ? 'Enregistrement...' : isEditing ? 'Mettre a jour' : 'Creer le type de contenu'}
                </button>
            </div>
        </form>
    );
}

// ---- Field Row Component ----

interface FieldRowProps {
    field: ContentTypeFieldDef;
    index: number;
    total: number;
    onUpdate: (updates: Partial<ContentTypeFieldDef>) => void;
    onNameChange: (name: string) => void;
    onRemove: () => void;
    onMove: (direction: 'up' | 'down') => void;
}

function FieldRow({ field, index, total, onUpdate, onNameChange, onRemove, onMove }: FieldRowProps) {
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
                        <ChevronUpIcon />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove('down')}
                        disabled={index === total - 1}
                        className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="Descendre"
                    >
                        <ChevronDownIcon />
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
                        <TrashIcon />
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

// ---- Icons ----

function PlusIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}

function ChevronUpIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    );
}

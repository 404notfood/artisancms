import { useForm , usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ContentTypeData, ContentTypeFieldDef, SharedProps } from '@/types/cms';
import { Plus } from 'lucide-react';
import { supportOptions, slugify, createEmptyField } from './components/content-type-helpers';
import FieldRow from './components/FieldRow';

interface ContentTypeFormProps {
    contentType?: ContentTypeData;
}

export default function ContentTypeForm({ contentType }: ContentTypeFormProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
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
            post(`/${prefix}/content-types`);
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
                        <Plus className="h-4 w-4" />
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
                    href={`/${prefix}/content-types`}
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

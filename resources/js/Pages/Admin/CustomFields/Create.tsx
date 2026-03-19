import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { FieldEntry } from './components/types';
import { createEmptyField, generateGroupSlug, prepareFieldsForSubmit } from './components/types';
import { useFieldManager } from './components/useFieldManager';
import { GroupSettingsForm } from './components/GroupSettingsForm';
import { FieldListSection } from './components/FieldListSection';

interface Props {
    fieldTypes: string[];
}

export default function CustomFieldsCreate({ fieldTypes }: Props) {
    const {
        fields,
        updateField,
        addField,
        removeField,
        moveField,
        addOption,
        updateOption,
        removeOption,
    } = useFieldManager([createEmptyField(0)]);

    const { data, setData, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        applies_to: [] as string[],
        position: 'normal',
        order: 0,
        active: true,
        fields: [] as FieldEntry[],
    });

    function handleNameChange(value: string) {
        setData((prev) => ({
            ...prev,
            name: value,
            slug:
                prev.slug === '' || prev.slug === generateGroupSlug(prev.name)
                    ? generateGroupSlug(value)
                    : prev.slug,
        }));
    }

    function toggleAppliesTo(value: string) {
        setData((prev) => {
            const current = prev.applies_to;
            const updated = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
            return { ...prev, applies_to: updated };
        });
    }

    function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();

        router.post('/admin/custom-fields', {
            name: data.name,
            slug: data.slug,
            description: data.description,
            applies_to: data.applies_to,
            position: data.position,
            order: data.order,
            active: data.active,
            fields: JSON.stringify(prepareFieldsForSubmit(fields)),
        });
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/admin/custom-fields" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Nouveau groupe de champs
                    </h1>
                </div>
            }
        >
            <Head title="Nouveau groupe de champs" />

            <form onSubmit={handleFormSubmit} className="mx-auto max-w-4xl space-y-6">
                <GroupSettingsForm
                    name={data.name}
                    slug={data.slug}
                    description={data.description}
                    applies_to={data.applies_to}
                    position={data.position}
                    errors={errors}
                    nameInputProps={{ placeholder: 'Ex : Détails produit' }}
                    onNameChange={handleNameChange}
                    onSlugChange={(v) => setData('slug', v)}
                    onDescriptionChange={(v) => setData('description', v)}
                    onToggleAppliesTo={toggleAppliesTo}
                    onPositionChange={(v) => setData('position', v)}
                />

                <FieldListSection
                    fields={fields}
                    fieldTypes={fieldTypes}
                    errors={errors}
                    onAddField={addField}
                    onUpdateField={updateField}
                    onRemoveField={removeField}
                    onMoveField={moveField}
                    onAddOption={addOption}
                    onUpdateOption={updateOption}
                    onRemoveOption={removeOption}
                />

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

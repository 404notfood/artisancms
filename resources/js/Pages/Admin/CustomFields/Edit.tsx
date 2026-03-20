import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router , usePage } from '@inertiajs/react';
import type { CustomFieldGroupData, SharedProps } from '@/types/cms';
import { ArrowLeft } from 'lucide-react';
import type { FieldEntry } from './components/types';
import { createEmptyField, fieldFromData, prepareFieldsForSubmit } from './components/types';
import { useFieldManager } from './components/useFieldManager';
import { GroupSettingsForm } from './components/GroupSettingsForm';
import { FieldListSection } from './components/FieldListSection';

interface Props {
    group: CustomFieldGroupData;
    fieldTypes: string[];
}

export default function CustomFieldsEdit({ group, fieldTypes }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const initialFields =
        group.fields && group.fields.length > 0
            ? group.fields.map(fieldFromData)
            : [createEmptyField(0)];

    const {
        fields,
        updateField,
        addField,
        removeField,
        moveField,
        addOption,
        updateOption,
        removeOption,
    } = useFieldManager(initialFields);

    const { data, setData, processing, errors } = useForm({
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

    function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();

        router.put(`/admin/custom-fields/${group.id}`, {
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
                            href={`/${prefix}/custom-fields`}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="h-5 w-5" />
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
                <GroupSettingsForm
                    name={data.name}
                    slug={data.slug}
                    description={data.description}
                    applies_to={data.applies_to}
                    position={data.position}
                    active={data.active}
                    errors={errors}
                    showActive
                    onNameChange={(v) => setData('name', v)}
                    onSlugChange={(v) => setData('slug', v)}
                    onDescriptionChange={(v) => setData('description', v)}
                    onToggleAppliesTo={toggleAppliesTo}
                    onPositionChange={(v) => setData('position', v as 'normal' | 'side')}
                    onActiveChange={(v) => setData('active', v)}
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
                        href={`/${prefix}/custom-fields`}
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

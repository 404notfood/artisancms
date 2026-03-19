import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface FieldData {
    id: number;
    name: string;
    slug: string;
    type: string;
    options: string[] | null;
    placeholder: string | null;
    description: string | null;
    required: boolean;
    show_on_registration: boolean;
    show_on_profile: boolean;
    show_in_directory: boolean;
    admin_only: boolean;
    active: boolean;
    order: number;
}

interface FieldsIndexProps {
    fields: FieldData[];
}

const FIELD_TYPES = [
    { value: 'text', label: 'Texte' },
    { value: 'textarea', label: 'Zone de texte' },
    { value: 'select', label: 'Liste deroulante' },
    { value: 'checkbox', label: 'Case a cocher' },
    { value: 'radio', label: 'Bouton radio' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Telephone' },
    { value: 'date', label: 'Date' },
    { value: 'number', label: 'Nombre' },
];

export default function FieldsIndex({ fields }: FieldsIndexProps) {
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<FieldData | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        slug: '',
        type: 'text',
        options: [] as string[],
        placeholder: '',
        description: '',
        required: false,
        show_on_registration: false,
        show_on_profile: true,
        show_in_directory: false,
        admin_only: false,
        active: true,
    });

    const [optionsText, setOptionsText] = useState('');

    function openNew() {
        setEditing(null);
        reset();
        setOptionsText('');
        setShowForm(true);
    }

    function openEdit(field: FieldData) {
        setEditing(field);
        setData({
            name: field.name,
            slug: field.slug,
            type: field.type,
            options: field.options || [],
            placeholder: field.placeholder || '',
            description: field.description || '',
            required: field.required,
            show_on_registration: field.show_on_registration,
            show_on_profile: field.show_on_profile,
            show_in_directory: field.show_in_directory,
            admin_only: field.admin_only,
            active: field.active,
        });
        setOptionsText((field.options || []).join('\n'));
        setShowForm(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = { ...data, options: optionsText.split('\n').filter(Boolean) };

        if (editing) {
            router.put(`/admin/member-space/fields/${editing.id}`, payload, { onSuccess: () => setShowForm(false) });
        } else {
            router.post('/admin/member-space/fields', payload, { onSuccess: () => setShowForm(false) });
        }
    }

    function handleDelete(field: FieldData) {
        if (!confirm(`Supprimer le champ "${field.name}" ?`)) return;
        router.delete(`/admin/member-space/fields/${field.id}`);
    }

    function handleNameChange(name: string) {
        setData('name', name);
        if (!editing) {
            setData('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        }
    }

    const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

    return (
        <AdminLayout header={
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">Champs personnalises</h1>
                <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                    <Plus className="h-4 w-4" /> Ajouter
                </button>
            </div>
        }>
            <Head title="Champs personnalises" />

            <div className="mx-auto max-w-3xl space-y-6">
                {fields.length === 0 && !showForm && (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
                        Aucun champ personnalise. Cliquez sur "Ajouter" pour en creer un.
                    </div>
                )}

                {/* List */}
                {fields.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                        {fields.map((field) => (
                            <div key={field.id} className="flex items-center justify-between px-6 py-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{field.name}</span>
                                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{field.type}</span>
                                        {field.required && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">Requis</span>}
                                        {!field.active && <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Inactif</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{field.slug}{field.description ? ` — ${field.description}` : ''}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEdit(field)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(field)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            {editing ? `Modifier : ${editing.name}` : 'Nouveau champ'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom</label>
                                <input type="text" value={data.name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Slug</label>
                                <input type="text" value={data.slug} onChange={(e) => setData('slug', e.target.value)} className={inputClass} required readOnly={!!editing} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select value={data.type} onChange={(e) => setData('type', e.target.value)} className={inputClass}>
                                    {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Placeholder</label>
                                <input type="text" value={data.placeholder} onChange={(e) => setData('placeholder', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        {['select', 'radio'].includes(data.type) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Options (une par ligne)</label>
                                <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} className={inputClass} rows={3} placeholder="Option 1&#10;Option 2&#10;Option 3" />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <input type="text" value={data.description} onChange={(e) => setData('description', e.target.value)} className={inputClass} />
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {[
                                { key: 'required', label: 'Requis' },
                                { key: 'show_on_registration', label: 'Inscription' },
                                { key: 'show_on_profile', label: 'Profil' },
                                { key: 'show_in_directory', label: 'Annuaire' },
                                { key: 'admin_only', label: 'Admin uniquement' },
                                { key: 'active', label: 'Actif' },
                            ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={Boolean((data as Record<string, unknown>)[key])}
                                        onChange={(e) => setData(key as keyof typeof data, e.target.checked as never)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                    />
                                    <span className="text-sm text-gray-700">{label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Annuler
                            </button>
                            <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                                {processing ? 'Enregistrement...' : editing ? 'Mettre a jour' : 'Creer'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </AdminLayout>
    );
}

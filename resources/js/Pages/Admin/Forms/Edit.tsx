import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Badge } from '@/Components/ui/badge';
import { ArrowLeft, Plus, Trash2, Eye } from 'lucide-react';
import { FormEvent } from 'react';

const FIELD_TYPES = [
    { value: 'text', label: 'Texte' }, { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Téléphone' }, { value: 'textarea', label: 'Zone de texte' },
    { value: 'select', label: 'Liste' }, { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' }, { value: 'file', label: 'Fichier' },
    { value: 'number', label: 'Nombre' }, { value: 'date', label: 'Date' },
];

interface Field { id: string; type: string; label: string; name: string; required: boolean; order: number; }
interface Form {
    id: number; name: string; slug: string;
    fields: Field[]; is_active: boolean; submissions_count: number;
}
interface Props { form: Form; }

export default function FormsEdit({ form }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: form.name,
        fields: form.fields,
        is_active: form.is_active,
        settings: {},
        notifications: {},
        confirmation: { message: 'Merci pour votre message !' },
        spam_protection: { enabled: true },
    });

    const addField = (type: string) => {
        const newField: Field = {
            id: `field-${Date.now()}`, type,
            label: FIELD_TYPES.find(t => t.value === type)?.label ?? type,
            name: `field_${data.fields.length + 1}`,
            required: false, order: data.fields.length,
        };
        setData('fields', [...data.fields, newField]);
    };

    const updateField = (id: string, updates: Partial<Field>) =>
        setData('fields', data.fields.map(f => f.id === id ? { ...f, ...updates } : f));

    const removeField = (id: string) =>
        setData('fields', data.fields.filter(f => f.id !== id));

    const handleSubmit = (e: FormEvent) => { e.preventDefault(); put(`/admin/forms/${form.id}`); };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href="/admin/forms">
                        <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">{form.name}</h1>
                    <Link href={`/admin/forms/${form.id}/submissions`}>
                        <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            {form.submissions_count} soumissions
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title={`Modifier : ${form.name}`} />

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                <Card>
                    <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Nom</Label>
                            <Input value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1" />
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <Label>Slug</Label>
                            <Input value={form.slug} disabled className="mt-1 font-mono bg-gray-50" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Actif</Label>
                            <Switch checked={data.is_active} onCheckedChange={v => setData('is_active', v)} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Champs</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {data.fields.map(field => (
                            <div key={field.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Label</Label>
                                        <Input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} className="mt-0.5 h-8 text-sm" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Name</Label>
                                        <Input value={field.name} onChange={e => updateField(field.id, { name: e.target.value })} className="mt-0.5 h-8 text-sm font-mono" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Badge variant="outline" className="text-xs">{field.type}</Badge>
                                    <Switch checked={field.required} onCheckedChange={v => updateField(field.id, { required: v })} />
                                    <Button type="button" variant="ghost" size="sm" className="text-red-500 h-7 w-7 p-0" onClick={() => removeField(field.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <div className="border-t pt-3 flex flex-wrap gap-2">
                            {FIELD_TYPES.map(ft => (
                                <Button key={ft.value} type="button" variant="outline" size="sm" onClick={() => addField(ft.value)}>
                                    <Plus className="h-3.5 w-3.5 mr-1" />{ft.label}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>{processing ? 'Enregistrement...' : 'Enregistrer'}</Button>
                    <Link href="/admin/forms"><Button variant="outline">Annuler</Button></Link>
                </div>
            </form>
        </AdminLayout>
    );
}

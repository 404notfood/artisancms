import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import PluginSettingsForm from '@/Components/admin/plugin-settings-form';
import { ChevronRight, Save } from 'lucide-react';
import { useState } from 'react';

interface PluginData {
    slug: string;
    name: string;
    description?: string;
    version?: string;
}

interface FieldSchema {
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'color' | 'password';
    default?: string | number | boolean;
    description?: string;
    options?: Array<{ value: string; label: string }>;
}

interface PluginSettingsProps {
    plugin: PluginData;
    settings: Record<string, unknown>;
    schema: FieldSchema[];
}

export default function PluginSettings({ plugin, settings, schema }: PluginSettingsProps) {
    const [values, setValues] = useState<Record<string, unknown>>({ ...settings });
    const [processing, setProcessing] = useState(false);

    const handleChange = (key: string, value: unknown) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.put(`/admin/plugins/${plugin.slug}/settings`, {
            settings: values,
        } as any, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/admin/plugins" className="text-gray-500 hover:text-gray-700">
                        Plugins
                    </Link>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{plugin.name}</span>
                </div>
            }
        >
            <Head title={`Parametres - ${plugin.name}`} />

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Parametres de {plugin.name}</CardTitle>
                        {plugin.description && (
                            <p className="text-sm text-gray-500">{plugin.description}</p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <PluginSettingsForm
                            schema={schema}
                            values={values}
                            onChange={handleChange}
                        />
                    </CardContent>
                </Card>

                <div className="mt-4 flex justify-end gap-3">
                    <Button type="button" variant="outline" size="sm" asChild>
                        <Link href="/admin/plugins">Retour</Link>
                    </Button>
                    <Button type="submit" size="sm" disabled={processing} className="gap-1.5">
                        <Save className="h-4 w-4" />
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}

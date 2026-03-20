import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { LayoutTemplate, Download, Upload } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface SiteTemplate {
    slug: string;
    name: string;
    description: string;
    category: string;
    version: string;
    preview_image: string | null;
}

interface Props {
    templates: SiteTemplate[];
}

const categoryLabels: Record<string, string> = {
    blank: 'Vide',
    business: 'Business',
    creative: 'Créatif',
    content: 'Contenu',
    marketing: 'Marketing',
    custom: 'Personnalisé',
};

const categoryColors: Record<string, string> = {
    blank: 'bg-gray-50 text-gray-600 border-gray-200',
    business: 'bg-blue-50 text-blue-700 border-blue-200',
    creative: 'bg-purple-50 text-purple-700 border-purple-200',
    content: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    marketing: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function SiteTemplatesIndex({ templates }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [installing, setInstalling] = useState<string | null>(null);
    const [showExport, setShowExport] = useState(false);

    const exportForm = useForm({
        name: '',
        slug: '',
    });

    const handleInstall = (slug: string, name: string) => {
        if (!confirm(`Installer le template "${name}" ? Cela créera des pages, menus et paramètres. Cette action ne peut pas être annulée facilement.`)) return;
        setInstalling(slug);
        router.post(`/${prefix}/site-templates/install`, { slug }, {
            onFinish: () => setInstalling(null),
        });
    };

    const handleExport = (e: FormEvent) => {
        e.preventDefault();
        window.location.href = `/admin/site-templates/export?name=${encodeURIComponent(exportForm.data.name)}&slug=${encodeURIComponent(exportForm.data.slug)}`;
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <LayoutTemplate className="h-5 w-5" />
                        Templates de sites
                    </h1>
                    <Button variant="outline" size="sm" onClick={() => setShowExport(!showExport)}>
                        <Download className="h-4 w-4 mr-1" />
                        Exporter le site actuel
                    </Button>
                </div>
            }
        >
            <Head title="Templates de sites" />

            {showExport && (
                <Card className="mb-6 border-indigo-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Exporter le site actuel comme template</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleExport} className="flex items-end gap-3">
                            <div>
                                <Label htmlFor="export-name">Nom du template</Label>
                                <Input
                                    id="export-name"
                                    value={exportForm.data.name}
                                    onChange={e => exportForm.setData('name', e.target.value)}
                                    placeholder="Mon site"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="export-slug">Slug</Label>
                                <Input
                                    id="export-slug"
                                    value={exportForm.data.slug}
                                    onChange={e => exportForm.setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                    placeholder="mon-site"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <Button type="submit">
                                <Download className="h-4 w-4 mr-1" />
                                Télécharger
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {templates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <LayoutTemplate className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Aucun template disponible</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Placez des templates dans <code className="bg-gray-100 px-1 rounded">content/templates/</code>
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                        <Card key={template.slug} className="overflow-hidden">
                            {template.preview_image ? (
                                <img
                                    src={template.preview_image}
                                    alt={template.name}
                                    className="h-40 w-full object-cover"
                                />
                            ) : (
                                <div className="h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <LayoutTemplate className="h-10 w-10 text-gray-300" />
                                </div>
                            )}
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs shrink-0 ml-2 ${categoryColors[template.category] ?? ''}`}
                                    >
                                        {categoryLabels[template.category] ?? template.category}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                                <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={installing === template.slug}
                                    onClick={() => handleInstall(template.slug, template.name)}
                                >
                                    <Upload className="h-4 w-4 mr-1" />
                                    {installing === template.slug ? 'Installation...' : 'Installer ce template'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}

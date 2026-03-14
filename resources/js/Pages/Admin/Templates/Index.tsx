import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { LayoutTemplate, Upload } from 'lucide-react';
import { useState } from 'react';

interface Template {
    slug: string;
    name: string;
    description?: string;
    category?: string;
    version?: string;
    thumbnail_url?: string;
}

interface Props {
    templates: Record<string, Template>;
    categories: Record<string, Template[]>;
}

const categoryLabels: Record<string, string> = {
    blank: 'Vide',
    business: 'Business',
    creative: 'Créatif',
    content: 'Contenu',
    marketing: 'Marketing',
    restaurant: 'Restaurant',
    agency: 'Agence',
    portfolio: 'Portfolio',
    blog: 'Blog',
    custom: 'Personnalisé',
};

const categoryColors: Record<string, string> = {
    blank: 'bg-gray-50 text-gray-600 border-gray-200',
    business: 'bg-blue-50 text-blue-700 border-blue-200',
    creative: 'bg-purple-50 text-purple-700 border-purple-200',
    content: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    marketing: 'bg-orange-50 text-orange-700 border-orange-200',
    restaurant: 'bg-red-50 text-red-700 border-red-200',
    agency: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    portfolio: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blog: 'bg-teal-50 text-teal-700 border-teal-200',
};

export default function TemplatesIndex({ templates }: Props) {
    const [installing, setInstalling] = useState<string | null>(null);
    const templateList = Object.values(templates);

    const handleInstall = (slug: string, name: string) => {
        if (!confirm(`Installer le template "${name}" ? Cette action va créer des pages, menus et paramètres.`)) return;
        setInstalling(slug);
        router.post(`/admin/templates/${slug}/install`, {}, {
            onFinish: () => setInstalling(null),
        });
    };

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5" />
                    Templates de sites
                </h1>
            }
        >
            <Head title="Templates" />

            {templateList.length === 0 ? (
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
                    {templateList.map(template => (
                        <Card key={template.slug} className="overflow-hidden">
                            {template.thumbnail_url ? (
                                <img
                                    src={template.thumbnail_url}
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
                                    {template.category && (
                                        <Badge
                                            variant="outline"
                                            className={`text-xs shrink-0 ml-2 ${categoryColors[template.category] ?? ''}`}
                                        >
                                            {categoryLabels[template.category] ?? template.category}
                                        </Badge>
                                    )}
                                </div>
                                {template.description && (
                                    <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                                )}
                                <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={installing === template.slug}
                                    onClick={() => handleInstall(template.slug, template.name)}
                                >
                                    <Upload className="h-4 w-4 mr-1" />
                                    {installing === template.slug ? 'Installation...' : 'Installer'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}

import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Globe, Plus, Star, CheckCircle2, XCircle } from 'lucide-react';

interface Site {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    subdomain: string | null;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
}

interface Props {
    sites: Site[];
    currentSite: Site | null;
}

export default function SitesIndex({ sites, currentSite }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const handleDelete = (id: number, name: string) => {
        if (!confirm(`Supprimer le site "${name}" ? Tout le contenu de ce site sera perdu.`)) return;
        router.delete(`/admin/sites/${id}`);
    };

    const handleSwitch = (id: number) => {
        router.post(`/admin/sites/${id}/switch`);
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Multi-site
                    </h1>
                    <Link href={`/${prefix}/sites/create`}>
                        <Button size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            Nouveau site
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Sites" />

            <div className="space-y-3">
                {sites.map(site => (
                    <Card key={site.id} className={currentSite?.id === site.id ? 'ring-2 ring-indigo-500' : ''}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                                    <Globe className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{site.name}</p>
                                        {site.is_primary && (
                                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                                <Star className="h-3 w-3 mr-0.5 fill-current" />
                                                Principal
                                            </Badge>
                                        )}
                                        {currentSite?.id === site.id && (
                                            <Badge className="text-xs">Actif</Badge>
                                        )}
                                        {site.is_active ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        {site.domain && (
                                            <span className="text-xs text-gray-500 font-mono">{site.domain}</span>
                                        )}
                                        {site.subdomain && (
                                            <span className="text-xs text-gray-400">{site.subdomain}.*</span>
                                        )}
                                        <span className="text-xs text-gray-400">/{site.slug}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {currentSite?.id !== site.id && (
                                    <Button variant="outline" size="sm" onClick={() => handleSwitch(site.id)}>
                                        Basculer
                                    </Button>
                                )}
                                <Link href={`/admin/sites/${site.id}/edit`}>
                                    <Button variant="outline" size="sm">Modifier</Button>
                                </Link>
                                {!site.is_primary && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(site.id, site.name)}
                                    >
                                        Supprimer
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {sites.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Globe className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">Aucun site configuré</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>Architecture multi-site :</strong> Chaque site partage la même base de données mais dispose de son propre contenu, paramètres et branding. La résolution se fait par domaine ou sous-domaine.
            </div>
        </AdminLayout>
    );
}

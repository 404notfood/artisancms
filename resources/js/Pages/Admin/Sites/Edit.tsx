import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { FormEvent } from 'react';

interface Site {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    subdomain: string | null;
    is_primary: boolean;
    is_active: boolean;
}

interface Props {
    site: Site;
}

export default function SitesEdit({ site }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: site.name,
        domain: site.domain ?? '',
        subdomain: site.subdomain ?? '',
        is_primary: site.is_primary,
        is_active: site.is_active,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/sites/${site.id}`);
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href="/admin/sites">
                        <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Modifier le site</h1>
                </div>
            }
        >
            <Head title={`Modifier : ${site.name}`} />

            <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{site.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nom du site</Label>
                            <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1" />
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label>Slug</Label>
                            <Input value={site.slug} disabled className="mt-1 font-mono bg-gray-50" />
                            <p className="text-xs text-gray-400 mt-1">Non modifiable après création</p>
                        </div>

                        <div>
                            <Label htmlFor="domain">Domaine</Label>
                            <Input id="domain" value={data.domain} onChange={e => setData('domain', e.target.value)} placeholder="client.com" className="mt-1" />
                            {errors.domain && <p className="text-xs text-red-600 mt-1">{errors.domain}</p>}
                        </div>

                        <div>
                            <Label htmlFor="subdomain">Sous-domaine</Label>
                            <Input id="subdomain" value={data.subdomain} onChange={e => setData('subdomain', e.target.value)} placeholder="client" className="mt-1" />
                            {errors.subdomain && <p className="text-xs text-red-600 mt-1">{errors.subdomain}</p>}
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <Label>Site principal</Label>
                            <Switch checked={data.is_primary} onCheckedChange={v => setData('is_primary', v)} disabled={site.is_primary} />
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <Label>Site actif</Label>
                            <Switch checked={data.is_active} onCheckedChange={v => setData('is_active', v)} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Link href="/admin/sites">
                        <Button variant="outline">Annuler</Button>
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}

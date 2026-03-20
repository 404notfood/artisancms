import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { FormEvent } from 'react';

export default function SitesCreate() {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        domain: '',
        subdomain: '',
        is_primary: false,
        is_active: true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/${prefix}/sites`);
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={`/${prefix}/sites`}>
                        <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Nouveau site</h1>
                </div>
            }
        >
            <Head title="Nouveau site" />

            <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informations du site</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nom du site</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => {
                                    setData('name', e.target.value);
                                    if (!data.slug) {
                                        setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                                    }
                                }}
                                placeholder="Mon site client"
                                className="mt-1"
                            />
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="slug">Slug (identifiant interne)</Label>
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={e => setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="mon-site-client"
                                className="mt-1 font-mono"
                            />
                            {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug}</p>}
                        </div>

                        <div>
                            <Label htmlFor="domain">Domaine (optionnel)</Label>
                            <Input
                                id="domain"
                                value={data.domain}
                                onChange={e => setData('domain', e.target.value)}
                                placeholder="client.com"
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Le domaine exact associé à ce site</p>
                            {errors.domain && <p className="text-xs text-red-600 mt-1">{errors.domain}</p>}
                        </div>

                        <div>
                            <Label htmlFor="subdomain">Sous-domaine (optionnel)</Label>
                            <Input
                                id="subdomain"
                                value={data.subdomain}
                                onChange={e => setData('subdomain', e.target.value)}
                                placeholder="client"
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">ex: "client" pour client.votredomaine.com</p>
                            {errors.subdomain && <p className="text-xs text-red-600 mt-1">{errors.subdomain}</p>}
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <div>
                                <Label>Site principal</Label>
                                <p className="text-xs text-gray-500">Utilisé comme fallback si aucun domaine ne correspond</p>
                            </div>
                            <Switch checked={data.is_primary} onCheckedChange={v => setData('is_primary', v)} />
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <Label>Site actif</Label>
                            <Switch checked={data.is_active} onCheckedChange={v => setData('is_active', v)} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Création...' : 'Créer le site'}
                    </Button>
                    <Link href={`/${prefix}/sites`}>
                        <Button variant="outline">Annuler</Button>
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}

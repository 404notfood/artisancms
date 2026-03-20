import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Palette, Upload, Download, RotateCcw } from 'lucide-react';
import { FormEvent } from 'react';

interface BrandingConfig {
    brand_name: string | null;
    brand_logo: string | null;
    brand_logo_dark: string | null;
    brand_favicon: string | null;
    brand_color_primary: string;
    brand_color_accent: string;
    brand_login_bg: string | null;
    brand_login_message: string | null;
    brand_show_credit: boolean;
    brand_custom_css: string | null;
    brand_footer_text: string | null;
}

interface Props {
    branding: BrandingConfig;
}

export default function BrandingIndex({ branding }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { data, setData, put, processing, errors } = useForm({
        brand_name: branding.brand_name ?? '',
        brand_logo: branding.brand_logo ?? '',
        brand_logo_dark: branding.brand_logo_dark ?? '',
        brand_favicon: branding.brand_favicon ?? '',
        brand_color_primary: branding.brand_color_primary ?? '#3b82f6',
        brand_color_accent: branding.brand_color_accent ?? '#8b5cf6',
        brand_login_bg: branding.brand_login_bg ?? '',
        brand_login_message: branding.brand_login_message ?? '',
        brand_show_credit: branding.brand_show_credit ?? true,
        brand_custom_css: branding.brand_custom_css ?? '',
        brand_footer_text: branding.brand_footer_text ?? '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/${prefix}/branding`);
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        White-labeling
                    </h1>
                    <div className="flex gap-2">
                        <a href={`/${prefix}/branding/export`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Download className="h-4 w-4" />
                                Exporter
                            </Button>
                        </a>
                    </div>
                </div>
            }
        >
            <Head title="White-labeling" />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="identity">
                    <TabsList>
                        <TabsTrigger value="identity">Identité</TabsTrigger>
                        <TabsTrigger value="colors">Couleurs</TabsTrigger>
                        <TabsTrigger value="login">Page de connexion</TabsTrigger>
                        <TabsTrigger value="advanced">Avancé</TabsTrigger>
                    </TabsList>

                    {/* Identity */}
                    <TabsContent value="identity" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Identité de la marque</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="brand_name">Nom de la marque</Label>
                                    <Input
                                        id="brand_name"
                                        value={data.brand_name}
                                        onChange={e => setData('brand_name', e.target.value)}
                                        placeholder="ArtisanCMS"
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Affiché dans le header admin et la page de connexion</p>
                                    {errors.brand_name && <p className="text-xs text-red-600 mt-1">{errors.brand_name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="brand_logo">URL du logo (header admin)</Label>
                                    <Input
                                        id="brand_logo"
                                        value={data.brand_logo}
                                        onChange={e => setData('brand_logo', e.target.value)}
                                        placeholder="/storage/media/logo.png"
                                        className="mt-1"
                                    />
                                    {data.brand_logo && (
                                        <img src={data.brand_logo} alt="Logo preview" className="mt-2 h-10 object-contain" />
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="brand_logo_dark">URL du logo (mode sombre)</Label>
                                    <Input
                                        id="brand_logo_dark"
                                        value={data.brand_logo_dark}
                                        onChange={e => setData('brand_logo_dark', e.target.value)}
                                        placeholder="/storage/media/logo-dark.png"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="brand_favicon">URL du favicon</Label>
                                    <Input
                                        id="brand_favicon"
                                        value={data.brand_favicon}
                                        onChange={e => setData('brand_favicon', e.target.value)}
                                        placeholder="/storage/media/favicon.ico"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="brand_footer_text">Texte du pied de page</Label>
                                    <Input
                                        id="brand_footer_text"
                                        value={data.brand_footer_text}
                                        onChange={e => setData('brand_footer_text', e.target.value)}
                                        placeholder="© 2026 Mon Agence"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <Label>Afficher le crédit "Propulsé par ArtisanCMS"</Label>
                                        <p className="text-xs text-gray-500">Affiché par défaut, peut être désactivé</p>
                                    </div>
                                    <Switch
                                        checked={data.brand_show_credit}
                                        onCheckedChange={v => setData('brand_show_credit', v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Colors */}
                    <TabsContent value="colors" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Couleurs de l'interface</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label htmlFor="brand_color_primary">Couleur principale</Label>
                                    <div className="flex items-center gap-3 mt-1">
                                        <input
                                            type="color"
                                            id="brand_color_primary"
                                            value={data.brand_color_primary}
                                            onChange={e => setData('brand_color_primary', e.target.value)}
                                            className="h-10 w-20 rounded border cursor-pointer"
                                        />
                                        <Input
                                            value={data.brand_color_primary}
                                            onChange={e => setData('brand_color_primary', e.target.value)}
                                            placeholder="#3b82f6"
                                            className="font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="brand_color_accent">Couleur d'accent</Label>
                                    <div className="flex items-center gap-3 mt-1">
                                        <input
                                            type="color"
                                            id="brand_color_accent"
                                            value={data.brand_color_accent}
                                            onChange={e => setData('brand_color_accent', e.target.value)}
                                            className="h-10 w-20 rounded border cursor-pointer"
                                        />
                                        <Input
                                            value={data.brand_color_accent}
                                            onChange={e => setData('brand_color_accent', e.target.value)}
                                            placeholder="#8b5cf6"
                                            className="font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="rounded-lg border p-4 bg-gray-50">
                                    <p className="text-xs text-gray-500 mb-3">Aperçu</p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-md text-white text-sm font-medium"
                                            style={{ backgroundColor: data.brand_color_primary }}
                                        >
                                            Bouton principal
                                        </button>
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-md text-white text-sm font-medium"
                                            style={{ backgroundColor: data.brand_color_accent }}
                                        >
                                            Accent
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Login */}
                    <TabsContent value="login" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Personnalisation de la page de connexion</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="brand_login_bg">Image de fond (URL)</Label>
                                    <Input
                                        id="brand_login_bg"
                                        value={data.brand_login_bg}
                                        onChange={e => setData('brand_login_bg', e.target.value)}
                                        placeholder="/storage/media/login-bg.jpg"
                                        className="mt-1"
                                    />
                                    {data.brand_login_bg && (
                                        <img src={data.brand_login_bg} alt="Login background preview" className="mt-2 h-20 w-full object-cover rounded" />
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="brand_login_message">Message d'accueil</Label>
                                    <Input
                                        id="brand_login_message"
                                        value={data.brand_login_message}
                                        onChange={e => setData('brand_login_message', e.target.value)}
                                        placeholder="Bienvenue dans votre espace d'administration"
                                        className="mt-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Advanced */}
                    <TabsContent value="advanced" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">CSS personnalisé</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={data.brand_custom_css}
                                    onChange={e => setData('brand_custom_css', e.target.value)}
                                    placeholder="/* CSS custom pour l'interface admin */
.admin-sidebar { background: #1a1a2e; }"
                                    rows={12}
                                    className="font-mono text-xs"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Ce CSS sera injecté dans toutes les pages de l'admin. Utilisez avec précaution.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Import */}
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="text-base">Importer une configuration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form action="/admin/branding/import" method="post" encType="multipart/form-data" className="flex gap-2">
                                    <input type="hidden" name="_token" value={document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ?? ''} />
                                    <Input type="file" name="file" accept=".json" />
                                    <Button type="submit" variant="outline">
                                        <Upload className="h-4 w-4 mr-1" />
                                        Importer
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Reset */}
                        <Card className="mt-4 border-red-200">
                            <CardHeader>
                                <CardTitle className="text-base text-red-700">Zone de danger</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form action="/admin/branding/reset" method="post">
                                    <input type="hidden" name="_token" value={document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ?? ''} />
                                    <input type="hidden" name="_method" value="POST" />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                        onClick={e => { if (!confirm('Réinitialiser tous les paramètres de branding ?')) e.preventDefault(); }}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        Réinitialiser aux valeurs par défaut
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}

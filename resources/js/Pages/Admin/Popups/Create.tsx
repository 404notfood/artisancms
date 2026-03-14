import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Switch } from '@/Components/ui/switch';
import { ArrowLeft, Eye, MessageSquare } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Popup {
    id: number;
    name: string;
    title: string | null;
    content: string | null;
    type: 'modal' | 'banner' | 'slide-in';
    trigger: 'page_load' | 'exit_intent' | 'scroll' | 'delay';
    trigger_value: string | null;
    display_frequency: 'always' | 'once' | 'once_per_session';
    pages: string[] | null;
    cta_text: string | null;
    cta_url: string | null;
    style: { backgroundColor?: string; textColor?: string } | null;
    active: boolean;
    starts_at: string | null;
    ends_at: string | null;
}

interface Props {
    popup?: Popup;
}

export default function PopupsCreate({ popup }: Props) {
    const isEditing = !!popup;
    const [showPreview, setShowPreview] = useState(false);

    const { data, setData, post, put, processing, errors } = useForm({
        name: popup?.name ?? '',
        title: popup?.title ?? '',
        content: popup?.content ?? '',
        type: popup?.type ?? 'modal' as 'modal' | 'banner' | 'slide-in',
        trigger: popup?.trigger ?? 'page_load' as 'page_load' | 'exit_intent' | 'scroll' | 'delay',
        trigger_value: popup?.trigger_value ?? '',
        display_frequency: popup?.display_frequency ?? 'once' as 'always' | 'once' | 'once_per_session',
        pages: (popup?.pages ?? []).join('\n'),
        cta_text: popup?.cta_text ?? '',
        cta_url: popup?.cta_url ?? '',
        style: {
            backgroundColor: popup?.style?.backgroundColor ?? '#ffffff',
            textColor: popup?.style?.textColor ?? '#1f2937',
        },
        active: popup?.active ?? false,
        starts_at: popup?.starts_at ?? '',
        ends_at: popup?.ends_at ?? '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const payload = {
            ...data,
            pages: data.pages.trim() ? data.pages.split('\n').map(p => p.trim()).filter(Boolean) : null,
        };

        if (isEditing) {
            put(`/admin/popups/${popup.id}`, payload as any);
        } else {
            post('/admin/popups', payload as any);
        }
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href="/admin/popups">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">
                        {isEditing ? 'Modifier le popup' : 'Nouveau popup'}
                    </h1>
                </div>
            }
        >
            <Head title={isEditing ? 'Modifier le popup' : 'Nouveau popup'} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
                    {/* Contenu */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Contenu</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nom (interne)</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Popup newsletter header"
                                    className="mt-1"
                                />
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="title">Titre (affich\u00e9)</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    placeholder="Inscrivez-vous \u00e0 notre newsletter !"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="content">Contenu (HTML)</Label>
                                <Textarea
                                    id="content"
                                    value={data.content}
                                    onChange={e => setData('content', e.target.value)}
                                    rows={5}
                                    placeholder="<p>Recevez nos derni\u00e8res actualit\u00e9s...</p>"
                                    className="mt-1 font-mono text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="cta_text">Texte du bouton CTA</Label>
                                    <Input
                                        id="cta_text"
                                        value={data.cta_text}
                                        onChange={e => setData('cta_text', e.target.value)}
                                        placeholder="En savoir plus"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cta_url">URL du CTA</Label>
                                    <Input
                                        id="cta_url"
                                        value={data.cta_url}
                                        onChange={e => setData('cta_url', e.target.value)}
                                        placeholder="https://..."
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Apparence */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Apparence</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Type</Label>
                                <div className="flex gap-3 mt-2">
                                    {([
                                        { value: 'modal', label: 'Modal' },
                                        { value: 'banner', label: 'Banni\u00e8re' },
                                        { value: 'slide-in', label: 'Slide-in' },
                                    ] as const).map(opt => (
                                        <label
                                            key={opt.value}
                                            className={`flex-1 text-center px-3 py-2 border rounded-md cursor-pointer text-sm transition-colors ${
                                                data.type === opt.value
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="type"
                                                value={opt.value}
                                                checked={data.type === opt.value}
                                                onChange={() => setData('type', opt.value)}
                                                className="sr-only"
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="bg_color">Couleur de fond</Label>
                                    <div className="flex gap-2 mt-1 items-center">
                                        <input
                                            type="color"
                                            value={data.style.backgroundColor}
                                            onChange={e => setData('style', { ...data.style, backgroundColor: e.target.value })}
                                            className="h-9 w-12 rounded border cursor-pointer"
                                        />
                                        <Input
                                            value={data.style.backgroundColor}
                                            onChange={e => setData('style', { ...data.style, backgroundColor: e.target.value })}
                                            className="font-mono text-xs"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="text_color">Couleur du texte</Label>
                                    <div className="flex gap-2 mt-1 items-center">
                                        <input
                                            type="color"
                                            value={data.style.textColor}
                                            onChange={e => setData('style', { ...data.style, textColor: e.target.value })}
                                            className="h-9 w-12 rounded border cursor-pointer"
                                        />
                                        <Input
                                            value={data.style.textColor}
                                            onChange={e => setData('style', { ...data.style, textColor: e.target.value })}
                                            className="font-mono text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* D\u00e9clencheur */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">D\u00e9clencheur</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Type de d\u00e9clencheur</Label>
                                <select
                                    value={data.trigger}
                                    onChange={e => setData('trigger', e.target.value as any)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white mt-1"
                                >
                                    <option value="page_load">Chargement de la page</option>
                                    <option value="exit_intent">Intention de sortie</option>
                                    <option value="scroll">D\u00e9filement</option>
                                    <option value="delay">D\u00e9lai</option>
                                </select>
                            </div>

                            {(data.trigger === 'scroll' || data.trigger === 'delay') && (
                                <div>
                                    <Label htmlFor="trigger_value">
                                        {data.trigger === 'scroll' ? 'Pourcentage de d\u00e9filement (%)' : 'D\u00e9lai (secondes)'}
                                    </Label>
                                    <Input
                                        id="trigger_value"
                                        type="number"
                                        min={0}
                                        value={data.trigger_value}
                                        onChange={e => setData('trigger_value', e.target.value)}
                                        placeholder={data.trigger === 'scroll' ? '50' : '5'}
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            <div>
                                <Label>Fr\u00e9quence d'affichage</Label>
                                <select
                                    value={data.display_frequency}
                                    onChange={e => setData('display_frequency', e.target.value as any)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white mt-1"
                                >
                                    <option value="always">Toujours</option>
                                    <option value="once">Une seule fois</option>
                                    <option value="once_per_session">Une fois par session</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Affichage */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Affichage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="pages">
                                    Pages (une par ligne, vide = toutes les pages)
                                </Label>
                                <Textarea
                                    id="pages"
                                    value={data.pages}
                                    onChange={e => setData('pages', e.target.value)}
                                    rows={3}
                                    placeholder={"/\n/blog/*\n/contact"}
                                    className="mt-1 font-mono text-xs"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Supporte les wildcards : /blog/* pour toutes les pages du blog
                                </p>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <Label>Activer ce popup</Label>
                                <Switch
                                    checked={data.active}
                                    onCheckedChange={v => setData('active', v)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Programmation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Programmation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="starts_at">D\u00e9but (optionnel)</Label>
                                    <Input
                                        id="starts_at"
                                        type="datetime-local"
                                        value={data.starts_at}
                                        onChange={e => setData('starts_at', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="ends_at">Fin (optionnel)</Label>
                                    <Input
                                        id="ends_at"
                                        type="datetime-local"
                                        value={data.ends_at}
                                        onChange={e => setData('ends_at', e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.ends_at && <p className="text-xs text-red-600 mt-1">{errors.ends_at}</p>}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Laissez vide pour un affichage permanent.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? (isEditing ? 'Mise \u00e0 jour...' : 'Cr\u00e9ation...')
                                : (isEditing ? 'Mettre \u00e0 jour' : 'Cr\u00e9er le popup')
                            }
                        </Button>
                        <Link href="/admin/popups">
                            <Button variant="outline">Annuler</Button>
                        </Link>
                    </div>
                </form>

                {/* Preview */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Aper\u00e7u
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`rounded-lg border overflow-hidden ${
                                    data.type === 'banner' ? 'min-h-[60px]' : 'min-h-[200px]'
                                }`}
                                style={{
                                    backgroundColor: data.style.backgroundColor,
                                    color: data.style.textColor,
                                }}
                            >
                                <div className={`p-4 ${
                                    data.type === 'banner' ? 'text-center' :
                                    data.type === 'slide-in' ? 'text-sm' : ''
                                }`}>
                                    {data.type !== 'banner' && (
                                        <div className="flex justify-end mb-2">
                                            <span className="text-xs opacity-50 cursor-pointer">\u2715</span>
                                        </div>
                                    )}
                                    {data.title && (
                                        <h3 className={`font-semibold ${data.type === 'banner' ? 'text-sm inline mr-2' : 'text-lg mb-2'}`}>
                                            {data.title}
                                        </h3>
                                    )}
                                    {data.content && (
                                        <div
                                            className={`${data.type === 'banner' ? 'inline text-sm' : 'text-sm mb-3'}`}
                                            dangerouslySetInnerHTML={{ __html: data.content }}
                                        />
                                    )}
                                    {data.cta_text && (
                                        <button
                                            type="button"
                                            className={`px-3 py-1.5 rounded text-xs font-medium ${
                                                data.type === 'banner' ? 'ml-2 inline' : 'mt-2 block'
                                            }`}
                                            style={{
                                                backgroundColor: data.style.textColor,
                                                color: data.style.backgroundColor,
                                            }}
                                        >
                                            {data.cta_text}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                                Type : {data.type === 'modal' ? 'Modal centr\u00e9' : data.type === 'banner' ? 'Banni\u00e8re fixe en haut' : 'Slide-in bas droite'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

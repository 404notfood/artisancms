import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Badge } from '@/Components/ui/badge';
import { ArrowLeft, Eye, EyeOff, Copy } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Props {
    availableEvents: string[];
    generatedSecret: string;
}

export default function WebhooksCreate({ availableEvents, generatedSecret }: Props) {
    const [showSecret, setShowSecret] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        url: '',
        secret: generatedSecret,
        events: [] as string[],
        is_active: true,
        timeout: 30,
        retry_count: 3,
    });

    const toggleEvent = (event: string) => {
        if (data.events.includes(event)) {
            setData('events', data.events.filter(e => e !== event));
        } else {
            setData('events', [...data.events, event]);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/webhooks');
    };

    const copySecret = () => {
        navigator.clipboard.writeText(data.secret);
    };

    // Group events by category
    const eventGroups: Record<string, string[]> = {};
    availableEvents.forEach(event => {
        const category = event.split('.')[0];
        if (!eventGroups[category]) eventGroups[category] = [];
        eventGroups[category].push(event);
    });

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href="/admin/webhooks">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">Nouveau webhook</h1>
                </div>
            }
        >
            <Head title="Nouveau webhook" />

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nom</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Sync avec Zapier"
                                className="mt-1"
                            />
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="url">URL de destination</Label>
                            <Input
                                id="url"
                                type="url"
                                value={data.url}
                                onChange={e => setData('url', e.target.value)}
                                placeholder="https://hooks.zapier.com/hooks/catch/..."
                                className="mt-1"
                            />
                            {errors.url && <p className="text-xs text-red-600 mt-1">{errors.url}</p>}
                        </div>

                        <div>
                            <Label htmlFor="secret">Secret HMAC</Label>
                            <div className="flex gap-2 mt-1">
                                <div className="relative flex-1">
                                    <Input
                                        id="secret"
                                        type={showSecret ? 'text' : 'password'}
                                        value={data.secret}
                                        onChange={e => setData('secret', e.target.value)}
                                        className="font-mono pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={copySecret}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Utilisé pour signer les payloads (header X-ArtisanCMS-Signature)
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="timeout">Timeout (secondes)</Label>
                                <Input
                                    id="timeout"
                                    type="number"
                                    min={5}
                                    max={120}
                                    value={data.timeout}
                                    onChange={e => setData('timeout', parseInt(e.target.value))}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="retry_count">Tentatives max</Label>
                                <Input
                                    id="retry_count"
                                    type="number"
                                    min={0}
                                    max={5}
                                    value={data.retry_count}
                                    onChange={e => setData('retry_count', parseInt(e.target.value))}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <Label>Activer ce webhook</Label>
                            <Switch
                                checked={data.is_active}
                                onCheckedChange={v => setData('is_active', v)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Événements déclencheurs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {errors.events && <p className="text-xs text-red-600">{errors.events}</p>}
                        {Object.entries(eventGroups).map(([category, events]) => (
                            <div key={category}>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 capitalize">
                                    {category}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {events.map(event => (
                                        <button
                                            key={event}
                                            type="button"
                                            onClick={() => toggleEvent(event)}
                                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                                data.events.includes(event)
                                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {event.split('.')[1]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {data.events.length > 0 && (
                            <p className="text-xs text-gray-500">
                                {data.events.length} événement(s) sélectionné(s)
                            </p>
                        )}
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Création...' : 'Créer le webhook'}
                    </Button>
                    <Link href="/admin/webhooks">
                        <Button variant="outline">Annuler</Button>
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}

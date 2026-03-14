import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Bot, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Props {
    provider: string;
    is_configured: boolean;
    has_openai_key: boolean;
    has_anthropic_key: boolean;
}

export default function AiAssistantSettings({ provider, is_configured, has_openai_key, has_anthropic_key }: Props) {
    const [showOpenAiKey, setShowOpenAiKey] = useState(false);
    const [showAnthropicKey, setShowAnthropicKey] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        provider: provider,
        openai_api_key: '',
        anthropic_api_key: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/ai-assistant/settings');
    };

    const capabilities = [
        { label: 'Génération de contenu', desc: 'Créez des textes, descriptions, articles à partir d\'un prompt' },
        { label: 'Amélioration de texte', desc: 'Raccourcir, développer, changer le ton (formel/décontracté)' },
        { label: 'SEO automatique', desc: 'Génère meta title, meta description et mots-clés' },
        { label: 'Alt-text images', desc: 'Génère automatiquement les textes alternatifs pour l\'accessibilité' },
        { label: 'Traduction', desc: 'Traduit vos contenus en français et en anglais' },
    ];

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Assistant IA
                </h1>
            }
        >
            <Head title="Assistant IA" />

            <div className="space-y-6 max-w-2xl">
                {/* Status */}
                <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                        {is_configured ? (
                            <>
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Assistant IA configuré</p>
                                    <p className="text-sm text-gray-500">
                                        Fournisseur actif : <span className="font-medium">{provider === 'anthropic' ? 'Anthropic Claude' : 'OpenAI'}</span>
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <XCircle className="h-8 w-8 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-700">Assistant IA non configuré</p>
                                    <p className="text-sm text-gray-500">Ajoutez une clé API pour activer les fonctionnalités IA</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Configuration */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Fournisseur IA</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'openai', label: 'OpenAI', desc: 'GPT-4o mini · Recommandé', hasKey: has_openai_key },
                                    { value: 'anthropic', label: 'Anthropic', desc: 'Claude Haiku · Haute qualité', hasKey: has_anthropic_key },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setData('provider', opt.value)}
                                        className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                                            data.provider === opt.value
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <p className="font-medium text-gray-900">{opt.label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                        {opt.hasKey && (
                                            <Badge className="absolute top-2 right-2 text-xs bg-emerald-100 text-emerald-700">
                                                Configuré
                                            </Badge>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <Label htmlFor="openai_key">Clé API OpenAI</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="openai_key"
                                        type={showOpenAiKey ? 'text' : 'password'}
                                        value={data.openai_api_key}
                                        onChange={e => setData('openai_api_key', e.target.value)}
                                        placeholder={has_openai_key ? '••••••••••••••• (laisser vide pour conserver)' : 'sk-proj-...'}
                                        className="font-mono pr-10"
                                    />
                                    <button type="button" onClick={() => setShowOpenAiKey(!showOpenAiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showOpenAiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.openai_api_key && <p className="text-xs text-red-600 mt-1">{errors.openai_api_key}</p>}
                            </div>

                            <div>
                                <Label htmlFor="anthropic_key">Clé API Anthropic</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="anthropic_key"
                                        type={showAnthropicKey ? 'text' : 'password'}
                                        value={data.anthropic_api_key}
                                        onChange={e => setData('anthropic_api_key', e.target.value)}
                                        placeholder={has_anthropic_key ? '••••••••••••••• (laisser vide pour conserver)' : 'sk-ant-api03-...'}
                                        className="font-mono pr-10"
                                    />
                                    <button type="button" onClick={() => setShowAnthropicKey(!showAnthropicKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.anthropic_api_key && <p className="text-xs text-red-600 mt-1">{errors.anthropic_api_key}</p>}
                            </div>

                            <p className="text-xs text-gray-500">
                                Les clés API sont stockées chiffrées dans la base de données. Elles ne sont jamais exposées côté client.
                            </p>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={processing}>
                        {processing ? 'Enregistrement...' : 'Enregistrer la configuration'}
                    </Button>
                </form>

                {/* Capabilities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Fonctionnalités disponibles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {capabilities.map(cap => (
                            <div key={cap.label} className="flex items-start gap-3">
                                <Bot className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{cap.label}</p>
                                    <p className="text-xs text-gray-500">{cap.desc}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

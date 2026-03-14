import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import { ArrowLeft, Send, RotateCcw, Copy } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Variable {
    key: string;
    description: string;
    example: string;
}

interface EmailTemplate {
    id: number;
    slug: string;
    name: string;
    subject: string;
    body_html: string;
    body_text: string | null;
    category: string;
    is_system: boolean;
    enabled: boolean;
}

interface Props {
    emailTemplate: EmailTemplate;
    availableVariables: Variable[];
    categories: Record<string, string>;
}

export default function EmailTemplatesEdit({ emailTemplate, availableVariables, categories }: Props) {
    const [testEmail, setTestEmail] = useState('');
    const [showTestDialog, setShowTestDialog] = useState(false);
    const [activeTab, setActiveTab] = useState<'html' | 'text' | 'preview'>('html');

    const { data, setData, put, processing, errors } = useForm({
        subject: emailTemplate.subject,
        body_html: emailTemplate.body_html,
        body_text: emailTemplate.body_text ?? '',
        enabled: emailTemplate.enabled,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/email-templates/${emailTemplate.id}`);
    };

    const handleSendTest = () => {
        if (!testEmail) return;
        router.post(`/admin/email-templates/${emailTemplate.id}/test`, { email: testEmail }, {
            onSuccess: () => setShowTestDialog(false),
        });
    };

    const handleReset = () => {
        if (!confirm('Réinitialiser ce template aux valeurs par défaut ?')) return;
        router.post(`/admin/email-templates/${emailTemplate.id}/reset`);
    };

    const insertVariable = (key: string, field: 'subject' | 'body_html' | 'body_text') => {
        const varStr = `{{ ${key} }}`;
        setData(field, (data[field] ?? '') + varStr);
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/email-templates">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{emailTemplate.name}</h1>
                            <Badge variant="outline" className="text-xs">{emailTemplate.slug}</Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowTestDialog(true)}>
                            <Send className="h-4 w-4 mr-1" />
                            Test
                        </Button>
                        {emailTemplate.is_system && (
                            <Button variant="outline" size="sm" onClick={handleReset}>
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Réinitialiser
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Template : ${emailTemplate.name}`} />

            {showTestDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-medium text-gray-900 mb-3">Envoyer un email de test</h3>
                        <Input
                            type="email"
                            value={testEmail}
                            onChange={e => setTestEmail(e.target.value)}
                            placeholder="email@exemple.fr"
                            className="mb-3"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setShowTestDialog(false)}>Annuler</Button>
                            <Button size="sm" onClick={handleSendTest}>Envoyer</Button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main editor */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <Label htmlFor="subject">Sujet</Label>
                                    <Input
                                        id="subject"
                                        value={data.subject}
                                        onChange={e => setData('subject', e.target.value)}
                                        placeholder="Sujet de l'email (supporte {{ variables }})"
                                        className="mt-1"
                                    />
                                    {errors.subject && <p className="text-xs text-red-600 mt-1">{errors.subject}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {(['html', 'text', 'preview'] as const).map(tab => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setActiveTab(tab)}
                                                className={`text-xs px-3 py-1 rounded ${activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {tab === 'html' ? 'HTML' : tab === 'text' ? 'Texte brut' : 'Aperçu'}
                                            </button>
                                        ))}
                                    </div>

                                    {activeTab === 'html' && (
                                        <>
                                            <Textarea
                                                value={data.body_html}
                                                onChange={e => setData('body_html', e.target.value)}
                                                rows={18}
                                                className="font-mono text-xs"
                                                placeholder="<h1>Bonjour {{ user.name }}</h1>..."
                                            />
                                            {errors.body_html && <p className="text-xs text-red-600 mt-1">{errors.body_html}</p>}
                                        </>
                                    )}

                                    {activeTab === 'text' && (
                                        <Textarea
                                            value={data.body_text}
                                            onChange={e => setData('body_text', e.target.value)}
                                            rows={18}
                                            className="font-mono text-xs"
                                            placeholder="Version texte brut (fallback)..."
                                        />
                                    )}

                                    {activeTab === 'preview' && (
                                        <div className="border rounded-md overflow-auto" style={{ height: '400px' }}>
                                            <iframe
                                                srcDoc={data.body_html}
                                                className="w-full h-full"
                                                title="Email preview"
                                                sandbox="allow-same-origin"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                            <Link href="/admin/email-templates">
                                <Button variant="outline">Annuler</Button>
                            </Link>
                        </div>
                    </div>

                    {/* Variables panel */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Variables disponibles</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 space-y-2">
                                {availableVariables.map(variable => (
                                    <div key={variable.key} className="group flex items-start justify-between rounded p-2 hover:bg-gray-50">
                                        <div className="min-w-0">
                                            <code className="text-xs font-mono text-indigo-600">{'{{ ' + variable.key + ' }}'}</code>
                                            <p className="text-xs text-gray-500 mt-0.5">{variable.description}</p>
                                            {variable.example && (
                                                <p className="text-xs text-gray-400 italic">ex: {variable.example}</p>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                            onClick={() => insertVariable(variable.key, 'body_html')}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {availableVariables.length === 0 && (
                                    <p className="text-xs text-gray-400">Aucune variable définie</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Informations</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-gray-500 space-y-1 p-3">
                                <p><span className="font-medium">Slug :</span> {emailTemplate.slug}</p>
                                <p><span className="font-medium">Catégorie :</span> {categories[emailTemplate.category] ?? emailTemplate.category}</p>
                                <p><span className="font-medium">Type :</span> {emailTemplate.is_system ? 'Système (réinitialisable)' : 'Personnalisé'}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}

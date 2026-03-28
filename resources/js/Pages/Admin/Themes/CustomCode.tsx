import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useRef, type FormEvent } from 'react';
import type { FlashMessages, SharedProps } from '@/types/cms';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import CodeEditor from '@/Components/admin/code-editor';
import { ChevronRight, Code2, AlertTriangle, Save } from 'lucide-react';

interface CustomCodeProps {
    theme: { slug: string; name: string };
    customCss: string;
    customJs: string;
}

export default function CustomCode({ theme, customCss, customJs }: CustomCodeProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const { flash } = usePage().props as unknown as { flash: FlashMessages };

    const [css, setCss] = useState(customCss);
    const [js, setJs] = useState(customJs);
    const [processing, setProcessing] = useState(false);

    const initialCss = useRef(customCss);
    const initialJs = useRef(customJs);
    const isDirty = css !== initialCss.current || js !== initialJs.current;

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.put(`/${prefix}/themes/${theme.slug}/custom-code`, {
            custom_css: css,
            custom_js: js,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                initialCss.current = css;
                initialJs.current = js;
            },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-2 text-sm">
                    <Link href={`/${prefix}/themes`} className="text-gray-500 hover:text-gray-700">
                        Themes
                    </Link>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">{theme.name}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">Code personnalise</span>
                </div>
            }
        >
            <Head title={`Code personnalise - ${theme.name}`} />

            {flash.success && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Code2 className="h-5 w-5 text-indigo-500" />
                                <div>
                                    <CardTitle>Code personnalise</CardTitle>
                                    <CardDescription className="mt-1">
                                        Ajoutez du CSS et du JavaScript personnalise a votre theme.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isDirty && (
                                    <span className="text-xs text-amber-600">
                                        Modifications non sauvegardees
                                    </span>
                                )}
                                <Button type="submit" size="sm" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="css">
                            <TabsList>
                                <TabsTrigger value="css">CSS personnalise</TabsTrigger>
                                <TabsTrigger value="js">JavaScript personnalise</TabsTrigger>
                            </TabsList>

                            <TabsContent value="css">
                                <div className="mt-4 space-y-3">
                                    <p className="text-sm text-gray-500">
                                        Le CSS personnalise est injecte sur toutes les pages du site, apres les styles du theme.
                                    </p>
                                    <CodeEditor
                                        value={css}
                                        onChange={setCss}
                                        language="css"
                                        height="450px"
                                        placeholder="/* Ajoutez votre CSS personnalise ici */&#10;&#10;body {&#10;  /* ... */&#10;}"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="js">
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                        <p className="text-sm text-amber-700">
                                            Le JavaScript personnalise est injecte sur toutes les pages du site.
                                            Utilisez-le avec precaution : un code errone peut rendre votre site inaccessible.
                                        </p>
                                    </div>
                                    <CodeEditor
                                        value={js}
                                        onChange={setJs}
                                        language="js"
                                        height="450px"
                                        placeholder="// Ajoutez votre JavaScript personnalise ici&#10;&#10;document.addEventListener('DOMContentLoaded', function() {&#10;  // ...&#10;});"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </form>
        </AdminLayout>
    );
}

import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';
import { Label } from '@/Components/ui/label';
import { Upload, FileUp, AlertTriangle, CheckCircle2, XCircle, FileText, Image, Tag, FolderOpen } from 'lucide-react';
import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';

interface ImportResult {
    pages: number; posts: number; media: number;
    categories: number; tags: number; errors: string[];
}

interface FlashData { success?: string; error?: string; import_result?: ImportResult; }

export default function WordPressImport() {
    const { cms, flash } = usePage<SharedProps & { flash: FlashData }>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [file, setFile] = useState<File | null>(null);
    const [importPages, setImportPages] = useState(true);
    const [importPosts, setImportPosts] = useState(true);
    const [importMedia, setImportMedia] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const result = (flash as FlashData)?.import_result ?? null;
    const successMsg = (flash as FlashData)?.success ?? null;
    const errorMsg = (flash as FlashData)?.error ?? null;

    const handleDrop = (e: DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.type === 'text/xml' || f.name.endsWith('.xml'))) setFile(f);
    };

    const handleSubmit = () => {
        if (!file) return;
        setSubmitting(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('import_pages', importPages ? '1' : '0');
        fd.append('import_posts', importPosts ? '1' : '0');
        fd.append('import_media', importMedia ? '1' : '0');
        router.post(`/${prefix}/wordpress-import`, fd, {
            forceFormData: true,
            onFinish: () => { setSubmitting(false); setFile(null); },
        });
    };

    const fmtSize = (b: number) => b < 1024 ? `${b} o` : b < 1048576 ? `${(b / 1024).toFixed(1)} Ko` : `${(b / 1048576).toFixed(1)} Mo`;

    const stats = [
        { label: 'Pages', value: result?.pages, icon: FileText },
        { label: 'Articles', value: result?.posts, icon: FileUp },
        { label: 'Médias', value: result?.media, icon: Image },
        { label: 'Catégories', value: result?.categories, icon: FolderOpen },
        { label: 'Tags', value: result?.tags, icon: Tag },
    ];

    return (
        <AdminLayout header={<div className="flex items-center gap-2"><Upload className="h-5 w-5" /><h1 className="text-xl font-semibold text-gray-900">Import WordPress</h1></div>}>
            <Head title="Import WordPress" />
            <div className="max-w-2xl mx-auto space-y-6">
                {successMsg && (
                    <Card className="border-emerald-200 bg-emerald-50">
                        <CardContent className="p-4 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-emerald-800">{successMsg}</p>
                        </CardContent>
                    </Card>
                )}
                {errorMsg && !successMsg && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4 flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-800">{errorMsg}</p>
                        </CardContent>
                    </Card>
                )}

                {result && (
                    <Card>
                        <CardHeader><CardTitle className="text-base">Résultat de l'import</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {stats.map((s) => (
                                    <div key={s.label} className="flex items-center gap-2 rounded-lg border p-3">
                                        <s.icon className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900">{s.value}</p>
                                            <p className="text-xs text-gray-500">{s.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {result.errors.length > 0 && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <p className="text-sm font-medium text-amber-800">{result.errors.length} erreur(s)</p>
                                    </div>
                                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                                        {result.errors.map((err, i) => <li key={i} className="text-xs text-amber-700">{err}</li>)}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader><CardTitle className="text-base">Fichier d'export WordPress (WXR)</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
                        >
                            <FileUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            {file ? (
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{fmtSize(file.size)}</p>
                                    <Badge variant="outline" className="mt-2 text-xs bg-indigo-50 text-indigo-700 border-indigo-200">Prêt</Badge>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-600">Glissez-déposez votre fichier .xml ici</p>
                                    <p className="text-xs text-gray-400 mt-1">ou cliquez pour sélectionner (max 50 Mo)</p>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const f = e.target.files?.[0];
                                if (f && (f.type === 'text/xml' || f.type === 'application/xml' || f.name.endsWith('.xml'))) setFile(f);
                            }} />
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Options d'import</p>
                            {([
                                { id: 'pages', label: 'Importer les pages', checked: importPages, set: setImportPages },
                                { id: 'posts', label: 'Importer les articles', checked: importPosts, set: setImportPosts },
                                { id: 'media', label: 'Télécharger les médias', checked: importMedia, set: setImportMedia },
                            ] as const).map((o) => (
                                <div key={o.id} className="flex items-center justify-between">
                                    <Label htmlFor={`import-${o.id}`} className="text-sm text-gray-600 cursor-pointer">{o.label}</Label>
                                    <Switch id={`import-${o.id}`} checked={o.checked} onCheckedChange={o.set} />
                                </div>
                            ))}
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">L'import peut prendre plusieurs minutes si le fichier contient beaucoup de médias. Ne fermez pas la page pendant l'opération.</p>
                        </div>

                        <Button onClick={handleSubmit} disabled={!file || submitting} className="w-full">
                            <Upload className="h-4 w-4 mr-2" />
                            {submitting ? 'Import en cours...' : "Lancer l'import"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

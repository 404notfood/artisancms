import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { ArrowDownToLine, ArrowUpFromLine, FileJson, FileCode, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { FormEvent, useCallback, useRef, useState } from 'react';

type ExportType = 'all' | 'pages' | 'posts' | 'menus' | 'settings';

const exportTypes: { value: ExportType; label: string }[] = [
    { value: 'all', label: 'Tout' },
    { value: 'pages', label: 'Pages' },
    { value: 'posts', label: 'Articles' },
    { value: 'menus', label: 'Menus' },
    { value: 'settings', label: 'Param\u00e8tres' },
];

interface ImportResult {
    created: number;
    skipped: number;
    errors: string[];
}

export default function ImportExportIndex() {
    const [exportType, setExportType] = useState<ExportType>('all');
    const [exporting, setExporting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, reset } = useForm<{
        file: File | null;
        format: 'json' | 'wordpress';
    }>({
        file: null,
        format: 'json',
    });

    const handleExport = () => {
        setExporting(true);
        // Use a form submission to trigger file download
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/admin/export';

        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_token';
        csrfInput.value = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        form.appendChild(csrfInput);

        const typeInput = document.createElement('input');
        typeInput.type = 'hidden';
        typeInput.name = 'type';
        typeInput.value = exportType;
        form.appendChild(typeInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        setTimeout(() => setExporting(false), 2000);
    };

    const handleImport = (e: FormEvent) => {
        e.preventDefault();
        if (!data.file) return;

        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('format', data.format);

        router.post('/admin/import', formData, {
            forceFormData: true,
            onSuccess: () => {
                reset();
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setData('file', file);
            // Auto-detect format
            if (file.name.endsWith('.xml')) {
                setData('format', 'wordpress');
            } else {
                setData('format', 'json');
            }
        }
    }, [setData]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('file', file);
        if (file?.name.endsWith('.xml')) {
            setData('format', 'wordpress');
        } else {
            setData('format', 'json');
        }
    };

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <ArrowDownToLine className="h-5 w-5" />
                    Import / Export
                </h1>
            }
        >
            <Head title="Import / Export" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Export Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ArrowUpFromLine className="h-4 w-4" />
                            Exporter
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Exportez le contenu de votre site au format JSON.
                        </p>

                        <div className="space-y-2">
                            <Label>Type de contenu</Label>
                            <div className="space-y-2">
                                {exportTypes.map(type => (
                                    <label
                                        key={type.value}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            name="export_type"
                                            value={type.value}
                                            checked={exportType === type.value}
                                            onChange={() => setExportType(type.value)}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">{type.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Button onClick={handleExport} disabled={exporting} className="w-full">
                            <ArrowUpFromLine className="h-4 w-4 mr-2" />
                            {exporting ? 'Export en cours...' : 'Exporter'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Import Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ArrowDownToLine className="h-4 w-4" />
                            Importer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleImport} className="space-y-4">
                            <p className="text-sm text-gray-500">
                                Importez du contenu depuis un fichier JSON (ArtisanCMS) ou XML (WordPress).
                            </p>

                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                    dragOver
                                        ? 'border-indigo-400 bg-indigo-50'
                                        : data.file
                                            ? 'border-emerald-300 bg-emerald-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".json,.xml"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {data.file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        {data.file.name.endsWith('.xml') ? (
                                            <FileCode className="h-8 w-8 text-emerald-500" />
                                        ) : (
                                            <FileJson className="h-8 w-8 text-emerald-500" />
                                        )}
                                        <p className="text-sm font-medium text-emerald-700">{data.file.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {(data.file.size / 1024).toFixed(1)} Ko
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="h-8 w-8 text-gray-400" />
                                        <p className="text-sm text-gray-600">
                                            Glissez-d\u00e9posez un fichier ou cliquez pour parcourir
                                        </p>
                                        <p className="text-xs text-gray-400">.json ou .xml</p>
                                    </div>
                                )}
                            </div>

                            {/* Format selector */}
                            <div className="space-y-2">
                                <Label>Format</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="format"
                                            value="json"
                                            checked={data.format === 'json'}
                                            onChange={() => setData('format', 'json')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">ArtisanCMS (JSON)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="format"
                                            value="wordpress"
                                            checked={data.format === 'wordpress'}
                                            onChange={() => setData('format', 'wordpress')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">WordPress (XML)</span>
                                    </label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={!data.file || processing}
                                className="w-full"
                            >
                                <ArrowDownToLine className="h-4 w-4 mr-2" />
                                {processing ? 'Import en cours...' : 'Importer'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

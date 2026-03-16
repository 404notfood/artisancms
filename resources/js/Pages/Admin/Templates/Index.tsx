import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Switch } from '@/Components/ui/switch';
import { Label } from '@/Components/ui/label';
import { LayoutTemplate, Upload, Loader2, Check } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface Template {
    slug: string;
    name: string;
    description?: string;
    category?: string;
    version?: string;
    thumbnail_url?: string;
}

interface TemplatePageDetail {
    id: string;
    title: string;
    slug: string;
    meta_description: string;
    blocks_count: number;
}

interface TemplateMenuDetail {
    name: string;
    location: string;
    items_count: number;
}

interface TemplateThemeSummary {
    primary_color: string | null;
    secondary_color: string | null;
    font_heading: string | null;
    font_body: string | null;
}

interface TemplateDetails {
    pages: TemplatePageDetail[];
    menus: TemplateMenuDetail[];
    has_settings: boolean;
    has_theme_overrides: boolean;
    theme_summary: TemplateThemeSummary | null;
}

interface Props {
    templates: Record<string, Template>;
    categories: Record<string, Template[]>;
}

const categoryLabels: Record<string, string> = {
    blank: 'Vide',
    business: 'Business',
    creative: 'Creatif',
    content: 'Contenu',
    marketing: 'Marketing',
    restaurant: 'Restaurant',
    agency: 'Agence',
    portfolio: 'Portfolio',
    blog: 'Blog',
    custom: 'Personnalise',
};

const categoryColors: Record<string, string> = {
    blank: 'bg-gray-50 text-gray-600 border-gray-200',
    business: 'bg-blue-50 text-blue-700 border-blue-200',
    creative: 'bg-purple-50 text-purple-700 border-purple-200',
    content: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    marketing: 'bg-orange-50 text-orange-700 border-orange-200',
    restaurant: 'bg-red-50 text-red-700 border-red-200',
    agency: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    portfolio: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blog: 'bg-teal-50 text-teal-700 border-teal-200',
};

export default function TemplatesIndex({ templates }: Props) {
    const [installing, setInstalling] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [details, setDetails] = useState<TemplateDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Selective install state
    const [selectedPages, setSelectedPages] = useState<string[]>([]);
    const [installMenus, setInstallMenus] = useState(true);
    const [installSettings, setInstallSettings] = useState(false);
    const [installTheme, setInstallTheme] = useState(true);
    const [overwrite, setOverwrite] = useState(false);

    const templateList = Object.values(templates);

    const openInstallModal = useCallback((template: Template) => {
        setSelectedTemplate(template);
        setDetails(null);
        setSelectedPages([]);
        setInstallMenus(true);
        setInstallSettings(false);
        setInstallTheme(true);
        setOverwrite(false);
        setModalOpen(true);
        setLoadingDetails(true);

        fetch(`/admin/templates/${template.slug}/pages`, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => res.json())
            .then((data: TemplateDetails) => {
                setDetails(data);
                setSelectedPages(data.pages.map(p => p.id));
            })
            .catch(() => setDetails(null))
            .finally(() => setLoadingDetails(false));
    }, []);

    const togglePage = useCallback((pageId: string) => {
        setSelectedPages(prev =>
            prev.includes(pageId)
                ? prev.filter(id => id !== pageId)
                : [...prev, pageId]
        );
    }, []);

    const selectAllPages = useCallback(() => {
        if (details) setSelectedPages(details.pages.map(p => p.id));
    }, [details]);

    const selectNoPages = useCallback(() => {
        setSelectedPages([]);
    }, []);

    const handleInstall = useCallback(() => {
        if (!selectedTemplate) return;
        setInstalling(selectedTemplate.slug);
        setModalOpen(false);

        router.post(`/admin/templates/${selectedTemplate.slug}/install`, {
            pages: selectedPages,
            install_menus: installMenus,
            install_settings: installSettings,
            install_theme: installTheme,
            overwrite,
        }, {
            onFinish: () => setInstalling(null),
        });
    }, [selectedTemplate, selectedPages, installMenus, installSettings, installTheme, overwrite]);

    const selectedCount = selectedPages.length;

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5" />
                    Templates de sites
                </h1>
            }
        >
            <Head title="Templates" />

            {templateList.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <LayoutTemplate className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Aucun template disponible</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Placez des templates dans <code className="bg-gray-100 px-1 rounded">content/templates/</code>
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templateList.map(template => (
                        <Card key={template.slug} className="overflow-hidden">
                            {template.thumbnail_url ? (
                                <img
                                    src={template.thumbnail_url}
                                    alt={template.name}
                                    className="h-40 w-full object-cover"
                                />
                            ) : (
                                <div className="h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <LayoutTemplate className="h-10 w-10 text-gray-300" />
                                </div>
                            )}
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                                    {template.category && (
                                        <Badge
                                            variant="outline"
                                            className={`text-xs shrink-0 ml-2 ${categoryColors[template.category] ?? ''}`}
                                        >
                                            {categoryLabels[template.category] ?? template.category}
                                        </Badge>
                                    )}
                                </div>
                                {template.description && (
                                    <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                                )}
                                <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={installing === template.slug}
                                    onClick={() => openInstallModal(template)}
                                >
                                    {installing === template.slug ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            Installation...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-1" />
                                            Installer
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Install modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Installer &laquo;{selectedTemplate?.name}&raquo;
                        </DialogTitle>
                        <DialogDescription>
                            Choisissez les elements a importer depuis ce template.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingDetails ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : details ? (
                        <div className="space-y-6">
                            {/* Pages selection */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-gray-900">
                                        Pages ({selectedCount}/{details.pages.length})
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={selectAllPages}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Tout
                                        </button>
                                        <span className="text-xs text-gray-300">|</span>
                                        <button
                                            type="button"
                                            onClick={selectNoPages}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Aucune
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {details.pages.map(page => {
                                        const isSelected = selectedPages.includes(page.id);
                                        return (
                                            <button
                                                key={page.id}
                                                type="button"
                                                onClick={() => togglePage(page.id)}
                                                className={`text-left border rounded-lg p-3 transition-colors ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                            {page.title}
                                                        </p>
                                                        <p className={`text-xs truncate ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                                            /{page.slug}
                                                        </p>
                                                        <p className={`text-xs mt-1 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                                                            {page.blocks_count} blocs
                                                        </p>
                                                    </div>
                                                    <div className={`shrink-0 w-4 h-4 rounded border mt-0.5 flex items-center justify-center ${
                                                        isSelected
                                                            ? 'bg-blue-500 border-blue-500'
                                                            : 'border-gray-300'
                                                    }`}>
                                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="border-t pt-4 space-y-4">
                                <h3 className="text-sm font-medium text-gray-900">Options</h3>

                                {details.menus.length > 0 && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="install-menus" className="text-sm">Importer les menus</Label>
                                            <p className="text-xs text-gray-400">
                                                {details.menus.map(m => `${m.name} (${m.items_count} items)`).join(', ')}
                                            </p>
                                        </div>
                                        <Switch id="install-menus" checked={installMenus} onCheckedChange={setInstallMenus} />
                                    </div>
                                )}

                                {details.has_settings && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="install-settings" className="text-sm">Appliquer les parametres</Label>
                                            <p className="text-xs text-gray-400">Nom du site, description, etc.</p>
                                        </div>
                                        <Switch id="install-settings" checked={installSettings} onCheckedChange={setInstallSettings} />
                                    </div>
                                )}

                                {details.has_theme_overrides && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="install-theme" className="text-sm">Appliquer le theme</Label>
                                            {installTheme && details.theme_summary && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {details.theme_summary.primary_color && (
                                                        <span
                                                            className="inline-block w-3 h-3 rounded-full border border-gray-200"
                                                            style={{ backgroundColor: details.theme_summary.primary_color }}
                                                        />
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        {[
                                                            details.theme_summary.primary_color,
                                                            details.theme_summary.font_heading,
                                                        ].filter(Boolean).join(' — ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <Switch id="install-theme" checked={installTheme} onCheckedChange={setInstallTheme} />
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="overwrite" className="text-sm">Remplacer le contenu existant</Label>
                                        <p className="text-xs text-gray-400">Ecrase les pages/menus avec le meme slug</p>
                                    </div>
                                    <Switch id="overwrite" checked={overwrite} onCheckedChange={setOverwrite} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-red-500 py-8 text-center">
                            Impossible de charger les details du template.
                        </p>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleInstall}
                            disabled={!details || selectedCount === 0}
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            Installer ({selectedCount})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

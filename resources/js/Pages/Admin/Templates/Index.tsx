import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Switch } from '@/Components/ui/switch';
import { Label } from '@/Components/ui/label';
import { Select, SelectOption } from '@/Components/ui/select';
import { LayoutTemplate, Upload, Loader2, Check, ChevronLeft, ChevronRight, Type, Palette, Settings2 } from 'lucide-react';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// -------------------------------------------------------
// Types
// -------------------------------------------------------

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

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

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

const FONT_OPTIONS = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Merriweather', label: 'Merriweather' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'system-ui', label: 'System UI' },
];

const COLOR_PALETTES = [
    { name: 'Indigo', primary: '#4f46e5', heading: '#1e1b4b', text: '#374151' },
    { name: 'Émeraude', primary: '#059669', heading: '#064e3b', text: '#374151' },
    { name: 'Rose', primary: '#e11d48', heading: '#4c0519', text: '#374151' },
    { name: 'Ambre', primary: '#d97706', heading: '#451a03', text: '#374151' },
    { name: 'Ciel', primary: '#0284c7', heading: '#0c4a6e', text: '#374151' },
];

const WIZARD_STEPS = [
    { id: 1, label: 'Template', icon: LayoutTemplate },
    { id: 2, label: 'Typographie', icon: Type },
    { id: 3, label: 'Couleurs', icon: Palette },
    { id: 4, label: 'Options', icon: Settings2 },
];

// -------------------------------------------------------
// Google Fonts loader
// -------------------------------------------------------

const loadedFonts = new Set<string>();

function loadGoogleFont(fontFamily: string) {
    if (fontFamily === 'system-ui' || fontFamily === 'Georgia' || loadedFonts.has(fontFamily)) return;
    loadedFonts.add(fontFamily);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
}

// -------------------------------------------------------
// FontPreview component
// -------------------------------------------------------

function FontPreview({
    headingFont,
    bodyFont,
    primaryColor,
    headingColor,
    textColor,
}: {
    headingFont: string;
    bodyFont: string;
    primaryColor: string;
    headingColor: string;
    textColor: string;
}) {
    useEffect(() => {
        loadGoogleFont(headingFont);
        loadGoogleFont(bodyFont);
    }, [headingFont, bodyFont]);

    return (
        <div className="border rounded-lg p-5 bg-white space-y-3">
            <h3
                className="text-xl font-bold leading-tight"
                style={{ fontFamily: `"${headingFont}", sans-serif`, color: headingColor }}
            >
                Titre Principal
            </h3>
            <h4
                className="text-base font-semibold"
                style={{ fontFamily: `"${headingFont}", sans-serif`, color: headingColor }}
            >
                Sous-titre de section
            </h4>
            <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: `"${bodyFont}", sans-serif`, color: textColor }}
            >
                Voici un exemple de paragraphe avec la police de corps sélectionnée.
                Ce texte vous permet de visualiser le rendu final sur votre site.
            </p>
            <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md"
                style={{ backgroundColor: primaryColor, fontFamily: `"${bodyFont}", sans-serif` }}
            >
                Bouton d'action
            </button>
        </div>
    );
}

// -------------------------------------------------------
// Main component
// -------------------------------------------------------

export default function TemplatesIndex({ templates }: Props) {
    const [installing, setInstalling] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [details, setDetails] = useState<TemplateDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Wizard step
    const [step, setStep] = useState(1);

    // Step 2: Typography
    const [headingFont, setHeadingFont] = useState('Inter');
    const [bodyFont, setBodyFont] = useState('Inter');

    // Step 3: Colors
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');
    const [headingColor, setHeadingColor] = useState('#1e1b4b');
    const [textColor, setTextColor] = useState('#374151');

    // Step 4: Options
    const [selectedPages, setSelectedPages] = useState<string[]>([]);
    const [installMenus, setInstallMenus] = useState(true);
    const [installSettings, setInstallSettings] = useState(false);
    const [installTheme, setInstallTheme] = useState(true);
    const [overwrite, setOverwrite] = useState(false);
    const [includeLegalPages, setIncludeLegalPages] = useState(true);

    const templateList = Object.values(templates);

    const openInstallModal = useCallback((template: Template) => {
        setSelectedTemplate(template);
        setDetails(null);
        setStep(1);
        setHeadingFont('Inter');
        setBodyFont('Inter');
        setPrimaryColor('#4f46e5');
        setHeadingColor('#1e1b4b');
        setTextColor('#374151');
        setSelectedPages([]);
        setInstallMenus(true);
        setInstallSettings(false);
        setInstallTheme(true);
        setOverwrite(false);
        setIncludeLegalPages(true);
        setModalOpen(true);
        setLoadingDetails(true);

        fetch(`/admin/templates/${template.slug}/pages`, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => res.json())
            .then((data: TemplateDetails) => {
                setDetails(data);
                setSelectedPages(data.pages.map(p => p.id));
                // Pre-fill from theme summary if available
                if (data.theme_summary) {
                    if (data.theme_summary.primary_color) setPrimaryColor(data.theme_summary.primary_color);
                    if (data.theme_summary.font_heading) setHeadingFont(data.theme_summary.font_heading);
                    if (data.theme_summary.font_body) setBodyFont(data.theme_summary.font_body);
                }
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
            heading_font: headingFont,
            body_font: bodyFont,
            primary_color: primaryColor,
            heading_color: headingColor,
            text_color: textColor,
            include_legal_pages: includeLegalPages,
        }, {
            onFinish: () => setInstalling(null),
        });
    }, [selectedTemplate, selectedPages, installMenus, installSettings, installTheme, overwrite, headingFont, bodyFont, primaryColor, headingColor, textColor, includeLegalPages]);

    const selectedCount = selectedPages.length;
    const canGoNext = step < 4;
    const canGoPrev = step > 1;
    const isLastStep = step === 4;

    const applyPalette = useCallback((palette: typeof COLOR_PALETTES[0]) => {
        setPrimaryColor(palette.primary);
        setHeadingColor(palette.heading);
        setTextColor(palette.text);
    }, []);

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

            {/* Install wizard modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Installer &laquo;{selectedTemplate?.name}&raquo;
                        </DialogTitle>
                    </DialogHeader>

                    {/* Progress bar */}
                    <div className="flex items-center gap-1 mb-2">
                        {WIZARD_STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isDone = step > s.id;
                            return (
                                <div key={s.id} className="flex items-center flex-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isDone || isActive) setStep(s.id);
                                        }}
                                        className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md w-full transition-colors ${
                                            isActive
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : isDone
                                                    ? 'text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                                                    : 'text-gray-400 cursor-default'
                                        }`}
                                    >
                                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                                            isActive
                                                ? 'bg-indigo-600 text-white'
                                                : isDone
                                                    ? 'bg-indigo-100 text-indigo-600'
                                                    : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {isDone ? <Check className="h-3.5 w-3.5" /> : s.id}
                                        </div>
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </button>
                                    {i < WIZARD_STEPS.length - 1 && (
                                        <div className={`h-px w-4 shrink-0 ${isDone ? 'bg-indigo-300' : 'bg-gray-200'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {loadingDetails ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : !details ? (
                        <p className="text-sm text-red-500 py-8 text-center">
                            Impossible de charger les details du template.
                        </p>
                    ) : (
                        <>
                            {/* Step 1: Template summary */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        {selectedTemplate?.thumbnail_url ? (
                                            <img
                                                src={selectedTemplate.thumbnail_url}
                                                alt={selectedTemplate.name}
                                                className="w-40 h-28 object-cover rounded-lg border shrink-0"
                                            />
                                        ) : (
                                            <div className="w-40 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border flex items-center justify-center shrink-0">
                                                <LayoutTemplate className="h-8 w-8 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-lg">{selectedTemplate?.name}</h3>
                                            {selectedTemplate?.description && (
                                                <p className="text-sm text-gray-500 mt-1">{selectedTemplate.description}</p>
                                            )}
                                            {selectedTemplate?.category && (
                                                <Badge
                                                    variant="outline"
                                                    className={`mt-2 text-xs ${categoryColors[selectedTemplate.category] ?? ''}`}
                                                >
                                                    {categoryLabels[selectedTemplate.category] ?? selectedTemplate.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-2xl font-bold text-gray-900">{details.pages.length}</p>
                                            <p className="text-xs text-gray-500">Pages</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-2xl font-bold text-gray-900">{details.menus.length}</p>
                                            <p className="text-xs text-gray-500">Menus</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-2xl font-bold text-gray-900">
                                                {details.pages.reduce((sum, p) => sum + p.blocks_count, 0)}
                                            </p>
                                            <p className="text-xs text-gray-500">Blocs</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Typography */}
                            {step === 2 && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="heading-font" className="text-sm font-medium mb-1.5 block">
                                                Police des titres
                                            </Label>
                                            <Select
                                                id="heading-font"
                                                value={headingFont}
                                                onChange={e => setHeadingFont(e.target.value)}
                                            >
                                                {FONT_OPTIONS.map(f => (
                                                    <SelectOption key={f.value} value={f.value}>
                                                        {f.label}
                                                    </SelectOption>
                                                ))}
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="body-font" className="text-sm font-medium mb-1.5 block">
                                                Police du texte
                                            </Label>
                                            <Select
                                                id="body-font"
                                                value={bodyFont}
                                                onChange={e => setBodyFont(e.target.value)}
                                            >
                                                {FONT_OPTIONS.map(f => (
                                                    <SelectOption key={f.value} value={f.value}>
                                                        {f.label}
                                                    </SelectOption>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                    <FontPreview
                                        headingFont={headingFont}
                                        bodyFont={bodyFont}
                                        primaryColor={primaryColor}
                                        headingColor={headingColor}
                                        textColor={textColor}
                                    />
                                </div>
                            )}

                            {/* Step 3: Colors */}
                            {step === 3 && (
                                <div className="space-y-5">
                                    {/* Predefined palettes */}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Palettes</Label>
                                        <div className="flex gap-2">
                                            {COLOR_PALETTES.map(palette => {
                                                const isActive = palette.primary === primaryColor && palette.heading === headingColor;
                                                return (
                                                    <button
                                                        key={palette.name}
                                                        type="button"
                                                        onClick={() => applyPalette(palette)}
                                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                                                            isActive
                                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className="w-4 h-4 rounded-full border border-gray-200"
                                                            style={{ backgroundColor: palette.primary }}
                                                        />
                                                        {palette.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Custom color pickers */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="primary-color" className="text-sm font-medium mb-1.5 block">
                                                Couleur principale
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    id="primary-color"
                                                    value={primaryColor}
                                                    onChange={e => setPrimaryColor(e.target.value)}
                                                    className="w-9 h-9 rounded border border-gray-300 cursor-pointer"
                                                />
                                                <span className="text-xs text-gray-500 font-mono">{primaryColor}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="heading-color" className="text-sm font-medium mb-1.5 block">
                                                Couleur titres
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    id="heading-color"
                                                    value={headingColor}
                                                    onChange={e => setHeadingColor(e.target.value)}
                                                    className="w-9 h-9 rounded border border-gray-300 cursor-pointer"
                                                />
                                                <span className="text-xs text-gray-500 font-mono">{headingColor}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="text-color" className="text-sm font-medium mb-1.5 block">
                                                Couleur texte
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    id="text-color"
                                                    value={textColor}
                                                    onChange={e => setTextColor(e.target.value)}
                                                    className="w-9 h-9 rounded border border-gray-300 cursor-pointer"
                                                />
                                                <span className="text-xs text-gray-500 font-mono">{textColor}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <FontPreview
                                        headingFont={headingFont}
                                        bodyFont={bodyFont}
                                        primaryColor={primaryColor}
                                        headingColor={headingColor}
                                        textColor={textColor}
                                    />
                                </div>
                            )}

                            {/* Step 4: Options (pages, menus, settings, legal) */}
                            {step === 4 && (
                                <div className="space-y-5">
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

                                    {/* Toggles */}
                                    <div className="border-t pt-4 space-y-4">
                                        {/* Legal pages toggle */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="legal-pages" className="text-sm">Generer les pages legales</Label>
                                                <p className="text-xs text-gray-400">
                                                    Mentions legales, Confidentialite, Cookies
                                                </p>
                                            </div>
                                            <Switch id="legal-pages" checked={includeLegalPages} onCheckedChange={setIncludeLegalPages} />
                                        </div>

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
                            )}
                        </>
                    )}

                    {/* Navigation footer */}
                    <DialogFooter className="flex items-center justify-between sm:justify-between">
                        <div>
                            {canGoPrev && (
                                <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Precedent
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                                Annuler
                            </Button>
                            {isLastStep ? (
                                <Button
                                    onClick={handleInstall}
                                    disabled={!details || selectedCount === 0}
                                >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Installer ({selectedCount})
                                </Button>
                            ) : (
                                <Button onClick={() => setStep(s => s + 1)} disabled={!details}>
                                    Suivant
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

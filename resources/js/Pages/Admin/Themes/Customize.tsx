import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, type FormEvent } from 'react';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Button } from '@/Components/ui/button';
import {
    Layout,
    PanelBottom,
    Palette,
    Type,
    Columns3,
    ShoppingBag,
    Sparkles,
    ChevronRight,
    RotateCcw,
    Upload,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FieldDefinition {
    label: string;
    type: 'color' | 'font' | 'select' | 'text' | 'boolean' | 'image';
    default: string | boolean;
    options?: string[];
}

type SchemaSection = Record<string, FieldDefinition>;
type Schema = Record<string, SchemaSection>;

interface CustomizeProps {
    theme: { slug: string; name: string };
    schema: Schema;
    values: Record<string, string | boolean>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

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

const SECTION_META: Record<string, { label: string; icon: typeof Layout }> = {
    header: { label: 'En-tete', icon: Layout },
    footer: { label: 'Pied de page', icon: PanelBottom },
    colors: { label: 'Couleurs', icon: Palette },
    fonts: { label: 'Polices', icon: Type },
    layout: { label: 'Mise en page', icon: Columns3 },
    ecommerce: { label: 'E-commerce', icon: ShoppingBag },
    global_styles: { label: 'Styles globaux', icon: Sparkles },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function Customize({ theme, schema, values }: CustomizeProps) {
    const sections = Object.keys(schema).filter((s) => SECTION_META[s]);
    const [activeSection, setActiveSection] = useState(sections[0] || 'colors');
    const [data, setDataState] = useState<Record<string, string | boolean>>({ ...values });
    const [processing, setProcessing] = useState(false);
    const initialRef = useRef(JSON.stringify(values));
    const isDirty = JSON.stringify(data) !== initialRef.current;

    function setData(key: string, value: string | boolean): void;
    function setData(obj: Record<string, string | boolean>): void;
    function setData(keyOrObj: string | Record<string, string | boolean>, value?: string | boolean) {
        if (typeof keyOrObj === 'string') {
            setDataState((prev) => ({ ...prev, [keyOrObj]: value! }));
        } else {
            setDataState(keyOrObj);
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.put(`/admin/themes/${theme.slug}/customize`, {
            customizations: JSON.stringify(data),
        } as Record<string, string>, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                initialRef.current = JSON.stringify(data);
            },
        });
    }

    function resetSection() {
        const fields = schema[activeSection];
        if (!fields) return;
        const updated = { ...data };
        for (const [key, def] of Object.entries(fields)) {
            updated[`${activeSection}.${key}`] = def.default;
        }
        setDataState(updated);
    }

    function handleImageUpload(dotKey: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('/admin/media', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                'Accept': 'application/json',
            },
        })
            .then((res) => res.json())
            .then((result) => {
                if (result.url || result.path) {
                    setData(dotKey, result.url || `/storage/${result.path}`);
                }
            })
            .catch(() => {
                // Upload failed silently
            });
    }

    const sectionFields = schema[activeSection] || {};
    const SectionIcon = SECTION_META[activeSection]?.icon || Palette;

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/admin/themes" className="text-gray-500 hover:text-gray-700">
                        Themes
                    </Link>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">{theme.name}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">Personnaliser</span>
                </div>
            }
        >
            <Head title={`Personnaliser - ${theme.name}`} />

            <form onSubmit={handleSubmit} className="flex h-[calc(100vh-8rem)] flex-col">
                <div className="flex flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {/* Sidebar */}
                    <div className="w-56 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50/50">
                        <nav className="p-2">
                            {sections.map((sectionKey) => {
                                const meta = SECTION_META[sectionKey];
                                if (!meta) return null;
                                const Icon = meta.icon;
                                const isActive = activeSection === sectionKey;
                                return (
                                    <button
                                        key={sectionKey}
                                        type="button"
                                        onClick={() => setActiveSection(sectionKey)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                            isActive
                                                ? 'bg-indigo-50 font-medium text-indigo-700'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                                        {meta.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Settings */}
                    <div className="w-80 shrink-0 overflow-y-auto border-r border-gray-200 p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <SectionIcon className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-base font-semibold text-gray-900">
                                {SECTION_META[activeSection]?.label || activeSection}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(sectionFields).map(([key, definition]) => {
                                const dotKey = `${activeSection}.${key}`;
                                const value = data[dotKey] ?? definition.default;

                                return (
                                    <FieldRenderer
                                        key={dotKey}
                                        dotKey={dotKey}
                                        definition={definition}
                                        value={value}
                                        onChange={(val) => setData(dotKey, val)}
                                        onImageUpload={(file) => handleImageUpload(dotKey, file)}
                                    />
                                );
                            })}

                            {Object.keys(sectionFields).length === 0 && (
                                <p className="py-8 text-center text-sm text-gray-500">
                                    Aucune option disponible pour cette section.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Live Preview iframe */}
                    <div className="flex-1 bg-gray-100 relative">
                        <iframe
                            src="/"
                            className="w-full h-full border-0"
                            title="Live preview"
                            ref={(el) => {
                                if (!el) return;
                                // Inject CSS variables into iframe on data change
                                try {
                                    const doc = el.contentDocument;
                                    if (!doc) return;
                                    let style = doc.getElementById('theme-preview-vars');
                                    if (!style) {
                                        style = doc.createElement('style');
                                        style.id = 'theme-preview-vars';
                                        doc.head.appendChild(style);
                                    }
                                    const vars = Object.entries(data)
                                        .filter(([, v]) => typeof v === 'string' && v !== '')
                                        .map(([k, v]) => {
                                            const dotIdx = k.indexOf('.');
                                            if (dotIdx === -1) return '';
                                            const section = k.substring(0, dotIdx);
                                            const key = k.substring(dotIdx + 1);
                                            const prefixes: Record<string, string> = {
                                                colors: '--color-',
                                                fonts: '--font-',
                                                layout: '--',
                                                header: '--header-',
                                                footer: '--footer-',
                                                global_styles: '--global-',
                                            };
                                            const prefix = prefixes[section];
                                            if (!prefix) return '';
                                            if (String(v).startsWith('/') || String(v).startsWith('http')) return '';
                                            return `${prefix}${key.replace(/_/g, '-')}: ${v};`;
                                        })
                                        .filter(Boolean)
                                        .join('\n  ');
                                    style.textContent = `:root {\n  ${vars}\n}`;
                                } catch {
                                    // Cross-origin or not loaded yet
                                }
                            }}
                        />
                        <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-500 shadow-sm border">
                            Apercu en direct
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={resetSection}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reinitialiser la section
                        </Button>
                        {isDirty && (
                            <span className="text-xs text-amber-600">
                                Modifications non sauvegardees
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" size="sm" asChild>
                            <Link href="/admin/themes">Annuler</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}

// ─── Field Renderer ─────────────────────────────────────────────────────────

interface FieldRendererProps {
    dotKey: string;
    definition: FieldDefinition;
    value: string | boolean;
    onChange: (value: string | boolean) => void;
    onImageUpload: (file: File) => void;
}

function FieldRenderer({ dotKey, definition, value, onChange, onImageUpload }: FieldRendererProps) {
    switch (definition.type) {
        case 'color':
            return (
                <div>
                    <Label htmlFor={dotKey}>{definition.label}</Label>
                    <div className="mt-1 flex items-center gap-3">
                        <input
                            type="color"
                            id={dotKey}
                            value={String(value || definition.default)}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-10 w-20 cursor-pointer rounded border"
                        />
                        <Input
                            value={String(value || definition.default)}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="#000000"
                            className="max-w-32 font-mono"
                        />
                    </div>
                </div>
            );

        case 'font':
            return (
                <div>
                    <Label htmlFor={dotKey}>{definition.label}</Label>
                    <select
                        id={dotKey}
                        value={String(value || definition.default)}
                        onChange={(e) => onChange(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.label}
                            </option>
                        ))}
                    </select>
                </div>
            );

        case 'select':
            return (
                <div>
                    <Label htmlFor={dotKey}>{definition.label}</Label>
                    <select
                        id={dotKey}
                        value={String(value ?? definition.default)}
                        onChange={(e) => onChange(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {(definition.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            );

        case 'text':
            return (
                <div>
                    <Label htmlFor={dotKey}>{definition.label}</Label>
                    <Input
                        id={dotKey}
                        value={String(value || '')}
                        onChange={(e) => onChange(e.target.value)}
                        className="mt-1"
                    />
                </div>
            );

        case 'boolean':
            return (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                    <Label htmlFor={dotKey} className="cursor-pointer">
                        {definition.label}
                    </Label>
                    <Switch
                        id={dotKey}
                        checked={Boolean(value)}
                        onCheckedChange={(checked) => onChange(checked)}
                    />
                </div>
            );

        case 'image':
            return (
                <div>
                    <Label>{definition.label}</Label>
                    <div className="mt-1 flex items-center gap-3">
                        <Input
                            value={String(value || '')}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="/storage/media/logo.png"
                            className="flex-1"
                        />
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                            <Upload className="h-4 w-4" />
                            Upload
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onImageUpload(file);
                                }}
                            />
                        </label>
                    </div>
                    {value && typeof value === 'string' && value.length > 0 && (
                        <img
                            src={value}
                            alt="Preview"
                            className="mt-2 h-12 rounded border object-contain"
                        />
                    )}
                </div>
            );

        default:
            return null;
    }
}

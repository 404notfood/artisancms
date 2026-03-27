import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { useState, useRef, type FormEvent } from 'react';
import { Button } from '@/Components/ui/button';
import {
    Layout,
    PanelBottom,
    Palette,
    Type,
    Columns3,
    ShoppingBag,
    Sparkles,
    Space,
    ChevronRight,
    RotateCcw,
} from 'lucide-react';
import { type Schema } from './components/types';
import FieldRenderer from './components/FieldRenderer';
import FontsSectionLayout from './components/FontsSectionLayout';
import LivePreview from './components/LivePreview';

interface CustomizeProps {
    theme: { slug: string; name: string };
    schema: Schema;
    values: Record<string, string | boolean>;
}

const SECTION_META: Record<string, { label: string; icon: typeof Layout }> = {
    header: { label: 'En-tete', icon: Layout },
    footer: { label: 'Pied de page', icon: PanelBottom },
    colors: { label: 'Couleurs', icon: Palette },
    fonts: { label: 'Polices', icon: Type },
    layout: { label: 'Mise en page', icon: Columns3 },
    ecommerce: { label: 'E-commerce', icon: ShoppingBag },
    global_styles: { label: 'Styles globaux', icon: Sparkles },
    spacing: { label: 'Espacement', icon: Space },
};

export default function Customize({ theme, schema, values }: CustomizeProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
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

        fetch(`/${prefix}/media`, {
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
                    <Link href={`/${prefix}/themes`} className="text-gray-500 hover:text-gray-700">
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

                        {Object.keys(sectionFields).length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-500">
                                Aucune option disponible pour cette section.
                            </p>
                        ) : activeSection === 'fonts' ? (
                            <FontsSectionLayout
                                fields={sectionFields}
                                data={data}
                                activeSection={activeSection}
                                onChange={(dotKey, val) => setData(dotKey, val)}
                                onImageUpload={(dotKey, file) => handleImageUpload(dotKey, file)}
                            />
                        ) : (
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
                            </div>
                        )}
                    </div>

                    {/* Live Preview iframe */}
                    <LivePreview data={data} />
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
                            <Link href={`/${prefix}/themes`}>Annuler</Link>
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

import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { FlashMessages } from '@/types/cms';

interface ThemeCustomization {
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
}

interface ThemeItem {
    slug: string;
    name: string;
    version: string;
    description: string;
    author: string;
    active: boolean;
    customization: ThemeCustomization;
    active_customizations: Record<string, unknown>;
}

interface ThemesIndexProps {
    themes: ThemeItem[];
}

const FONT_OPTIONS = [
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans' },
    { value: 'Lato, sans-serif', label: 'Lato' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
    { value: 'Playfair Display, serif', label: 'Playfair Display' },
    { value: 'Merriweather, serif', label: 'Merriweather' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'system-ui, sans-serif', label: 'System UI' },
];

export default function ThemesIndex({ themes }: ThemesIndexProps) {
    const { flash } = usePage().props as unknown as { flash: FlashMessages };
    const [customizingSlug, setCustomizingSlug] = useState<string | null>(null);
    const [customizations, setCustomizations] = useState<Record<string, unknown>>({});
    const [saving, setSaving] = useState(false);

    function handleActivate(slug: string) {
        router.post(`/admin/themes/${slug}/activate`, {}, {
            preserveScroll: true,
        });
    }

    function openCustomizer(theme: ThemeItem) {
        setCustomizingSlug(theme.slug);
        setCustomizations(theme.active_customizations ?? {});
    }

    function closeCustomizer() {
        setCustomizingSlug(null);
        setCustomizations({});
    }

    function handleCustomizationChange(key: string, value: string) {
        setCustomizations((prev) => ({ ...prev, [key]: value }));
    }

    function handleSaveCustomizations() {
        if (!customizingSlug) return;
        setSaving(true);
        router.put(`/admin/themes/${customizingSlug}/customize`, {
            customizations: JSON.stringify(customizations),
        } as Record<string, string>, {
            preserveScroll: true,
            onFinish: () => {
                setSaving(false);
                closeCustomizer();
            },
        });
    }

    const customizingTheme = themes.find((t) => t.slug === customizingSlug);

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Themes</h1>}>
            <Head title="Themes" />

            {/* Flash message */}
            {flash.success && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            {themes.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                    <ThemeEmptyIcon />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">Aucun theme</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Placez vos themes dans le dossier content/themes/ pour les voir ici.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {themes.map((theme) => (
                        <div
                            key={theme.slug}
                            className={`relative rounded-lg border bg-white transition-shadow hover:shadow-md ${
                                theme.active ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200'
                            }`}
                        >
                            {/* Theme preview placeholder */}
                            <div className="flex h-40 items-center justify-center rounded-t-lg bg-gradient-to-br from-gray-100 to-gray-50">
                                <ThemePreviewIcon />
                            </div>

                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-sm font-semibold text-gray-900">
                                            {theme.name}
                                        </h3>
                                        {theme.author && (
                                            <p className="text-xs text-gray-500">par {theme.author}</p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="text-xs text-gray-400">v{theme.version}</span>
                                        {theme.active && (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                Actif
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {theme.description && (
                                    <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                                        {theme.description}
                                    </p>
                                )}

                                <div className="mt-4 flex items-center gap-2">
                                    {theme.active ? (
                                        <button
                                            type="button"
                                            onClick={() => openCustomizer(theme)}
                                            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                        >
                                            Personnaliser
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleActivate(theme.slug)}
                                            className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                                        >
                                            Activer
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Customization panel (slide-over) */}
            {customizingTheme && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={closeCustomizer}
                    />
                    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Personnaliser : {customizingTheme.name}
                            </h2>
                            <button
                                type="button"
                                onClick={closeCustomizer}
                                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6 p-6">
                            {/* Colors */}
                            {customizingTheme.customization.colors &&
                                Object.keys(customizingTheme.customization.colors).length > 0 && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-medium text-gray-900">Couleurs</h3>
                                        <div className="space-y-3">
                                            {Object.entries(customizingTheme.customization.colors).map(
                                                ([key, defaultValue]) => (
                                                    <div key={key} className="flex items-center gap-3">
                                                        <input
                                                            type="color"
                                                            value={String((customizations as Record<string, string>)[key] ?? defaultValue)}
                                                            onChange={(e) => handleCustomizationChange(key, e.target.value)}
                                                            className="h-8 w-8 shrink-0 cursor-pointer rounded border border-gray-300"
                                                        />
                                                        <label className="text-sm text-gray-700">
                                                            {formatCustomizationLabel(key)}
                                                        </label>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Fonts */}
                            {customizingTheme.customization.fonts &&
                                Object.keys(customizingTheme.customization.fonts).length > 0 && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-medium text-gray-900">Polices</h3>
                                        <div className="space-y-3">
                                            {Object.entries(customizingTheme.customization.fonts).map(
                                                ([key, defaultValue]) => (
                                                    <div key={key}>
                                                        <label className="mb-1 block text-sm text-gray-700">
                                                            {formatCustomizationLabel(key)}
                                                        </label>
                                                        <select
                                                            value={String((customizations as Record<string, string>)[key] ?? defaultValue)}
                                                            onChange={(e) => handleCustomizationChange(key, e.target.value)}
                                                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        >
                                                            {FONT_OPTIONS.map((font) => (
                                                                <option key={font.value} value={font.value}>
                                                                    {font.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* No customization options */}
                            {(!customizingTheme.customization.colors ||
                                Object.keys(customizingTheme.customization.colors).length === 0) &&
                                (!customizingTheme.customization.fonts ||
                                    Object.keys(customizingTheme.customization.fonts).length === 0) && (
                                    <p className="py-8 text-center text-sm text-gray-500">
                                        Ce theme ne propose pas d'options de personnalisation.
                                    </p>
                                )}
                        </div>

                        <div className="border-t border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeCustomizer}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveCustomizations}
                                    disabled={saving}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}

function formatCustomizationLabel(key: string): string {
    return key
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ThemeEmptyIcon() {
    return (
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072" />
        </svg>
    );
}

function ThemePreviewIcon() {
    return (
        <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="0.75" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072" />
        </svg>
    );
}

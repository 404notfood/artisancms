import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { FlashMessages } from '@/types/cms';

interface ThemeItem {
    slug: string;
    name: string;
    version: string;
    description: string;
    author: string;
    active: boolean;
}

interface ThemesIndexProps {
    themes: ThemeItem[];
}

export default function ThemesIndex({ themes }: ThemesIndexProps) {
    const { flash } = usePage().props as unknown as { flash: FlashMessages };

    function handleActivate(slug: string) {
        router.post(`/admin/themes/${slug}/activate`, {}, {
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Themes</h1>}>
            <Head title="Themes" />

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
                                        <Link
                                            href={`/admin/themes/${theme.slug}/customize`}
                                            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-center text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                        >
                                            Personnaliser
                                        </Link>
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
        </AdminLayout>
    );
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

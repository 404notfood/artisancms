import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { FlashMessages } from '@/types/cms';

interface ThemeItem {
    slug: string;
    name: string;
    version: string;
    description: string;
    author: string;
    active: boolean;
    preview_url: string | null;
}

interface ThemesIndexProps {
    themes: ThemeItem[];
}

export default function ThemesIndex({ themes }: ThemesIndexProps) {
    const { flash } = usePage().props as unknown as { flash: FlashMessages };
    const [uploadOpen, setUploadOpen] = useState(false);
    const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

    function handleActivate(slug: string) {
        router.post(`/admin/themes/${slug}/activate`, {}, { preserveScroll: true });
    }

    function handleDelete(slug: string) {
        router.delete(`/admin/themes/${slug}`, {
            onSuccess: () => setDeleteSlug(null),
        });
    }

    return (
        <AdminLayout header={
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">Thèmes</h1>
                <button
                    type="button"
                    onClick={() => setUploadOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <UploadIcon />
                    Installer un thème
                </button>
            </div>
        }>
            <Head title="Thèmes" />

            {flash.success && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}
            {(flash as any).error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {(flash as any).error}
                </div>
            )}

            {themes.length === 0 ? (
                <EmptyState onInstall={() => setUploadOpen(true)} />
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {themes.map((theme) => (
                        <ThemeCard
                            key={theme.slug}
                            theme={theme}
                            onActivate={handleActivate}
                            onDelete={(slug) => setDeleteSlug(slug)}
                        />
                    ))}
                </div>
            )}

            {uploadOpen && (
                <UploadModal onClose={() => setUploadOpen(false)} />
            )}

            {deleteSlug && (
                <DeleteConfirmModal
                    slug={deleteSlug}
                    themeName={themes.find(t => t.slug === deleteSlug)?.name ?? deleteSlug}
                    onConfirm={() => handleDelete(deleteSlug)}
                    onCancel={() => setDeleteSlug(null)}
                />
            )}
        </AdminLayout>
    );
}

// ─── Theme Card ───────────────────────────────────────────────────────────────

function ThemeCard({
    theme,
    onActivate,
    onDelete,
}: {
    theme: ThemeItem;
    onActivate: (slug: string) => void;
    onDelete: (slug: string) => void;
}) {
    return (
        <div className={`relative flex flex-col rounded-lg border bg-white transition-shadow hover:shadow-md ${
            theme.active ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200'
        }`}>
            {/* Preview thumbnail */}
            <div className="flex h-40 items-center justify-center overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-100 to-gray-50">
                {theme.preview_url ? (
                    <img
                        src={theme.preview_url}
                        alt={`Aperçu ${theme.name}`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <ThemePreviewIcon />
                )}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-gray-900">{theme.name}</h3>
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
                    <p className="mt-2 line-clamp-2 text-xs text-gray-500">{theme.description}</p>
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
                        <>
                            <button
                                type="button"
                                onClick={() => onActivate(theme.slug)}
                                className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                            >
                                Activer
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(theme.slug)}
                                title="Supprimer ce thème"
                                className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            >
                                <TrashIcon />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose }: { onClose: () => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    function handleFile(f: File) {
        if (f.name.endsWith('.zip')) {
            setFile(f);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }

    function handleSubmit() {
        if (!file) return;

        const formData = new FormData();
        formData.append('theme_zip', file);
        setUploading(true);

        router.post('/admin/themes/upload', formData, {
            forceFormData: true,
            onFinish: () => {
                setUploading(false);
                onClose();
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-900">Installer un thème</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Drop zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                            dragging
                                ? 'border-indigo-400 bg-indigo-50'
                                : file
                                    ? 'border-green-400 bg-green-50'
                                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip,application/zip"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                        {file ? (
                            <>
                                <ZipIcon className="mx-auto mb-2 h-10 w-10 text-green-500" />
                                <p className="text-sm font-medium text-green-700">{file.name}</p>
                                <p className="mt-1 text-xs text-green-600">
                                    {(file.size / 1024 / 1024).toFixed(2)} Mo
                                </p>
                            </>
                        ) : (
                            <>
                                <UploadIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                                <p className="text-sm font-medium text-gray-700">
                                    Glissez votre fichier .zip ici
                                </p>
                                <p className="mt-1 text-xs text-gray-400">ou cliquez pour sélectionner</p>
                                <p className="mt-2 text-xs text-gray-400">ZIP uniquement · max 50 Mo</p>
                            </>
                        )}
                    </div>

                    <p className="text-xs text-gray-500">
                        Le ZIP doit contenir un fichier <code className="rounded bg-gray-100 px-1 py-0.5">artisan-theme.json</code> à la racine.
                    </p>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!file || uploading}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <SpinnerIcon />
                                Installation...
                            </>
                        ) : (
                            'Installer le thème'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
    slug,
    themeName,
    onConfirm,
    onCancel,
}: {
    slug: string;
    themeName: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                            <TrashIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Supprimer ce thème ?</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Le thème <strong>{themeName}</strong> sera supprimé définitivement. Cette action est irréversible.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onInstall }: { onInstall: () => void }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <ThemeEmptyIcon />
            <h3 className="mt-4 text-sm font-medium text-gray-900">Aucun thème installé</h3>
            <p className="mt-1 text-sm text-gray-500">
                Installez un thème depuis un fichier ZIP ou placez-le dans{' '}
                <code className="rounded bg-gray-100 px-1">content/themes/</code>.
            </p>
            <button
                type="button"
                onClick={onInstall}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
                <UploadIcon />
                Installer un thème
            </button>
        </div>
    );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function UploadIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
    );
}

function TrashIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function ZipIcon({ className = 'h-8 w-8' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function SpinnerIcon() {
    return (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
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

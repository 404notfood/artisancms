import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Upload, Trash2, X, FileArchive, Loader2, Paintbrush, Code2 } from 'lucide-react';
import type { FlashMessages, SharedProps } from '@/types/cms';

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
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
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
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Thèmes</h1>}>
            <Head title="Thèmes" />

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

            <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {themes.length} thème{themes.length !== 1 ? 's' : ''} installé{themes.length !== 1 ? 's' : ''}
                </p>
                <button
                    type="button"
                    onClick={() => setUploadOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <Upload className="h-4 w-4" />
                    Installer un thème
                </button>
            </div>

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
                    <Paintbrush className="h-16 w-16 text-gray-300" strokeWidth={0.75} />
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
                        <>
                            <Link
                                href={`/admin/themes/${theme.slug}/customize`}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-center text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Personnaliser
                            </Link>
                            <Link
                                href={`/admin/themes/${theme.slug}/custom-code`}
                                title="CSS / JS personnalise"
                                className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-500"
                            >
                                <Code2 className="h-4 w-4" />
                            </Link>
                        </>
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
                                <Trash2 className="h-4 w-4" />
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

        router.post(`/${prefix}/themes/upload`, formData, {
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
                        <X className="h-5 w-5" />
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
                                <FileArchive className="mx-auto mb-2 h-10 w-10 text-green-500" />
                                <p className="text-sm font-medium text-green-700">{file.name}</p>
                                <p className="mt-1 text-xs text-green-600">
                                    {(file.size / 1024 / 1024).toFixed(2)} Mo
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload className="mx-auto mb-2 h-10 w-10 text-gray-300" />
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
                                <Loader2 className="h-4 w-4 animate-spin" />
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
                            <Trash2 className="h-5 w-5 text-red-600" />
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
            <Paintbrush className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1} />
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
                <Upload className="h-4 w-4" />
                Installer un thème
            </button>
        </div>
    );
}


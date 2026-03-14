import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import type { MediaData, PaginatedResponse } from '@/types/cms';

interface MediaIndexProps {
    media: PaginatedResponse<MediaData>;
    filters: {
        type?: string;
        search?: string;
    };
}

const typeFilters = [
    { label: 'Tout', value: '' },
    { label: 'Images', value: 'image' },
    { label: 'Documents', value: 'document' },
    { label: 'Vidéos', value: 'video' },
];

export default function MediaIndex({ media, filters }: MediaIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedMedia, setSelectedMedia] = useState<MediaData | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/media', { search, type: filters.type }, { preserveState: true });
    }

    function handleTypeChange(type: string) {
        router.get('/admin/media', { type, search: filters.search }, { preserveState: true });
    }

    function handleUpload(files: FileList | null) {
        if (!files || files.length === 0) return;

        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('files[]', file);
        });

        router.post('/admin/media', formData, {
            forceFormData: true,
            preserveState: true,
        });
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        handleUpload(e.dataTransfer.files);
    }

    function handleDelete(mediaItem: MediaData) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${mediaItem.original_filename}" ?`)) return;
        router.delete(`/admin/media/${mediaItem.id}`, {
            preserveState: true,
            onSuccess: () => {
                if (selectedMedia?.id === mediaItem.id) {
                    setSelectedMedia(null);
                }
            },
        });
    }

    function isImage(mimeType: string): boolean {
        return mimeType.startsWith('image/');
    }

    function isVideo(mimeType: string): boolean {
        return mimeType.startsWith('video/');
    }

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} o`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    }

    return (
        <AdminLayout header={<h1 className="text-xl font-semibold text-gray-900">Médiathèque</h1>}>
            <Head title="Médiathèque" />

            <div className="space-y-6">
                {/* Upload zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                        isDragging
                            ? 'border-indigo-400 bg-indigo-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                >
                    <UploadIcon />
                    <p className="mt-2 text-sm font-medium text-gray-700">
                        Glissez-déposez vos fichiers ici
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        ou cliquez pour sélectionner
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => handleUpload(e.target.files)}
                        className="hidden"
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                    />
                </div>

                {/* Filters + Search */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-1">
                        {typeFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => handleTypeChange(filter.value)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    (filters.type ?? '') === filter.value
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un fichier..."
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            Rechercher
                        </button>
                    </form>
                </div>

                <div className="flex gap-6">
                    {/* Grid */}
                    <div className="flex-1">
                        {media.data.length === 0 ? (
                            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
                                <MediaEmptyIcon />
                                <p className="mt-2 text-sm text-gray-500">Aucun média trouvé.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {media.data.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedMedia(item)}
                                        className={`group relative overflow-hidden rounded-lg border bg-white transition-all hover:shadow-md ${
                                            selectedMedia?.id === item.id
                                                ? 'border-indigo-500 ring-2 ring-indigo-200'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="aspect-square bg-gray-100">
                                            {isImage(item.mime_type) ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.alt_text ?? item.original_filename}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : isVideo(item.mime_type) ? (
                                                <div className="flex h-full items-center justify-center">
                                                    <VideoIcon />
                                                </div>
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <FileIcon />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <p className="truncate text-xs font-medium text-gray-700">
                                                {item.original_filename}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatFileSize(item.size)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {media.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    {media.from}–{media.to} sur {media.total}
                                </p>
                                <div className="flex gap-1">
                                    {Array.from({ length: media.last_page }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() =>
                                                router.get('/admin/media', {
                                                    page: p,
                                                    type: filters.type ?? '',
                                                    search: filters.search ?? '',
                                                }, { preserveState: true })
                                            }
                                            className={`rounded px-3 py-1 text-sm ${
                                                p === media.current_page
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detail panel */}
                    {selectedMedia && (
                        <div className="hidden w-80 shrink-0 rounded-lg border border-gray-200 bg-white p-4 lg:block">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-900">Détails du fichier</h3>
                                <button
                                    onClick={() => setSelectedMedia(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <CloseIcon />
                                </button>
                            </div>

                            {/* Preview */}
                            <div className="mb-4 overflow-hidden rounded-lg bg-gray-100">
                                {isImage(selectedMedia.mime_type) ? (
                                    <img
                                        src={selectedMedia.url}
                                        alt={selectedMedia.alt_text ?? selectedMedia.original_filename}
                                        className="w-full object-contain"
                                        style={{ maxHeight: '200px' }}
                                    />
                                ) : (
                                    <div className="flex h-32 items-center justify-center">
                                        <FileIcon />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Nom du fichier</p>
                                    <p className="font-medium text-gray-900 break-all">{selectedMedia.original_filename}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Type MIME</p>
                                    <p className="font-medium text-gray-900">{selectedMedia.mime_type}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Taille</p>
                                    <p className="font-medium text-gray-900">{formatFileSize(selectedMedia.size)}</p>
                                </div>
                                {selectedMedia.alt_text && (
                                    <div>
                                        <p className="text-gray-500">Texte alternatif</p>
                                        <p className="font-medium text-gray-900">{selectedMedia.alt_text}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-gray-500">URL</p>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedMedia.url}
                                        className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600"
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                </div>
                                <div>
                                    <p className="text-gray-500">Date d'ajout</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(selectedMedia.created_at).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handleDelete(selectedMedia)}
                                    className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function UploadIcon() {
    return (
        <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
    );
}

function FileIcon() {
    return (
        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function VideoIcon() {
    return (
        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
        </svg>
    );
}

function MediaEmptyIcon() {
    return (
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25H4.5A2.25 2.25 0 012.25 18z" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

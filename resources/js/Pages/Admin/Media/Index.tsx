import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { CloudUpload, FileText, Video, ImageIcon, X } from 'lucide-react';
import type { MediaData, PaginatedResponse } from '@/types/cms';
import { MediaFolderTree } from '@/Components/admin/media-folder-tree';
import { ImageEditor } from '@/Components/admin/image-editor';
import { StockPhotoSearch } from '@/Components/admin/stock-photo-search';

interface MediaIndexProps {
    media: PaginatedResponse<MediaData>;
    filters: {
        type?: string;
        search?: string;
        folder?: string;
    };
}

const typeFilters = [
    { label: 'Tout', value: '' },
    { label: 'Images', value: 'image' },
    { label: 'Documents', value: 'document' },
    { label: 'Vidéos', value: 'video' },
];

type SidePanel = 'details' | 'stock' | 'editor';

export default function MediaIndex({ media, filters }: MediaIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedMedia, setSelectedMedia] = useState<MediaData | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [currentFolder, setCurrentFolder] = useState(filters.folder ?? '');
    const [sidePanel, setSidePanel] = useState<SidePanel>('details');
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(`/${prefix}/media`, { search, type: filters.type, folder: currentFolder }, { preserveState: true });
    }

    function handleTypeChange(type: string) {
        router.get(`/${prefix}/media`, { type, search: filters.search, folder: currentFolder }, { preserveState: true });
    }

    function handleFolderChange(folder: string) {
        setCurrentFolder(folder);
        router.get(`/${prefix}/media`, { folder, type: filters.type, search: filters.search }, { preserveState: true });
    }

    function handleUpload(files: FileList | null) {
        if (!files || files.length === 0) return;

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        let completed = 0;
        const total = files.length;

        Array.from(files).forEach((file) => {
            const formData = new FormData();
            formData.append('file', file);
            if (currentFolder) formData.append('folder', currentFolder);

            fetch(`/${prefix}/media`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            })
                .then((res) => {
                    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
                    return res.json();
                })
                .then(() => {
                    completed++;
                    if (completed === total) {
                        router.reload({ only: ['media'] });
                    }
                })
                .catch((err) => {
                    console.error('Upload error:', err);
                    completed++;
                    if (completed === total) {
                        router.reload({ only: ['media'] });
                    }
                });
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
                    <CloudUpload className="h-10 w-10 text-gray-400" />
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

                {/* Filters + Search + Stock Photos toggle */}
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
                        <div className="mx-2 w-px bg-gray-200" />
                        <button
                            onClick={() => {
                                setSidePanel('stock');
                                setSelectedMedia(null);
                            }}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                sidePanel === 'stock'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Stock Photos
                        </button>
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
                    {/* Folder sidebar */}
                    <MediaFolderTree
                        currentFolder={currentFolder}
                        onSelectFolder={handleFolderChange}
                    />

                    {/* Grid */}
                    <div className="flex-1">
                        {media.data.length === 0 ? (
                            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500">Aucun média trouvé.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {media.data.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedMedia(item);
                                            setSidePanel('details');
                                        }}
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
                                                    <Video className="h-12 w-12 text-gray-400" />
                                                </div>
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <FileText className="h-12 w-12 text-gray-400" />
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
                                                router.get(`/${prefix}/media`, {
                                                    page: p,
                                                    type: filters.type ?? '',
                                                    search: filters.search ?? '',
                                                    folder: currentFolder,
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

                    {/* Right side panel */}
                    {sidePanel === 'stock' && (
                        <div className="hidden w-80 shrink-0 rounded-lg border border-gray-200 bg-white p-4 lg:block">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-900">Stock Photos</h3>
                                <button
                                    onClick={() => setSidePanel('details')}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <StockPhotoSearch
                                onSelect={() => {
                                    router.reload({ only: ['media'] });
                                }}
                            />
                        </div>
                    )}

                    {sidePanel === 'editor' && selectedMedia && isImage(selectedMedia.mime_type) && (
                        <div className="hidden w-96 shrink-0 rounded-lg border border-gray-200 bg-white p-4 lg:block">
                            <ImageEditor
                                mediaId={selectedMedia.id}
                                imageUrl={selectedMedia.url}
                                onSave={() => {
                                    router.reload({ only: ['media'] });
                                    setSidePanel('details');
                                }}
                                onCancel={() => setSidePanel('details')}
                            />
                        </div>
                    )}

                    {sidePanel === 'details' && selectedMedia && (
                        <div className="hidden w-80 shrink-0 rounded-lg border border-gray-200 bg-white p-4 lg:block">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-900">Détails du fichier</h3>
                                <button
                                    onClick={() => setSelectedMedia(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
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
                                        <FileText className="h-12 w-12 text-gray-400" />
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
                            <div className="mt-4 space-y-2">
                                {isImage(selectedMedia.mime_type) && (
                                    <button
                                        onClick={() => setSidePanel('editor')}
                                        className="w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
                                    >
                                        Recadrer / Remplacer
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(selectedMedia)}
                                    className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
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


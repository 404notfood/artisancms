import { useState } from 'react';
import { Search, Download, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/Components/ui/button';

interface StockPhoto {
    id: string;
    url: string;
    thumb: string;
    author: string;
    download_url: string;
}

interface StockPhotoSearchProps {
    onSelect: (photo: StockPhoto) => void;
}

export function StockPhotoSearch({ onSelect }: StockPhotoSearchProps) {
    const [query, setQuery] = useState('');
    const [provider, setProvider] = useState<'unsplash' | 'pexels'>('unsplash');
    const [results, setResults] = useState<StockPhoto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const res = await fetch(
                `/admin/media/stock-search?provider=${provider}&query=${encodeURIComponent(query)}`,
                { headers: { Accept: 'application/json' } },
            );
            const data = await res.json();
            setResults(data.results ?? []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload(photo: StockPhoto) {
        setDownloading(photo.id);
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

        try {
            const res = await fetch('/admin/media/stock-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    url: photo.download_url,
                    filename: `${provider}-${photo.id}.jpg`,
                    author: photo.author,
                }),
            });
            const data = await res.json();
            if (data.success) {
                onSelect(photo);
            }
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloading(null);
        }
    }

    return (
        <div className="space-y-4">
            {/* Provider tabs */}
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                <button
                    onClick={() => setProvider('unsplash')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        provider === 'unsplash'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Unsplash
                </button>
                <button
                    onClick={() => setProvider('pexels')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        provider === 'pexels'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Pexels
                </button>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher des photos..."
                        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <Button type="submit" disabled={loading} size="sm">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rechercher'}
                </Button>
            </form>

            {/* Results grid */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {results.map((photo) => (
                        <div
                            key={photo.id}
                            className="group relative overflow-hidden rounded-lg border border-gray-200"
                        >
                            <img
                                src={photo.thumb}
                                alt={`Photo by ${photo.author}`}
                                className="aspect-square w-full object-cover"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleDownload(photo)}
                                    disabled={downloading === photo.id}
                                >
                                    {downloading === photo.id ? (
                                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Download className="mr-1 h-3.5 w-3.5" />
                                    )}
                                    Importer
                                </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
                                <p className="truncate text-xs text-white">{photo.author}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : searched ? (
                <div className="py-8 text-center text-sm text-gray-500">
                    Aucun résultat trouvé. Essayez d'autres termes.
                </div>
            ) : (
                <div className="py-8 text-center text-sm text-gray-400">
                    Recherchez des photos libres de droits sur {provider === 'unsplash' ? 'Unsplash' : 'Pexels'}
                </div>
            )}
        </div>
    );
}

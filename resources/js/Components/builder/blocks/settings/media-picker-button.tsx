import { useCallback, useEffect, useState } from 'react';

interface MediaItem {
    id: number;
    url: string;
    alt: string;
    filename: string;
    mime_type: string;
    thumbnail_url?: string;
}

interface MediaPickerButtonProps {
    value: string;
    onChange: (url: string, alt?: string) => void;
    label?: string;
    placeholder?: string;
}

export default function MediaPickerButton({ value, onChange, label = 'Image', placeholder = "Choisir une image" }: MediaPickerButtonProps) {
    const [open, setOpen] = useState(false);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/admin/media?json=1&type=image&search=${encodeURIComponent(search)}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                const data = await res.json();
                setMedia(Array.isArray(data) ? data : data.data || []);
            }
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (open) {
            fetchMedia();
        }
    }, [open, fetchMedia]);

    return (
        <div>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

            {value ? (
                <div className="space-y-2">
                    <div className="relative group">
                        <img src={value} alt="" className="w-full h-24 object-cover rounded border" />
                        <button
                            type="button"
                            onClick={() => onChange('', '')}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            &times;
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                    >
                        Changer
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="w-full border-2 border-dashed border-gray-300 rounded px-3 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                    {placeholder}
                </button>
            )}

            {open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="font-semibold text-gray-900">Choisir dans la médiathèque</h3>
                            <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                        </div>

                        <div className="px-4 py-2 border-b">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher..."
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="flex-1 overflow-auto p-4">
                            {loading ? (
                                <div className="text-center py-8 text-gray-400">Chargement...</div>
                            ) : media.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">Aucun média trouvé</div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {media.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(item.url, item.alt);
                                                setOpen(false);
                                            }}
                                            className={`relative rounded border-2 overflow-hidden aspect-square hover:border-blue-500 transition-colors ${value === item.url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                                        >
                                            <img
                                                src={item.thumbnail_url || item.url}
                                                alt={item.alt || item.filename}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

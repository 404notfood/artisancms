import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { SharedProps } from '@/types/cms';

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
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [open, setOpen] = useState(false);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!open) return;

        const controller = new AbortController();
        setLoading(true);
        setError(false);

        const timer = window.setTimeout(async () => {
            try {
                const res = await fetch(`/${prefix}/media?json=1&type=image&search=${encodeURIComponent(search)}`, {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Media request failed');
                const data = await res.json();
                if (!controller.signal.aborted) {
                    setMedia(Array.isArray(data) ? data : data.data || []);
                }
            } catch {
                if (!controller.signal.aborted) setError(true);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 200);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [open, prefix, search]);

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
                            aria-label="Retirer l'image"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                            &times;
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                    >
                        Changer dans la médiathèque
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
                <Dialog open={open} onClose={() => setOpen(false)} className="relative z-[9999]">
                    <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <DialogPanel className="bg-white rounded-lg shadow-xl w-full max-w-[600px] max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b">
                                <DialogTitle className="font-semibold text-gray-900">Choisir dans la médiathèque</DialogTitle>
                                <button type="button" onClick={() => setOpen(false)} aria-label="Fermer la médiathèque" className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                            </div>

                            <div className="px-4 py-2 border-b">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Rechercher..."
                                    aria-label="Rechercher une image"
                                    data-autofocus
                                    className="w-full border rounded px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="min-h-0 flex-1 overflow-auto p-4">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-400">Chargement...</div>
                                ) : error ? (
                                    <div role="alert" className="text-center py-8 text-red-600">Impossible de charger la médiathèque. Fermez puis réessayez.</div>
                                ) : media.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">Aucun média trouvé</div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {media.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                aria-label={`Choisir ${item.filename}`}
                                                title={item.filename}
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
                        </DialogPanel>
                    </div>
                </Dialog>
            )}
        </div>
    );
}

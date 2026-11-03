import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Check, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

export interface MediaItem {
    id: number;
    url: string;
    alt: string;
    caption?: string;
    filename: string;
    mime_type: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
}

interface MediaPickerDialogProps {
    adminPrefix: string;
    onClose: () => void;
    onSelect: (items: MediaItem[]) => void;
    multiple?: boolean;
    selectedUrls?: string[];
    excludedUrls?: string[];
}

export default function MediaPickerDialog({ adminPrefix, onClose, onSelect, multiple = false, selectedUrls = [], excludedUrls = [] }: MediaPickerDialogProps) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [selection, setSelection] = useState<MediaItem[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [nextPage, setNextPage] = useState<number | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    const selectedIds = new Set(selection.map((item) => item.id));
    const excluded = new Set(excludedUrls);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(`/${adminPrefix}/media?json=1&type=image&picker_page=${page}&search=${encodeURIComponent(search)}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error('Media request failed');
                const result = await response.json();
                if (!controller.signal.aborted) {
                    setMedia(Array.isArray(result) ? result : result.data ?? []);
                    setNextPage(result.next_page ?? null);
                    setTotal(Array.isArray(result) ? result.length : result.total ?? 0);
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
    }, [adminPrefix, search, page, retry]);

    function toggle(item: MediaItem) {
        if (!multiple) {
            onSelect([item]);
            return;
        }
        setSelection((current) => current.some((selected) => selected.id === item.id)
            ? current.filter((selected) => selected.id !== item.id)
            : [...current, item]);
    }

    return (
        <Dialog open onClose={onClose} className="relative z-[9999]" onKeyDown={(event) => { if (event.key !== 'Escape') event.stopPropagation(); }}>
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
                <DialogPanel className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                        <div>
                            <DialogTitle className="text-lg font-semibold text-slate-900">{multiple ? 'Ajouter des photos à la galerie' : 'Choisir une image'}</DialogTitle>
                            <p className="mt-1 text-sm text-slate-500">{multiple ? 'Sélectionnez vos photos, puis ajoutez-les en une fois.' : 'Choisissez une image de votre médiathèque.'}</p>
                        </div>
                        <button type="button" onClick={onClose} aria-label="Fermer la médiathèque" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
                        <div className="relative min-w-40 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} aria-label="Rechercher une image" placeholder="Rechercher une photo…" data-autofocus className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                        </div>
                        {multiple && <button type="button" disabled={loading || error || media.every((item) => excluded.has(item.url))} onClick={() => setSelection((current) => [...current, ...media.filter((item) => !excluded.has(item.url) && !current.some((selected) => selected.id === item.id))])} className="text-sm font-medium text-indigo-600 disabled:opacity-40">Sélectionner cette page</button>}
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-5" aria-busy={loading}>
                        {loading ? <p role="status" className="py-16 text-center text-sm text-slate-400">Chargement des photos…</p>
                            : error ? <div role="alert" className="py-12 text-center"><p className="text-sm text-red-600">Impossible de charger la médiathèque.</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-3 text-sm font-medium text-indigo-600">Réessayer</button></div>
                                : media.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">Aucune photo trouvée.</p>
                                    : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                        {media.map((item) => {
                                            const isExcluded = excluded.has(item.url);
                                            const isSelected = multiple ? selectedIds.has(item.id) : selectedUrls.includes(item.url);
                                            return <button key={item.id} type="button" disabled={isExcluded} aria-label={`${multiple ? 'Sélectionner' : 'Choisir'} ${item.filename}`} aria-pressed={isSelected} onClick={() => toggle(item)} className={`group relative overflow-hidden rounded-xl border-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent hover:border-slate-300'} ${isExcluded ? 'opacity-45' : ''}`}>
                                                <img src={item.thumbnail_url || item.url} alt={item.alt || ''} loading="lazy" className="aspect-[4/3] w-full bg-slate-100 object-cover" />
                                                {multiple && <span aria-hidden="true" className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-white bg-black/20 text-transparent'}`}><Check className="h-4 w-4" /></span>}
                                                <span className="block truncate bg-slate-50 px-2 py-2 text-xs text-slate-600" title={item.filename}>{item.filename}</span>
                                                {isExcluded && <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-600">Déjà ajoutée</span>}
                                            </button>;
                                        })}
                                    </div>}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <button type="button" aria-label="Page précédente" disabled={page === 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                            <span>Page {page} · {total} photo{total > 1 ? 's' : ''}</span>
                            <button type="button" aria-label="Page suivante" disabled={nextPage === null || loading} onClick={() => nextPage && setPage(nextPage)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                        {multiple && <div className="flex items-center gap-3">
                            <span role="status" className="text-xs text-slate-500">{selection.length} sélectionnée{selection.length > 1 ? 's' : ''}</span>
                            <button type="button" disabled={selection.length === 0} onClick={() => setSelection([])} className="text-xs text-slate-500 disabled:opacity-30">Effacer</button>
                            <button type="button" disabled={selection.length === 0} onClick={() => onSelect(selection)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">Ajouter {selection.length > 0 ? selection.length : ''} photo{selection.length !== 1 ? 's' : ''}</button>
                        </div>}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

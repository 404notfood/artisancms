import { useCallback, useEffect, useState } from 'react';
import { Star, X, Plus, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/Components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Bookmark {
    id: number;
    label: string;
    url: string;
    icon: string | null;
}

function getCsrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            ...(options?.headers ?? {}),
        },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
}

export default function BookmarksMenu({ className }: { className?: string }) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const loadBookmarks = useCallback(async () => {
        if (loaded) return;
        setLoading(true);
        try {
            const data = await fetchJson<Bookmark[]>('/admin/bookmarks');
            setBookmarks(data);
            setLoaded(true);
        } catch {
            // Silently fail — bookmarks are non-critical
        } finally {
            setLoading(false);
        }
    }, [loaded]);

    // Reload bookmarks whenever the dropdown opens (first load)
    useEffect(() => {
        loadBookmarks();
    }, [loadBookmarks]);

    const isCurrentPageBookmarked = bookmarks.some(
        (b) => b.url === window.location.pathname,
    );

    const handleAdd = useCallback(async () => {
        setAdding(true);
        try {
            const label = document.title.replace(/ [-|].+$/, '').trim() || 'Page';
            const bookmark = await fetchJson<Bookmark>('/admin/bookmarks', {
                method: 'POST',
                body: JSON.stringify({
                    label,
                    url: window.location.pathname,
                }),
            });
            setBookmarks((prev) => [bookmark, ...prev]);
        } catch {
            // Fail silently
        } finally {
            setAdding(false);
        }
    }, []);

    const handleRemove = useCallback(async (id: number) => {
        try {
            await fetchJson(`/admin/bookmarks/${id}`, { method: 'DELETE' });
            setBookmarks((prev) => prev.filter((b) => b.id !== id));
        } catch {
            // Fail silently
        }
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-yellow-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    isCurrentPageBookmarked && 'text-yellow-500',
                    className,
                )}
                aria-label="Favoris"
            >
                <Star className={cn('h-5 w-5', isCurrentPageBookmarked && 'fill-current')} />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Favoris</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                ) : bookmarks.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-gray-400">
                        Aucun favori
                    </div>
                ) : (
                    bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="group flex items-center">
                            <a
                                href={bookmark.url}
                                className="flex flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-gray-100"
                                role="menuitem"
                            >
                                <Star className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
                                <span className="truncate">{bookmark.label}</span>
                            </a>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(bookmark.id);
                                }}
                                className="mr-1 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                                aria-label={`Supprimer ${bookmark.label}`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))
                )}

                {!isCurrentPageBookmarked && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleAdd} disabled={adding}>
                            {adding ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Ajouter cette page
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

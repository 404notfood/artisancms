import { useState, useRef, useEffect, useCallback } from 'react';

interface SearchResult {
    id: number;
    title: string;
    type: 'page' | 'post' | 'content_entry';
    url: string;
    excerpt?: string;
    thumbnail?: string;
}

interface SearchAutocompleteProps {
    apiUrl?: string;
    placeholder?: string;
    className?: string;
}

export function SearchAutocomplete({
    apiUrl = '/api/search',
    placeholder = 'Rechercher...',
    className,
}: SearchAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const search = useCallback(
        async (q: string) => {
            if (q.length < 2) {
                setResults([]);
                setOpen(false);
                return;
            }

            abortRef.current?.abort();
            abortRef.current = new AbortController();

            setLoading(true);
            try {
                const res = await fetch(`${apiUrl}?q=${encodeURIComponent(q)}`, {
                    signal: abortRef.current.signal,
                    headers: { Accept: 'application/json' },
                });
                const data = await res.json();
                setResults(data.results ?? []);
                setOpen(true);
            } catch (e) {
                if ((e as Error).name !== 'AbortError') {
                    setResults([]);
                }
            } finally {
                setLoading(false);
            }
        },
        [apiUrl],
    );

    useEffect(() => {
        const timer = setTimeout(() => search(query), 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!open) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
            e.preventDefault();
            window.location.href = results[activeIndex].url;
        } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
        }
    }

    const grouped: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
        const group = r.type === 'page' ? 'Pages' : r.type === 'post' ? 'Articles' : 'Contenu';
        grouped[group] = grouped[group] || [];
        grouped[group].push(r);
    });

    const TYPE_LABELS: Record<string, string> = {
        page: 'Page',
        post: 'Article',
        content_entry: 'Contenu',
    };

    let flatIndex = -1;

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setActiveIndex(-1);
                    }}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {Object.entries(grouped).map(([group, items]) => (
                        <div key={group}>
                            <div className="px-3 py-1.5 text-xs font-semibold uppercase text-gray-400 bg-gray-50">
                                {group}
                            </div>
                            {items.map((result) => {
                                flatIndex++;
                                const idx = flatIndex;
                                return (
                                    <a
                                        key={result.id}
                                        href={result.url}
                                        className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                                            idx === activeIndex
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                    >
                                        {result.thumbnail && (
                                            <img
                                                src={result.thumbnail}
                                                alt=""
                                                className="h-8 w-8 rounded object-cover shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate font-medium">{result.title}</p>
                                            {result.excerpt && (
                                                <p className="truncate text-xs text-gray-500">{result.excerpt}</p>
                                            )}
                                        </div>
                                        <span className="shrink-0 text-[10px] text-gray-400">
                                            {TYPE_LABELS[result.type] ?? result.type}
                                        </span>
                                    </a>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {open && query.length >= 2 && !loading && results.length === 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 shadow-lg">
                    Aucun résultat pour « {query} »
                </div>
            )}
        </div>
    );
}

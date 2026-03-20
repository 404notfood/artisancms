import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { getCommands } from './command-palette/commands';
import { type CommandItem } from './command-palette/types';
import type { SharedProps } from '@/types/cms';
import CommandResults from './command-palette/CommandResults';

export default function CommandPalette() {
    const { cms } = usePage<SharedProps>().props;
    const adminPrefix = cms?.adminPrefix ?? 'admin';
    const commands = useMemo(() => getCommands(adminPrefix), [adminPrefix]);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Toggle with Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
                setQuery('');
                setSelectedIndex(0);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Fuzzy search
    const filtered = useMemo(() => {
        if (!query.trim()) return commands;
        const q = query.toLowerCase();
        return commands.filter((cmd) => {
            const haystack = [
                cmd.label,
                cmd.description ?? '',
                cmd.category,
                ...(cmd.keywords ?? []),
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [query, commands]);

    // Group by category
    const grouped = useMemo(() => {
        const map = new Map<string, CommandItem[]>();
        for (const item of filtered) {
            if (!map.has(item.category)) map.set(item.category, []);
            map.get(item.category)!.push(item);
        }
        return map;
    }, [filtered]);

    // Flatten for keyboard nav
    const flatItems = useMemo(() => filtered, [filtered]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
                e.preventDefault();
                navigate(flatItems[selectedIndex].href);
            }
        },
        [flatItems, selectedIndex],
    );

    const navigate = (href: string) => {
        setOpen(false);
        router.visit(href);
    };

    // Scroll selected into view
    useEffect(() => {
        const el = listRef.current?.querySelector(
            `[data-index="${selectedIndex}"]`,
        );
        el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-\[100\] flex items-start justify-center pt-[15vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                    <Search className="h-5 w-5 text-gray-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Rechercher une page, action..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                    />
                    <kbd className="hidden sm:inline-flex items-center rounded border bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <CommandResults
                    ref={listRef}
                    grouped={grouped}
                    flatItems={flatItems}
                    selectedIndex={selectedIndex}
                    query={query}
                    onSelect={navigate}
                    onHover={setSelectedIndex}
                />

                {/* Footer */}
                <div className="border-t px-4 py-2 flex items-center gap-4 text-[11px] text-gray-400">
                    <span>
                        <kbd className="font-mono">↑↓</kbd> naviguer
                    </span>
                    <span>
                        <kbd className="font-mono">↵</kbd> ouvrir
                    </span>
                    <span>
                        <kbd className="font-mono">esc</kbd> fermer
                    </span>
                </div>
            </div>
        </div>
    );
}

import { useState, useCallback } from 'react';
import type { RevisionData } from '@/types/cms';

interface RevisionHistoryProps {
    entityType: 'page' | 'post';
    entityId: number;
}

interface RevisionDiff {
    [key: string]: { old: unknown; new: unknown };
}

export default function RevisionHistory({ entityType, entityId }: RevisionHistoryProps) {
    const [revisions, setRevisions] = useState<RevisionData[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [comparing, setComparing] = useState(false);
    const [diff, setDiff] = useState<RevisionDiff | null>(null);
    const [selectedRevisions, setSelectedRevisions] = useState<[number | null, number | null]>([null, null]);
    const [restoring, setRestoring] = useState(false);

    const basePath = `/admin/${entityType === 'page' ? 'pages' : 'posts'}/${entityId}`;

    const loadRevisions = useCallback(async () => {
        if (loaded) return;
        setLoading(true);
        try {
            const response = await fetch(`${basePath}/revisions`);
            const data = await response.json();
            setRevisions(data.revisions ?? []);
            setLoaded(true);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [basePath, loaded]);

    function handleToggle() {
        const next = !expanded;
        setExpanded(next);
        if (next && !loaded) {
            loadRevisions();
        }
    }

    async function handleCompare() {
        const [revA, revB] = selectedRevisions;
        if (!revA || !revB) return;
        setComparing(true);
        try {
            const response = await fetch(`${basePath}/revisions/${revA}/compare/${revB}`);
            const data = await response.json();
            setDiff(data.changes ?? null);
        } catch {
            // silently fail
        } finally {
            setComparing(false);
        }
    }

    async function handleRestore(revisionId: number) {
        if (!confirm('Restaurer cette revision ? Les modifications non sauvegardees seront perdues.')) return;
        setRestoring(true);
        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            await fetch(`${basePath}/revisions/${revisionId}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                    'Accept': 'application/json',
                },
            });
            window.location.reload();
        } catch {
            // silently fail
        } finally {
            setRestoring(false);
        }
    }

    function toggleRevisionSelection(id: number) {
        setSelectedRevisions(([a, b]) => {
            if (a === id) return [b, null];
            if (b === id) return [a, null];
            if (a === null) return [id, b];
            if (b === null) return [a, id];
            return [id, b];
        });
        setDiff(null);
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <button
                type="button"
                onClick={handleToggle}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <HistoryIcon />
                    <h2 className="text-lg font-medium text-gray-900">Historique des revisions</h2>
                    {loaded && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {revisions.length}
                        </span>
                    )}
                </div>
                <ChevronIcon expanded={expanded} />
            </button>

            {expanded && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                            <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                        </div>
                    )}

                    {!loading && revisions.length === 0 && (
                        <p className="text-sm text-gray-500 py-4 text-center">Aucune revision disponible.</p>
                    )}

                    {!loading && revisions.length > 0 && (
                        <>
                            {/* Compare bar */}
                            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                                <p className="text-sm text-gray-600">
                                    Selectionnez 2 revisions pour comparer
                                </p>
                                <button
                                    type="button"
                                    onClick={handleCompare}
                                    disabled={!selectedRevisions[0] || !selectedRevisions[1] || comparing}
                                    className="ml-auto rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {comparing ? 'Comparaison...' : 'Comparer'}
                                </button>
                            </div>

                            {/* Revision list */}
                            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                                {revisions.map((rev) => {
                                    const isSelected = selectedRevisions.includes(rev.id);
                                    return (
                                        <div
                                            key={rev.id}
                                            className={`flex items-center gap-3 p-3 ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'} transition-colors`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleRevisionSelection(rev.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        #{rev.id}
                                                    </span>
                                                    {rev.reason && (
                                                        <span className="truncate text-sm text-gray-500">
                                                            — {rev.reason}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{rev.creator?.name ?? 'Systeme'}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(rev.created_at).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRestore(rev.id)}
                                                disabled={restoring}
                                                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                            >
                                                Restaurer
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Diff view */}
                            {diff && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-900">Differences</h3>
                                    {Object.keys(diff).length === 0 ? (
                                        <p className="text-sm text-gray-500">Aucune difference trouvee.</p>
                                    ) : (
                                        <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 overflow-hidden">
                                            {Object.entries(diff).map(([key, { old: oldVal, new: newVal }]) => (
                                                <div key={key} className="grid grid-cols-[150px_1fr_1fr] text-sm">
                                                    <div className="bg-gray-50 p-3 font-medium text-gray-700 break-all">
                                                        {key}
                                                    </div>
                                                    <div className="bg-red-50 p-3 text-red-800 break-all whitespace-pre-wrap">
                                                        {formatValue(oldVal)}
                                                    </div>
                                                    <div className="bg-green-50 p-3 text-green-800 break-all whitespace-pre-wrap">
                                                        {formatValue(newVal)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return '(vide)';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
}

function HistoryIcon() {
    return (
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
    return (
        <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    );
}

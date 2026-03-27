import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { PaginatedResponse, SharedProps, UserData } from '@/types/cms';
import { formatDate } from '@/lib/format';
import { ScrollText } from 'lucide-react';

interface ActivityLogEntry {
    id: number;
    user_id: number | null;
    action: string;
    action_label: string;
    subject_type: string | null;
    subject_id: number | null;
    properties: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
    user: Pick<UserData, 'id' | 'name' | 'email'> | null;
    subject: { id: number; title?: string; name?: string } | null;
}

interface Props {
    logs: PaginatedResponse<ActivityLogEntry>;
    filters: {
        action?: string;
        user_id?: string;
        date_from?: string;
        date_to?: string;
    };
    actions: string[];
    users: Array<{ id: number; name: string }>;
}

function subjectLabel(entry: ActivityLogEntry): string {
    if (!entry.subject_type) return '--';
    const name = entry.subject?.title ?? entry.subject?.name ?? '';
    const shortType = entry.subject_type.split('\\').pop() ?? entry.subject_type;
    return name ? `${shortType} #${entry.subject_id} (${name})` : `${shortType} #${entry.subject_id}`;
}

const ACTION_COLORS: Record<string, string> = {
    created:   'bg-green-50 text-green-700',
    updated:   'bg-blue-50 text-blue-700',
    deleted:   'bg-red-50 text-red-700',
    restored:  'bg-emerald-50 text-emerald-700',
    published: 'bg-indigo-50 text-indigo-700',
    login:     'bg-cyan-50 text-cyan-700',
    logout:    'bg-gray-100 text-gray-600',
};

function actionBadgeClass(action: string): string {
    return ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-700';
}

export default function ActivityLogIndex({ logs, filters, actions, users }: Props) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';

    const [action, setAction] = useState(filters.action ?? '');
    const [userId, setUserId] = useState(filters.user_id ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    function applyFilters() {
        router.get(`/${prefix}/activity-log`, {
            action: action || undefined,
            user_id: userId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { preserveState: true });
    }

    function resetFilters() {
        setAction('');
        setUserId('');
        setDateFrom('');
        setDateTo('');
        router.get(`/${prefix}/activity-log`, {}, { preserveState: true });
    }

    function goToPage(page: number) {
        router.get(`/${prefix}/activity-log`, {
            page,
            action: filters.action,
            user_id: filters.user_id,
            date_from: filters.date_from,
            date_to: filters.date_to,
        }, { preserveState: true });
    }

    const hasFilters = !!(filters.action || filters.user_id || filters.date_from || filters.date_to);

    return (
        <AdminLayout
            header={
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <ScrollText className="h-5 w-5" />
                    Journal d'activite
                </h1>
            }
        >
            <Head title="Journal d'activite" />

            <div className="rounded-lg border border-gray-200 bg-white">
                {/* Filters */}
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Action</label>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Toutes</option>
                            {actions.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Utilisateur</label>
                        <select
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Tous</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Du</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Au</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={applyFilters}
                            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            Filtrer
                        </button>
                        {hasFilters && (
                            <button
                                onClick={resetFilters}
                                className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Reinitialiser
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">Date</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Utilisateur</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Action</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 md:table-cell">Sujet</th>
                                <th className="hidden px-4 py-3 font-medium text-gray-700 sm:table-cell">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Aucune activite trouvee.
                                    </td>
                                </tr>
                            ) : (
                                logs.data.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                            {formatDate(entry.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {entry.user ? (
                                                <div>
                                                    <span className="font-medium text-gray-900">{entry.user.name}</span>
                                                    <p className="text-xs text-gray-500">{entry.user.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Systeme</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${actionBadgeClass(entry.action)}`}>
                                                {entry.action_label}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell max-w-xs truncate">
                                            {subjectLabel(entry)}
                                        </td>
                                        <td className="hidden whitespace-nowrap px-4 py-3 text-gray-500 sm:table-cell font-mono text-xs">
                                            {entry.ip_address ?? '--'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {logs.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-600">
                            {logs.from}--{logs.to} sur {logs.total}
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: logs.last_page }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => goToPage(p)}
                                    className={`rounded px-3 py-1 text-sm ${
                                        p === logs.current_page
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
        </AdminLayout>
    );
}

import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Mail, Trash2, Eye, Clock, User, AtSign, Inbox } from 'lucide-react';
import { formatDate } from '@/lib/format';

interface Submission {
    id: number;
    form_name: string;
    data: Record<string, string>;
    ip_address: string | null;
    user_agent: string | null;
    read_at: string | null;
    created_at: string;
}

interface PaginatedSubmissions {
    data: Submission[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    submissions: PaginatedSubmissions;
    unreadCount: number;
}

export default function ContactFormSubmissions({ submissions, unreadCount }: Props) {
    const [viewing, setViewing] = useState<Submission | null>(null);

    function handleDelete(id: number) {
        if (!confirm('Supprimer cette soumission ?')) return;
        router.delete(`/admin/plugins/contact-form/submissions/${id}`, {
            preserveScroll: true,
        });
    }

    function handleView(sub: Submission) {
        setViewing(sub);
        fetch(`/admin/plugins/contact-form/submissions/${sub.id}`, {
            headers: { Accept: 'application/json' },
        }).catch(() => {});
    }

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-indigo-600" />
                    <h1 className="text-xl font-semibold text-gray-900">Messages de contact</h1>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-indigo-500 px-2.5 py-0.5 text-xs font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                    {submissions.total > 0 && (
                        <span className="text-sm text-gray-400">({submissions.total} total)</span>
                    )}
                </div>
            }
        >
            <Head title="Messages de contact" />

            {submissions.data.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white px-6 py-20 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                        <Inbox className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">Aucun message</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Les messages envoyes via le formulaire de contact apparaitront ici.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                        {submissions.data.map((sub) => (
                            <div
                                key={sub.id}
                                className={`flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50 ${
                                    !sub.read_at ? 'bg-indigo-50/30 border-l-2 border-l-indigo-400' : 'border-l-2 border-l-transparent'
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2.5">
                                        {!sub.read_at && (
                                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" title="Non lu" />
                                        )}
                                        <p className={`text-sm truncate ${!sub.read_at ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                            {sub.data.name || 'Anonyme'}
                                        </p>
                                        <span className="text-xs text-gray-400 truncate">{sub.data.email || ''}</span>
                                    </div>
                                    {sub.data.subject && (
                                        <p className="mt-1 text-sm font-medium text-gray-800 truncate">{sub.data.subject}</p>
                                    )}
                                    <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{sub.data.message || ''}</p>
                                    <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(sub.created_at)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleView(sub)}
                                        className="rounded p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        title="Voir le message"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(sub.id)}
                                        className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {submissions.last_page > 1 && (
                        <div className="flex items-center justify-center gap-1">
                            {submissions.links.map((link, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'text-gray-600 hover:bg-gray-100'
                                              : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Detail modal */}
            {viewing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setViewing(null)}>
                    <div
                        className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                                <Mail className="h-4 w-4 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Detail du message</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                        <User className="h-3 w-3" />
                                        Nom
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{viewing.data.name || '-'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                        <AtSign className="h-3 w-3" />
                                        Email
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 truncate">{viewing.data.email || '-'}</p>
                                </div>
                            </div>

                            {viewing.data.phone && (
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs text-gray-500 mb-1">Telephone</p>
                                    <p className="text-sm font-medium text-gray-900">{viewing.data.phone}</p>
                                </div>
                            )}

                            {viewing.data.subject && (
                                <div className="rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs text-gray-500 mb-1">Sujet</p>
                                    <p className="text-sm font-medium text-gray-900">{viewing.data.subject}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-gray-500 mb-1.5">Message</p>
                                <div className="rounded-lg bg-gray-50 p-4 max-h-48 overflow-y-auto">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {viewing.data.message || '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(viewing.created_at)}
                                </span>
                                {viewing.ip_address && <span>IP: {viewing.ip_address}</span>}
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setViewing(null)}
                                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

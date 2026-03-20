import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';

interface VerificationData {
    id: number;
    user_id: number;
    status: string;
    notes: string | null;
    admin_notes: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    user: { id: number; name: string; email: string };
    reviewer: { name: string } | null;
}

interface PaginatedVerifications {
    data: VerificationData[];
    current_page: number;
    last_page: number;
    total: number;
}

interface VerificationsIndexProps {
    verifications: PaginatedVerifications;
    filters: { status?: string };
    pendingCount: number;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvee',
    rejected: 'Refusee',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

export default function VerificationsIndex({ verifications, filters, pendingCount }: VerificationsIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});

    function handleApprove(id: number) {
        router.post(`/admin/member-space/verifications/${id}/approve`, {
            admin_notes: adminNotes[id] || null,
        });
    }

    function handleReject(id: number) {
        const notes = adminNotes[id];
        if (!notes) {
            alert('Veuillez indiquer une raison de refus.');
            return;
        }
        router.post(`/admin/member-space/verifications/${id}/reject`, { admin_notes: notes });
    }

    function filterByStatus(status: string) {
        router.get(`/${prefix}/member-space/verifications`, status ? { status } : {}, { preserveState: true });
    }

    return (
        <AdminLayout header={
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                    Verifications
                    {pendingCount > 0 && (
                        <span className="ml-2 rounded-full bg-yellow-100 px-2.5 py-0.5 text-sm font-medium text-yellow-700">
                            {pendingCount} en attente
                        </span>
                    )}
                </h1>
            </div>
        }>
            <Head title="Verifications" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Filters */}
                <div className="flex gap-2">
                    {['', 'pending', 'approved', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => filterByStatus(status)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                (filters.status || '') === status ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {status === '' ? 'Toutes' : STATUS_LABELS[status] || status}
                        </button>
                    ))}
                </div>

                {verifications.data.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
                        Aucune verification.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {verifications.data.map((v) => (
                            <div key={v.id} className="rounded-lg border border-gray-200 bg-white p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-medium text-gray-900">{v.user.name}</p>
                                            <p className="text-sm text-gray-500">{v.user.email}</p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {STATUS_LABELS[v.status] || v.status}
                                    </span>
                                </div>

                                {v.notes && (
                                    <p className="mb-3 text-sm text-gray-600">
                                        <span className="font-medium">Note du membre :</span> {v.notes}
                                    </p>
                                )}

                                {v.submitted_at && (
                                    <p className="mb-3 text-xs text-gray-400">
                                        Soumise le {new Date(v.submitted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}

                                {v.status === 'pending' && (
                                    <div className="border-t border-gray-100 pt-3 space-y-3">
                                        <textarea
                                            value={adminNotes[v.id] || ''}
                                            onChange={(e) => setAdminNotes((prev) => ({ ...prev, [v.id]: e.target.value }))}
                                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            rows={2}
                                            placeholder="Note admin (obligatoire pour refuser)..."
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(v.id)}
                                                className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                                            >
                                                Approuver
                                            </button>
                                            <button
                                                onClick={() => handleReject(v.id)}
                                                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                                            >
                                                Refuser
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {v.admin_notes && v.status !== 'pending' && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        <span className="font-medium">Reponse admin :</span> {v.admin_notes}
                                        {v.reviewer && <span className="text-xs text-gray-400"> — {v.reviewer.name}</span>}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

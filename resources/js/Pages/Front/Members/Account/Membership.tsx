import { Head, Link, router } from '@inertiajs/react';

interface PlanData {
    id: number;
    name: string;
    price: string;
    billing_period: string;
    features: string[] | null;
}

interface MembershipData {
    id: number;
    plan_id: number;
    plan: PlanData;
    status: string;
    starts_at: string | null;
    expires_at: string | null;
    trial_ends_at: string | null;
    amount_paid: string | null;
}

interface MembershipProps {
    membership: MembershipData | null;
    plans: PlanData[];
}

const STATUS_LABELS: Record<string, string> = {
    active: 'Actif',
    trial: 'Essai',
    expired: 'Expire',
    cancelled: 'Annule',
    pending: 'En attente',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-blue-100 text-blue-700',
    expired: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
};

export default function Membership({ membership, plans }: MembershipProps) {
    function handleCancel() {
        if (!confirm('Annuler votre abonnement ?')) return;
        router.post('/members/membership/cancel');
    }

    return (
        <>
            <Head title="Mon abonnement" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <h1 className="mb-8 text-2xl font-bold text-gray-900">Mon abonnement</h1>

                {membership ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">{membership.plan.name}</h2>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[membership.status] || 'bg-gray-100 text-gray-600'}`}>
                                {STATUS_LABELS[membership.status] || membership.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {membership.starts_at && (
                                <div>
                                    <p className="text-gray-500">Debut</p>
                                    <p className="font-medium text-gray-900">{new Date(membership.starts_at).toLocaleDateString('fr-FR')}</p>
                                </div>
                            )}
                            {membership.expires_at && (
                                <div>
                                    <p className="text-gray-500">Expiration</p>
                                    <p className="font-medium text-gray-900">{new Date(membership.expires_at).toLocaleDateString('fr-FR')}</p>
                                </div>
                            )}
                            {membership.trial_ends_at && (
                                <div>
                                    <p className="text-gray-500">Fin de l'essai</p>
                                    <p className="font-medium text-gray-900">{new Date(membership.trial_ends_at).toLocaleDateString('fr-FR')}</p>
                                </div>
                            )}
                            {membership.amount_paid && (
                                <div>
                                    <p className="text-gray-500">Montant paye</p>
                                    <p className="font-medium text-gray-900">{parseFloat(membership.amount_paid).toFixed(2)} &euro;</p>
                                </div>
                            )}
                        </div>

                        {membership.plan.features && membership.plan.features.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-500">Fonctionnalites incluses</p>
                                <ul className="space-y-1">
                                    {membership.plan.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                            <span className="text-green-500">&#10003;</span> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {['active', 'trial'].includes(membership.status) && (
                            <div className="border-t border-gray-200 pt-4">
                                <button
                                    onClick={handleCancel}
                                    className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                    Annuler mon abonnement
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                        <p className="mb-4 text-gray-500">Vous n'avez pas d'abonnement actif.</p>
                        <Link
                            href="/members/plans"
                            className="inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Voir les offres
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}

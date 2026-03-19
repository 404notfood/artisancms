import { Head, router } from '@inertiajs/react';

interface PlanData {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    billing_period: string;
    trial_days: number;
    features: string[] | null;
    is_popular: boolean;
    badge_label: string | null;
    badge_color: string | null;
}

interface MembershipData {
    id: number;
    plan_id: number;
    status: string;
    expires_at: string | null;
}

interface PlansProps {
    plans: PlanData[];
    currentMembership: MembershipData | null;
}

const PERIOD_LABELS: Record<string, string> = {
    monthly: '/mois',
    yearly: '/an',
    lifetime: 'a vie',
    one_time: 'unique',
};

export default function Plans({ plans, currentMembership }: PlansProps) {
    function handleSubscribe(planId: number) {
        router.post(`/members/membership/subscribe/${planId}`);
    }

    return (
        <>
            <Head title="Nos offres" />

            <div className="mx-auto max-w-5xl px-4 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Nos offres</h1>
                    <p className="mt-3 text-lg text-gray-600">
                        Choisissez le plan qui vous convient le mieux
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => {
                        const isCurrent = currentMembership?.plan_id === plan.id;
                        const price = parseFloat(plan.price);

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl border-2 bg-white p-8 transition-shadow hover:shadow-lg ${
                                    plan.is_popular
                                        ? 'border-indigo-500 shadow-md'
                                        : 'border-gray-200'
                                }`}
                            >
                                {plan.is_popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                                            {plan.badge_label || 'Populaire'}
                                        </span>
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                {plan.description && (
                                    <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                                )}

                                <div className="mt-6">
                                    <span className="text-4xl font-bold text-gray-900">
                                        {price === 0 ? 'Gratuit' : `${price}\u00a0\u20ac`}
                                    </span>
                                    {price > 0 && (
                                        <span className="text-gray-500">{PERIOD_LABELS[plan.billing_period] || ''}</span>
                                    )}
                                </div>

                                {plan.trial_days > 0 && (
                                    <p className="mt-2 text-sm text-indigo-600">
                                        {plan.trial_days} jours d'essai gratuit
                                    </p>
                                )}

                                {plan.features && plan.features.length > 0 && (
                                    <ul className="mt-6 space-y-3">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckIcon />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={isCurrent}
                                    className={`mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                                        isCurrent
                                            ? 'cursor-default bg-green-100 text-green-700'
                                            : plan.is_popular
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                                >
                                    {isCurrent ? 'Plan actuel' : price === 0 ? 'Commencer gratuitement' : 'Souscrire'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

function CheckIcon() {
    return (
        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

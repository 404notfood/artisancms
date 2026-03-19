import { Head, router } from '@inertiajs/react';
import type { MenuData } from '@/types/cms';
import FrontLayout from '@/Layouts/FrontLayout';
import type { ThemeStyle } from '@/Layouts/Front/theme-helpers';

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
    menus: Record<string, MenuData>;
    theme: {
        customizations: Record<string, string | boolean>;
        layouts: Array<{ slug: string; name: string }>;
        style?: ThemeStyle;
    };
    plans: PlanData[];
    currentMembership: MembershipData | null;
}

const PERIOD_LABELS: Record<string, string> = {
    monthly: '/mois',
    yearly: '/an',
    lifetime: 'a vie',
    one_time: 'unique',
};

export default function Plans({ menus, theme, plans, currentMembership }: PlansProps) {
    function handleSubscribe(planId: number) {
        router.post(`/members/membership/subscribe/${planId}`);
    }

    return (
        <FrontLayout menus={menus} theme={theme}>
            <Head title="Nos offres" />

            {/* Hero section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary,#6366f1)] via-[var(--color-primary,#6366f1)]/90 to-[var(--color-primary,#6366f1)]/70">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                </div>
                <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-white/5" />
                <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
                <div className="relative mx-auto max-w-5xl px-4 py-16 text-center">
                    <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white/90 uppercase tracking-wider backdrop-blur-sm">
                        Plans et tarifs
                    </span>
                    <h1 className="mt-6 text-4xl font-bold text-white sm:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
                        Choisissez votre plan
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
                        Choisissez le plan qui vous convient le mieux et debloquez tous les avantages
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 -mt-8 pb-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => {
                        const isCurrent = currentMembership?.plan_id === plan.id;
                        const price = parseFloat(plan.price);

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl bg-white p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                                    plan.is_popular
                                        ? 'border-2 border-[var(--color-primary,#6366f1)] shadow-xl shadow-[var(--color-primary,#6366f1)]/10 ring-1 ring-[var(--color-primary,#6366f1)]/10'
                                        : 'border border-gray-200 shadow-sm'
                                }`}
                            >
                                {plan.is_popular && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary,#6366f1)] px-5 py-1.5 text-xs font-bold text-white shadow-md shadow-[var(--color-primary,#6366f1)]/25">
                                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                            {plan.badge_label || 'Populaire'}
                                        </span>
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                {plan.description && (
                                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{plan.description}</p>
                                )}

                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-gray-900">
                                        {price === 0 ? 'Gratuit' : `${price}\u00a0\u20ac`}
                                    </span>
                                    {price > 0 && (
                                        <span className="text-base text-gray-500">{PERIOD_LABELS[plan.billing_period] || ''}</span>
                                    )}
                                </div>

                                {plan.trial_days > 0 && (
                                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary,#6366f1)]/8 px-3 py-1 text-xs font-semibold text-[var(--color-primary,#6366f1)]">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {plan.trial_days} jours d'essai gratuit
                                    </p>
                                )}

                                {plan.features && plan.features.length > 0 && (
                                    <ul className="mt-8 space-y-3.5">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                                <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 flex-shrink-0">
                                                    <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={isCurrent}
                                    className={`mt-8 w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                                        isCurrent
                                            ? 'cursor-default bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : plan.is_popular
                                                ? 'bg-[var(--color-primary,#6366f1)] text-white shadow-md shadow-[var(--color-primary,#6366f1)]/25 hover:shadow-lg hover:shadow-[var(--color-primary,#6366f1)]/30 hover:scale-[1.02]'
                                                : 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02]'
                                    }`}
                                >
                                    {isCurrent ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                            Plan actuel
                                        </span>
                                    ) : price === 0 ? 'Commencer gratuitement' : 'Souscrire'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </FrontLayout>
    );
}

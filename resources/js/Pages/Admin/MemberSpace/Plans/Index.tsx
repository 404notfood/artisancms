import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router , usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types/cms';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface PlanData {
    id: number;
    name: string;
    slug: string;
    price: string;
    billing_period: string;
    active: boolean;
    is_popular: boolean;
    active_members_count: number;
}

interface PlansIndexProps {
    plans: PlanData[];
}

const PERIOD_LABELS: Record<string, string> = {
    monthly: 'Mensuel',
    yearly: 'Annuel',
    lifetime: 'A vie',
    one_time: 'Unique',
};

export default function PlansIndex({ plans }: PlansIndexProps) {
    const { cms } = usePage<SharedProps>().props;
    const prefix = cms?.adminPrefix ?? 'admin';
    function handleDelete(plan: PlanData) {
        if (!confirm(`Supprimer le plan "${plan.name}" ?`)) return;
        router.delete(`/admin/member-space/plans/${plan.id}`);
    }

    return (
        <AdminLayout header={
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">Plans d'abonnement</h1>
                <Link href={`/${prefix}/member-space/plans/create`} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                    <Plus className="h-4 w-4" /> Nouveau plan
                </Link>
            </div>
        }>
            <Head title="Plans d'abonnement" />

            <div className="mx-auto max-w-4xl">
                {plans.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
                        Aucun plan. Cliquez sur "Nouveau plan" pour en creer un.
                    </div>
                ) : (
                    <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                        {plans.map((plan) => (
                            <div key={plan.id} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{plan.name}</span>
                                            {plan.is_popular && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Populaire</span>}
                                            {!plan.active && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Inactif</span>}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {parseFloat(plan.price) === 0 ? 'Gratuit' : `${parseFloat(plan.price).toFixed(2)} \u20ac`}
                                            {' '}&middot;{' '}
                                            {PERIOD_LABELS[plan.billing_period] || plan.billing_period}
                                            {' '}&middot;{' '}
                                            {plan.active_members_count} membre{plan.active_members_count > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Link href={`/admin/member-space/plans/${plan.id}/edit`} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                    <button onClick={() => handleDelete(plan)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

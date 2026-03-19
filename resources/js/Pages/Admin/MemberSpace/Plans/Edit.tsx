import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

interface PlanData {
    id: number;
    name: string;
    description: string | null;
    price: string;
    billing_period: string;
    duration_days: number | null;
    trial_days: number;
    features: string[] | null;
    is_popular: boolean;
    active: boolean;
    stripe_price_id: string | null;
    badge_label: string | null;
    badge_color: string | null;
    member_limit: number | null;
}

interface EditPlanProps {
    plan: PlanData;
}

export default function EditPlan({ plan }: EditPlanProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: plan.name,
        description: plan.description || '',
        price: parseFloat(plan.price),
        billing_period: plan.billing_period,
        duration_days: plan.duration_days ?? ('' as string | number),
        trial_days: plan.trial_days,
        features: plan.features || [],
        is_popular: plan.is_popular,
        active: plan.active,
        stripe_price_id: plan.stripe_price_id || '',
        badge_label: plan.badge_label || '',
        badge_color: plan.badge_color || '',
        member_limit: plan.member_limit ?? ('' as string | number),
    });

    const [featureText, setFeatureText] = useState('');

    function addFeature() {
        if (!featureText.trim()) return;
        setData('features', [...data.features, featureText.trim()]);
        setFeatureText('');
    }

    function removeFeature(index: number) {
        setData('features', data.features.filter((_, i) => i !== index));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/member-space/plans/${plan.id}`);
    }

    const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
    const labelClass = 'block text-sm font-medium text-gray-700';

    return (
        <AdminLayout header={
            <div className="flex items-center gap-3">
                <Link href="/admin/member-space/plans" className="text-gray-400 hover:text-gray-600">&larr;</Link>
                <h1 className="text-xl font-semibold text-gray-900">Modifier : {plan.name}</h1>
            </div>
        }>
            <Head title={`Modifier ${plan.name}`} />

            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <div>
                        <label className={labelClass}>Nom *</label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className={inputClass} required />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className={inputClass} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Prix *</label>
                            <input type="number" step="0.01" min="0" value={data.price} onChange={(e) => setData('price', parseFloat(e.target.value) || 0)} className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Periode</label>
                            <select value={data.billing_period} onChange={(e) => setData('billing_period', e.target.value)} className={inputClass}>
                                <option value="monthly">Mensuel</option>
                                <option value="yearly">Annuel</option>
                                <option value="lifetime">A vie</option>
                                <option value="one_time">Paiement unique</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Duree (jours)</label>
                            <input type="number" min="1" value={data.duration_days} onChange={(e) => setData('duration_days', e.target.value)} className={inputClass} placeholder="Illimite" />
                        </div>
                        <div>
                            <label className={labelClass}>Essai gratuit (jours)</label>
                            <input type="number" min="0" value={data.trial_days} onChange={(e) => setData('trial_days', parseInt(e.target.value) || 0)} className={inputClass} />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Fonctionnalites</h2>
                    <div className="flex gap-2">
                        <input type="text" value={featureText} onChange={(e) => setFeatureText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())} className={`flex-1 ${inputClass.replace('mt-1 ', '')}`} placeholder="Ajouter une fonctionnalite" />
                        <button type="button" onClick={addFeature} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">+</button>
                    </div>
                    {data.features.length > 0 && (
                        <ul className="space-y-1">
                            {data.features.map((f, i) => (
                                <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                    <span>{f}</span>
                                    <button type="button" onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600">&times;</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Options</h2>
                    <div>
                        <label className={labelClass}>Stripe Price ID</label>
                        <input type="text" value={data.stripe_price_id} onChange={(e) => setData('stripe_price_id', e.target.value)} className={inputClass} placeholder="price_..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Badge</label>
                            <input type="text" value={data.badge_label} onChange={(e) => setData('badge_label', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Limite de membres</label>
                            <input type="number" min="1" value={data.member_limit} onChange={(e) => setData('member_limit', e.target.value)} className={inputClass} placeholder="Illimite" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={data.is_popular} onChange={(e) => setData('is_popular', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <span className="text-sm text-gray-700">Populaire</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={data.active} onChange={(e) => setData('active', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <span className="text-sm text-gray-700">Actif</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                        {processing ? 'Enregistrement...' : 'Mettre a jour'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}

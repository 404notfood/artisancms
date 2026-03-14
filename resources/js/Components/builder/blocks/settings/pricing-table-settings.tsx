import type { BlockSettingsProps } from '../block-registry';

interface PricingPlan {
    name: string;
    price: string;
    period: string;
    features: string[];
    ctaText: string;
    ctaUrl: string;
    highlighted: boolean;
}

export default function PricingTableSettings({ block, onUpdate }: BlockSettingsProps) {
    const plans = (block.props.plans as PricingPlan[]) || [];
    const columns = (block.props.columns as number) || 3;

    const updatePlan = (index: number, field: keyof PricingPlan, value: unknown) => {
        const updated = [...plans];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate({ plans: updated });
    };

    const addPlan = () => {
        onUpdate({
            plans: [...plans, { name: '', price: '', period: 'mois', features: [], ctaText: '', ctaUrl: '', highlighted: false }],
        });
    };

    const removePlan = (index: number) => {
        onUpdate({ plans: plans.filter((_, i) => i !== index) });
    };

    const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
        const updated = [...plans];
        const features = [...(updated[planIndex].features || [])];
        features[featureIndex] = value;
        updated[planIndex] = { ...updated[planIndex], features };
        onUpdate({ plans: updated });
    };

    const addFeature = (planIndex: number) => {
        const updated = [...plans];
        updated[planIndex] = { ...updated[planIndex], features: [...(updated[planIndex].features || []), ''] };
        onUpdate({ plans: updated });
    };

    const removeFeature = (planIndex: number, featureIndex: number) => {
        const updated = [...plans];
        updated[planIndex] = {
            ...updated[planIndex],
            features: updated[planIndex].features.filter((_, i) => i !== featureIndex),
        };
        onUpdate({ plans: updated });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes</label>
                <input type="number" min={2} max={4} value={columns} onChange={(e) => onUpdate({ columns: parseInt(e.target.value) || 3 })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forfaits</label>
                {plans.map((plan, index) => (
                    <div key={index} className="border rounded p-3 mb-3 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Forfait {index + 1}</span>
                            <button type="button" onClick={() => removePlan(index)} className="text-red-500 text-xs hover:text-red-700">Supprimer</button>
                        </div>
                        <input type="text" value={plan.name} onChange={(e) => updatePlan(index, 'name', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Nom du forfait" />
                        <div className="flex gap-2">
                            <input type="text" value={plan.price} onChange={(e) => updatePlan(index, 'price', e.target.value)} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Prix (ex: 29€)" />
                            <input type="text" value={plan.period} onChange={(e) => updatePlan(index, 'period', e.target.value)} className="w-24 border rounded px-3 py-1.5 text-sm" placeholder="mois" />
                        </div>
                        <input type="text" value={plan.ctaText} onChange={(e) => updatePlan(index, 'ctaText', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Texte du bouton" />
                        <input type="text" value={plan.ctaUrl} onChange={(e) => updatePlan(index, 'ctaUrl', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="URL du bouton" />
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={plan.highlighted || false} onChange={(e) => updatePlan(index, 'highlighted', e.target.checked)} className="rounded" />
                            <label className="text-sm text-gray-700">Mis en avant</label>
                        </div>

                        <div className="pl-2 border-l-2 border-gray-200">
                            <label className="text-xs font-medium text-gray-500">Fonctionnalités</label>
                            {(plan.features || []).map((feature, fi) => (
                                <div key={fi} className="flex gap-1 mt-1">
                                    <input type="text" value={feature} onChange={(e) => updateFeature(index, fi, e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Fonctionnalité" />
                                    <button type="button" onClick={() => removeFeature(index, fi)} className="text-red-400 text-xs px-1 hover:text-red-600">&times;</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addFeature(index)} className="text-xs text-blue-500 hover:text-blue-700 mt-1">
                                + Fonctionnalité
                            </button>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addPlan} className="w-full border-2 border-dashed rounded px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400">
                    + Ajouter un forfait
                </button>
            </div>
        </div>
    );
}

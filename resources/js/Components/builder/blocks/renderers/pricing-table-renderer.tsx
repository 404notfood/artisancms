import type { BlockRendererProps } from '../block-registry';

interface PricingPlan {
    name: string;
    price: string;
    period: string;
    features: string[];
    ctaText: string;
    ctaUrl: string;
    highlighted: boolean;
}

export default function PricingTableRenderer({ block }: BlockRendererProps) {
    const plans = (block.props.plans as PricingPlan[]) || [];
    const columns = (block.props.columns as number) || 3;

    if (plans.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Aucun forfait configuré
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-${columns} gap-6`}>
            {plans.map((plan, index) => (
                <div
                    key={index}
                    className={`relative rounded-lg p-6 flex flex-col ${
                        plan.highlighted
                            ? 'border-2 border-blue-600 shadow-lg'
                            : 'border shadow-sm'
                    }`}
                >
                    {plan.highlighted && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                            Populaire
                        </div>
                    )}
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">{plan.name || 'Forfait'}</h3>
                        <div className="mt-2">
                            <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                            {plan.period && (
                                <span className="text-gray-500 text-sm ml-1">/{plan.period}</span>
                            )}
                        </div>
                    </div>
                    <ul className="space-y-2 mb-6 flex-1">
                        {(plan.features || []).map((feature, fi) => (
                            <li key={fi} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-green-500 mt-0.5">{'\u2713'}</span>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                    {plan.ctaText && (
                        <a
                            href={plan.ctaUrl || '#'}
                            className={`block text-center py-2 px-4 rounded font-medium transition-colors ${
                                plan.highlighted
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                            {plan.ctaText}
                        </a>
                    )}
                </div>
            ))}
        </div>
    );
}

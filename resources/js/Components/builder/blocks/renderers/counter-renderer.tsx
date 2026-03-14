import type { BlockRendererProps } from '../block-registry';

interface CounterItem {
    value: number;
    label: string;
    prefix: string;
    suffix: string;
}

export default function CounterRenderer({ block }: BlockRendererProps) {
    const items = (block.props.items as CounterItem[]) || [];
    const columns = (block.props.columns as number) || 3;
    const align = (block.props.align as string) || 'center';

    if (items.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Aucun compteur configuré
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-${columns} gap-6`}>
            {items.map((item, index) => (
                <div key={index} className={`text-${align} p-4`}>
                    <div className="text-4xl font-bold text-gray-900">
                        {item.prefix || ''}{item.value ?? 0}{item.suffix || ''}
                    </div>
                    {item.label && (
                        <div className="mt-2 text-sm text-gray-500 font-medium uppercase tracking-wide">
                            {item.label}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

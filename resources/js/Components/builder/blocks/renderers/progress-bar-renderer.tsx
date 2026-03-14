import type { BlockRendererProps } from '../block-registry';

interface Bar {
    label: string;
    value: number;
    color: string;
}

export default function ProgressBarRenderer({ block }: BlockRendererProps) {
    const bars = (block.props.bars as Bar[]) || [
        { label: 'Compétence 1', value: 80, color: '#3b82f6' },
        { label: 'Compétence 2', value: 60, color: '#10b981' },
    ];
    const showPercentage = block.props.showPercentage !== false;
    const height = (block.props.height as string) || 'md';
    const animated = block.props.animated !== false;

    const heightClasses: Record<string, string> = {
        sm: 'h-2',
        md: 'h-4',
        lg: 'h-6',
    };

    if (bars.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Aucune barre ajoutée</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {bars.map((bar, i) => (
                <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{bar.label}</span>
                        {showPercentage && (
                            <span className="text-sm text-gray-500">{bar.value}%</span>
                        )}
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[height] || heightClasses.md}`}>
                        <div
                            className={`${heightClasses[height] || heightClasses.md} rounded-full ${animated ? 'transition-all duration-1000 ease-out' : ''}`}
                            style={{
                                width: `${Math.min(100, Math.max(0, bar.value))}%`,
                                backgroundColor: bar.color || '#3b82f6',
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

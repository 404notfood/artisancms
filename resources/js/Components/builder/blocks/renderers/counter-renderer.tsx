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
    // Allow explicit color overrides for use on colored backgrounds
    const valueColor = (block.props.valueColor as string) || 'var(--color-text, #0f172a)';
    const labelColor = (block.props.labelColor as string) || 'var(--color-text-muted, #64748b)';

    if (items.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Aucun compteur configuré
            </div>
        );
    }

    const textAlignStyle = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';

    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1.5rem' }}>
            {items.map((item, index) => (
                <div key={index} style={{ textAlign: textAlignStyle, padding: '1rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: valueColor, lineHeight: 1.1 }}>
                        {item.prefix || ''}{item.value ?? 0}{item.suffix || ''}
                    </div>
                    {item.label && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: labelColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {item.label}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

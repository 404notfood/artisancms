import type { BlockRendererProps } from '../block-registry';

export default function ListRenderer({ block }: BlockRendererProps) {
    const items = (block.props.items as string[]) || ['Élément 1', 'Élément 2', 'Élément 3'];
    const style = (block.props.style as string) || 'bullet';
    const spacing = (block.props.spacing as string) || 'normal';

    const spacingClasses: Record<string, string> = {
        compact: 'space-y-1',
        normal: 'space-y-2',
        relaxed: 'space-y-4',
    };

    const markers: Record<string, string> = {
        bullet: '\u2022',
        check: '\u2713',
        arrow: '\u2192',
        none: '',
    };

    if (style === 'numbered') {
        return (
            <ol className={`${spacingClasses[spacing] || spacingClasses.normal} list-none`}>
                {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700">
                        <span className="font-semibold text-blue-600 flex-shrink-0 min-w-[1.5rem]">
                            {i + 1}.
                        </span>
                        <span>{item}</span>
                    </li>
                ))}
            </ol>
        );
    }

    return (
        <ul className={`${spacingClasses[spacing] || spacingClasses.normal} list-none`}>
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                    {markers[style] && (
                        <span className={`flex-shrink-0 ${style === 'check' ? 'text-green-500' : 'text-blue-500'} font-bold`}>
                            {markers[style]}
                        </span>
                    )}
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

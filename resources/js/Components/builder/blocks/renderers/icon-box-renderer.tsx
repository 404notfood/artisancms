import type { BlockRendererProps } from '../block-registry';

interface IconBoxItem {
    icon: string;
    title: string;
    description: string;
    link: string;
}

export default function IconBoxRenderer({ block }: BlockRendererProps) {
    const items = (block.props.items as IconBoxItem[]) || [];
    const columns = (block.props.columns as number) || 3;
    const align = (block.props.align as string) || 'center';

    if (items.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Aucune carte configurée
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-${columns} gap-6`}>
            {items.map((item, index) => {
                const content = (
                    <div
                        key={index}
                        className={`p-6 rounded-lg border bg-white hover:shadow-md transition-shadow text-${align}`}
                    >
                        {item.icon && (
                            <div className="text-4xl mb-3">{item.icon}</div>
                        )}
                        {item.title && (
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                        )}
                        {item.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                        )}
                    </div>
                );

                if (item.link) {
                    return (
                        <a key={index} href={item.link} className="block no-underline">
                            {content}
                        </a>
                    );
                }

                return content;
            })}
        </div>
    );
}

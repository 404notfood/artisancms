import type { BlockRendererProps } from '../block-registry';

interface TocItem {
    id: string;
    text: string;
    level: number;
}

export default function TocRenderer({ block }: BlockRendererProps) {
    const { title = 'Table des matieres', style = 'default' } = block.props as Record<string, string>;

    // In the builder, show a placeholder. On front-end, this will be populated via JS.
    return (
        <nav className={`toc-block rounded-lg p-4 ${style === 'boxed' ? 'border bg-gray-50' : ''}`}>
            {title && (
                <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
            )}
            <div className="text-sm text-gray-500 space-y-1.5" data-toc-list>
                <p className="text-xs italic text-gray-400">
                    Auto-genere depuis les titres de la page
                </p>
                <ul className="space-y-1 list-none">
                    <li className="pl-0"><a href="#" className="text-indigo-600 hover:underline">Titre H2 exemple</a></li>
                    <li className="pl-4"><a href="#" className="text-gray-600 hover:underline">Sous-titre H3</a></li>
                    <li className="pl-0"><a href="#" className="text-indigo-600 hover:underline">Autre titre H2</a></li>
                </ul>
            </div>
        </nav>
    );
}

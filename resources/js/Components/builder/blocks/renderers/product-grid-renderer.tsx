import type { BlockRendererProps } from '../block-registry';

export default function ProductGridRenderer({ block, isEditing }: BlockRendererProps) {
    const columns = (block.props.columns as number) || 3;
    const limit = (block.props.limit as number) || 6;
    const gap = (block.props.gap as string) || '1.5rem';
    const showPagination = block.props.showPagination === true;

    const placeholderCount = isEditing ? limit : 0;
    const placeholders = Array.from({ length: placeholderCount }, (_, i) => i);

    const columnClasses: Record<number, string> = {
        2: 'sm:grid-cols-2',
        3: 'sm:grid-cols-2 lg:grid-cols-3',
        4: 'sm:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div>
            <div
                className={`grid grid-cols-1 ${columnClasses[columns] || columnClasses[3]}`}
                style={{ gap }}
            >
                {isEditing ? (
                    placeholders.map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div className="p-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-5 bg-blue-100 rounded w-1/3 mb-3" />
                                <div className="h-8 bg-blue-500 rounded w-full" />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-gray-400">
                        Grille de produits (chargement dynamique)
                    </div>
                )}
            </div>
            {showPagination && isEditing && (
                <div className="flex justify-center gap-2 mt-6">
                    <button type="button" className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">Prec.</button>
                    <button type="button" className="px-3 py-1 border rounded text-sm bg-blue-600 text-white">1</button>
                    <button type="button" className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">2</button>
                    <button type="button" className="px-3 py-1 border rounded text-sm text-gray-500 hover:bg-gray-50">Suiv.</button>
                </div>
            )}
        </div>
    );
}

import type { BlockRendererProps } from '../block-registry';

export default function TableRenderer({ block }: BlockRendererProps) {
    const headers = (block.props.headers as string[]) || [];
    const rows = (block.props.rows as string[][]) || [];
    const striped = (block.props.striped as boolean) ?? true;
    const bordered = (block.props.bordered as boolean) ?? true;
    const caption = (block.props.caption as string) || '';

    if (headers.length === 0 && rows.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Tableau vide - ajoutez des colonnes et des lignes
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className={`w-full text-sm text-left ${bordered ? 'border' : ''}`}>
                {caption && (
                    <caption className="text-sm text-gray-500 mb-2 text-left">{caption}</caption>
                )}
                {headers.length > 0 && (
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                        <tr>
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    className={`px-4 py-3 ${bordered ? 'border' : 'border-b'}`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className={striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''}
                        >
                            {(row || []).map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    className={`px-4 py-3 text-gray-600 ${bordered ? 'border' : 'border-b'}`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

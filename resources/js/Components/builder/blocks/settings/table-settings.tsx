import type { BlockSettingsProps } from '../block-registry';

export default function TableSettings({ block, onUpdate }: BlockSettingsProps) {
    const headers = (block.props.headers as string[]) || [];
    const rows = (block.props.rows as string[][]) || [];
    const striped = (block.props.striped as boolean) ?? true;
    const bordered = (block.props.bordered as boolean) ?? true;
    const caption = (block.props.caption as string) || '';

    const updateHeader = (index: number, value: string) => {
        const updated = [...headers];
        updated[index] = value;
        onUpdate({ headers: updated });
    };

    const addColumn = () => {
        const newHeaders = [...headers, `Colonne ${headers.length + 1}`];
        const newRows = rows.map((row) => [...row, '']);
        onUpdate({ headers: newHeaders, rows: newRows });
    };

    const removeColumn = (colIndex: number) => {
        const newHeaders = headers.filter((_, i) => i !== colIndex);
        const newRows = rows.map((row) => row.filter((_, i) => i !== colIndex));
        onUpdate({ headers: newHeaders, rows: newRows });
    };

    const addRow = () => {
        const newRow = Array(headers.length).fill('');
        onUpdate({ rows: [...rows, newRow] });
    };

    const removeRow = (rowIndex: number) => {
        onUpdate({ rows: rows.filter((_, i) => i !== rowIndex) });
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const updated = rows.map((row) => [...row]);
        updated[rowIndex][colIndex] = value;
        onUpdate({ rows: updated });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Légende du tableau</label>
                <input type="text" value={caption} onChange={(e) => onUpdate({ caption: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Description du tableau" />
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={striped} onChange={(e) => onUpdate({ striped: e.target.checked })} className="rounded" />
                    <label className="text-sm text-gray-700">Lignes alternées</label>
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={bordered} onChange={(e) => onUpdate({ bordered: e.target.checked })} className="rounded" />
                    <label className="text-sm text-gray-700">Bordures</label>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">En-têtes de colonnes</label>
                    <button type="button" onClick={addColumn} className="text-xs text-blue-500 hover:text-blue-700">+ Colonne</button>
                </div>
                {headers.map((header, index) => (
                    <div key={index} className="flex gap-1 mb-1">
                        <input type="text" value={header} onChange={(e) => updateHeader(index, e.target.value)} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder={`Colonne ${index + 1}`} />
                        <button type="button" onClick={() => removeColumn(index)} className="text-red-400 text-xs px-2 hover:text-red-600">&times;</button>
                    </div>
                ))}
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Lignes</label>
                    <button type="button" onClick={addRow} className="text-xs text-blue-500 hover:text-blue-700">+ Ligne</button>
                </div>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="border rounded p-2 mb-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">Ligne {rowIndex + 1}</span>
                            <button type="button" onClick={() => removeRow(rowIndex)} className="text-red-500 text-xs hover:text-red-700">Supprimer</button>
                        </div>
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${headers.length || 1}, 1fr)` }}>
                            {(row || []).map((cell, colIndex) => (
                                <input
                                    key={colIndex}
                                    type="text"
                                    value={cell}
                                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                    className="border rounded px-2 py-1 text-sm"
                                    placeholder={headers[colIndex] || ''}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

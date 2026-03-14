import type { BlockSettingsProps } from '../block-registry';

export default function ListSettings({ block, onUpdate }: BlockSettingsProps) {
    const items = (block.props.items as string[]) || ['Élément 1', 'Élément 2', 'Élément 3'];
    const style = (block.props.style as string) || 'bullet';
    const spacing = (block.props.spacing as string) || 'normal';

    const updateItem = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        onUpdate({ items: newItems });
    };

    const addItem = () => {
        onUpdate({ items: [...items, ''] });
    };

    const removeItem = (index: number) => {
        onUpdate({ items: items.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style de liste</label>
                <select
                    value={style}
                    onChange={(e) => onUpdate({ style: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="bullet">Puces</option>
                    <option value="numbered">Numérotée</option>
                    <option value="check">Coches</option>
                    <option value="arrow">Flèches</option>
                    <option value="none">Sans marqueur</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espacement</label>
                <select
                    value={spacing}
                    onChange={(e) => onUpdate({ spacing: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="compact">Compact</option>
                    <option value="normal">Normal</option>
                    <option value="relaxed">Aéré</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Éléments</label>
                <div className="space-y-2">
                    {items.map((item, i) => (
                        <div key={i} className="flex gap-2">
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => updateItem(i, e.target.value)}
                                className="flex-1 border rounded px-3 py-2 text-sm"
                                placeholder={`Élément ${i + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeItem(i)}
                                className="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-sm"
                            >
                                Supprimer
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addItem}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                    + Ajouter un élément
                </button>
            </div>
        </div>
    );
}

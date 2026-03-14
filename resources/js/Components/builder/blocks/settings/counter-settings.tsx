import type { BlockSettingsProps } from '../block-registry';

interface CounterItem {
    value: number;
    label: string;
    prefix: string;
    suffix: string;
}

export default function CounterSettings({ block, onUpdate }: BlockSettingsProps) {
    const items = (block.props.items as CounterItem[]) || [];
    const columns = (block.props.columns as number) || 3;
    const align = (block.props.align as string) || 'center';

    const updateItem = (index: number, field: keyof CounterItem, value: string | number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate({ items: updated });
    };

    const addItem = () => {
        onUpdate({ items: [...items, { value: 0, label: '', prefix: '', suffix: '' }] });
    };

    const removeItem = (index: number) => {
        onUpdate({ items: items.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes</label>
                <input type="number" min={2} max={4} value={columns} onChange={(e) => onUpdate({ columns: parseInt(e.target.value) || 3 })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alignement</label>
                <select value={align} onChange={(e) => onUpdate({ align: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="center">Centré</option>
                    <option value="left">Gauche</option>
                    <option value="right">Droite</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compteurs</label>
                {items.map((item, index) => (
                    <div key={index} className="border rounded p-3 mb-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Compteur {index + 1}</span>
                            <button type="button" onClick={() => removeItem(index)} className="text-red-500 text-xs hover:text-red-700">Supprimer</button>
                        </div>
                        <input type="number" value={item.value ?? 0} onChange={(e) => updateItem(index, 'value', parseInt(e.target.value) || 0)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Valeur" />
                        <input type="text" value={item.label} onChange={(e) => updateItem(index, 'label', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Libellé (ex: Clients)" />
                        <div className="flex gap-2">
                            <input type="text" value={item.prefix} onChange={(e) => updateItem(index, 'prefix', e.target.value)} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Préfixe (ex: $)" />
                            <input type="text" value={item.suffix} onChange={(e) => updateItem(index, 'suffix', e.target.value)} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Suffixe (ex: %)" />
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addItem} className="w-full border-2 border-dashed rounded px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400">
                    + Ajouter un compteur
                </button>
            </div>
        </div>
    );
}

import type { BlockSettingsProps } from '../block-registry';

interface IconBoxItem {
    icon: string;
    title: string;
    description: string;
    link: string;
}

export default function IconBoxSettings({ block, onUpdate }: BlockSettingsProps) {
    const items = (block.props.items as IconBoxItem[]) || [];
    const columns = (block.props.columns as number) || 3;
    const align = (block.props.align as string) || 'center';

    const updateItem = (index: number, field: keyof IconBoxItem, value: string) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate({ items: updated });
    };

    const addItem = () => {
        onUpdate({ items: [...items, { icon: '', title: '', description: '', link: '' }] });
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
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cartes</label>
                {items.map((item, index) => (
                    <div key={index} className="border rounded p-3 mb-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Carte {index + 1}</span>
                            <button type="button" onClick={() => removeItem(index)} className="text-red-500 text-xs hover:text-red-700">Supprimer</button>
                        </div>
                        <input type="text" value={item.icon} onChange={(e) => updateItem(index, 'icon', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Icône (emoji ou symbole, ex: ⚡)" />
                        <input type="text" value={item.title} onChange={(e) => updateItem(index, 'title', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Titre" />
                        <textarea value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" rows={2} placeholder="Description" />
                        <input type="text" value={item.link} onChange={(e) => updateItem(index, 'link', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Lien (optionnel)" />
                    </div>
                ))}
                <button type="button" onClick={addItem} className="w-full border-2 border-dashed rounded px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400">
                    + Ajouter une carte
                </button>
            </div>
        </div>
    );
}

import type { BlockSettingsProps } from '../block-registry';

interface AccordionItem {
    title: string;
    content: string;
}

export default function AccordionSettings({ block, onUpdate }: BlockSettingsProps) {
    const items = (block.props.items as AccordionItem[]) || [];
    const allowMultiple = (block.props.allowMultiple as boolean) || false;
    const defaultOpen = (block.props.defaultOpen as number) ?? -1;

    const updateItem = (index: number, field: keyof AccordionItem, value: string) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate({ items: updated });
    };

    const addItem = () => {
        onUpdate({ items: [...items, { title: '', content: '' }] });
    };

    const removeItem = (index: number) => {
        onUpdate({ items: items.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={allowMultiple} onChange={(e) => onUpdate({ allowMultiple: e.target.checked })} className="rounded" />
                <label className="text-sm text-gray-700">Autoriser l&apos;ouverture multiple</label>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ouvert par défaut</label>
                <input type="number" min={-1} max={items.length - 1} value={defaultOpen} onChange={(e) => onUpdate({ defaultOpen: parseInt(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" placeholder="-1 = aucun" />
                <p className="text-xs text-gray-400 mt-1">-1 = aucun, 0 = premier, etc.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Éléments</label>
                {items.map((item, index) => (
                    <div key={index} className="border rounded p-3 mb-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Élément {index + 1}</span>
                            <button type="button" onClick={() => removeItem(index)} className="text-red-500 text-xs hover:text-red-700">Supprimer</button>
                        </div>
                        <input type="text" value={item.title} onChange={(e) => updateItem(index, 'title', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Titre" />
                        <textarea value={item.content} onChange={(e) => updateItem(index, 'content', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" rows={3} placeholder="Contenu" />
                    </div>
                ))}
                <button type="button" onClick={addItem} className="w-full border-2 border-dashed rounded px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400">
                    + Ajouter un élément
                </button>
            </div>
        </div>
    );
}

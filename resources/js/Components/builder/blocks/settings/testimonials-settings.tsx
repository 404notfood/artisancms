import type { BlockSettingsProps } from '../block-registry';

interface Testimonial {
    name: string;
    role: string;
    company: string;
    content: string;
    avatar: string;
    rating: number;
}

export default function TestimonialsSettings({ block, onUpdate }: BlockSettingsProps) {
    const items = (block.props.items as Testimonial[]) || [];
    const layout = (block.props.layout as string) || 'grid';
    const columns = (block.props.columns as number) || 2;

    const updateItem = (index: number, field: keyof Testimonial, value: string | number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate({ items: updated });
    };

    const addItem = () => {
        onUpdate({ items: [...items, { name: '', role: '', company: '', content: '', avatar: '', rating: 5 }] });
    };

    const removeItem = (index: number) => {
        onUpdate({ items: items.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disposition</label>
                <select value={layout} onChange={(e) => onUpdate({ layout: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="grid">Grille</option>
                    <option value="carousel">Carrousel</option>
                    <option value="list">Liste</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes</label>
                <input type="number" min={1} max={3} value={columns} onChange={(e) => onUpdate({ columns: parseInt(e.target.value) || 2 })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Témoignages</label>
                {items.map((item, index) => (
                    <div key={index} className="border rounded p-3 mb-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Témoignage {index + 1}</span>
                            <button type="button" onClick={() => removeItem(index)} className="text-red-500 text-xs hover:text-red-700">Supprimer</button>
                        </div>
                        <input type="text" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Nom" />
                        <input type="text" value={item.role} onChange={(e) => updateItem(index, 'role', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Fonction" />
                        <input type="text" value={item.company} onChange={(e) => updateItem(index, 'company', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Entreprise" />
                        <textarea value={item.content} onChange={(e) => updateItem(index, 'content', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" rows={3} placeholder="Témoignage" />
                        <input type="text" value={item.avatar} onChange={(e) => updateItem(index, 'avatar', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="URL de l'avatar" />
                        <div>
                            <label className="text-xs text-gray-500">Note (0-5)</label>
                            <input type="number" min={0} max={5} value={item.rating || 0} onChange={(e) => updateItem(index, 'rating', parseInt(e.target.value) || 0)} className="w-full border rounded px-3 py-1.5 text-sm" />
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addItem} className="w-full border-2 border-dashed rounded px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400">
                    + Ajouter un témoignage
                </button>
            </div>
        </div>
    );
}

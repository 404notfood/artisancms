import type { BlockSettingsProps } from '../block-registry';

interface TabItem {
    label: string;
    content: string;
}

export default function TabsSettings({ block, onUpdate }: BlockSettingsProps) {
    const tabs = (block.props.tabs as TabItem[]) || [];
    const style = (block.props.style as string) || 'underline';
    const defaultTab = (block.props.defaultTab as number) || 0;

    const updateTab = (index: number, field: keyof TabItem, value: string) => {
        const updated = [...tabs];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate({ tabs: updated });
    };

    const addTab = () => {
        onUpdate({ tabs: [...tabs, { label: '', content: '' }] });
    };

    const removeTab = (index: number) => {
        onUpdate({ tabs: tabs.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select value={style} onChange={(e) => onUpdate({ style: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="underline">Souligné</option>
                    <option value="pills">Pilules</option>
                    <option value="boxed">Encadré</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onglet actif par défaut</label>
                <input type="number" min={0} max={Math.max(0, tabs.length - 1)} value={defaultTab} onChange={(e) => onUpdate({ defaultTab: parseInt(e.target.value) || 0 })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Onglets</label>
                {tabs.map((tab, index) => (
                    <div key={index} className="border rounded p-3 mb-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Onglet {index + 1}</span>
                            <button type="button" onClick={() => removeTab(index)} className="text-red-500 text-xs hover:text-red-700">Supprimer</button>
                        </div>
                        <input type="text" value={tab.label} onChange={(e) => updateTab(index, 'label', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Libellé" />
                        <textarea value={tab.content} onChange={(e) => updateTab(index, 'content', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" rows={3} placeholder="Contenu" />
                    </div>
                ))}
                <button type="button" onClick={addTab} className="w-full border-2 border-dashed rounded px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400">
                    + Ajouter un onglet
                </button>
            </div>
        </div>
    );
}

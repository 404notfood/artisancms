import type { BlockSettingsProps } from '../block-registry';

export default function ButtonSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte</label>
                <input type="text" value={(block.props.text as string) || ''} onChange={(e) => onUpdate({ text: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input type="text" value={(block.props.url as string) || ''} onChange={(e) => onUpdate({ url: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variante</label>
                <select value={(block.props.variant as string) || 'primary'} onChange={(e) => onUpdate({ variant: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="primary">Primaire</option>
                    <option value="secondary">Secondaire</option>
                    <option value="outline">Contour</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taille</label>
                <select value={(block.props.size as string) || 'md'} onChange={(e) => onUpdate({ size: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="sm">Petit</option>
                    <option value="md">Moyen</option>
                    <option value="lg">Grand</option>
                </select>
            </div>
        </div>
    );
}

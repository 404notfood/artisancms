import type { BlockSettingsProps } from '../block-registry';

export default function CartWidgetSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                    value={(block.props.style as string) || 'icon'}
                    onChange={(e) => onUpdate({ style: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="icon">Icone</option>
                    <option value="sidebar">Barre laterale</option>
                    <option value="dropdown">Menu deroulant</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="showCount"
                    checked={block.props.showCount !== false}
                    onChange={(e) => onUpdate({ showCount: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="showCount" className="text-sm font-medium text-gray-700">Afficher le compteur</label>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="showTotal"
                    checked={block.props.showTotal !== false}
                    onChange={(e) => onUpdate({ showTotal: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="showTotal" className="text-sm font-medium text-gray-700">Afficher le total</label>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                    value={(block.props.position as string) || 'top-right'}
                    onChange={(e) => onUpdate({ position: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="top-right">Haut droite</option>
                    <option value="top-left">Haut gauche</option>
                </select>
            </div>
        </div>
    );
}

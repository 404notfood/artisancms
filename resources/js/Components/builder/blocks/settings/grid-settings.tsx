import type { BlockSettingsProps } from '../block-registry';

export default function GridSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes</label>
                <select value={Number(block.props.columns) || 2} onChange={(e) => onUpdate({ columns: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm">
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} colonne{n > 1 ? 's' : ''}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espacement (px)</label>
                <input type="number" min={0} max={100} value={Number(block.props.gap) || 16} onChange={(e) => onUpdate({ gap: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
        </div>
    );
}

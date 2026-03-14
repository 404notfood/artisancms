import type { BlockSettingsProps } from '../block-registry';

export default function SpacerSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hauteur (px)</label>
                <input type="number" min={0} max={500} value={Number(block.props.height) || 40} onChange={(e) => onUpdate({ height: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
        </div>
    );
}

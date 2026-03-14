import type { BlockSettingsProps } from '../block-registry';

export default function DividerSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select value={(block.props.style as string) || 'solid'} onChange={(e) => onUpdate({ style: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="solid">Continu</option>
                    <option value="dashed">Tirets</option>
                    <option value="dotted">Pointilles</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                <input type="color" value={(block.props.color as string) || '#d1d5db'} onChange={(e) => onUpdate({ color: e.target.value })} className="w-full h-10 rounded border cursor-pointer" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Epaisseur (px)</label>
                <input type="number" min={1} max={20} value={Number(block.props.thickness) || 1} onChange={(e) => onUpdate({ thickness: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
        </div>
    );
}

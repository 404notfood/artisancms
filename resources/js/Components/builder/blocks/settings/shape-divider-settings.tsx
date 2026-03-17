import type { BlockSettingsProps } from '../block-registry';

const SHAPES = [
    { value: 'wave', label: 'Vague' },
    { value: 'curve', label: 'Courbe' },
    { value: 'zigzag', label: 'Zigzag' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'tilt', label: 'Incline' },
    { value: 'arrow', label: 'Fleche' },
    { value: 'cloud', label: 'Nuage' },
    { value: 'mountains', label: 'Montagnes' },
    { value: 'waves', label: 'Vagues' },
    { value: 'drops', label: 'Gouttes' },
];

export default function ShapeDividerSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forme</label>
                <select
                    value={(block.props.shape as string) ?? 'wave'}
                    onChange={(e) => onUpdate({ shape: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    {SHAPES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                <input
                    type="color"
                    value={(block.props.color as string) ?? '#ffffff'}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="w-full h-10 rounded border cursor-pointer"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hauteur (px)</label>
                <input
                    type="number"
                    value={Number(block.props.height) || 80}
                    onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                    min={20}
                    max={300}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            </div>
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={(block.props.flipX as boolean) ?? false}
                        onChange={(e) => onUpdate({ flipX: e.target.checked })}
                        className="rounded"
                    />
                    Miroir H
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={(block.props.flipY as boolean) ?? false}
                        onChange={(e) => onUpdate({ flipY: e.target.checked })}
                        className="rounded"
                    />
                    Miroir V
                </label>
            </div>
        </div>
    );
}

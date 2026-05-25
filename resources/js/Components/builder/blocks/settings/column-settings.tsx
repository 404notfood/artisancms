import type { BlockSettingsProps } from '../block-registry';

export default function ColumnSettings({ block, onUpdate }: BlockSettingsProps) {
    const span = Number(block.props.span) || 6;
    const padding = Number(block.props.padding) || 16;
    const minHeight = Number(block.props.minHeight) || 120;
    const backgroundColor = (block.props.backgroundColor as string) || '';

    return (
        <div className="space-y-4">
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Largeur</label>
                <select
                    value={span}
                    onChange={(event) => onUpdate({ span: Number(event.target.value) })}
                    className="w-full rounded border px-3 py-2 text-sm"
                >
                    <option value={12}>100%</option>
                    <option value={9}>75%</option>
                    <option value={8}>66%</option>
                    <option value={6}>50%</option>
                    <option value={4}>33%</option>
                    <option value={3}>25%</option>
                </select>
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Padding</label>
                <input
                    type="number"
                    min={0}
                    max={120}
                    value={padding}
                    onChange={(event) => onUpdate({ padding: Number(event.target.value) })}
                    className="w-full rounded border px-3 py-2 text-sm"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hauteur minimum</label>
                <input
                    type="number"
                    min={40}
                    max={800}
                    value={minHeight}
                    onChange={(event) => onUpdate({ minHeight: Number(event.target.value) })}
                    className="w-full rounded border px-3 py-2 text-sm"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fond</label>
                <input
                    type="color"
                    value={backgroundColor || '#ffffff'}
                    onChange={(event) => onUpdate({ backgroundColor: event.target.value })}
                    className="h-10 w-full rounded border px-2 py-1"
                />
            </div>
        </div>
    );
}

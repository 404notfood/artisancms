import type { BlockSettingsProps } from '../block-registry';

export default function RowSettings({ block, onUpdate }: BlockSettingsProps) {
    const gap = Number(block.props.gap) || 20;
    const verticalAlign = (block.props.verticalAlign as string) || 'stretch';

    return (
        <div className="space-y-4">
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Espacement entre colonnes</label>
                <input
                    type="number"
                    min={0}
                    max={80}
                    value={gap}
                    onChange={(event) => onUpdate({ gap: Number(event.target.value) })}
                    className="w-full rounded border px-3 py-2 text-sm"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Alignement vertical</label>
                <select
                    value={verticalAlign}
                    onChange={(event) => onUpdate({ verticalAlign: event.target.value })}
                    className="w-full rounded border px-3 py-2 text-sm"
                >
                    <option value="stretch">Etirer</option>
                    <option value="start">Haut</option>
                    <option value="center">Centre</option>
                    <option value="end">Bas</option>
                </select>
            </div>
        </div>
    );
}

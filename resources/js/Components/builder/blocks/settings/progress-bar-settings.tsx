import type { BlockSettingsProps } from '../block-registry';

interface Bar {
    label: string;
    value: number;
    color: string;
}

export default function ProgressBarSettings({ block, onUpdate }: BlockSettingsProps) {
    const bars = (block.props.bars as Bar[]) || [];
    const showPercentage = block.props.showPercentage !== false;
    const height = (block.props.height as string) || 'md';
    const animated = block.props.animated !== false;

    const updateBar = (index: number, field: keyof Bar, value: string | number) => {
        const newBars = [...bars];
        newBars[index] = { ...newBars[index], [field]: value };
        onUpdate({ bars: newBars });
    };

    const addBar = () => {
        onUpdate({ bars: [...bars, { label: '', value: 50, color: '#3b82f6' }] });
    };

    const removeBar = (index: number) => {
        onUpdate({ bars: bars.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hauteur</label>
                <select
                    value={height}
                    onChange={(e) => onUpdate({ height: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="sm">Petite</option>
                    <option value="md">Moyenne</option>
                    <option value="lg">Grande</option>
                </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={showPercentage}
                    onChange={(e) => onUpdate({ showPercentage: e.target.checked })}
                    className="rounded"
                />
                Afficher le pourcentage
            </label>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={animated}
                    onChange={(e) => onUpdate({ animated: e.target.checked })}
                    className="rounded"
                />
                Animation
            </label>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barres</label>
                <div className="space-y-3">
                    {bars.map((bar, i) => (
                        <div key={i} className="border rounded p-3 space-y-2 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Barre {i + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeBar(i)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                >
                                    Supprimer
                                </button>
                            </div>
                            <input
                                type="text"
                                value={bar.label}
                                onChange={(e) => updateBar(i, 'label', e.target.value)}
                                className="w-full border rounded px-3 py-1.5 text-sm"
                                placeholder="Libellé"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={bar.value}
                                    onChange={(e) => updateBar(i, 'value', Number(e.target.value))}
                                    className="flex-1 border rounded px-3 py-1.5 text-sm"
                                    placeholder="Valeur (0-100)"
                                />
                                <input
                                    type="color"
                                    value={bar.color || '#3b82f6'}
                                    onChange={(e) => updateBar(i, 'color', e.target.value)}
                                    className="w-10 h-8 border rounded cursor-pointer"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addBar}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                    + Ajouter une barre
                </button>
            </div>
        </div>
    );
}

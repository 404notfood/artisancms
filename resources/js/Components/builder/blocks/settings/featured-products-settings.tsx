import type { BlockSettingsProps } from '../block-registry';

export default function FeaturedProductsSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                    type="text"
                    value={(block.props.title as string) || ''}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Produits en vedette"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de produits</label>
                <input
                    type="number"
                    value={(block.props.limit as number) || 4}
                    onChange={(e) => onUpdate({ limit: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    min={1}
                    max={12}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disposition</label>
                <select
                    value={(block.props.layout as string) || 'scroll'}
                    onChange={(e) => onUpdate({ layout: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="scroll">Defilement horizontal</option>
                    <option value="grid">Grille</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="showArrows"
                    checked={block.props.showArrows !== false}
                    onChange={(e) => onUpdate({ showArrows: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="showArrows" className="text-sm font-medium text-gray-700">Afficher les fleches</label>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="autoplay"
                    checked={block.props.autoplay === true}
                    onChange={(e) => onUpdate({ autoplay: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="autoplay" className="text-sm font-medium text-gray-700">Lecture automatique</label>
            </div>
        </div>
    );
}

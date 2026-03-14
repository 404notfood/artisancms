import type { BlockSettingsProps } from '../block-registry';

export default function ProductGridSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes</label>
                <select
                    value={(block.props.columns as number) || 3}
                    onChange={(e) => onUpdate({ columns: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value={2}>2 colonnes</option>
                    <option value={3}>3 colonnes</option>
                    <option value={4}>4 colonnes</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID de la categorie</label>
                <input
                    type="number"
                    value={(block.props.categoryId as number) || ''}
                    onChange={(e) => onUpdate({ categoryId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Toutes les categories"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de produits</label>
                <input
                    type="number"
                    value={(block.props.limit as number) || 6}
                    onChange={(e) => onUpdate({ limit: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    min={1}
                    max={24}
                />
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="showPagination"
                    checked={block.props.showPagination === true}
                    onChange={(e) => onUpdate({ showPagination: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="showPagination" className="text-sm font-medium text-gray-700">Afficher la pagination</label>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espacement</label>
                <input
                    type="text"
                    value={(block.props.gap as string) || ''}
                    onChange={(e) => onUpdate({ gap: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="1.5rem"
                />
            </div>
        </div>
    );
}

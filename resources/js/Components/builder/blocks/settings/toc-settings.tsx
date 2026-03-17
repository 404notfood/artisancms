import type { BlockSettingsProps } from '../block-registry';

export default function TocSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                    type="text"
                    value={(block.props.title as string) ?? 'Table des matieres'}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                    value={(block.props.style as string) ?? 'default'}
                    onChange={(e) => onUpdate({ style: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="default">Simple</option>
                    <option value="boxed">Encadre</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveaux de titres</label>
                <select
                    value={(block.props.maxLevel as string) ?? '3'}
                    onChange={(e) => onUpdate({ maxLevel: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="2">H2 uniquement</option>
                    <option value="3">H2 - H3</option>
                    <option value="4">H2 - H4</option>
                    <option value="5">H2 - H5</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="toc-smooth"
                    checked={(block.props.smoothScroll as boolean) !== false}
                    onChange={(e) => onUpdate({ smoothScroll: e.target.checked })}
                    className="rounded"
                />
                <label htmlFor="toc-smooth" className="text-sm text-gray-700">Defilement fluide</label>
            </div>
        </div>
    );
}

import type { BlockSettingsProps } from '../block-registry';

export default function SectionSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur de fond</label>
                <input type="color" value={(block.props.backgroundColor as string) || '#ffffff'} onChange={(e) => onUpdate({ backgroundColor: e.target.value })} className="w-full h-10 rounded border cursor-pointer" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image de fond (URL)</label>
                <input type="text" value={(block.props.backgroundImage as string) || ''} onChange={(e) => onUpdate({ backgroundImage: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Padding haut</label>
                    <input type="number" value={Number(block.props.paddingTop) || 40} onChange={(e) => onUpdate({ paddingTop: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Padding bas</label>
                    <input type="number" value={Number(block.props.paddingBottom) || 40} onChange={(e) => onUpdate({ paddingBottom: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Padding gauche</label>
                    <input type="number" value={Number(block.props.paddingLeft) || 20} onChange={(e) => onUpdate({ paddingLeft: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Padding droite</label>
                    <input type="number" value={Number(block.props.paddingRight) || 20} onChange={(e) => onUpdate({ paddingRight: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
            </div>
        </div>
    );
}

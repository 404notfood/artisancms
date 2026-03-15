import type { BlockSettingsProps } from '../block-registry';

export default function HeadingSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte</label>
                <input type="text" value={(block.props.text as string) || ''} onChange={(e) => onUpdate({ text: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                <select value={Number(block.props.level) || 2} onChange={(e) => onUpdate({ level: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm">
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>H{n}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alignement</label>
                <select value={(block.props.alignment as string) || 'left'} onChange={(e) => onUpdate({ alignment: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="left">Gauche</option>
                    <option value="center">Centre</option>
                    <option value="right">Droite</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur du texte</label>
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={(block.props.color as string) || '#000000'}
                        onChange={(e) => onUpdate({ color: e.target.value })}
                        className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <input
                        type="text"
                        value={(block.props.color as string) || ''}
                        onChange={(e) => onUpdate({ color: e.target.value })}
                        className="flex-1 border rounded px-3 py-2 text-sm"
                        placeholder="#000000"
                    />
                </div>
            </div>
        </div>
    );
}

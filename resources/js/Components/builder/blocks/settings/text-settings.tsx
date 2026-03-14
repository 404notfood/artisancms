import type { BlockSettingsProps } from '../block-registry';

export default function TextSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                <textarea rows={6} value={(block.props.content as string) || ''} onChange={(e) => onUpdate({ content: e.target.value })} className="w-full border rounded px-3 py-2 text-sm font-mono" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alignement</label>
                <select value={(block.props.alignment as string) || 'left'} onChange={(e) => onUpdate({ alignment: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="left">Gauche</option>
                    <option value="center">Centre</option>
                    <option value="right">Droite</option>
                </select>
            </div>
        </div>
    );
}

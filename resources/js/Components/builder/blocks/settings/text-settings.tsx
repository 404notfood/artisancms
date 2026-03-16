import type { BlockSettingsProps } from '../block-registry';
import TipTapEditor from '../../tiptap-editor';

export default function TextSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                <TipTapEditor
                    content={(block.props.content as string) || ''}
                    onUpdate={(html) => onUpdate({ content: html })}
                    placeholder="Saisissez votre texte..."
                />
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

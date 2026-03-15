import type { BlockSettingsProps } from '../block-registry';
import MediaPickerButton from './media-picker-button';

export default function ImageSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <MediaPickerButton
                label="Image"
                value={(block.props.src as string) || ''}
                onChange={(url, alt) => {
                    onUpdate({ src: url, ...(alt ? { alt } : {}) });
                }}
                placeholder="Choisir une image"
            />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ou URL directe</label>
                <input type="text" value={(block.props.src as string) || ''} onChange={(e) => onUpdate({ src: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte alternatif</label>
                <input type="text" value={(block.props.alt as string) || ''} onChange={(e) => onUpdate({ alt: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Largeur</label>
                <input type="text" value={(block.props.width as string) || '100%'} onChange={(e) => onUpdate({ width: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="100%, 500px..." />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ajustement</label>
                <select value={(block.props.objectFit as string) || 'cover'} onChange={(e) => onUpdate({ objectFit: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="cover">Couvrir</option>
                    <option value="contain">Contenir</option>
                    <option value="fill">Remplir</option>
                    <option value="none">Aucun</option>
                </select>
            </div>
        </div>
    );
}

import type { BlockSettingsProps } from '../block-registry';

export default function CtaSettings({ block, onUpdate }: BlockSettingsProps) {
    const title = (block.props.title as string) || '';
    const description = (block.props.description as string) || '';
    const buttonText = (block.props.buttonText as string) || '';
    const buttonUrl = (block.props.buttonUrl as string) || '';
    const buttonVariant = (block.props.buttonVariant as string) || 'primary';
    const backgroundColor = (block.props.backgroundColor as string) || '#1e40af';
    const textColor = (block.props.textColor as string) || '#ffffff';
    const align = (block.props.align as string) || 'center';

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input type="text" value={title} onChange={(e) => onUpdate({ title: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={(e) => onUpdate({ description: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={3} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bouton</label>
                <input type="text" value={buttonText} onChange={(e) => onUpdate({ buttonText: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL du bouton</label>
                <input type="text" value={buttonUrl} onChange={(e) => onUpdate({ buttonUrl: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style du bouton</label>
                <select value={buttonVariant} onChange={(e) => onUpdate({ buttonVariant: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="primary">Primaire (blanc)</option>
                    <option value="secondary">Secondaire (sombre)</option>
                    <option value="outline">Contour</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur de fond</label>
                <div className="flex gap-2">
                    <input type="color" value={backgroundColor} onChange={(e) => onUpdate({ backgroundColor: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                    <input type="text" value={backgroundColor} onChange={(e) => onUpdate({ backgroundColor: e.target.value })} className="flex-1 border rounded px-3 py-2 text-sm" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur du texte</label>
                <div className="flex gap-2">
                    <input type="color" value={textColor} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                    <input type="text" value={textColor} onChange={(e) => onUpdate({ textColor: e.target.value })} className="flex-1 border rounded px-3 py-2 text-sm" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alignement</label>
                <select value={align} onChange={(e) => onUpdate({ align: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="center">Centré</option>
                    <option value="left">Gauche</option>
                </select>
            </div>
        </div>
    );
}

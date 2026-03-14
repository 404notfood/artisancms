import type { BlockSettingsProps } from '../block-registry';

export default function AlertSettings({ block, onUpdate }: BlockSettingsProps) {
    const type = (block.props.type as string) || 'info';
    const title = (block.props.title as string) || '';
    const content = (block.props.content as string) || '';
    const dismissible = (block.props.dismissible as boolean) || false;
    const showIcon = block.props.icon !== false;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={type} onChange={(e) => onUpdate({ type: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="info">Information</option>
                    <option value="success">Succès</option>
                    <option value="warning">Avertissement</option>
                    <option value="error">Erreur</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input type="text" value={title} onChange={(e) => onUpdate({ title: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                <textarea value={content} onChange={(e) => onUpdate({ content: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={4} />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={dismissible} onChange={(e) => onUpdate({ dismissible: e.target.checked })} className="rounded" />
                <label className="text-sm text-gray-700">Peut être fermé</label>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={showIcon} onChange={(e) => onUpdate({ icon: e.target.checked })} className="rounded" />
                <label className="text-sm text-gray-700">Afficher l&apos;icône</label>
            </div>
        </div>
    );
}

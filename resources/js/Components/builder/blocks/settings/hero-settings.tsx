import type { BlockSettingsProps } from '../block-registry';

export default function HeroSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input type="text" value={(block.props.title as string) || ''} onChange={(e) => onUpdate({ title: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
                <input type="text" value={(block.props.subtitle as string) || ''} onChange={(e) => onUpdate({ subtitle: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image de fond (URL)</label>
                <input type="text" value={(block.props.backgroundImage as string) || ''} onChange={(e) => onUpdate({ backgroundImage: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={block.props.overlay !== false} onChange={(e) => onUpdate({ overlay: e.target.checked })} className="rounded" />
                <label className="text-sm text-gray-700">Overlay sombre</label>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bouton</label>
                <input type="text" value={(block.props.ctaText as string) || ''} onChange={(e) => onUpdate({ ctaText: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL du bouton</label>
                <input type="text" value={(block.props.ctaUrl as string) || ''} onChange={(e) => onUpdate({ ctaUrl: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
        </div>
    );
}

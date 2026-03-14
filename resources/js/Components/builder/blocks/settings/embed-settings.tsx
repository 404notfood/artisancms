import type { BlockSettingsProps } from '../block-registry';

export default function EmbedSettings({ block, onUpdate }: BlockSettingsProps) {
    const url = (block.props.url as string) || '';
    const type = (block.props.type as string) || 'auto';
    const aspectRatio = (block.props.aspectRatio as string) || '16/9';
    const maxWidth = (block.props.maxWidth as string) || '100%';

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => onUpdate({ url: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="https://www.youtube.com/watch?v=..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                    value={type}
                    onChange={(e) => onUpdate({ type: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="auto">Automatique</option>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="iframe">iFrame générique</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ratio d'aspect</label>
                <select
                    value={aspectRatio}
                    onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="16/9">16:9</option>
                    <option value="4/3">4:3</option>
                    <option value="1/1">1:1</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Largeur maximale</label>
                <input
                    type="text"
                    value={maxWidth}
                    onChange={(e) => onUpdate({ maxWidth: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="100%, 800px, etc."
                />
            </div>
        </div>
    );
}

import type { BlockSettingsProps } from '../block-registry';

export default function BlockquoteSettings({ block, onUpdate }: BlockSettingsProps) {
    const text = (block.props.text as string) || '';
    const author = (block.props.author as string) || '';
    const source = (block.props.source as string) || '';
    const style = (block.props.style as string) || 'simple';

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Citation</label>
                <textarea
                    value={text}
                    onChange={(e) => onUpdate({ text: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={4}
                    placeholder="Votre citation ici..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
                <input
                    type="text"
                    value={author}
                    onChange={(e) => onUpdate({ author: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Nom de l'auteur"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <input
                    type="text"
                    value={source}
                    onChange={(e) => onUpdate({ source: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Titre du livre, article..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                    value={style}
                    onChange={(e) => onUpdate({ style: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="simple">Simple</option>
                    <option value="bordered">Bordure</option>
                    <option value="filled">Rempli</option>
                </select>
            </div>
        </div>
    );
}

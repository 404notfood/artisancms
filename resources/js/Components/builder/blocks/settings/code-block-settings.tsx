import type { BlockSettingsProps } from '../block-registry';

export default function CodeBlockSettings({ block, onUpdate }: BlockSettingsProps) {
    const code = (block.props.code as string) || '';
    const language = (block.props.language as string) || 'javascript';
    const showLineNumbers = block.props.showLineNumbers !== false;
    const title = (block.props.title as string) || '';

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Titre du bloc de code"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Langage</label>
                <select
                    value={language}
                    onChange={(e) => onUpdate({ language: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="php">PHP</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="python">Python</option>
                    <option value="bash">Bash</option>
                    <option value="json">JSON</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <textarea
                    value={code}
                    onChange={(e) => onUpdate({ code: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm font-mono"
                    rows={10}
                    placeholder="// Votre code ici"
                />
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => onUpdate({ showLineNumbers: e.target.checked })}
                    className="rounded"
                />
                Afficher les numéros de ligne
            </label>
        </div>
    );
}

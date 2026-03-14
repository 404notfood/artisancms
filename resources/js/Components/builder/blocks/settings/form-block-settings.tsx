import type { BlockSettingsProps } from '../block-registry';

export default function FormBlockSettings({ block, onUpdate }: BlockSettingsProps) {
    const formId = (block.props.formId as number) || '';
    const formSlug = (block.props.formSlug as string) || '';
    const style = (block.props.style as string) || 'default';

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID du formulaire</label>
                <input
                    type="number"
                    value={formId}
                    onChange={(e) => onUpdate({ formId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="1"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug du formulaire</label>
                <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => onUpdate({ formSlug: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="contact-form"
                />
                <p className="text-xs text-gray-400 mt-1">
                    Renseignez l'ID ou le slug du formulaire créé dans le Form Builder
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                    value={style}
                    onChange={(e) => onUpdate({ style: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="default">Par défaut</option>
                    <option value="card">Carte</option>
                    <option value="minimal">Minimal</option>
                </select>
            </div>
        </div>
    );
}

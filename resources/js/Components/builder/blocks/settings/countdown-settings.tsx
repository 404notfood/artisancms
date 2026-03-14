import type { BlockSettingsProps } from '../block-registry';

export default function CountdownSettings({ block, onUpdate }: BlockSettingsProps) {
    const targetDate = (block.props.targetDate as string) || '';
    const title = (block.props.title as string) || '';
    const expiredMessage = (block.props.expiredMessage as string) || 'Terminé !';
    const showDays = block.props.showDays !== false;
    const showHours = block.props.showHours !== false;
    const showMinutes = block.props.showMinutes !== false;
    const showSeconds = block.props.showSeconds !== false;
    const style = (block.props.style as string) || 'cards';

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Compte à rebours"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date cible</label>
                <input
                    type="datetime-local"
                    value={targetDate ? targetDate.slice(0, 16) : ''}
                    onChange={(e) => onUpdate({ targetDate: new Date(e.target.value).toISOString() })}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message expiré</label>
                <input
                    type="text"
                    value={expiredMessage}
                    onChange={(e) => onUpdate({ expiredMessage: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                    value={style}
                    onChange={(e) => onUpdate({ style: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="cards">Cartes</option>
                    <option value="inline">En ligne</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Unités affichées</label>
                {[
                    { key: 'showDays', label: 'Jours', value: showDays },
                    { key: 'showHours', label: 'Heures', value: showHours },
                    { key: 'showMinutes', label: 'Minutes', value: showMinutes },
                    { key: 'showSeconds', label: 'Secondes', value: showSeconds },
                ].map((toggle) => (
                    <label key={toggle.key} className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={toggle.value}
                            onChange={(e) => onUpdate({ [toggle.key]: e.target.checked })}
                            className="rounded"
                        />
                        {toggle.label}
                    </label>
                ))}
            </div>
        </div>
    );
}

import type { BlockSettingsProps } from '../block-registry';
import { SelectField, NumberInput } from '../shared/setting-controls';
import { RepeaterList } from '../shared/repeater-list';

interface TabItem {
    label: string;
    content: string;
}

export default function TabsSettings({ block, onUpdate }: BlockSettingsProps) {
    const tabs = (block.props.tabs as TabItem[]) || [];

    return (
        <div className="space-y-4">
            <SelectField
                label="Style"
                value={(block.props.style as string) || 'underline'}
                onChange={(v) => onUpdate({ style: v })}
                options={[
                    { value: 'underline', label: 'Souligne' },
                    { value: 'pills', label: 'Pilules' },
                    { value: 'boxed', label: 'Encadre' },
                ]}
            />
            <NumberInput
                label="Onglet actif par defaut"
                value={(block.props.defaultTab as number) || 0}
                onChange={(v) => onUpdate({ defaultTab: v })}
                min={0}
                max={Math.max(0, tabs.length - 1)}
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Onglets</label>
                <RepeaterList<TabItem>
                    items={tabs}
                    onUpdate={(updated) => onUpdate({ tabs: updated })}
                    createItem={() => ({ label: '', content: '' })}
                    itemLabel="Onglet"
                    addLabel="Ajouter un onglet"
                    renderItem={(tab, _index, update) => (
                        <>
                            <input type="text" value={tab.label} onChange={(e) => update('label', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Libelle" />
                            <textarea value={tab.content} onChange={(e) => update('content', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" rows={3} placeholder="Contenu" />
                        </>
                    )}
                />
            </div>
        </div>
    );
}

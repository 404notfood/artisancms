import type { BlockSettingsProps } from '../block-registry';
import { ColumnsInput, AlignmentSelect } from '../shared/setting-controls';
import { RepeaterList } from '../shared/repeater-list';

interface IconBoxItem {
    icon: string;
    title: string;
    description: string;
    link: string;
}

export default function IconBoxSettings({ block, onUpdate }: BlockSettingsProps) {
    const items = (block.props.items as IconBoxItem[]) || [];

    return (
        <div className="space-y-4">
            <ColumnsInput
                value={(block.props.columns as number) || 3}
                onChange={(v) => onUpdate({ columns: v })}
                min={2}
                max={4}
            />
            <AlignmentSelect
                value={(block.props.align as string) || 'center'}
                onChange={(v) => onUpdate({ align: v })}
                options={[
                    { value: 'center', label: 'Centre' },
                    { value: 'left', label: 'Gauche' },
                ]}
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cartes</label>
                <RepeaterList<IconBoxItem>
                    items={items}
                    onUpdate={(updated) => onUpdate({ items: updated })}
                    createItem={() => ({ icon: '', title: '', description: '', link: '' })}
                    itemLabel="Carte"
                    addLabel="Ajouter une carte"
                    renderItem={(item, _index, update) => (
                        <>
                            <input type="text" value={item.icon} onChange={(e) => update('icon', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Icone (emoji ou symbole, ex: &#9889;)" />
                            <input type="text" value={item.title} onChange={(e) => update('title', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Titre" />
                            <textarea value={item.description} onChange={(e) => update('description', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" rows={2} placeholder="Description" />
                            <input type="text" value={item.link} onChange={(e) => update('link', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Lien (optionnel)" />
                        </>
                    )}
                />
            </div>
        </div>
    );
}

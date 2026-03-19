import type { BlockSettingsProps } from '../block-registry';
import { CheckboxToggle, NumberInput } from '../shared/setting-controls';
import { RepeaterList } from '../shared/repeater-list';

interface AccordionItem {
    title: string;
    content: string;
}

export default function AccordionSettings({ block, onUpdate }: BlockSettingsProps) {
    const items = (block.props.items as AccordionItem[]) || [];

    return (
        <div className="space-y-4">
            <CheckboxToggle
                label="Autoriser l'ouverture multiple"
                checked={(block.props.allowMultiple as boolean) || false}
                onChange={(v) => onUpdate({ allowMultiple: v })}
            />
            <NumberInput
                label="Ouvert par defaut"
                value={(block.props.defaultOpen as number) ?? -1}
                onChange={(v) => onUpdate({ defaultOpen: v })}
                min={-1}
                max={items.length - 1}
                hint="-1 = aucun, 0 = premier, etc."
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Elements</label>
                <RepeaterList<AccordionItem>
                    items={items}
                    onUpdate={(updated) => onUpdate({ items: updated })}
                    createItem={() => ({ title: '', content: '' })}
                    itemLabel="Element"
                    addLabel="Ajouter un element"
                    renderItem={(item, _index, update) => (
                        <>
                            <input type="text" value={item.title} onChange={(e) => update('title', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Titre" />
                            <textarea value={item.content} onChange={(e) => update('content', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" rows={3} placeholder="Contenu" />
                        </>
                    )}
                />
            </div>
        </div>
    );
}

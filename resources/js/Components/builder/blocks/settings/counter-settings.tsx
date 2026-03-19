import type { BlockSettingsProps } from '../block-registry';
import { ColumnsInput, AlignmentSelect } from '../shared/setting-controls';
import { RepeaterList } from '../shared/repeater-list';

interface CounterItem {
    value: number;
    label: string;
    prefix: string;
    suffix: string;
}

export default function CounterSettings({ block, onUpdate }: BlockSettingsProps) {
    const items = (block.props.items as CounterItem[]) || [];

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
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compteurs</label>
                <RepeaterList<CounterItem>
                    items={items}
                    onUpdate={(updated) => onUpdate({ items: updated })}
                    createItem={() => ({ value: 0, label: '', prefix: '', suffix: '' })}
                    itemLabel="Compteur"
                    addLabel="Ajouter un compteur"
                    renderItem={(item, _index, update) => (
                        <>
                            <input type="number" value={item.value ?? 0} onChange={(e) => update('value', parseInt(e.target.value) || 0)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Valeur" />
                            <input type="text" value={item.label} onChange={(e) => update('label', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Libelle (ex: Clients)" />
                            <div className="flex gap-2">
                                <input type="text" value={item.prefix} onChange={(e) => update('prefix', e.target.value)} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Prefixe (ex: $)" />
                                <input type="text" value={item.suffix} onChange={(e) => update('suffix', e.target.value)} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Suffixe (ex: %)" />
                            </div>
                        </>
                    )}
                />
            </div>
        </div>
    );
}

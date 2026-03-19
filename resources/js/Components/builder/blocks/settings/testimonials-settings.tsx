import type { BlockSettingsProps } from '../block-registry';
import { SelectField, ColumnsInput } from '../shared/setting-controls';
import { RepeaterList } from '../shared/repeater-list';

interface Testimonial {
    name: string;
    role: string;
    company: string;
    content: string;
    avatar: string;
    rating: number;
}

export default function TestimonialsSettings({ block, onUpdate }: BlockSettingsProps) {
    const items = (block.props.items as Testimonial[]) || [];

    return (
        <div className="space-y-4">
            <SelectField
                label="Disposition"
                value={(block.props.layout as string) || 'grid'}
                onChange={(v) => onUpdate({ layout: v })}
                options={[
                    { value: 'grid', label: 'Grille' },
                    { value: 'carousel', label: 'Carrousel' },
                    { value: 'list', label: 'Liste' },
                ]}
            />
            <ColumnsInput
                value={(block.props.columns as number) || 2}
                onChange={(v) => onUpdate({ columns: v })}
                min={1}
                max={3}
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Temoignages</label>
                <RepeaterList<Testimonial>
                    items={items}
                    onUpdate={(updated) => onUpdate({ items: updated })}
                    createItem={() => ({ name: '', role: '', company: '', content: '', avatar: '', rating: 5 })}
                    itemLabel="Temoignage"
                    addLabel="Ajouter un temoignage"
                    renderItem={(item, _index, update) => (
                        <>
                            <input type="text" value={item.name} onChange={(e) => update('name', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Nom" />
                            <input type="text" value={item.role} onChange={(e) => update('role', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Fonction" />
                            <input type="text" value={item.company} onChange={(e) => update('company', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Entreprise" />
                            <textarea value={item.content} onChange={(e) => update('content', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" rows={3} placeholder="Temoignage" />
                            <input type="text" value={item.avatar} onChange={(e) => update('avatar', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="URL de l'avatar" />
                            <div>
                                <label className="text-xs text-gray-500">Note (0-5)</label>
                                <input type="number" min={0} max={5} value={item.rating || 0} onChange={(e) => update('rating', parseInt(e.target.value) || 0)} className="w-full border rounded px-3 py-1.5 text-sm" />
                            </div>
                        </>
                    )}
                />
            </div>
        </div>
    );
}

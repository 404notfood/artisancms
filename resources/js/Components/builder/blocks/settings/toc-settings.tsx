import type { BlockSettingsProps } from '../block-registry';
import { TextInput, SelectField, CheckboxToggle } from '../shared/setting-controls';

export default function TocSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <TextInput
                label="Titre du sommaire"
                value={(block.props.title as string) ?? 'Sommaire'}
                onChange={(v) => onUpdate({ title: v })}
                placeholder="Sommaire"
            />

            <CheckboxToggle
                label="Afficher le titre"
                checked={(block.props.showTitle as boolean) !== false}
                onChange={(v) => onUpdate({ showTitle: v })}
            />

            <SelectField
                label="Profondeur maximale"
                value={Number(block.props.maxDepth) || 3}
                onChange={(v) => onUpdate({ maxDepth: Number(v) })}
                options={[
                    { value: 2, label: 'H2 uniquement' },
                    { value: 3, label: 'H2 a H3' },
                    { value: 4, label: 'H2 a H4' },
                    { value: 5, label: 'H2 a H5' },
                    { value: 6, label: 'H2 a H6' },
                ]}
                hint="Niveaux de titres inclus dans le sommaire"
            />

            <SelectField
                label="Style de liste"
                value={(block.props.style as string) || 'bullet'}
                onChange={(v) => onUpdate({ style: v })}
                options={[
                    { value: 'numbered', label: 'Numerote (1, 2, 3)' },
                    { value: 'bullet', label: 'Puces' },
                    { value: 'plain', label: 'Simple (sans marqueur)' },
                ]}
            />
        </div>
    );
}

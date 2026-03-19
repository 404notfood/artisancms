import type { BlockSettingsProps } from '../block-registry';
import { TextInput, SelectField, ColorPicker } from '../shared/setting-controls';

export default function HeadingSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <TextInput
                label="Texte"
                value={(block.props.text as string) || ''}
                onChange={(v) => onUpdate({ text: v })}
            />
            <SelectField
                label="Niveau"
                value={Number(block.props.level) || 2}
                onChange={(v) => onUpdate({ level: Number(v) })}
                options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `H${n}` }))}
            />
            <SelectField
                label="Alignement"
                value={(block.props.alignment as string) || 'left'}
                onChange={(v) => onUpdate({ alignment: v })}
                options={[
                    { value: 'left', label: 'Gauche' },
                    { value: 'center', label: 'Centre' },
                    { value: 'right', label: 'Droite' },
                ]}
            />
            <ColorPicker
                label="Couleur du texte"
                value={(block.props.color as string) || ''}
                onChange={(v) => onUpdate({ color: v })}
            />
        </div>
    );
}

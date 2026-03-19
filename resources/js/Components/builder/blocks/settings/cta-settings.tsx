import type { BlockSettingsProps } from '../block-registry';
import { TextInput, SelectField, ColorPicker, AlignmentSelect } from '../shared/setting-controls';

export default function CtaSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <TextInput
                label="Titre"
                value={(block.props.title as string) || ''}
                onChange={(v) => onUpdate({ title: v })}
            />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    value={(block.props.description as string) || ''}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={3}
                />
            </div>
            <TextInput
                label="Texte du bouton"
                value={(block.props.buttonText as string) || ''}
                onChange={(v) => onUpdate({ buttonText: v })}
            />
            <TextInput
                label="URL du bouton"
                value={(block.props.buttonUrl as string) || ''}
                onChange={(v) => onUpdate({ buttonUrl: v })}
                placeholder="https://..."
            />
            <SelectField
                label="Style du bouton"
                value={(block.props.buttonVariant as string) || 'primary'}
                onChange={(v) => onUpdate({ buttonVariant: v })}
                options={[
                    { value: 'primary', label: 'Primaire (blanc)' },
                    { value: 'secondary', label: 'Secondaire (sombre)' },
                    { value: 'outline', label: 'Contour' },
                ]}
            />
            <ColorPicker
                label="Couleur de fond"
                value={(block.props.backgroundColor as string) || '#1e40af'}
                onChange={(v) => onUpdate({ backgroundColor: v })}
            />
            <ColorPicker
                label="Couleur du texte"
                value={(block.props.textColor as string) || '#ffffff'}
                onChange={(v) => onUpdate({ textColor: v })}
            />
            <AlignmentSelect
                value={(block.props.align as string) || 'center'}
                onChange={(v) => onUpdate({ align: v })}
                options={[
                    { value: 'center', label: 'Centre' },
                    { value: 'left', label: 'Gauche' },
                ]}
            />
        </div>
    );
}

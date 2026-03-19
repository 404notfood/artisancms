import type { BlockSettingsProps } from '../block-registry';
import { SelectField, NumberInput, TextInput, CheckboxToggle } from '../shared/setting-controls';
import { RepeaterList } from '../shared/repeater-list';

interface GalleryImage {
    src: string;
    alt: string;
    caption: string;
}

export default function GallerySettings({ block, onUpdate }: BlockSettingsProps) {
    const images = (block.props.images as GalleryImage[]) || [];

    return (
        <div className="space-y-4">
            <SelectField
                label="Style d'affichage"
                value={(block.props.style as string) || 'grid'}
                onChange={(v) => onUpdate({ style: v })}
                options={[
                    { value: 'grid', label: 'Grille' },
                    { value: 'masonry', label: 'Maconnerie' },
                    { value: 'carousel', label: 'Carrousel' },
                ]}
            />
            <NumberInput
                label="Colonnes"
                value={(block.props.columns as number) || 3}
                onChange={(v) => onUpdate({ columns: v })}
                min={1}
                max={6}
            />
            <TextInput
                label="Espacement"
                value={(block.props.gap as string) || '8px'}
                onChange={(v) => onUpdate({ gap: v })}
                placeholder="8px"
            />
            <CheckboxToggle
                label="Lightbox au clic"
                checked={block.props.lightbox !== false}
                onChange={(v) => onUpdate({ lightbox: v })}
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                <RepeaterList<GalleryImage>
                    items={images}
                    onUpdate={(updated) => onUpdate({ images: updated })}
                    createItem={() => ({ src: '', alt: '', caption: '' })}
                    itemLabel="Image"
                    addLabel="Ajouter une image"
                    renderItem={(image, _index, update) => (
                        <>
                            <input type="text" value={image.src} onChange={(e) => update('src', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="URL de l'image" />
                            <input type="text" value={image.alt} onChange={(e) => update('alt', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Texte alternatif" />
                            <input type="text" value={image.caption} onChange={(e) => update('caption', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Legende" />
                        </>
                    )}
                />
            </div>
        </div>
    );
}

import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Images, ChevronUp, ChevronDown, Trash2, Plus, Grid2X2, Columns3, Rows3, GalleryHorizontal, PanelsTopLeft, LayoutGrid } from 'lucide-react';
import type { SharedProps } from '@/types/cms';
import type { BlockSettingsProps } from '../block-registry';
import type { GalleryImage } from '../renderers/gallery-layouts/types';
import { SelectField, NumberInput, TextInput, CheckboxToggle } from '../shared/setting-controls';
import MediaPickerButton from './media-picker-button';
import MediaPickerDialog, { type MediaItem } from './media-picker-dialog';

const LAYOUT_OPTIONS = [
    { value: 'masonry', label: 'Mosaïque', description: 'Proportions originales', icon: Columns3 },
    { value: 'slider', label: 'Carrousel', description: 'Photo et miniatures', icon: GalleryHorizontal },
    { value: 'editorial', label: 'Reportage', description: 'Une photo à la une', icon: PanelsTopLeft },
    { value: 'justified', label: 'Justifiée', description: 'Rangées alignées', icon: Rows3 },
    { value: 'grid', label: 'Grille', description: 'Cadres réguliers', icon: Grid2X2 },
    { value: 'collage', label: 'Composition', description: 'Formats alternés', icon: LayoutGrid },
    { value: 'filmstrip', label: 'Pellicule', description: 'Défilement horizontal', icon: Images },
];

export default function GallerySettings({ block, onUpdate }: BlockSettingsProps) {
    const { cms } = usePage<SharedProps>().props;
    const images = (block.props.images as GalleryImage[]) || [];
    const [pickerOpen, setPickerOpen] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);
    const currentStyle = block.props.style === 'carousel' ? 'slider' : (block.props.style as string) || 'masonry';

    function updateImage(index: number, values: Partial<GalleryImage>) {
        onUpdate({ images: images.map((image, position) => position === index ? { ...image, ...values } : image) });
    }

    function addPhotos(media: MediaItem[]) {
        const seen = new Set(images.map((image) => image.src));
        const additions = media.filter((item) => {
            if (seen.has(item.url)) return false;
            seen.add(item.url);
            return true;
        }).map((item) => ({ src: item.url, alt: item.alt || '', caption: item.caption || '', width: item.width || undefined, height: item.height || undefined, thumbnail: item.thumbnail_url }));
        onUpdate({ images: [...images.filter((image) => image.src?.trim() || image.alt?.trim() || image.caption?.trim()), ...additions] });
        setPickerOpen(false);
    }

    function move(index: number, direction: number) {
        const updated = [...images];
        const destination = index + direction;
        [updated[index], updated[destination]] = [updated[destination], updated[index]];
        onUpdate({ images: updated });
        if (expanded === index) setExpanded(destination);
        else if (expanded === destination) setExpanded(index);
    }

    return <div className="space-y-5">
        <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Présentation</p>
            <div className="grid grid-cols-2 gap-2" aria-label="Présentations de la galerie">
                {LAYOUT_OPTIONS.map(({ value, label, description, icon: Icon }) => {
                    const selected = currentStyle === value;
                    return <button key={value} type="button" aria-pressed={selected} onClick={() => onUpdate({ style: value })} className={`flex flex-col items-start gap-1.5 rounded-lg border p-2.5 text-left transition ${selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'}`}>
                        <Icon className="h-5 w-5" /><span className="text-xs font-semibold">{label}</span><span className="text-[10px] leading-tight opacity-75">{description}</span>
                    </button>;
                })}
            </div>
        </div>
        {currentStyle === 'slider' && <SelectField label="Habillage du carrousel" value={(block.props.appearance as string) || 'theme'} onChange={(appearance) => onUpdate({ appearance })} options={[
            { value: 'theme', label: 'Automatique — couleurs du thème' },
            { value: 'light', label: 'Clair' },
            { value: 'dark', label: 'Sombre — projection photo' },
        ]} />}
        <SelectField label="Coins des photos" value={(block.props.cornerStyle as string) || 'theme'} onChange={(cornerStyle) => onUpdate({ cornerStyle })} options={[
            { value: 'theme', label: 'Selon le thème' },
            { value: 'square', label: 'Droits — éditorial' },
            { value: 'soft', label: 'Légèrement arrondis' },
            { value: 'rounded', label: 'Arrondis' },
        ]} />
        <TextInput label="Titre de la galerie (facultatif)" value={(block.props.title as string) || ''} onChange={(title) => onUpdate({ title })} placeholder="Le reportage en images" />
        {['grid', 'masonry', 'editorial', 'collage'].includes(currentStyle) && <NumberInput label="Colonnes" value={(block.props.columns as number) || 3} onChange={(columns) => onUpdate({ columns })} min={1} max={6} />}
        <TextInput label="Espacement" value={(block.props.gap as string) || '16px'} onChange={(gap) => onUpdate({ gap })} placeholder="16px" />
        <CheckboxToggle label="Afficher les légendes" checked={block.props.showCaptions !== false} onChange={(showCaptions) => onUpdate({ showCaptions })} />
        <CheckboxToggle label="Agrandir les photos au clic" checked={block.props.lightbox !== false} onChange={(lightbox) => onUpdate({ lightbox })} />
        <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">Photos</h3><span className="text-xs text-slate-400">{images.filter((image) => image.src).length} ajoutée(s)</span></div>
            <button type="button" onClick={() => setPickerOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><Images className="h-4 w-4" />Ajouter plusieurs photos</button>
            {images.length === 0 && <p className="text-xs leading-relaxed text-slate-500">Choisissez vos photos en une fois. Vous pourrez ensuite modifier leur ordre et leurs légendes.</p>}
            <div className="space-y-2">
                {images.map((image, index) => <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 p-2">
                        <button type="button" onClick={() => setExpanded(expanded === index ? null : index)} aria-expanded={expanded === index} aria-label={`Modifier la photo ${index + 1}`} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                            {image.src ? <img src={image.thumbnail || image.src} alt="" loading="lazy" className="h-11 w-14 shrink-0 rounded object-cover" /> : <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400"><Images className="h-4 w-4" /></span>}
                            <span className="min-w-0"><span className="block text-[10px] font-medium uppercase text-slate-400">Photo {index + 1}</span><span className="block truncate text-xs text-slate-700">{image.caption || image.alt || 'Modifier les informations'}</span></span>
                        </button>
                        <div className="flex shrink-0 flex-col">
                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Monter la photo ${index + 1}`} className="p-0.5 text-slate-500 hover:text-indigo-600 disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label={`Descendre la photo ${index + 1}`} className="p-0.5 text-slate-500 hover:text-indigo-600 disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
                        </div>
                        <button type="button" onClick={() => { onUpdate({ images: images.filter((_, position) => position !== index) }); setExpanded(null); }} aria-label={`Retirer la photo ${index + 1}`} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    {expanded === index && <div className="space-y-3 border-t border-slate-100 p-3">
                        <MediaPickerButton label="" value={image.src} onChange={(src, alt, media) => updateImage(index, { src, alt: alt || image.alt, caption: media?.caption || image.caption, width: media?.width || undefined, height: media?.height || undefined, thumbnail: media?.thumbnail_url })} placeholder="Choisir une photo" />
                        <TextInput label="URL directe" value={image.src} onChange={(src) => updateImage(index, { src, width: undefined, height: undefined, thumbnail: undefined })} placeholder="https://…" />
                        <TextInput label="Texte alternatif" value={image.alt || ''} onChange={(alt) => updateImage(index, { alt })} />
                        <TextInput label="Légende" value={image.caption || ''} onChange={(caption) => updateImage(index, { caption })} />
                    </div>}
                </div>)}
            </div>
            <button type="button" onClick={() => { onUpdate({ images: [...images, { src: '', alt: '', caption: '' }] }); setExpanded(images.length); }} className="flex w-full items-center justify-center gap-1 py-1 text-xs text-slate-500 hover:text-indigo-600"><Plus className="h-3 w-3" />Ajouter une URL manuellement</button>
        </div>
        {pickerOpen && <MediaPickerDialog adminPrefix={cms?.adminPrefix ?? 'admin'} multiple excludedUrls={images.map((image) => image.src)} onSelect={addPhotos} onClose={() => setPickerOpen(false)} />}
    </div>;
}

import type { BlockSettingsProps } from '../block-registry';

interface GalleryImage {
    src: string;
    alt: string;
    caption: string;
}

export default function GallerySettings({ block, onUpdate }: BlockSettingsProps) {
    const images = (block.props.images as GalleryImage[]) || [];
    const columns = (block.props.columns as number) || 3;
    const gap = (block.props.gap as string) || '8px';
    const style = (block.props.style as string) || 'grid';
    const lightbox = block.props.lightbox !== false;

    const updateImage = (index: number, field: keyof GalleryImage, value: string) => {
        const updated = [...images];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate({ images: updated });
    };

    const addImage = () => {
        onUpdate({ images: [...images, { src: '', alt: '', caption: '' }] });
    };

    const removeImage = (index: number) => {
        onUpdate({ images: images.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style d&apos;affichage</label>
                <select value={style} onChange={(e) => onUpdate({ style: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="grid">Grille</option>
                    <option value="masonry">Maonnerie</option>
                    <option value="carousel">Carrousel</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes</label>
                <input type="number" min={1} max={6} value={columns} onChange={(e) => onUpdate({ columns: parseInt(e.target.value) || 3 })} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espacement</label>
                <input type="text" value={gap} onChange={(e) => onUpdate({ gap: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="8px" />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" checked={lightbox} onChange={(e) => onUpdate({ lightbox: e.target.checked })} className="rounded" />
                <label className="text-sm text-gray-700">Lightbox au clic</label>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                {images.map((image, index) => (
                    <div key={index} className="border rounded p-3 mb-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Image {index + 1}</span>
                            <button type="button" onClick={() => removeImage(index)} className="text-red-500 text-xs hover:text-red-700">Supprimer</button>
                        </div>
                        <input type="text" value={image.src} onChange={(e) => updateImage(index, 'src', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="URL de l'image" />
                        <input type="text" value={image.alt} onChange={(e) => updateImage(index, 'alt', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Texte alternatif" />
                        <input type="text" value={image.caption} onChange={(e) => updateImage(index, 'caption', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Lgende" />
                    </div>
                ))}
                <button type="button" onClick={addImage} className="w-full border-2 border-dashed rounded px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400">
                    + Ajouter une image
                </button>
            </div>
        </div>
    );
}

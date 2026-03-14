import type { BlockSettingsProps } from '../block-registry';

export default function ProductCardSettings({ block, onUpdate }: BlockSettingsProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID du produit</label>
                <input
                    type="number"
                    value={(block.props.productId as number) || ''}
                    onChange={(e) => onUpdate({ productId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Laisser vide pour dynamique"
                />
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="showImage"
                    checked={block.props.showImage !== false}
                    onChange={(e) => onUpdate({ showImage: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="showImage" className="text-sm font-medium text-gray-700">Afficher image</label>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="showPrice"
                    checked={block.props.showPrice !== false}
                    onChange={(e) => onUpdate({ showPrice: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="showPrice" className="text-sm font-medium text-gray-700">Afficher le prix</label>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="showButton"
                    checked={block.props.showButton !== false}
                    onChange={(e) => onUpdate({ showButton: e.target.checked })}
                    className="rounded border-gray-300"
                />
                <label htmlFor="showButton" className="text-sm font-medium text-gray-700">Afficher le bouton</label>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bouton</label>
                <input
                    type="text"
                    value={(block.props.buttonText as string) || ''}
                    onChange={(e) => onUpdate({ buttonText: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Ajouter au panier"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hauteur image</label>
                <input
                    type="text"
                    value={(block.props.imageHeight as string) || ''}
                    onChange={(e) => onUpdate({ imageHeight: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="200px"
                />
            </div>
        </div>
    );
}

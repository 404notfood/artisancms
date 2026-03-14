import type { BlockRendererProps } from '../block-registry';

export default function ProductCardRenderer({ block, isEditing }: BlockRendererProps) {
    const showImage = block.props.showImage !== false;
    const showPrice = block.props.showPrice !== false;
    const showButton = block.props.showButton !== false;
    const buttonText = (block.props.buttonText as string) || 'Ajouter au panier';
    const imageHeight = (block.props.imageHeight as string) || '200px';

    const productName = isEditing ? 'Nom du produit' : (block.props._productName as string) || 'Nom du produit';
    const productPrice = isEditing ? '29.99' : (block.props._productPrice as string) || '29.99';
    const comparePrice = isEditing ? '39.99' : (block.props._comparePrice as string) || '';
    const productImage = isEditing ? '' : (block.props._productImage as string) || '';

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg group">
            {showImage && (
                <div
                    className="w-full bg-gray-100 flex items-center justify-center overflow-hidden"
                    style={{ height: imageHeight }}
                >
                    {productImage ? (
                        <img
                            src={productImage}
                            alt={productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span className="text-sm">Image produit</span>
                        </div>
                    )}
                </div>
            )}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2">{productName}</h3>
                {showPrice && (
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-blue-600">{productPrice} EUR</span>
                        {comparePrice && (
                            <span className="text-sm text-gray-400 line-through">{comparePrice} EUR</span>
                        )}
                    </div>
                )}
                {showButton && (
                    <button
                        type="button"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
                    >
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    );
}

import type { BlockRendererProps } from '../block-registry';

export default function CartWidgetRenderer({ block, isEditing }: BlockRendererProps) {
    const style = (block.props.style as string) || 'icon';
    const showCount = block.props.showCount !== false;
    const showTotal = block.props.showTotal !== false;
    const position = (block.props.position as string) || 'top-right';

    const itemCount = isEditing ? 3 : 0;
    const totalAmount = isEditing ? '89.97' : '0.00';

    const positionClasses = position === 'top-left' ? 'left-4' : 'right-4';

    const CartIcon = () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
    );

    if (style === 'icon') {
        return (
            <div className={`inline-flex items-center gap-2 ${isEditing ? '' : positionClasses}`}>
                <button type="button" className="relative p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
                    <CartIcon />
                    {showCount && itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {itemCount}
                        </span>
                    )}
                </button>
                {showTotal && itemCount > 0 && (
                    <span className="text-sm font-medium text-gray-700">{totalAmount} EUR</span>
                )}
            </div>
        );
    }

    if (style === 'dropdown' || style === 'sidebar') {
        return (
            <div className={`${style === 'sidebar' ? 'w-80' : 'w-72'} bg-white rounded-lg shadow-xl border`}>
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <CartIcon />
                        <span className="font-semibold text-gray-900">Panier</span>
                    </div>
                    {showCount && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {itemCount} articles
                        </span>
                    )}
                </div>
                {isEditing && (
                    <div className="p-4 space-y-3">
                        {[
                            { name: 'Produit A', price: '29.99', qty: 1 },
                            { name: 'Produit B', price: '19.99', qty: 1 },
                            { name: 'Produit C', price: '39.99', qty: 1 },
                        ].map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    <p className="text-gray-500">Qty: {item.qty}</p>
                                </div>
                                <span className="font-medium">{item.price} EUR</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="border-t p-4">
                    {showTotal && (
                        <div className="flex justify-between mb-3 font-semibold text-gray-900">
                            <span>Total</span>
                            <span>{totalAmount} EUR</span>
                        </div>
                    )}
                    <button type="button" className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">
                        Commander
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

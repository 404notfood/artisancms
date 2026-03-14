import type { BlockRendererProps } from '../block-registry';

export default function CheckoutFormRenderer({ block, isEditing }: BlockRendererProps) {
    const showOrderSummary = block.props.showOrderSummary !== false;
    const requireAccount = block.props.requireAccount === true;

    if (!isEditing) {
        return (
            <div className="text-center py-12 text-gray-400">
                Formulaire de commande (rendu dynamique)
            </div>
        );
    }

    return (
        <div className="bg-gray-50 rounded-lg p-6">
            {/* Steps indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {['Livraison', 'Paiement', 'Confirmation'].map((step, index) => (
                    <div key={step} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {index + 1}
                        </div>
                        <span className={`text-sm font-medium ${index === 0 ? 'text-blue-600' : 'text-gray-400'}`}>{step}</span>
                        {index < 2 && <div className="w-8 h-px bg-gray-300" />}
                    </div>
                ))}
            </div>

            <div className={`grid ${showOrderSummary ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {/* Shipping form */}
                <div className={`${showOrderSummary ? 'lg:col-span-2' : ''} bg-white rounded-lg p-6 shadow-sm`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse de livraison</h3>

                    {requireAccount && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                            Un compte est requis pour passer commande
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Prenom</label>
                            <div className="h-10 bg-gray-100 rounded border" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Nom</label>
                            <div className="h-10 bg-gray-100 rounded border" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">Email</label>
                            <div className="h-10 bg-gray-100 rounded border" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">Adresse</label>
                            <div className="h-10 bg-gray-100 rounded border" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Ville</label>
                            <div className="h-10 bg-gray-100 rounded border" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Code postal</label>
                            <div className="h-10 bg-gray-100 rounded border" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Pays</label>
                            <div className="h-10 bg-gray-100 rounded border" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Telephone</label>
                            <div className="h-10 bg-gray-100 rounded border" />
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                        <h4 className="text-base font-semibold text-gray-900 mb-3">Paiement</h4>
                        <div className="p-4 bg-gray-50 rounded-md border border-dashed border-gray-300 text-center text-sm text-gray-500">
                            Zone de paiement (Stripe / PayPal)
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button type="button" className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors">
                            Valider la commande
                        </button>
                    </div>
                </div>

                {/* Order summary */}
                {showOrderSummary && (
                    <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Votre commande</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Produit A', qty: 1, price: '29.99' },
                                { name: 'Produit B', qty: 2, price: '39.98' },
                            ].map((item) => (
                                <div key={item.name} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{item.name} x{item.qty}</span>
                                    <span className="font-medium">{item.price} EUR</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t mt-4 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Sous-total</span>
                                <span>69.97 EUR</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Livraison</span>
                                <span>4.99 EUR</span>
                            </div>
                            <div className="flex justify-between font-semibold text-base pt-2 border-t">
                                <span>Total</span>
                                <span>74.96 EUR</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import type { ProductFormSectionProps } from './types';

export default function ProductPricingSection({ data, setData, errors }: ProductFormSectionProps) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Prix</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Prix
                    </label>
                    <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                            &euro;
                        </span>
                        <input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.price}
                            onChange={(e) => setData('price', parseFloat(e.target.value) || 0)}
                            className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>

                <div>
                    <label htmlFor="compare_price" className="block text-sm font-medium text-gray-700">
                        Prix compare (barre)
                    </label>
                    <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                            &euro;
                        </span>
                        <input
                            id="compare_price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.compare_price}
                            onChange={(e) => setData('compare_price', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Optionnel"
                        />
                    </div>
                    {errors.compare_price && <p className="mt-1 text-sm text-red-600">{errors.compare_price}</p>}
                </div>
            </div>
        </div>
    );
}

import type { useForm } from '@inertiajs/react';

interface TaxCreateFormProps {
    form: ReturnType<typeof useForm<{
        name: string;
        country_code: string;
        region: string;
        rate: number;
        priority: number;
        compound: boolean;
        active: boolean;
    }>>;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export default function TaxCreateForm({ form, onSubmit, onCancel }: TaxCreateFormProps) {
    return (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Nouvelle regle de taxe</h2>
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label htmlFor="create-name" className="block text-sm font-medium text-gray-700">
                            Nom
                        </label>
                        <input
                            id="create-name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Ex: TVA France"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="create-country" className="block text-sm font-medium text-gray-700">
                            Code pays
                        </label>
                        <input
                            id="create-country"
                            type="text"
                            maxLength={2}
                            value={form.data.country_code}
                            onChange={(e) => form.setData('country_code', e.target.value.toUpperCase())}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="FR (vide = defaut)"
                        />
                    </div>

                    <div>
                        <label htmlFor="create-region" className="block text-sm font-medium text-gray-700">
                            Region
                        </label>
                        <input
                            id="create-region"
                            type="text"
                            value={form.data.region}
                            onChange={(e) => form.setData('region', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Optionnel"
                        />
                    </div>

                    <div>
                        <label htmlFor="create-rate" className="block text-sm font-medium text-gray-700">
                            Taux (%)
                        </label>
                        <input
                            id="create-rate"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={form.data.rate}
                            onChange={(e) => form.setData('rate', parseFloat(e.target.value) || 0)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="create-priority" className="block text-sm font-medium text-gray-700">
                            Priorite
                        </label>
                        <input
                            id="create-priority"
                            type="number"
                            min="0"
                            value={form.data.priority}
                            onChange={(e) => form.setData('priority', parseInt(e.target.value) || 0)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-end gap-4 pb-1">
                        <div className="flex items-center gap-2">
                            <input
                                id="create-compound"
                                type="checkbox"
                                checked={form.data.compound}
                                onChange={(e) => form.setData('compound', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="create-compound" className="text-sm text-gray-700">
                                Compose
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="create-active"
                                type="checkbox"
                                checked={form.data.active}
                                onChange={(e) => form.setData('active', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="create-active" className="text-sm text-gray-700">
                                Active
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {form.processing ? 'Ajout...' : 'Ajouter'}
                    </button>
                </div>
            </form>
        </div>
    );
}

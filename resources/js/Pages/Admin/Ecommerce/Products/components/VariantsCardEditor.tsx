import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { VariantFormData } from './types';
import NewVariantForm from './NewVariantForm';

interface VariantsCardEditorProps {
    variants: VariantFormData[];
    onChange: (variants: VariantFormData[]) => void;
}

export default function VariantsCardEditor({ variants, onChange }: VariantsCardEditorProps) {
    const [showVariantForm, setShowVariantForm] = useState(false);

    function addVariant(variant: VariantFormData) {
        onChange([...variants, variant]);
        setShowVariantForm(false);
    }

    function removeVariant(index: number) {
        onChange(variants.filter((_, i) => i !== index));
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Variantes</h2>
                <button
                    type="button"
                    onClick={() => setShowVariantForm(true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter
                </button>
            </div>

            {variants.length > 0 && (
                <div className="space-y-3">
                    {variants.map((variant, index) => (
                        <div key={index} className="rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-gray-900">{variant.name}</p>
                                <button
                                    type="button"
                                    onClick={() => removeVariant(index)}
                                    className="text-gray-400 hover:text-red-600"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm text-gray-600">
                                <div>
                                    <span className="text-gray-400">SKU:</span> {variant.sku || '---'}
                                </div>
                                <div>
                                    <span className="text-gray-400">Prix:</span> {variant.price} &euro;
                                </div>
                                <div>
                                    <span className="text-gray-400">Stock:</span> {variant.stock}
                                </div>
                            </div>
                            {Object.keys(variant.attributes).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {Object.entries(variant.attributes).map(([key, value]) => (
                                        <span
                                            key={key}
                                            className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                        >
                                            {key}: {value}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showVariantForm && (
                <NewVariantForm
                    onAdd={addVariant}
                    onCancel={() => setShowVariantForm(false)}
                />
            )}

            {variants.length === 0 && !showVariantForm && (
                <p className="text-sm text-gray-500">Aucune variante. Cliquez sur Ajouter pour en creer une.</p>
            )}
        </div>
    );
}

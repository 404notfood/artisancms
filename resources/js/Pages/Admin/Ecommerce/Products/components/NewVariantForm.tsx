import { useState } from 'react';
import { X } from 'lucide-react';
import type { VariantFormData } from './types';

interface NewVariantFormProps {
    onAdd: (variant: VariantFormData) => void;
    onCancel: () => void;
}

export default function NewVariantForm({ onAdd, onCancel }: NewVariantFormProps) {
    const [newVariant, setNewVariant] = useState<VariantFormData>({
        name: '',
        sku: '',
        price: 0,
        stock: 0,
        attributes: {},
    });
    const [newAttrKey, setNewAttrKey] = useState('');
    const [newAttrValue, setNewAttrValue] = useState('');

    function addVariantAttribute() {
        if (!newAttrKey.trim()) return;
        setNewVariant({
            ...newVariant,
            attributes: { ...newVariant.attributes, [newAttrKey.trim()]: newAttrValue.trim() },
        });
        setNewAttrKey('');
        setNewAttrValue('');
    }

    function removeVariantAttribute(key: string) {
        const updated = { ...newVariant.attributes };
        delete updated[key];
        setNewVariant({ ...newVariant, attributes: updated });
    }

    function handleAdd() {
        if (!newVariant.name) return;
        onAdd({ ...newVariant });
    }

    return (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Nouvelle variante</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <input
                    type="text"
                    value={newVariant.name}
                    onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                    placeholder="Nom"
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                    type="text"
                    value={newVariant.sku}
                    onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                    placeholder="SKU"
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                    placeholder="Prix"
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                    type="number"
                    min="0"
                    value={newVariant.stock}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                    placeholder="Stock"
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* Attributes */}
            <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Attributs</p>
                {Object.keys(newVariant.attributes).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(newVariant.attributes).map(([key, value]) => (
                            <span
                                key={key}
                                className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                            >
                                {key}: {value}
                                <button
                                    type="button"
                                    onClick={() => removeVariantAttribute(key)}
                                    className="text-indigo-400 hover:text-indigo-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newAttrKey}
                        onChange={(e) => setNewAttrKey(e.target.value)}
                        placeholder="Cle (ex: Taille)"
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                        type="text"
                        value={newAttrValue}
                        onChange={(e) => setNewAttrValue(e.target.value)}
                        placeholder="Valeur (ex: XL)"
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={addVariantAttribute}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleAdd}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                    Ajouter la variante
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Annuler
                </button>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { VariantFormData } from './types';
import NewVariantForm from './NewVariantForm';

interface VariantsTableEditorProps {
    variants: VariantFormData[];
    onChange: (variants: VariantFormData[]) => void;
}

export default function VariantsTableEditor({ variants, onChange }: VariantsTableEditorProps) {
    const [showVariantForm, setShowVariantForm] = useState(false);
    const [editAttrKey, setEditAttrKey] = useState('');
    const [editAttrValue, setEditAttrValue] = useState('');
    const [editAttrIndex, setEditAttrIndex] = useState<number | null>(null);

    function addVariant(variant: VariantFormData) {
        onChange([...variants, variant]);
        setShowVariantForm(false);
    }

    function removeVariant(index: number) {
        onChange(variants.filter((_, i) => i !== index));
    }

    function updateVariantField(index: number, field: keyof VariantFormData, value: string | number) {
        const updated = [...variants];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    }

    function addExistingVariantAttribute(index: number) {
        if (!editAttrKey.trim()) return;
        const updated = [...variants];
        updated[index] = {
            ...updated[index],
            attributes: { ...updated[index].attributes, [editAttrKey.trim()]: editAttrValue.trim() },
        };
        onChange(updated);
        setEditAttrKey('');
        setEditAttrValue('');
        setEditAttrIndex(null);
    }

    function removeExistingVariantAttribute(variantIndex: number, key: string) {
        const updated = [...variants];
        const attrs = { ...updated[variantIndex].attributes };
        delete attrs[key];
        updated[variantIndex] = { ...updated[variantIndex], attributes: attrs };
        onChange(updated);
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 font-medium text-gray-700">Nom</th>
                                <th className="px-3 py-2 font-medium text-gray-700">SKU</th>
                                <th className="px-3 py-2 font-medium text-gray-700">Prix</th>
                                <th className="px-3 py-2 font-medium text-gray-700">Stock</th>
                                <th className="px-3 py-2 font-medium text-gray-700">Attributs</th>
                                <th className="px-3 py-2 font-medium text-gray-700"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {variants.map((variant, index) => (
                                <tr key={variant.id ?? `new-${index}`}>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={variant.name}
                                            onChange={(e) => updateVariantField(index, 'name', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={variant.sku}
                                            onChange={(e) => updateVariantField(index, 'sku', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={variant.price}
                                            onChange={(e) => updateVariantField(index, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={variant.stock}
                                            onChange={(e) => updateVariantField(index, 'stock', parseInt(e.target.value) || 0)}
                                            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <VariantAttributeCell
                                            variant={variant}
                                            index={index}
                                            editAttrIndex={editAttrIndex}
                                            editAttrKey={editAttrKey}
                                            editAttrValue={editAttrValue}
                                            onEditAttrKey={setEditAttrKey}
                                            onEditAttrValue={setEditAttrValue}
                                            onSetEditAttrIndex={setEditAttrIndex}
                                            onAddAttribute={addExistingVariantAttribute}
                                            onRemoveAttribute={removeExistingVariantAttribute}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(index)}
                                            className="text-gray-400 hover:text-red-600"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

// Sub-component for the attribute cell in the table
interface VariantAttributeCellProps {
    variant: VariantFormData;
    index: number;
    editAttrIndex: number | null;
    editAttrKey: string;
    editAttrValue: string;
    onEditAttrKey: (value: string) => void;
    onEditAttrValue: (value: string) => void;
    onSetEditAttrIndex: (index: number | null) => void;
    onAddAttribute: (index: number) => void;
    onRemoveAttribute: (variantIndex: number, key: string) => void;
}

function VariantAttributeCell({
    variant,
    index,
    editAttrIndex,
    editAttrKey,
    editAttrValue,
    onEditAttrKey,
    onEditAttrValue,
    onSetEditAttrIndex,
    onAddAttribute,
    onRemoveAttribute,
}: VariantAttributeCellProps) {
    return (
        <div className="flex flex-wrap gap-1">
            {variant.attributes && Object.entries(variant.attributes).map(([key, value]) => (
                <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                >
                    {key}: {value}
                    <button
                        type="button"
                        onClick={() => onRemoveAttribute(index, key)}
                        className="text-gray-400 hover:text-red-600"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}
            {editAttrIndex === index ? (
                <div className="flex items-center gap-1 mt-1">
                    <input
                        type="text"
                        value={editAttrKey}
                        onChange={(e) => onEditAttrKey(e.target.value)}
                        placeholder="Cle"
                        className="w-16 rounded border border-gray-300 px-1 py-0.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                        type="text"
                        value={editAttrValue}
                        onChange={(e) => onEditAttrValue(e.target.value)}
                        placeholder="Valeur"
                        className="w-16 rounded border border-gray-300 px-1 py-0.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => onAddAttribute(index)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                    >
                        OK
                    </button>
                    <button
                        type="button"
                        onClick={() => onSetEditAttrIndex(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => onSetEditAttrIndex(index)}
                    className="inline-flex items-center rounded border border-dashed border-gray-300 px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-400"
                >
                    + attr
                </button>
            )}
        </div>
    );
}

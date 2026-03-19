import { Pencil, Trash2 } from 'lucide-react';
import type { useForm } from '@inertiajs/react';

export interface TaxRuleData {
    id: number;
    name: string;
    country_code: string | null;
    region: string | null;
    rate: number;
    priority: number;
    compound: boolean;
    active: boolean;
}

interface TaxRuleRowProps {
    rule: TaxRuleData;
    isEditing: boolean;
    editForm: ReturnType<typeof useForm<{
        name: string;
        country_code: string;
        region: string;
        rate: number;
        priority: number;
        compound: boolean;
        active: boolean;
    }>>;
    onEdit: () => void;
    onUpdate: (e: React.FormEvent) => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
    onToggleCompound: () => void;
}

export default function TaxRuleRow({
    rule,
    isEditing,
    editForm,
    onEdit,
    onUpdate,
    onCancelEdit,
    onDelete,
    onToggleActive,
    onToggleCompound,
}: TaxRuleRowProps) {
    if (isEditing) {
        return (
            <tr className="bg-indigo-50">
                <td colSpan={8} className="p-4">
                    <form onSubmit={onUpdate} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                            <input
                                type="text"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Nom"
                                required
                            />
                            <input
                                type="text"
                                maxLength={2}
                                value={editForm.data.country_code}
                                onChange={(e) => editForm.setData('country_code', e.target.value.toUpperCase())}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Pays"
                            />
                            <input
                                type="text"
                                value={editForm.data.region}
                                onChange={(e) => editForm.setData('region', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Region"
                            />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={editForm.data.rate}
                                onChange={(e) => editForm.setData('rate', parseFloat(e.target.value) || 0)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Taux %"
                                required
                            />
                            <input
                                type="number"
                                min="0"
                                value={editForm.data.priority}
                                onChange={(e) => editForm.setData('priority', parseInt(e.target.value) || 0)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Priorite"
                            />
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={editForm.data.compound}
                                        onChange={(e) => editForm.setData('compound', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                    />
                                    Comp.
                                </label>
                                <label className="flex items-center gap-1 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={editForm.data.active}
                                        onChange={(e) => editForm.setData('active', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                    />
                                    Actif
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                Enregistrer
                            </button>
                            <button
                                type="button"
                                onClick={onCancelEdit}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
            <td className="px-4 py-3 text-gray-600">
                {rule.country_code ? (
                    <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                        {rule.country_code}
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs">Defaut</span>
                )}
            </td>
            <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                {rule.region || '---'}
            </td>
            <td className="px-4 py-3 font-medium text-gray-900">
                {rule.rate}%
            </td>
            <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                {rule.priority}
            </td>
            <td className="hidden px-4 py-3 lg:table-cell">
                <button
                    onClick={onToggleCompound}
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                        rule.compound
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    {rule.compound ? 'Oui' : 'Non'}
                </button>
            </td>
            <td className="px-4 py-3">
                <button
                    onClick={onToggleActive}
                    className="transition-colors"
                >
                    {rule.active ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200">
                            Actif
                        </span>
                    ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200">
                            Inactif
                        </span>
                    )}
                </button>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="text-gray-500 hover:text-indigo-600"
                        title="Modifier"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-gray-500 hover:text-red-600"
                        title="Supprimer"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

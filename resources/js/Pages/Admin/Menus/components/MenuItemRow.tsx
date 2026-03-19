import type { MenuItemData } from '@/types/cms';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

function TypeBadge({ type }: { type: string }) {
    const labels: Record<string, string> = {
        page: 'Page',
        post: 'Article',
        url: 'URL',
        custom: 'Custom',
        taxonomy: 'Taxonomie',
    };
    return (
        <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
            {labels[type] ?? type}
        </span>
    );
}

interface MenuItemRowProps {
    item: MenuItemData;
    index: number;
    total: number;
    isEditing: boolean;
    onToggleEdit: () => void;
    onUpdate: (item: MenuItemData, updates: Partial<MenuItemData>) => void;
    onDelete: () => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
}

export default function MenuItemRow({ item, index, total, isEditing, onToggleEdit, onUpdate, onDelete, onMove }: MenuItemRowProps) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => onMove(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronUp className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => onMove(index, 'down')} disabled={index === total - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronDown className="h-3 w-3" />
                </button>
            </div>

            {/* Item content */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <input type="text" defaultValue={item.label} onBlur={(e) => onUpdate(item, { label: e.target.value })} className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Label" />
                            <input type="text" defaultValue={item.url ?? ''} onBlur={(e) => onUpdate(item, { url: e.target.value })} className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none" placeholder="URL" />
                            <select defaultValue={item.target} onChange={(e) => onUpdate(item, { target: e.target.value })} className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none">
                                <option value="_self">Meme fenetre</option>
                                <option value="_blank">Nouvelle fenetre</option>
                            </select>
                        </div>

                        {/* Mega menu fields */}
                        <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mega menu</p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" defaultChecked={item.is_mega ?? false} onChange={(e) => onUpdate(item, { is_mega: e.target.checked } as Partial<MenuItemData>)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    Activer
                                </label>
                                <div>
                                    <label className="block text-xs text-gray-500">Colonnes</label>
                                    <input type="number" min="1" max="6" defaultValue={item.mega_columns ?? 3} onBlur={(e) => onUpdate(item, { mega_columns: parseInt(e.target.value, 10) || 3 } as Partial<MenuItemData>)} className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Badge</label>
                                    <input type="text" defaultValue={item.badge_text ?? ''} onBlur={(e) => onUpdate(item, { badge_text: e.target.value || null } as Partial<MenuItemData>)} className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none" placeholder="Ex: Nouveau" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Couleur badge</label>
                                    <input type="color" defaultValue={item.badge_color ?? '#6366f1'} onBlur={(e) => onUpdate(item, { badge_color: e.target.value } as Partial<MenuItemData>)} className="mt-0.5 h-8 w-full rounded border border-gray-300 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            {item.is_mega && (
                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">Mega</span>
                            )}
                            {item.badge_text && (
                                <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: item.badge_color ?? '#6366f1' }}>
                                    {item.badge_text}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            <TypeBadge type={item.type} /> {item.url ?? ''}
                            {item.target === '_blank' && ' (nouvelle fenetre)'}
                            {item.is_mega && ` | ${item.mega_columns ?? 3} colonnes`}
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button type="button" onClick={onToggleEdit} className="text-gray-400 hover:text-indigo-600" title="Modifier">
                    <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={onDelete} className="text-gray-400 hover:text-red-600" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

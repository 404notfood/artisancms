import { useState } from 'react';
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

const inputCls = 'rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none';

export default function MenuItemRow({ item, index, total, isEditing, onToggleEdit, onUpdate, onDelete, onMove }: MenuItemRowProps) {
    const [isMegaLocal, setIsMegaLocal] = useState(item.is_mega ?? false);

    return (
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
            {/* Reorder */}
            <div className="flex flex-col gap-0.5 pt-1">
                <button type="button" onClick={() => onMove(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronUp className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => onMove(index, 'down')} disabled={index === total - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronDown className="h-3 w-3" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <EditForm item={item} isMegaLocal={isMegaLocal} setIsMegaLocal={setIsMegaLocal} onUpdate={onUpdate} />
                ) : (
                    <ReadOnlyView item={item} />
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 pt-1">
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

/* ---------- Edit form ---------- */

function EditForm({ item, isMegaLocal, setIsMegaLocal, onUpdate }: {
    item: MenuItemData;
    isMegaLocal: boolean;
    setIsMegaLocal: (v: boolean) => void;
    onUpdate: (item: MenuItemData, updates: Partial<MenuItemData>) => void;
}) {
    function update(updates: Partial<MenuItemData>) {
        onUpdate(item, updates);
    }

    return (
        <div className="space-y-3">
            {/* Basic fields */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input type="text" defaultValue={item.label} onBlur={(e) => update({ label: e.target.value })} className={inputCls} placeholder="Label" />
                <input type="text" defaultValue={item.url ?? ''} onBlur={(e) => update({ url: e.target.value })} className={inputCls} placeholder="URL" />
                <select defaultValue={item.target} onChange={(e) => update({ target: e.target.value })} className={inputCls}>
                    <option value="_self">Meme fenetre</option>
                    <option value="_blank">Nouvelle fenetre</option>
                </select>
            </div>

            {/* Mega menu section */}
            <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mega menu</p>

                {/* Row 1: toggle + columns + badge */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={isMegaLocal}
                            onChange={(e) => {
                                setIsMegaLocal(e.target.checked);
                                update({ is_mega: e.target.checked } as Partial<MenuItemData>);
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Activer
                    </label>
                    <div>
                        <label className="block text-xs text-gray-500">Colonnes (2-5)</label>
                        <input
                            type="number"
                            min={2}
                            max={5}
                            defaultValue={item.mega_columns ?? 3}
                            onBlur={(e) => {
                                const v = Math.min(5, Math.max(2, parseInt(e.target.value, 10) || 3));
                                update({ mega_columns: v } as Partial<MenuItemData>);
                            }}
                            disabled={!isMegaLocal}
                            className={`mt-0.5 w-full ${inputCls} disabled:opacity-50`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Badge</label>
                        <input type="text" defaultValue={item.badge_text ?? ''} onBlur={(e) => update({ badge_text: e.target.value || null } as Partial<MenuItemData>)} className={`mt-0.5 w-full ${inputCls}`} placeholder="Ex: Nouveau" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">Couleur badge</label>
                        <input type="color" defaultValue={item.badge_color ?? '#6366f1'} onBlur={(e) => update({ badge_color: e.target.value } as Partial<MenuItemData>)} className="mt-0.5 h-8 w-full rounded border border-gray-300 cursor-pointer" />
                    </div>
                </div>

                {/* Row 2: mega-only fields, shown when is_mega */}
                {isMegaLocal && (
                    <div className="space-y-2 border-t border-gray-200 pt-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs text-gray-500">Largeur du mega menu</label>
                                <select
                                    defaultValue={item.mega_width ?? 'auto'}
                                    onChange={(e) => update({ mega_width: e.target.value as MenuItemData['mega_width'] } as Partial<MenuItemData>)}
                                    className={`mt-0.5 w-full ${inputCls}`}
                                >
                                    <option value="auto">Auto (max-w-4xl)</option>
                                    <option value="full">Pleine largeur</option>
                                    <option value="fixed">Fixe (900px)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">Image (URL)</label>
                                <input
                                    type="text"
                                    defaultValue={item.mega_image ?? ''}
                                    onBlur={(e) => update({ mega_image: e.target.value || null } as Partial<MenuItemData>)}
                                    className={`mt-0.5 w-full ${inputCls}`}
                                    placeholder="https://... ou /media/image.jpg"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">HTML personnalise</label>
                            <textarea
                                defaultValue={item.mega_html ?? ''}
                                onBlur={(e) => update({ mega_html: e.target.value || null } as Partial<MenuItemData>)}
                                className={`mt-0.5 w-full ${inputCls} min-h-[60px]`}
                                rows={3}
                                placeholder="<p>Contenu HTML personnalise dans le mega menu</p>"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------- Read-only view ---------- */

function ReadOnlyView({ item }: { item: MenuItemData }) {
    const megaDetails: string[] = [];
    if (item.is_mega) {
        megaDetails.push(`${item.mega_columns ?? 3} col.`);
        if (item.mega_width && item.mega_width !== 'auto') {
            megaDetails.push(item.mega_width === 'full' ? 'pleine larg.' : 'fixe');
        }
        if (item.mega_image) megaDetails.push('image');
        if (item.mega_html) megaDetails.push('HTML');
    }

    return (
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
                {item.is_mega && megaDetails.length > 0 && ` | ${megaDetails.join(', ')}`}
            </p>
        </div>
    );
}

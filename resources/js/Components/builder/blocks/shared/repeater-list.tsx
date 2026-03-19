/**
 * Generic repeater list component for block settings.
 *
 * This pattern was duplicated across 12+ settings files:
 *   accordion, tabs, testimonials, icon-box, counter, progress-bar,
 *   timeline, logo-grid, gallery, list, pricing-table, team-members.
 *
 * Each file had its own copy of: header with index + remove button,
 * add button at the bottom, and an expandable card pattern.
 */
import { useState } from 'react';

// ─── Simple repeater (always expanded) ───────────────────────────────────────

interface RepeaterListProps<T> {
    items: T[];
    onUpdate: (items: T[]) => void;
    /** Creates a new blank item */
    createItem: () => T;
    /** Renders one item's fields */
    renderItem: (item: T, index: number, update: (field: string, value: unknown) => void) => React.ReactNode;
    /** Label for the "add" button, e.g. "Ajouter un element" */
    addLabel: string;
    /** Label for each item card header, e.g. "Element" produces "Element 1", "Element 2"... */
    itemLabel: string;
}

export function RepeaterList<T>({
    items,
    onUpdate,
    createItem,
    renderItem,
    addLabel,
    itemLabel,
}: RepeaterListProps<T>) {
    const updateItem = (index: number, field: string, value: unknown) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate(updated);
    };

    const addItem = () => {
        onUpdate([...items, createItem()]);
    };

    const removeItem = (index: number) => {
        onUpdate(items.filter((_, i) => i !== index));
    };

    return (
        <div>
            {items.map((item, index) => (
                <div key={index} className="border rounded p-3 mb-2 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500">
                            {itemLabel} {index + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 text-xs hover:text-red-700"
                        >
                            Supprimer
                        </button>
                    </div>
                    {renderItem(item, index, (field, value) => updateItem(index, field, value))}
                </div>
            ))}
            <button
                type="button"
                onClick={addItem}
                className="w-full border-2 border-dashed rounded px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400"
            >
                + {addLabel}
            </button>
        </div>
    );
}

// ─── Collapsible repeater (team-members / timeline style) ────────────────────

interface CollapsibleRepeaterProps<T> {
    items: T[];
    onUpdate: (items: T[]) => void;
    createItem: () => T;
    renderItem: (item: T, index: number, update: (field: string, value: unknown) => void) => React.ReactNode;
    addLabel: string;
    /** Function to get the header text for a collapsed item */
    getItemTitle: (item: T, index: number) => string;
}

export function CollapsibleRepeater<T>({
    items,
    onUpdate,
    createItem,
    renderItem,
    addLabel,
    getItemTitle,
}: CollapsibleRepeaterProps<T>) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const updateItem = (index: number, field: string, value: unknown) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onUpdate(updated);
    };

    const addItem = () => {
        onUpdate([...items, createItem()]);
        setExpandedIndex(items.length);
    };

    const removeItem = (index: number) => {
        onUpdate(items.filter((_, i) => i !== index));
        setExpandedIndex(null);
    };

    return (
        <div>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="border rounded bg-gray-50">
                        <button
                            type="button"
                            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                            className="w-full px-3 py-2 text-sm text-left flex justify-between items-center"
                        >
                            <span>{getItemTitle(item, i)}</span>
                            <span className="text-gray-400">{expandedIndex === i ? '\u25B2' : '\u25BC'}</span>
                        </button>
                        {expandedIndex === i && (
                            <div className="px-3 pb-3 space-y-2">
                                {renderItem(item, i, (field, value) => updateItem(i, field, value))}
                                <button
                                    type="button"
                                    onClick={() => removeItem(i)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                >
                                    Supprimer
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={addItem}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
                + {addLabel}
            </button>
        </div>
    );
}

import { useState } from 'react';
import type { BlockSettingsProps } from '../block-registry';

interface TimelineEvent {
    date: string;
    title: string;
    content: string;
    icon?: string;
}

export default function TimelineSettings({ block, onUpdate }: BlockSettingsProps) {
    const events = (block.props.events as TimelineEvent[]) || [];
    const style = (block.props.style as string) || 'left';
    const lineColor = (block.props.lineColor as string) || '#3b82f6';

    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const updateEvent = (index: number, field: keyof TimelineEvent, value: string) => {
        const newEvents = [...events];
        newEvents[index] = { ...newEvents[index], [field]: value };
        onUpdate({ events: newEvents });
    };

    const addEvent = () => {
        onUpdate({ events: [...events, { date: '', title: '', content: '' }] });
        setExpandedIndex(events.length);
    };

    const removeEvent = (index: number) => {
        onUpdate({ events: events.filter((_, i) => i !== index) });
        setExpandedIndex(null);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                    value={style}
                    onChange={(e) => onUpdate({ style: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                >
                    <option value="left">Gauche</option>
                    <option value="alternating">Alternée</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur de la ligne</label>
                <input
                    type="color"
                    value={lineColor}
                    onChange={(e) => onUpdate({ lineColor: e.target.value })}
                    className="w-full h-8 border rounded cursor-pointer"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Événements</label>
                <div className="space-y-2">
                    {events.map((event, i) => (
                        <div key={i} className="border rounded bg-gray-50">
                            <button
                                type="button"
                                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                                className="w-full px-3 py-2 text-sm text-left flex justify-between items-center"
                            >
                                <span>{event.title || `Événement ${i + 1}`}</span>
                                <span className="text-gray-400">{expandedIndex === i ? '\u25B2' : '\u25BC'}</span>
                            </button>
                            {expandedIndex === i && (
                                <div className="px-3 pb-3 space-y-2">
                                    <input
                                        type="text"
                                        value={event.date}
                                        onChange={(e) => updateEvent(i, 'date', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        placeholder="Date (ex: Janvier 2025)"
                                    />
                                    <input
                                        type="text"
                                        value={event.title}
                                        onChange={(e) => updateEvent(i, 'title', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        placeholder="Titre"
                                    />
                                    <textarea
                                        value={event.content}
                                        onChange={(e) => updateEvent(i, 'content', e.target.value)}
                                        className="w-full border rounded px-3 py-1.5 text-sm"
                                        rows={3}
                                        placeholder="Description"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeEvent(i)}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        Supprimer cet événement
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addEvent}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                    + Ajouter un événement
                </button>
            </div>
        </div>
    );
}

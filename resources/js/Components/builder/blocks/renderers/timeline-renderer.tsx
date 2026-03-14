import type { BlockRendererProps } from '../block-registry';

interface TimelineEvent {
    date: string;
    title: string;
    content: string;
    icon?: string;
}

export default function TimelineRenderer({ block }: BlockRendererProps) {
    const events = (block.props.events as TimelineEvent[]) || [];
    const style = (block.props.style as string) || 'left';
    const lineColor = (block.props.lineColor as string) || '#3b82f6';

    if (events.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Aucun événement ajouté</p>
                <p className="text-xs mt-1">Ajoutez des événements dans les paramètres du bloc</p>
            </div>
        );
    }

    if (style === 'alternating') {
        return (
            <div className="relative py-4">
                {/* Vertical line */}
                <div
                    className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
                    style={{ backgroundColor: lineColor }}
                />
                <div className="space-y-8">
                    {events.map((event, i) => {
                        const isLeft = i % 2 === 0;
                        return (
                            <div key={i} className="relative flex items-start">
                                {/* Dot */}
                                <div
                                    className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white z-10"
                                    style={{ backgroundColor: lineColor }}
                                />
                                {/* Content */}
                                <div className={`w-1/2 ${isLeft ? 'pr-8 text-right' : 'pl-8 ml-auto'}`}>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        {event.date}
                                    </span>
                                    <h4 className="font-semibold text-gray-800 mt-1">{event.title}</h4>
                                    {event.content && (
                                        <p className="text-sm text-gray-600 mt-1">{event.content}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // left style (default)
    return (
        <div className="relative py-4 pl-8">
            {/* Vertical line */}
            <div
                className="absolute left-3 top-0 bottom-0 w-0.5"
                style={{ backgroundColor: lineColor }}
            />
            <div className="space-y-8">
                {events.map((event, i) => (
                    <div key={i} className="relative">
                        {/* Dot */}
                        <div
                            className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2 border-white z-10"
                            style={{ backgroundColor: lineColor }}
                        />
                        <div>
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                {event.date}
                            </span>
                            <h4 className="font-semibold text-gray-800 mt-1">{event.title}</h4>
                            {event.content && (
                                <p className="text-sm text-gray-600 mt-1">{event.content}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

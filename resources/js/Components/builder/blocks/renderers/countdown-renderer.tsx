import { useState, useEffect } from 'react';
import type { BlockRendererProps } from '../block-registry';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    };
}

export default function CountdownRenderer({ block }: BlockRendererProps) {
    const targetDate = (block.props.targetDate as string) || new Date(Date.now() + 86400000).toISOString();
    const title = (block.props.title as string) || '';
    const expiredMessage = (block.props.expiredMessage as string) || 'Terminé !';
    const showDays = block.props.showDays !== false;
    const showHours = block.props.showHours !== false;
    const showMinutes = block.props.showMinutes !== false;
    const showSeconds = block.props.showSeconds !== false;
    const style = (block.props.style as string) || 'cards';

    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft(targetDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) {
        return (
            <div className="text-center py-8">
                <p className="text-2xl font-bold text-gray-600">{expiredMessage}</p>
            </div>
        );
    }

    const units: { label: string; value: number; show: boolean }[] = [
        { label: 'Jours', value: timeLeft.days, show: showDays },
        { label: 'Heures', value: timeLeft.hours, show: showHours },
        { label: 'Minutes', value: timeLeft.minutes, show: showMinutes },
        { label: 'Secondes', value: timeLeft.seconds, show: showSeconds },
    ];

    const visibleUnits = units.filter((u) => u.show);

    if (style === 'inline') {
        return (
            <div className="text-center py-6">
                {title && <h3 className="text-xl font-semibold mb-3">{title}</h3>}
                <p className="text-3xl font-mono font-bold text-gray-800">
                    {visibleUnits.map((u, i) => (
                        <span key={u.label}>
                            {i > 0 && <span className="text-gray-400 mx-1">:</span>}
                            {String(u.value).padStart(2, '0')}
                        </span>
                    ))}
                </p>
                <div className="flex justify-center gap-6 mt-2">
                    {visibleUnits.map((u) => (
                        <span key={u.label} className="text-xs text-gray-500 uppercase tracking-wide">
                            {u.label}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="text-center py-6">
            {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
            <div className="flex justify-center gap-4">
                {visibleUnits.map((u) => (
                    <div
                        key={u.label}
                        className="bg-gray-900 text-white rounded-lg px-4 py-3 min-w-[80px]"
                    >
                        <div className="text-3xl font-mono font-bold">
                            {String(u.value).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">
                            {u.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

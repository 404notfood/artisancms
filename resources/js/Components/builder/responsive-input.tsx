import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface ResponsiveValue {
    desktop: string | number;
    tablet?: string | number;
    mobile?: string | number;
}

interface ResponsiveInputProps {
    label: string;
    value: ResponsiveValue | string | number;
    onChange: (value: ResponsiveValue) => void;
    type?: 'text' | 'number' | 'color';
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
}

const viewportTabs: { key: Viewport; icon: typeof Monitor; label: string }[] = [
    { key: 'desktop', icon: Monitor, label: 'Desktop' },
    { key: 'tablet', icon: Tablet, label: 'Tablet' },
    { key: 'mobile', icon: Smartphone, label: 'Mobile' },
];

/**
 * Input with desktop/tablet/mobile tabs for responsive values.
 */
export default function ResponsiveInput({
    label,
    value,
    onChange,
    type = 'number',
    placeholder,
    min,
    max,
    step,
    suffix,
}: ResponsiveInputProps) {
    const [activeViewport, setActiveViewport] = useState<Viewport>('desktop');

    // Normalize value to ResponsiveValue
    const normalized: ResponsiveValue =
        typeof value === 'object' && value !== null && 'desktop' in value
            ? (value as ResponsiveValue)
            : { desktop: value as string | number };

    const currentValue = normalized[activeViewport] ?? normalized.desktop ?? '';

    const handleChange = (newVal: string | number) => {
        onChange({
            ...normalized,
            [activeViewport]: newVal,
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">{label}</label>
                <div className="flex gap-0.5 bg-gray-100 rounded p-0.5">
                    {viewportTabs.map(({ key, icon: Icon, label: tip }) => (
                        <button
                            key={key}
                            type="button"
                            title={tip}
                            onClick={() => setActiveViewport(key)}
                            className={cn(
                                'p-1 rounded transition-colors',
                                activeViewport === key
                                    ? 'bg-white shadow-sm text-indigo-600'
                                    : 'text-gray-400 hover:text-gray-600',
                            )}
                        >
                            <Icon className="h-3 w-3" />
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-1">
                <input
                    type={type}
                    value={currentValue}
                    onChange={(e) =>
                        handleChange(type === 'number' ? Number(e.target.value) : e.target.value)
                    }
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    step={step}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                />
                {suffix && (
                    <span className="text-xs text-gray-400 shrink-0">{suffix}</span>
                )}
            </div>
        </div>
    );
}

export type { ResponsiveValue };

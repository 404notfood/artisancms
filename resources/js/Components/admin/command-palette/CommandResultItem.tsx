import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { type CommandItem } from './types';

interface CommandResultItemProps {
    item: CommandItem;
    index: number;
    isSelected: boolean;
    onSelect: (href: string) => void;
    onHover: (index: number) => void;
}

export default function CommandResultItem({
    item,
    index,
    isSelected,
    onSelect,
    onHover,
}: CommandResultItemProps) {
    const Icon = item.icon;

    return (
        <button
            data-index={index}
            onClick={() => onSelect(item.href)}
            onMouseEnter={() => onHover(index)}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                isSelected
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50',
            )}
        >
            <Icon className="h-4 w-4 shrink-0 opacity-60" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                    {item.label}
                </p>
                {item.description && (
                    <p className="text-xs text-gray-400 truncate">
                        {item.description}
                    </p>
                )}
            </div>
            {isSelected && (
                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            )}
        </button>
    );
}

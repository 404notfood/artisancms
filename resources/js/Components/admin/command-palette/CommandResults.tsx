import { forwardRef } from 'react';
import { type CommandItem } from './types';
import CommandResultItem from './CommandResultItem';

interface CommandResultsProps {
    grouped: Map<string, CommandItem[]>;
    flatItems: CommandItem[];
    selectedIndex: number;
    query: string;
    onSelect: (href: string) => void;
    onHover: (index: number) => void;
}

const CommandResults = forwardRef<HTMLDivElement, CommandResultsProps>(
    ({ grouped, flatItems, selectedIndex, query, onSelect, onHover }, ref) => {
        let flatIndex = -1;

        return (
            <div ref={ref} className="max-h-[50vh] overflow-y-auto py-2">
                {flatItems.length > 0 ? (
                    Array.from(grouped.entries()).map(([category, items]) => (
                        <div key={category}>
                            <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                {category}
                            </p>
                            {items.map((item) => {
                                flatIndex++;
                                return (
                                    <CommandResultItem
                                        key={item.id}
                                        item={item}
                                        index={flatIndex}
                                        isSelected={selectedIndex === flatIndex}
                                        onSelect={onSelect}
                                        onHover={onHover}
                                    />
                                );
                            })}
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-8 text-center">
                        <p className="text-sm text-gray-400">
                            Aucun resultat pour "{query}"
                        </p>
                    </div>
                )}
            </div>
        );
    }
);

CommandResults.displayName = 'CommandResults';

export default CommandResults;

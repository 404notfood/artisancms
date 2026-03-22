import { useDraggable } from '@dnd-kit/core';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useBuilderStore } from '@/stores/builder-store';

const iconMap: Record<string, LucideIcon> = LucideIcons as unknown as Record<string, LucideIcon>;

interface DraggableBlockItemProps {
    slug: string;
    label: string;
    icon: string;
}

export default function DraggableBlockItem({ slug, label, icon }: DraggableBlockItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `new-${slug}`,
        data: { type: 'new-block', blockType: slug },
    });

    const addBlock = useBuilderStore((s) => s.addBlock);

    const IconComponent = iconMap[icon] ?? LucideIcons.Box;

    return (
        <div
            ref={setNodeRef}
            className={`flex items-center gap-2.5 rounded-md border bg-white text-sm transition-colors ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center pl-2 py-2 cursor-grab text-gray-300 hover:text-gray-500"
                title="Glisser pour déplacer"
            >
                <LucideIcons.GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Click to add */}
            <button
                type="button"
                onClick={() => addBlock(slug)}
                className="flex flex-1 items-center gap-2 pr-3 py-2 hover:bg-gray-50 rounded-r-md cursor-pointer"
            >
                <IconComponent className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-gray-700 font-medium">{label}</span>
            </button>
        </div>
    );
}

import { useDraggable } from '@dnd-kit/core';
import * as LucideIcons from 'lucide-react';

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Box;

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md border bg-white hover:bg-gray-50 cursor-grab text-sm transition-colors ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
        >
            <IconComponent className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-gray-700 font-medium">{label}</span>
        </div>
    );
}

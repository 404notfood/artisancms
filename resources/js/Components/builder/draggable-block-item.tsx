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

    const addBlock = useBuilderStore((state) => state.addBlock);
    const IconComponent = iconMap[icon] ?? LucideIcons.Box;

    return (
        <div
            ref={setNodeRef}
            className={`group flex items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="flex w-8 cursor-grab items-center justify-center border-r border-slate-100 bg-slate-50 text-slate-300 transition group-hover:text-slate-500"
                title="Glisser pour déplacer"
            >
                <LucideIcons.GripVertical className="h-3.5 w-3.5" />
            </div>

            <button
                type="button"
                onClick={() => addBlock(slug)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-slate-50"
            >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
                    <IconComponent className="h-4 w-4" />
                </span>
                <span className="truncate font-medium text-slate-700">{label}</span>
            </button>
        </div>
    );
}
